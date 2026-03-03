import os
import json
import shutil
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional

# ══════════════════════════════════════════════════════════
# DATA MANAGER — Handles all file storage in organized structure
# ══════════════════════════════════════════════════════════

BASE_DIR = "user_data"


def get_user_dir(user_email: str) -> str:
    """Returns the directory path for a specific user"""
    # Sanitize email for use in filesystem
    safe_email = user_email.replace("@", "_at_").replace(".", "_")
    user_dir = os.path.join(BASE_DIR, safe_email)
    os.makedirs(user_dir, exist_ok=True)
    return user_dir


def create_resume_folder(user_email: str) -> str:
    """
    Creates a new resume folder for the user
    Returns the resume_id (folder name)
    """
    user_dir = get_user_dir(user_email)
    resumes_dir = os.path.join(user_dir, "resumes")
    os.makedirs(resumes_dir, exist_ok=True)
    
    # Count existing resumes to generate resume_id
    existing = [d for d in os.listdir(resumes_dir) if os.path.isdir(os.path.join(resumes_dir, d))]
    resume_number = len(existing) + 1
    resume_id = f"resume_{resume_number}"
    
    # Create folder structure
    resume_dir = os.path.join(resumes_dir, resume_id)
    os.makedirs(resume_dir, exist_ok=True)
    os.makedirs(os.path.join(resume_dir, "job_searches"), exist_ok=True)
    os.makedirs(os.path.join(resume_dir, "applications"), exist_ok=True)
    
    return resume_id


def save_uploaded_resume(
    user_email: str,
    resume_id: str,
    pdf_file_path: str,
    parsed_data: dict
) -> Dict[str, str]:
    """
    Saves the uploaded PDF and parsed data
    
    Returns paths to saved files
    """
    user_dir = get_user_dir(user_email)
    resume_dir = os.path.join(user_dir, "resumes", resume_id)
    
    # Save original PDF
    pdf_dest = os.path.join(resume_dir, "original.pdf")
    shutil.copy(pdf_file_path, pdf_dest)
    
    # Save parsed data
    parsed_dest = os.path.join(resume_dir, "parsed.json")
    with open(parsed_dest, "w") as f:
        json.dump(parsed_data, f, indent=2)
    
    return {
        "pdf_path": pdf_dest,
        "parsed_path": parsed_dest,
        "resume_dir": resume_dir
    }


def save_job_search_results(
    user_email: str,
    resume_id: str,
    jobs: List[dict]
) -> str:
    """
    Saves job search results
    
    Returns path to saved file
    """
    user_dir = get_user_dir(user_email)
    search_dir = os.path.join(user_dir, "resumes", resume_id, "job_searches")
    
    # Generate timestamped filename
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    search_file = os.path.join(search_dir, f"search_{timestamp}.json")
    
    # Save results
    with open(search_file, "w") as f:
        json.dump({
            "timestamp": timestamp,
            "total_jobs": len(jobs),
            "jobs": jobs
        }, f, indent=2)
    
    return search_file


def save_application_result(
    user_email: str,
    resume_id: str,
    job_data: dict,
    apply_result: dict,
    screenshot_path: Optional[str] = None
) -> str:
    """
    Saves application result in organized folder
    
    Folder name: {company}_{status}/
    """
    user_dir = get_user_dir(user_email)
    applications_dir = os.path.join(user_dir, "resumes", resume_id, "applications")
    
    # Sanitize company name for folder
    company = job_data.get("company", "unknown_company")
    safe_company = company.replace(" ", "_").replace("/", "_").lower()
    
    status = apply_result.get("status", "pending")
    
    # Create application folder
    app_folder_name = f"{safe_company}_{status}"
    app_folder = os.path.join(applications_dir, app_folder_name)
    os.makedirs(app_folder, exist_ok=True)
    
    # Save application data
    app_data = {
        "job": job_data,
        "apply_result": apply_result,
        "applied_at": datetime.now().isoformat(),
    }
    
    app_file = os.path.join(app_folder, "application.json")
    with open(app_file, "w") as f:
        json.dump(app_data, f, indent=2)
    
    # Copy screenshot if provided
    if screenshot_path and os.path.exists(screenshot_path):
        screenshot_dest = os.path.join(app_folder, "screenshot.png")
        shutil.copy(screenshot_path, screenshot_dest)
    
    return app_folder


def get_user_resumes(user_email: str) -> List[dict]:
    """
    Returns list of all resumes for a user
    """
    user_dir = get_user_dir(user_email)
    resumes_dir = os.path.join(user_dir, "resumes")
    
    if not os.path.exists(resumes_dir):
        return []
    
    resumes = []
    for resume_id in os.listdir(resumes_dir):
        resume_dir = os.path.join(resumes_dir, resume_id)
        if not os.path.isdir(resume_dir):
            continue
        
        parsed_file = os.path.join(resume_dir, "parsed.json")
        if os.path.exists(parsed_file):
            with open(parsed_file, "r") as f:
                parsed_data = json.load(f)
            
            resumes.append({
                "resume_id": resume_id,
                "name": parsed_data.get("name", "Unknown"),
                "email": parsed_data.get("email", ""),
                "current_title": parsed_data.get("current_title", ""),
                "skills": parsed_data.get("skills", [])[:5],  # first 5 skills
            })
    
    return resumes


def get_resume_applications(user_email: str, resume_id: str) -> List[dict]:
    """
    Returns all applications for a specific resume
    """
    user_dir = get_user_dir(user_email)
    apps_dir = os.path.join(user_dir, "resumes", resume_id, "applications")
    
    if not os.path.exists(apps_dir):
        return []
    
    applications = []
    for app_folder in os.listdir(apps_dir):
        app_path = os.path.join(apps_dir, app_folder)
        if not os.path.isdir(app_path):
            continue
        
        app_file = os.path.join(app_path, "application.json")
        if os.path.exists(app_file):
            with open(app_file, "r") as f:
                app_data = json.load(f)
            
            applications.append({
                "folder": app_folder,
                **app_data
            })
    
    return applications


def get_resume_data(user_email: str, resume_id: str) -> Optional[dict]:
    """
    Gets the parsed resume data
    """
    user_dir = get_user_dir(user_email)
    parsed_file = os.path.join(user_dir, "resumes", resume_id, "parsed.json")
    
    if os.path.exists(parsed_file):
        with open(parsed_file, "r") as f:
            return json.load(f)
    
    return None


def get_resume_pdf_path(user_email: str, resume_id: str) -> Optional[str]:
    """
    Gets the path to the original PDF
    """
    user_dir = get_user_dir(user_email)
    pdf_path = os.path.join(user_dir, "resumes", resume_id, "original.pdf")
    
    if os.path.exists(pdf_path):
        return pdf_path
    
    return None
