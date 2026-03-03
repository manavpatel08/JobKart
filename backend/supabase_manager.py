from supabase import create_client, Client
import os
from dotenv import load_dotenv
from datetime import datetime
from typing import Optional, List
import json

load_dotenv()

supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

# ══════════════════════════════════════════════════════════
# FILE STORAGE
# ══════════════════════════════════════════════════════════

def upload_file_to_storage(bucket_name: str, file_path: str, destination_path: str) -> str:
    with open(file_path, "rb") as f:
        file_data = f.read()
    supabase.storage.from_(bucket_name).upload(
        destination_path,
        file_data,
        file_options={"content-type": "application/pdf" if file_path.endswith(".pdf") else "image/png"}
    )
    return supabase.storage.from_(bucket_name).get_public_url(destination_path)


# ══════════════════════════════════════════════════════════
# AUTH
# ══════════════════════════════════════════════════════════

def get_or_create_user(email: str) -> dict:
    """
    Try the users table; if it doesn't exist fall back to a
    deterministic synthetic user dict so auth never crashes.
    """
    import hashlib, uuid as _uuid
    synthetic = {
        "id":    str(_uuid.UUID(hashlib.md5(email.encode()).hexdigest())),
        "email": email,
    }
    try:
        result = supabase.table("users").select("*").eq("email", email).execute()
        if result.data:
            return result.data[0]
        # Table exists but row missing — insert it
        ins = supabase.table("users").insert({
            "email": email,
            "created_at": datetime.now().isoformat(),
        }).execute()
        return ins.data[0] if ins.data else synthetic
    except Exception as e:
        # Table doesn't exist yet (PGRST205) — use synthetic id
        print(f"[AUTH] users table unavailable ({e}), using synthetic id for {email}")
        return synthetic


def save_otp(email: str, otp: str) -> dict:
    from datetime import timezone, timedelta
    # Delete any existing OTP for this email first
    supabase.table("otps").delete().eq("email", email).execute()
    now = datetime.now(timezone.utc)
    expires = now + timedelta(minutes=10)
    result = supabase.table("otps").insert({
        "email":      email,
        "otp":        otp,
        "created_at": now.isoformat(),
        "expires_at": expires.isoformat(),
    }).execute()
    return result.data[0]


def verify_otp_from_db(email: str, otp: str) -> bool:
    from datetime import timezone
    result = supabase.table("otps").select("*").eq("email", email).eq("otp", otp).execute()
    if not result.data:
        return False
    row = result.data[0]
    # Parse expires_at (Supabase returns UTC ISO string)
    try:
        expires_at_str = row.get("expires_at", "")
        # Handle both offset-aware and naive
        if expires_at_str.endswith("+00:00") or expires_at_str.endswith("Z"):
            expires_at = datetime.fromisoformat(expires_at_str.replace("Z", "+00:00"))
            now = datetime.now(timezone.utc)
        else:
            expires_at = datetime.fromisoformat(expires_at_str)
            now = datetime.now()
        if now > expires_at:
            supabase.table("otps").delete().eq("email", email).execute()
            return False
    except Exception:
        # Fallback: check created_at age
        try:
            created_str = row.get("created_at", "")
            created_at = datetime.fromisoformat(created_str.replace("Z", "+00:00"))
            now = datetime.now(timezone.utc)
            if (now - created_at).total_seconds() > 600:
                supabase.table("otps").delete().eq("email", email).execute()
                return False
        except Exception:
            pass
    supabase.table("otps").delete().eq("email", email).execute()
    return True


# ══════════════════════════════════════════════════════════
# RESUMES
# ══════════════════════════════════════════════════════════

def save_resume(user_id: str, filename: str, pdf_path: str, parsed_data: dict) -> dict:
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    storage_path = f"{user_id}/{timestamp}_{filename}"
    pdf_url = upload_file_to_storage("resumes", pdf_path, storage_path)
    result = supabase.table("resumes").insert({
        "user_id": user_id,
        "filename": filename,
        "pdf_url": pdf_url,
        "parsed_data": parsed_data,
        "created_at": datetime.now().isoformat()
    }).execute()
    return result.data[0]


def get_user_resumes(user_id: str) -> List[dict]:
    result = supabase.table("resumes") \
        .select("*") \
        .eq("user_id", user_id) \
        .order("created_at", desc=True) \
        .execute()
    return result.data


def get_resume_by_id(resume_id: str) -> Optional[dict]:
    result = supabase.table("resumes").select("*").eq("id", resume_id).execute()
    return result.data[0] if result.data else None


def delete_resume(resume_id: str, user_id: str) -> bool:
    supabase.table("resumes").delete().eq("id", resume_id).eq("user_id", user_id).execute()
    return True


def update_resume_score(resume_id: str, score_data: dict) -> dict:
    """
    Saves resume score analysis results to the resume record.
    score_data: { overall_score, tier, dimension_scores, feedback, strengths, improvements }
    """
    result = supabase.table("resumes") \
        .update({"score_data": score_data, "scored_at": datetime.now().isoformat()}) \
        .eq("id", resume_id) \
        .execute()
    return result.data[0] if result.data else {}


# ══════════════════════════════════════════════════════════
# JOB SEARCHES
# ══════════════════════════════════════════════════════════

def save_job_search(user_id: str, resume_id: str, query_used: str, jobs: List[dict]) -> dict:
    result = supabase.table("job_searches").insert({
        "user_id": user_id,
        "resume_id": resume_id,
        "query_used": query_used,
        "jobs_found": len(jobs),
        "search_results": {"jobs": jobs},
        "created_at": datetime.now().isoformat()
    }).execute()
    return result.data[0]


def get_latest_job_search(resume_id: str) -> Optional[dict]:
    result = supabase.table("job_searches") \
        .select("*") \
        .eq("resume_id", resume_id) \
        .order("created_at", desc=True) \
        .limit(1) \
        .execute()
    return result.data[0] if result.data else None


# ══════════════════════════════════════════════════════════
# APPLICATIONS
# ══════════════════════════════════════════════════════════

def save_application(user_id: str, resume_id: str, job_data: dict, status: str = "queued") -> dict:
    result = supabase.table("applications").insert({
        "user_id": user_id,
        "resume_id": resume_id,
        "job_title": job_data.get("title"),
        "company": job_data.get("company"),
        "apply_url": job_data.get("apply_link"),
        "status": status,
        "match_score": job_data.get("match_score"),
        "applied_at": datetime.now().isoformat() if status == "applied" else None,
        "created_at": datetime.now().isoformat()
    }).execute()
    return result.data[0]


def update_application_status(application_id: str, user_id: str, status: str, notes: str = None, interview_date: str = None) -> dict:
    update_data = {"status": status}
    if notes:
        update_data["notes"] = notes
    if interview_date:
        update_data["interview_date"] = interview_date
    if status == "applied":
        update_data["applied_at"] = datetime.now().isoformat()
    result = supabase.table("applications") \
        .update(update_data) \
        .eq("id", application_id) \
        .eq("user_id", user_id) \
        .execute()
    return result.data[0] if result.data else {}


def delete_application(application_id: str, user_id: str) -> bool:
    supabase.table("applications").delete().eq("id", application_id).eq("user_id", user_id).execute()
    return True


def get_user_applications(user_id: str, status: Optional[str] = None) -> List[dict]:
    query = supabase.table("applications").select("*").eq("user_id", user_id)
    if status:
        query = query.eq("status", status)
    result = query.order("created_at", desc=True).execute()
    return result.data


def get_application_by_id(application_id: str) -> Optional[dict]:
    result = supabase.table("applications").select("*").eq("id", application_id).execute()
    return result.data[0] if result.data else None


def get_user_stats(user_id: str) -> dict:
    apps = get_user_applications(user_id)
    return {
        "total": len(apps),
        "queued": len([a for a in apps if a["status"] == "queued"]),
        "interested": len([a for a in apps if a["status"] == "interested"]),
        "shortlisted": len([a for a in apps if a["status"] == "shortlisted"]),
        "applied": len([a for a in apps if a["status"] == "applied"]),
        "interviewing": len([a for a in apps if a["status"] == "interviewing"]),
        "rejected": len([a for a in apps if a["status"] == "rejected"]),
        "offers": len([a for a in apps if a["status"] == "offer"]),
    }