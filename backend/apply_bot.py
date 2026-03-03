from playwright.async_api import async_playwright
import asyncio
import os
from pathlib import Path
import time

# ══════════════════════════════════════════════════════════
# APPLY BOT — Automatically fills job application forms
# ══════════════════════════════════════════════════════════

# 🚨 TEST MODE - NEVER CLICKS SUBMIT IN PRODUCTION
TEST_MODE = True  # Set to False only when you're 100% ready for real applications

# Common field name variations
FIELD_MAPPINGS = {
    "first_name": ["first_name", "firstname", "fname", "first", "given_name"],
    "last_name": ["last_name", "lastname", "lname", "last", "surname", "family_name"],
    "full_name": ["name", "full_name", "fullname", "your_name", "applicant_name"],
    "email": ["email", "email_address", "e-mail", "emailaddress", "mail"],
    "phone": ["phone", "phone_number", "mobile", "telephone", "contact", "cell"],
    "linkedin": ["linkedin", "linkedin_url", "linkedin_profile", "linked_in"],
    "portfolio": ["portfolio", "website", "personal_website", "portfolio_url", "github"],
    "location": ["location", "city", "address", "current_location", "where"],
    "cover_letter": ["cover_letter", "coverletter", "why_apply", "motivation", "message"],
}


def match_field_type(field_name: str) -> str:
    """Identifies what type of field this is"""
    if not field_name:
        return None
    
    field_name_lower = field_name.lower()
    
    for field_type, variations in FIELD_MAPPINGS.items():
        for variation in variations:
            if variation in field_name_lower:
                return field_type
    
    return None


def get_resume_data_for_field(field_type: str, parsed_resume: dict) -> str:
    """Gets the appropriate data from resume for a field type"""
    
    full_name = parsed_resume.get("name", "")
    name_parts = full_name.split() if full_name else []
    first_name = name_parts[0] if len(name_parts) > 0 else ""
    last_name = " ".join(name_parts[1:]) if len(name_parts) > 1 else ""
    
    field_data_map = {
        "first_name": first_name,
        "last_name": last_name,
        "full_name": full_name,
        "email": parsed_resume.get("email", ""),
        "phone": parsed_resume.get("phone", ""),
        "linkedin": parsed_resume.get("linkedin", ""),
        "portfolio": parsed_resume.get("portfolio", ""),
        "location": parsed_resume.get("location", ""),
    }
    
    return field_data_map.get(field_type, "")


async def fill_application_form(
    apply_url: str,
    parsed_resume: dict,
    resume_pdf_path: str,
    screenshot_dir: str = "screenshots"
) -> dict:
    """
    STAGE 1: Fills the form but DOES NOT submit
    Returns filled data for user review
    """
    
    result = {
        "status": "pending",
        "message": "",
        "filled_fields": {},
        "ai_answers": {},
        "screenshot_path": None,
        "final_url": apply_url,
        "submit_button_found": False
    }
    
    try:
        async with async_playwright() as p:
            
            print(f"\n{'='*60}")
            print(f"[APPLY BOT] STAGE 1: FILLING FORM (NOT SUBMITTING)")
            print(f"[APPLY BOT] URL: {apply_url}")
            print(f"{'='*60}\n")
            
            # Launch browser (visible for debugging)
            browser = await p.chromium.launch(
                headless=False,
                args=['--disable-blink-features=AutomationControlled']
            )
            
            context = await browser.new_context(
                viewport={'width': 1920, 'height': 1080},
                user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            )
            
            page = await context.new_page()
            
            # Navigate to URL
            await page.goto(apply_url, wait_until="networkidle", timeout=30000)
            await page.wait_for_timeout(2000)
            
            print("[APPLY BOT] Page loaded. Scanning for fields...")
            
            # Find all form fields
            text_inputs = await page.query_selector_all(
                'input[type="text"], input[type="email"], input[type="tel"], '
                'input:not([type]), input[type="url"]'
            )
            textareas = await page.query_selector_all('textarea')
            file_inputs = await page.query_selector_all('input[type="file"]')
            
            all_text_fields = text_inputs + textareas
            
            print(f"[APPLY BOT] Found {len(all_text_fields)} text fields, {len(file_inputs)} file uploads")
            
            # Fill each text field
            filled_count = 0
            
            for field in all_text_fields:
                try:
                    is_visible = await field.is_visible()
                    is_enabled = await field.is_enabled()
                    
                    if not is_visible or not is_enabled:
                        continue
                    
                    # Get field identifiers
                    name = await field.get_attribute("name")
                    placeholder = await field.get_attribute("placeholder")
                    field_id = await field.get_attribute("id")
                    aria_label = await field.get_attribute("aria_label")
                    
                    # Identify field type
                    field_type = None
                    for identifier in [name, placeholder, field_id, aria_label]:
                        if identifier:
                            field_type = match_field_type(identifier)
                            if field_type:
                                break
                    
                    # Fill if we know what it is
                    if field_type:
                        data = get_resume_data_for_field(field_type, parsed_resume)
                        
                        if data:
                            await field.scroll_into_view_if_needed()
                            await page.wait_for_timeout(200)
                            await field.fill(data)
                            
                            result["filled_fields"][field_type] = data
                            filled_count += 1
                            print(f"[APPLY BOT]   ✓ Filled {field_type}: {data[:30]}...")
                
                except Exception as e:
                    continue
            
            print(f"\n[APPLY BOT] Filled {filled_count} fields successfully\n")
            
            # Upload resume PDF
            if file_inputs and os.path.exists(resume_pdf_path):
                try:
                    file_input = file_inputs[0]
                    
                    if await file_input.is_visible():
                        await file_input.set_input_files(resume_pdf_path)
                        result["filled_fields"]["resume_pdf"] = "uploaded"
                        print(f"[APPLY BOT]   ✓ Uploaded resume PDF")
                
                except Exception as e:
                    print(f"[APPLY BOT]   ✗ Failed to upload resume: {e}")
            
            # Take screenshot
            os.makedirs(screenshot_dir, exist_ok=True)
            timestamp = int(time.time())
            screenshot_path = f"{screenshot_dir}/filled_form_{timestamp}.png"
            
            await page.screenshot(path=screenshot_path, full_page=True)
            result["screenshot_path"] = screenshot_path
            print(f"\n[APPLY BOT]   ✓ Screenshot saved: {screenshot_path}")
            
            # Check if submit button exists (but DON'T click it)
            submit_selectors = [
                'button[type="submit"]',
                'input[type="submit"]',
                'button:has-text("Submit")',
                'button:has-text("Apply")',
                'button:has-text("Send")',
            ]
            
            submit_button = None
            for selector in submit_selectors:
                try:
                    submit_button = await page.query_selector(selector)
                    if submit_button and await submit_button.is_visible():
                        result["submit_button_found"] = True
                        break
                except:
                    continue
            
            if result["submit_button_found"]:
                print(f"\n[APPLY BOT]   ℹ️  Submit button found (NOT clicking)")
            else:
                print(f"\n[APPLY BOT]   ⚠️  Submit button not found")
            
            # 🚨 TEST MODE - NEVER SUBMIT
            print(f"\n{'='*60}")
            print(f"[APPLY BOT] 🚨 TEST MODE ACTIVE")
            print(f"[APPLY BOT] Form filled but NOT submitted")
            print(f"[APPLY BOT] Status: pending_review")
            print(f"{'='*60}\n")
            
            result["status"] = "pending_review"
            result["message"] = "Form filled successfully. Awaiting user confirmation."
            
            # Close browser
            await browser.close()
    
    except Exception as e:
        result["status"] = "failed"
        result["message"] = f"Error: {str(e)}"
        print(f"\n[APPLY BOT]   ✗ Error: {e}\n")
    
    return result


async def submit_application_after_review(
    apply_url: str,
    filled_data: dict,
    ai_answers: dict,
    resume_pdf_path: str
) -> dict:
    """
    STAGE 2: Re-opens form and submits after user confirmation
    
    🚨 IN TEST MODE - WILL NOT ACTUALLY CLICK SUBMIT
    """
    
    result = {
        "status": "pending",
        "message": "",
        "final_url": apply_url
    }
    
    try:
        async with async_playwright() as p:
            
            print(f"\n{'='*60}")
            print(f"[APPLY BOT] STAGE 2: SUBMITTING APPLICATION")
            print(f"[APPLY BOT] URL: {apply_url}")
            print(f"{'='*60}\n")
            
            browser = await p.chromium.launch(
                headless=False,
                args=['--disable-blink-features=AutomationControlled']
            )
            
            context = await browser.new_context(
                viewport={'width': 1920, 'height': 1080},
                user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            )
            
            page = await context.new_page()
            
            # Navigate
            await page.goto(apply_url, wait_until="networkidle", timeout=30000)
            await page.wait_for_timeout(2000)
            
            print("[APPLY BOT] Re-filling form with saved data...")
            
            # Re-fill all fields quickly
            for field_type, value in filled_data.items():
                if field_type == "resume_pdf":
                    # Upload file
                    file_input = await page.query_selector('input[type="file"]')
                    if file_input:
                        await file_input.set_input_files(resume_pdf_path)
                        print(f"[APPLY BOT]   ✓ Re-uploaded resume")
                else:
                    # Fill text field
                    # Try to find field by name matching the field type
                    for variation in FIELD_MAPPINGS.get(field_type, []):
                        field = await page.query_selector(f'[name="{variation}"]')
                        if not field:
                            field = await page.query_selector(f'[placeholder*="{variation}"]')
                        
                        if field:
                            await field.fill(value)
                            print(f"[APPLY BOT]   ✓ Re-filled {field_type}")
                            break
            
            # Fill AI answers if any
            for question, answer in ai_answers.items():
                # Find textarea with this question in placeholder
                textareas = await page.query_selector_all('textarea')
                for textarea in textareas:
                    placeholder = await textarea.get_attribute("placeholder")
                    if placeholder and question.lower() in placeholder.lower():
                        await textarea.fill(answer)
                        print(f"[APPLY BOT]   ✓ Filled AI answer")
                        break
            
            # Find submit button
            submit_button = None
            submit_selectors = [
                'button[type="submit"]',
                'input[type="submit"]',
                'button:has-text("Submit")',
                'button:has-text("Apply")',
            ]
            
            for selector in submit_selectors:
                try:
                    submit_button = await page.query_selector(selector)
                    if submit_button and await submit_button.is_visible():
                        break
                except:
                    continue
            
            if submit_button:
                # 🚨🚨🚨 TEST MODE - DO NOT CLICK 🚨🚨🚨
                if TEST_MODE:
                    print(f"\n{'='*60}")
                    print(f"[APPLY BOT] 🚨🚨🚨 TEST MODE ACTIVE 🚨🚨🚨")
                    print(f"[APPLY BOT] Would click submit button here")
                    print(f"[APPLY BOT] But TEST_MODE=True, so NOT clicking")
                    print(f"[APPLY BOT] Set TEST_MODE=False to enable real submissions")
                    print(f"{'='*60}\n")
                    
                    result["status"] = "test_mode_success"
                    result["message"] = "TEST MODE: Would have submitted successfully"
                else:
                    # REAL SUBMISSION (only when TEST_MODE=False)
                    print(f"\n[APPLY BOT] ⚠️  REAL MODE - Actually clicking submit...")
                    
                    await submit_button.scroll_into_view_if_needed()
                    await page.wait_for_timeout(1000)
                    await submit_button.click()
                    
                    print(f"[APPLY BOT]   ✓ Clicked submit button")
                    
                    # Wait for response
                    await page.wait_for_timeout(3000)
                    
                    final_url = page.url
                    result["final_url"] = final_url
                    
                    # Check for success
                    success_keywords = ["success", "thank", "confirm", "submitted", "received"]
                    is_success = any(kw in final_url.lower() for kw in success_keywords)
                    
                    if is_success:
                        result["status"] = "success"
                        result["message"] = "Application submitted successfully"
                        print(f"[APPLY BOT]   ✓✓ Application submitted!")
                    else:
                        result["status"] = "success"
                        result["message"] = "Submitted - manual verification recommended"
            else:
                result["status"] = "failed"
                result["message"] = "Submit button not found"
                print(f"[APPLY BOT]   ✗ Submit button not found")
            
            await browser.close()
    
    except Exception as e:
        result["status"] = "failed"
        result["message"] = f"Error: {str(e)}"
        print(f"\n[APPLY BOT]   ✗ Error: {e}\n")
    
    return result


# Synchronous wrappers for FastAPI
def fill_application_sync(apply_url: str, parsed_resume: dict, resume_pdf_path: str, screenshot_dir: str = "screenshots") -> dict:
    """Synchronous wrapper for fill_application_form"""
    return asyncio.run(fill_application_form(apply_url, parsed_resume, resume_pdf_path, screenshot_dir))


def submit_application_sync(apply_url: str, filled_data: dict, ai_answers: dict, resume_pdf_path: str) -> dict:
    """Synchronous wrapper for submit_application_after_review"""
    return asyncio.run(submit_application_after_review(apply_url, filled_data, ai_answers, resume_pdf_path))