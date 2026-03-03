"""
auth.py — AutoApply AI
OTP delivery strategy:
  PRIMARY:  Gmail SMTP (smtplib) — uses your Gmail + App Password
            This is what was working before. Gmail SMTP is authorized
            to send FROM a Gmail address, so DMARC passes.
  FALLBACK: SendGrid (only if GMAIL creds not set AND SendGrid key exists)
  DEV MODE: If neither is configured, returns OTP in response body.

WHY GMAIL SMTP WORKS but SendGrid + Gmail FROM doesn't:
  Gmail's DMARC policy (p=reject) blocks any server OTHER than
  Gmail's own smtp.gmail.com from sending as @gmail.com.
  When you use smtplib → smtp.gmail.com, YOU are Gmail's server → passes.
  When SendGrid sends as @gmail.com → misaligned → deferred/rejected.

SETUP (one-time):
  1. Go to myaccount.google.com → Security → 2-Step Verification → ON
  2. Go to myaccount.google.com → Security → App Passwords
  3. Create an App Password for "Mail"
  4. Add to .env:
       GMAIL_USER=workandmorework2902@gmail.com
       GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx   (16-char app password)
"""

import os
import random
import string
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
from dotenv import load_dotenv
import supabase_manager as db

load_dotenv()

# ── Config ──────────────────────────────────────────────────────────────────
GMAIL_USER         = os.getenv("GMAIL_USER", "")
GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD", "")
SENDGRID_API_KEY   = os.getenv("SENDGRID_API_KEY", "")
SENDGRID_FROM      = os.getenv("SENDGRID_FROM_EMAIL", "")

USE_GMAIL    = bool(GMAIL_USER and GMAIL_APP_PASSWORD)
USE_SENDGRID = bool(SENDGRID_API_KEY and SENDGRID_FROM and not SENDGRID_FROM.endswith("@gmail.com"))
DEV_MODE     = not USE_GMAIL and not USE_SENDGRID


def _otp_html(otp: str) -> str:
    return f"""
    <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 420px; margin: 0 auto; padding: 32px; background: #0f172a; border-radius: 12px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display:inline-block; background:linear-gradient(135deg,#3b82f6,#6366f1); border-radius:12px; padding:12px 18px; font-size:24px;">⚡</div>
        <h2 style="color:#f8fafc; margin:12px 0 4px; font-size:20px; font-weight:700;">AutoApply AI</h2>
        <p style="color:#64748b; font-size:13px; margin:0;">Your one-time login code</p>
      </div>

      <div style="background:#1e293b; border:1px solid #334155; border-radius:10px; padding:28px; text-align:center; margin-bottom:20px;">
        <p style="color:#94a3b8; font-size:13px; margin:0 0 14px;">Use this code to sign in:</p>
        <div style="font-size:42px; font-weight:700; letter-spacing:16px; color:#3b82f6; font-family:'Courier New',monospace; background:#0f172a; padding:16px 20px; border-radius:8px; border:1px solid #1d4ed8; display:inline-block;">
          {otp}
        </div>
      </div>

      <p style="color:#64748b; font-size:12px; text-align:center; margin:0;">
        Expires in <strong style="color:#94a3b8;">10 minutes</strong>. Never share this code.
      </p>
    </div>
    """


# ── Senders ──────────────────────────────────────────────────────────────────

def _send_via_gmail(to_email: str, otp: str) -> bool:
    """
    Send via Gmail SMTP. This works because smtp.gmail.com is
    authorized for @gmail.com addresses — DMARC passes.
    """
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "Your AutoApply AI Login Code"
        msg["From"]    = f"AutoApply AI <{GMAIL_USER}>"
        msg["To"]      = to_email

        msg.attach(MIMEText(_otp_html(otp), "html"))

        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(GMAIL_USER, GMAIL_APP_PASSWORD)
            server.sendmail(GMAIL_USER, to_email, msg.as_string())

        print(f"[Gmail SMTP] Sent OTP to {to_email} ✓")
        return True

    except smtplib.SMTPAuthenticationError:
        print("[Gmail SMTP] Auth failed — check GMAIL_APP_PASSWORD in .env")
        print("  → Generate at: myaccount.google.com → Security → App Passwords")
        return False
    except Exception as e:
        print(f"[Gmail SMTP] Error: {e}")
        return False


def _send_via_sendgrid(to_email: str, otp: str) -> bool:
    """
    Send via SendGrid. Only works if FROM_EMAIL is NOT a Gmail address.
    (Gmail's DMARC blocks SendGrid sending as @gmail.com)
    """
    try:
        from sendgrid import SendGridAPIClient
        from sendgrid.helpers.mail import Mail

        message = Mail(
            from_email=SENDGRID_FROM,
            to_emails=to_email,
            subject="Your AutoApply AI Login Code",
            html_content=_otp_html(otp),
        )
        sg = SendGridAPIClient(SENDGRID_API_KEY)
        response = sg.send(message)
        print(f"[SendGrid] Sent OTP to {to_email} — status {response.status_code}")
        return response.status_code in (200, 202)
    except Exception as e:
        print(f"[SendGrid] Error: {e}")
        return False


def send_otp_email(to_email: str, otp: str) -> bool:
    """
    Route to the correct sender based on what's configured.
    Priority: Gmail SMTP > SendGrid > Dev mode
    """
    if USE_GMAIL:
        return _send_via_gmail(to_email, otp)
    if USE_SENDGRID:
        return _send_via_sendgrid(to_email, otp)
    # Dev mode — no email sent, OTP returned in API response
    print(f"[DEV MODE] OTP for {to_email}: {otp}")
    return True


# ── OTP helpers ───────────────────────────────────────────────────────────────

def generate_otp() -> str:
    return "".join(random.choices(string.digits, k=6))


# ── Auth functions ────────────────────────────────────────────────────────────

def request_otp(email: str) -> dict:
    email = email.lower().strip()
    otp   = generate_otp()
    expires_at = (datetime.utcnow() + timedelta(minutes=10)).isoformat()

    # Invalidate old unused OTPs
    db.supabase.table("otps") \
        .update({"used": True}) \
        .eq("email", email) \
        .eq("used", False) \
        .execute()

    # Save new OTP
    db.supabase.table("otps").insert({
        "email":      email,
        "otp":        otp,
        "expires_at": expires_at,
        "used":       False,
    }).execute()

    # Send
    sent = send_otp_email(email, otp)
    if not sent:
        if USE_GMAIL:
            raise Exception(
                "Failed to send via Gmail SMTP. "
                "Check that GMAIL_APP_PASSWORD is a valid App Password "
                "(not your regular Gmail password). "
                "Generate one at: myaccount.google.com → Security → App Passwords"
            )
        elif USE_SENDGRID:
            raise Exception(
                "Failed to send via SendGrid. "
                "Check SENDGRID_API_KEY and that SENDGRID_FROM_EMAIL is verified."
            )

    response = {"message": "OTP sent to your email", "email": email}

    # Dev mode: expose OTP in response for local testing
    if DEV_MODE:
        response["dev_otp"]     = otp
        response["dev_warning"] = (
            "Neither GMAIL_USER+GMAIL_APP_PASSWORD nor SENDGRID_API_KEY are configured. "
            "Running in dev mode — OTP returned in response for local testing only."
        )

    return response


def verify_otp(email: str, otp: str) -> dict:
    email = email.lower().strip()

    result = db.supabase.table("otps") \
        .select("*") \
        .eq("email", email) \
        .eq("otp", otp) \
        .eq("used", False) \
        .order("created_at", desc=True) \
        .limit(1) \
        .execute()

    if not result.data:
        raise Exception("Invalid OTP. Please request a new code.")

    otp_record = result.data[0]

    expires_at_str = otp_record["expires_at"].replace("Z", "+00:00")
    expires_at     = datetime.fromisoformat(expires_at_str)
    now            = datetime.now(expires_at.tzinfo)

    if now > expires_at:
        raise Exception("OTP has expired. Please request a new one.")

    # Mark used
    db.supabase.table("otps") \
        .update({"used": True}) \
        .eq("id", otp_record["id"]) \
        .execute()

    # Get or create user
    profile_result = db.supabase.table("profiles") \
        .select("*") \
        .eq("email", email) \
        .execute()

    if profile_result.data:
        user = profile_result.data[0]
    else:
        new_profile = db.supabase.table("profiles").insert({
            "email": email,
        }).execute()
        user = new_profile.data[0]

    return {
        "user_id": user["id"],
        "email":   user["email"],
        "message": "Login successful",
    }