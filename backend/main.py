from fastapi import FastAPI, UploadFile, File, HTTPException, Header, Body, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List, Any
from auth import request_otp, verify_otp
from pydantic import BaseModel
from dotenv import load_dotenv
import shutil
import uuid
import os
from datetime import datetime

from resume_parser import parse_resume
from job_scraper import search_jobs
from matcher import match_jobs
import supabase_manager as db

load_dotenv()

app = FastAPI(title="AutoApply AI - Job Discovery & Tracker")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ══════════════════════════════════════════════════════════
# AUTH HELPER
# ══════════════════════════════════════════════════════════

def get_user_id(x_user_id: Optional[str]) -> str:
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Not logged in")
    return x_user_id


# ══════════════════════════════════════════════════════════
# FILTER HELPER
# ══════════════════════════════════════════════════════════

def apply_filters(
    jobs: list,
    categories: Optional[List[str]] = None,
    work_modes: Optional[List[str]]  = None,
    min_stipend: Optional[int]        = None,
    max_stipend: Optional[int]        = None,
    location: Optional[str]           = None,
    company: Optional[str]            = None,
    is_research: Optional[bool]       = None,
    is_govt: Optional[bool]           = None,
) -> list:
    """
    Apply backend-side filters to a list of jobs.
    All filters are optional and composable.
    """
    result = jobs

    # Category filter (multi-select: full_time, internship, research_internship, etc.)
    if categories:
        cats_lower = [c.lower() for c in categories]
        result = [
            j for j in result
            if j.get("job_category", "").lower() in cats_lower
        ]

    # Work mode filter (multi-select: remote, hybrid, on-site)
    if work_modes:
        modes_lower = [m.lower() for m in work_modes]
        result = [
            j for j in result
            if j.get("work_mode", "").lower() in modes_lower
        ]

    # Location substring filter
    if location and location.strip():
        loc_lower = location.strip().lower()
        result = [
            j for j in result
            if loc_lower in j.get("location", "").lower()
        ]

    # Company/institution substring filter
    if company and company.strip():
        co_lower = company.strip().lower()
        result = [
            j for j in result
            if co_lower in j.get("company", "").lower()
        ]

    # Boolean flags
    if is_research is True:
        result = [j for j in result if j.get("is_research")]
    if is_govt is True:
        result = [j for j in result if j.get("is_govt")]

    # Stipend/salary range — best-effort parse from salary string
    if min_stipend is not None or max_stipend is not None:
        def parse_salary_value(s: str) -> Optional[int]:
            """Try to extract a numeric value (in thousands INR) from salary string."""
            if not s or s == "Not listed":
                return None
            import re
            nums = re.findall(r"[\d,]+", s.replace(",", ""))
            if nums:
                try:
                    return int(nums[0])
                except ValueError:
                    return None
            return None

        filtered = []
        for j in result:
            val = parse_salary_value(j.get("salary", ""))
            if val is None:
                # If salary unknown, include by default (don't exclude unpriced jobs)
                filtered.append(j)
                continue
            if min_stipend is not None and val < min_stipend:
                continue
            if max_stipend is not None and val > max_stipend:
                continue
            filtered.append(j)
        result = filtered

    return result


# ══════════════════════════════════════════════════════════
# REQUEST MODELS
# ══════════════════════════════════════════════════════════

class JobSearchRequest(BaseModel):
    resume_id: str

class OTPRequest(BaseModel):
    email: str

class OTPVerifyRequest(BaseModel):
    email: str
    otp: str

class AddToQueueRequest(BaseModel):
    resume_id: str
    job_data: dict

class MarkAppliedRequest(BaseModel):
    resume_id: str
    job_data: dict

class UpdateApplicationRequest(BaseModel):
    application_id: str
    status: str = None
    notes: str = None
    interview_date: str = None

class CustomSearchRequest(BaseModel):
    query: str
    location: Optional[str] = None
    resume_id: Optional[str] = None
    # Advanced filters (optional — frontend sends these dynamically)
    categories:   Optional[List[str]] = None
    work_modes:   Optional[List[str]] = None
    min_stipend:  Optional[int]        = None
    max_stipend:  Optional[int]        = None
    company:      Optional[str]        = None
    is_research:  Optional[bool]       = None
    is_govt:      Optional[bool]       = None

class ResumeChatRequest(BaseModel):
    resume_id: str
    message: str
    conversation_history: Optional[List[Any]] = None


# ══════════════════════════════════════════════════════════
# ENDPOINTS
# ══════════════════════════════════════════════════════════

@app.get("/health")
def health_check():
    return {"status": "ok", "message": "AutoApply AI is running"}


# ── Resume ─────────────────────────────────────────────────

@app.post("/api/resume/upload")
async def upload_resume(
    file: UploadFile = File(...),
    x_user_id: Optional[str] = Header(None)
):
    user_id = get_user_id(x_user_id)
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files allowed")

    temp_path = f"/tmp/{uuid.uuid4()}_{file.filename}"
    with open(temp_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    try:
        parsed_data  = parse_resume(temp_path)
        resume_record = db.save_resume(
            user_id=user_id,
            filename=file.filename,
            pdf_path=temp_path,
            parsed_data=parsed_data,
        )
        os.remove(temp_path)
        return {
            "resume_id":   resume_record["id"],
            "filename":    file.filename,
            "parsed_data": parsed_data,
        }
    except Exception as e:
        if os.path.exists(temp_path):
            os.remove(temp_path)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/resume/{resume_id}")
def get_resume(resume_id: str):
    resume = db.get_resume_by_id(resume_id)
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    return resume


@app.delete("/api/resume/{resume_id}")
def delete_resume(
    resume_id: str,
    x_user_id: Optional[str] = Header(None),
):
    user_id = get_user_id(x_user_id)
    try:
        db.supabase.table("resumes") \
            .delete() \
            .eq("id", resume_id) \
            .eq("user_id", user_id) \
            .execute()
        return {"message": "Resume deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/resumes")
def get_resumes(x_user_id: Optional[str] = Header(None)):
    user_id = get_user_id(x_user_id)
    resumes = db.get_user_resumes(user_id)
    return {"total": len(resumes), "resumes": resumes}


# ── Jobs ────────────────────────────────────────────────────

@app.post("/api/jobs/search")
def search_jobs_endpoint(
    data: JobSearchRequest,
    x_user_id: Optional[str] = Header(None),
    # Advanced filter query params (all optional)
    categories:  Optional[str] = Query(None, description="Comma-separated: full_time,internship,research_internship,summer_internship,consulting,government"),
    work_modes:  Optional[str] = Query(None, description="Comma-separated: remote,hybrid,on-site"),
    min_stipend: Optional[int] = Query(None, description="Minimum salary/stipend (numeric)"),
    max_stipend: Optional[int] = Query(None, description="Maximum salary/stipend (numeric)"),
    location:    Optional[str] = Query(None, description="Location substring filter"),
    company:     Optional[str] = Query(None, description="Company/institution substring filter"),
    is_research: Optional[bool] = Query(None),
    is_govt:     Optional[bool] = Query(None),
):
    user_id = get_user_id(x_user_id)

    resume = db.get_resume_by_id(data.resume_id)
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    parsed_resume = resume["parsed_data"]
    raw_jobs      = search_jobs(parsed_resume)
    matched_jobs  = match_jobs(parsed_resume, raw_jobs)

    # Parse comma-separated query params
    cat_list  = [c.strip() for c in categories.split(",") if c.strip()] if categories else None
    mode_list = [m.strip() for m in work_modes.split(",") if m.strip()] if work_modes else None

    # Apply filters
    filtered_jobs = apply_filters(
        matched_jobs,
        categories=cat_list,
        work_modes=mode_list,
        min_stipend=min_stipend,
        max_stipend=max_stipend,
        location=location,
        company=company,
        is_research=is_research,
        is_govt=is_govt,
    )

    # Build filter metadata for frontend
    available_categories = list({j.get("job_category") for j in matched_jobs if j.get("job_category")})
    available_locations  = list({j.get("location",  "").split(",")[0].strip() for j in matched_jobs if j.get("location")})
    available_companies  = list({j.get("company",   "") for j in matched_jobs if j.get("company")})
    available_work_modes = list({j.get("work_mode", "") for j in matched_jobs if j.get("work_mode")})

    query_used = f"{parsed_resume.get('current_title')} {' '.join(parsed_resume.get('skills', [])[:3])}"
    search_record = db.save_job_search(
        user_id=user_id,
        resume_id=data.resume_id,
        query_used=query_used,
        jobs=matched_jobs,
    )

    # ── Pagination split ──────────────────────────────────────────────────
    # Top 20 highest-scored jobs shown immediately.
    # Aspirational (govt/research/tier1/quant) always included regardless of score.
    # Remaining jobs surfaced on "Load More".
    TOP_N = 20
    top_jobs          = filtered_jobs[:TOP_N]
    aspirational_jobs = [
        j for j in filtered_jobs[TOP_N:]
        if j.get("is_aspirational")
    ]
    remaining_jobs = [
        j for j in filtered_jobs[TOP_N:]
        if not j.get("is_aspirational")
    ]

    return {
        "search_id":          search_record["id"],
        "total_found":        len(matched_jobs),
        "total_after_filter": len(filtered_jobs),
        # Top 20 matched jobs (default view)
        "jobs": top_jobs,
        # Aspirational opportunities (low match but top-tier brands — always shown)
        "aspirational_jobs": aspirational_jobs,
        # Rest of results — behind "Load More"
        "remaining_jobs": remaining_jobs,
        # Pagination metadata for frontend
        "pagination": {
            "top_count":          len(top_jobs),
            "aspirational_count": len(aspirational_jobs),
            "remaining_count":    len(remaining_jobs),
            "total":              len(filtered_jobs),
            "has_more":           len(remaining_jobs) > 0,
        },
        # Metadata for frontend to build dynamic filter UI
        "filter_meta": {
            "available_categories": sorted(available_categories),
            "available_locations":  sorted(available_locations)[:30],
            "available_companies":  sorted(available_companies)[:50],
            "available_work_modes": sorted(available_work_modes),
            "has_research": any(j.get("is_research") for j in matched_jobs),
            "has_govt":     any(j.get("is_govt")     for j in matched_jobs),
        },
    }


@app.post("/api/jobs/custom-search")
def custom_job_search(
    data: CustomSearchRequest,
    x_user_id: Optional[str] = Header(None),
):
    get_user_id(x_user_id)
    try:
        from job_scraper import search_jobs_custom
        raw_jobs = search_jobs_custom(data.query, data.location or "India")

        if not raw_jobs:
            return {"jobs": [], "total_found": 0, "query": data.query}

        # Match against resume if provided
        if data.resume_id:
            resume = db.get_resume_by_id(data.resume_id)
            if resume:
                matched = match_jobs(resume["parsed_data"], raw_jobs)
                raw_jobs = matched
            else:
                for job in raw_jobs:
                    job["match_score"] = None
                    job["match_label"] = "Unscored"
                    job["skill_gap"]   = None
        else:
            for job in raw_jobs:
                job["match_score"] = None
                job["match_label"] = "Unscored"
                job["skill_gap"]   = None

        # Apply advanced filters if provided by frontend
        filtered = apply_filters(
            raw_jobs,
            categories=data.categories,
            work_modes=data.work_modes,
            min_stipend=data.min_stipend,
            max_stipend=data.max_stipend,
            location=None,          # location already handled by scraper
            company=data.company,
            is_research=data.is_research,
            is_govt=data.is_govt,
        )

        return {
            "jobs":        filtered,
            "total_found": len(filtered),
            "total_raw":   len(raw_jobs),
            "query":       data.query,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Applications ────────────────────────────────────────────

@app.post("/api/applications/mark-applied")
def mark_as_applied(
    data: MarkAppliedRequest,
    x_user_id: Optional[str] = Header(None),
):
    user_id = get_user_id(x_user_id)
    result = db.supabase.table("applications").insert({
        "user_id":     user_id,
        "resume_id":   data.resume_id,
        "job_title":   data.job_data.get("title"),
        "company":     data.job_data.get("company"),
        "apply_url":   data.job_data.get("apply_link"),
        "status":      "applied",
        "match_score": data.job_data.get("match_score"),
        "applied_at":  datetime.now().isoformat(),
    }).execute()
    return {"message": "Application tracked successfully", "application": result.data[0]}


@app.post("/api/applications/add-to-queue")
def add_to_queue(
    data: AddToQueueRequest,
    x_user_id: Optional[str] = Header(None),
):
    user_id = get_user_id(x_user_id)
    result = db.supabase.table("applications").insert({
        "user_id":     user_id,
        "resume_id":   data.resume_id,
        "job_title":   data.job_data.get("title"),
        "company":     data.job_data.get("company"),
        "apply_url":   data.job_data.get("apply_link"),
        "status":      "queued",
        "match_score": data.job_data.get("match_score"),
        "created_at":  datetime.now().isoformat(),
    }).execute()
    return {"message": "Job added to queue", "application": result.data[0]}


@app.delete("/api/applications/{application_id}")
def delete_application(
    application_id: str,
    x_user_id: Optional[str] = Header(None),
):
    user_id = get_user_id(x_user_id)
    try:
        db.supabase.table("applications") \
            .delete() \
            .eq("id", application_id) \
            .eq("user_id", user_id) \
            .execute()
        return {"message": "Removed from queue"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.patch("/api/applications/{application_id}")
def update_application(
    application_id: str,
    data: UpdateApplicationRequest,
):
    update_data = {}
    if data.status:        update_data["status"]         = data.status
    if data.notes:         update_data["notes"]          = data.notes
    if data.interview_date: update_data["interview_date"] = data.interview_date

    result = db.supabase.table("applications") \
        .update(update_data) \
        .eq("id", application_id) \
        .execute()
    return {"message": "Application updated", "application": result.data[0]}


@app.get("/api/applications")
def get_applications(
    status: str = None,
    x_user_id: Optional[str] = Header(None),
):
    user_id      = get_user_id(x_user_id)
    applications = db.get_user_applications(user_id, status)
    return {"total": len(applications), "applications": applications}


# ── Stats ───────────────────────────────────────────────────

@app.get("/api/stats")
def get_stats(x_user_id: Optional[str] = Header(None)):
    user_id  = get_user_id(x_user_id)
    all_apps = db.get_user_applications(user_id)
    return {
        "total_applications": len(all_apps),
        "applied":      len([a for a in all_apps if a["status"] == "applied"]),
        "interviewing": len([a for a in all_apps if a["status"] == "interviewing"]),
        "rejected":     len([a for a in all_apps if a["status"] == "rejected"]),
        "offers":       len([a for a in all_apps if a["status"] == "offer"]),
    }


# ── Auth ────────────────────────────────────────────────────

@app.post("/api/auth/send-otp")
def send_otp(data: OTPRequest):
    try:
        return request_otp(data.email)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/auth/verify-otp")
def verify_otp_endpoint(data: OTPVerifyRequest):
    try:
        return verify_otp(data.email, data.otp)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/auth/me")
def get_me(x_user_id: Optional[str] = Header(None)):
    user_id = get_user_id(x_user_id)
    result = db.supabase.table("profiles") \
        .select("id, email, created_at") \
        .eq("id", user_id) \
        .execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="User not found")
    return result.data[0]


# ── Resume Score & Chat ─────────────────────────────────────

@app.post("/api/resume/score")
def score_resume_api(
    resume_id: str = Body(..., embed=True),
    x_user_id: Optional[str] = Header(None),
):
    uid = get_user_id(x_user_id)
    try:
        from resume_scorer import score_resume as run_score
        resume = db.get_resume_by_id(resume_id)
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found")
        if str(resume.get("user_id")) != str(uid):
            raise HTTPException(status_code=403, detail="Not your resume")
        result = run_score(resume["parsed_data"])
        db.update_resume_score(resume_id, result)
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/resume/{resume_id}/score")
def get_resume_score(
    resume_id: str,
    x_user_id: Optional[str] = Header(None),
):
    uid = get_user_id(x_user_id)
    try:
        resume = db.get_resume_by_id(resume_id)
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found")
        if str(resume.get("user_id")) != str(uid):
            raise HTTPException(status_code=403, detail="Not your resume")
        cached = resume.get("score_data")
        return {"cached": bool(cached), **(cached or {})}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/resume/chat")
def resume_chat(
    data: ResumeChatRequest,
    x_user_id: Optional[str] = Header(None),
):
    uid = get_user_id(x_user_id)
    try:
        from resume_scorer import chat_with_resume, score_resume as run_score
        resume = db.get_resume_by_id(data.resume_id)
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found")
        if str(resume.get("user_id")) != str(uid):
            raise HTTPException(status_code=403, detail="Not your resume")
        parsed = resume["parsed_data"]
        score  = resume.get("score_data") or run_score(parsed)
        reply  = chat_with_resume(
            parsed_resume=parsed,
            score_result=score,
            conversation_history=data.conversation_history,
            user_message=data.message,
        )
        return {"reply": reply, "role": "assistant"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Filter metadata endpoint (for dynamic frontend UI) ──────

@app.get("/api/jobs/filter-options")
def get_filter_options():
    """Return static filter options for the frontend filter UI."""
    from job_config import JOB_CATEGORIES, WORK_MODES
    return {
        "categories": [
            {"value": k, "label": v}
            for k, v in JOB_CATEGORIES.items()
        ],
        "work_modes": [
            {"value": m, "label": m.replace("-", " ").title()}
            for m in WORK_MODES
        ],
    }


# ── On-demand skill gap analysis (called by JobDetailModal) ──

class AnalyzeSkillsRequest(BaseModel):
    resume_id: str
    job_title: str
    job_description: str
    base_match_score: Optional[float] = 0.0


@app.post("/api/jobs/analyze-skills")
def analyze_job_skills(
    data: AnalyzeSkillsRequest,
    x_user_id: Optional[str] = Header(None),
):
    """
    Runs full Groq + local skill gap analysis for a single job.
    Called when user opens the JobDetailModal.
    """
    get_user_id(x_user_id)
    try:
        resume = db.get_resume_by_id(data.resume_id)
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found")

        resume_skills = resume["parsed_data"].get("skills", [])

        # Try Groq first
        try:
            from skill_analyzer import analyze_skill_gap, format_skill_gap_for_frontend
            raw = analyze_skill_gap(
                resume_skills=resume_skills,
                job_title=data.job_title,
                job_description=data.job_description,
                base_match_score=data.base_match_score,
            )
            if raw and raw.get("missing_skills"):
                return format_skill_gap_for_frontend(raw)
        except Exception as groq_err:
            print(f"[AnalyzeSkills] Groq failed: {groq_err}")

        # Fallback to local analysis
        from matcher import analyze_skills_basic, generate_learning_recommendations
        local = analyze_skills_basic(
            resume_skills,
            data.job_description,
            data.job_title,
        )
        roadmaps = generate_learning_recommendations(local["missing_skills"])
        return {
            "missing_skills":                   local["missing_skills"],
            "critical_count":                   local["critical_count"],
            "important_count":                  0,
            "minor_count":                      len([m for m in local["missing_skills"] if m.get("criticality") == "MINOR"]),
            "roadmaps":                         roadmaps,
            "estimated_score_after_upskilling": min(100, data.base_match_score + local["critical_count"] * 8),
            "interviewer_verdict":              "",
            "quick_wins":                       [m["skill"] for m in local["missing_skills"] if m.get("criticality") == "MINOR"][:3],
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Paginated job results endpoint ──────────────────────────

@app.get("/api/jobs/results/{search_id}")
def get_paginated_jobs(
    search_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    include_aspirational: bool = Query(True),
    x_user_id: Optional[str] = Header(None),
):
    """
    Returns paginated job results from a previous search.
    Page 1 = top 20 matched jobs.
    Page 2+ = remaining jobs including all aspirational opportunities.
    Always includes govt/research/consulting regardless of match score.
    """
    get_user_id(x_user_id)
    try:
        search = db.supabase.table("job_searches") \
            .select("*") \
            .eq("id", search_id) \
            .single() \
            .execute()
        if not search.data:
            raise HTTPException(status_code=404, detail="Search not found")

        all_jobs = search.data.get("jobs", [])

        # Always surface aspirational at top regardless of pagination
        aspirational = [j for j in all_jobs if j.get("is_aspirational")]
        regular      = [j for j in all_jobs if not j.get("is_aspirational")]

        if include_aspirational and page == 1:
            combined = aspirational + regular
        else:
            combined = all_jobs

        # Apply pagination
        offset = (page - 1) * page_size
        paginated = combined[offset: offset + page_size]
        total = len(combined)

        return {
            "jobs":       paginated,
            "page":       page,
            "page_size":  page_size,
            "total":      total,
            "has_more":   offset + page_size < total,
            "search_id":  search_id,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 10000))
    uvicorn.run("main:app", host="0.0.0.0", port=port)