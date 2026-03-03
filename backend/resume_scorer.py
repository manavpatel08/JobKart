"""
Resume Scorer — Groq-powered resume evaluation engine.

Scoring methodology based on industry research from:
- Google/Meta/Amazon recruiter interviews
- LinkedIn Talent Insights
- Glassdoor recruiter surveys
- ATS system whitepapers (Workday, Greenhouse, Lever)

Total: 100 points across 8 dimensions.
"""

import os
import json
from groq import Groq
from dotenv import load_dotenv

load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))


# ── SCORING RUBRIC ─────────────────────────────────────────
SCORING_DIMENSIONS = {
    "impact_and_quantification": {
        "weight": 25,
        "description": "Are achievements quantified? Numbers, percentages, scale of impact.",
        "what_recruiters_look_for": "Bullet points with metrics like 'reduced latency by 40%', 'handled 1M+ users', 'led team of 8'"
    },
    "technical_depth_and_relevance": {
        "weight": 20,
        "description": "Depth and relevance of technical skills to current industry demand.",
        "what_recruiters_look_for": "Specific frameworks/tools used in context, not just a skills list dump"
    },
    "experience_quality": {
        "weight": 20,
        "description": "Quality of experience: tier of companies, project scale, ownership.",
        "what_recruiters_look_for": "Known companies, significant projects, clear ownership and scope"
    },
    "formatting_and_readability": {
        "weight": 10,
        "description": "Clean structure, appropriate length, scannable in 6 seconds.",
        "what_recruiters_look_for": "1-2 pages, consistent formatting, no walls of text, good section hierarchy"
    },
    "education_and_credentials": {
        "weight": 10,
        "description": "Education relevance, GPA (if strong), certifications.",
        "what_recruiters_look_for": "Tier of institution, relevant degree, notable certifications like AWS/GCP"
    },
    "projects_and_portfolio": {
        "weight": 8,
        "description": "Strength of personal/academic projects, GitHub links, live demos.",
        "what_recruiters_look_for": "Real projects with outcomes, not just course assignments"
    },
    "career_progression": {
        "weight": 4,
        "description": "Is there a clear growth trajectory in titles and responsibilities?",
        "what_recruiters_look_for": "Promotions, increasing scope, no unexplained gaps"
    },
    "ats_compatibility": {
        "weight": 3,
        "description": "Will ATS systems parse this correctly? Standard section names, no tables/columns.",
        "what_recruiters_look_for": "Standard headings, no complex formatting, keyword density"
    },
}


def score_resume(parsed_resume: dict, raw_resume_text: str = "") -> dict:
    """
    Main scoring function.
    parsed_resume: output from resume_parser.py
    raw_resume_text: full text extracted from PDF (for better analysis)
    """

    resume_summary = _build_resume_summary(parsed_resume, raw_resume_text)

    prompt = f"""
You are a senior technical recruiter at a top-tier company (think Google, Goldman Sachs, McKinsey level).
You've reviewed 10,000+ resumes. Your feedback is precise, direct, and actionable.

Score this resume on 8 dimensions. Be STRICT and REALISTIC — a "good" resume scores 65-75, an exceptional one 85+.
Most resumes score 40-60. Don't inflate scores.

RESUME CONTENT:
{resume_summary}

Score each dimension from 0 to its max_score. Be precise to 1 decimal.

SCORING DIMENSIONS (with max scores):
{json.dumps(SCORING_DIMENSIONS, indent=2)}

Return ONLY valid JSON (no markdown, no explanation):
{{
  "dimension_scores": {{
    "impact_and_quantification": {{
      "score": 18.5,
      "max": 25,
      "grade": "B+",
      "verdict": "one sentence verdict",
      "top_issue": "specific thing to fix",
      "example_fix": "concrete rewrite example or suggestion"
    }},
    "technical_depth_and_relevance": {{ ... }},
    "experience_quality": {{ ... }},
    "formatting_and_readability": {{ ... }},
    "education_and_credentials": {{ ... }},
    "projects_and_portfolio": {{ ... }},
    "career_progression": {{ ... }},
    "ats_compatibility": {{ ... }}
  }},
  "total_score": 72.5,
  "overall_grade": "B",
  "tier": "Competitive" ,
  "tier_explanation": "one sentence about where this resume stands",
  "executive_summary": "2-3 sentence honest overall assessment like a senior recruiter would give",
  "top_3_strengths": ["strength 1", "strength 2", "strength 3"],
  "top_3_critical_fixes": ["fix 1", "fix 2", "fix 3"],
  "ats_score": 78,
  "interview_probability": "Medium",
  "target_companies": ["list of companies this resume is currently competitive for"],
  "reach_companies": ["companies achievable with improvements"],
  "estimated_salary_range": "₹12-18 LPA"
}}

TIER GUIDE:
- 85-100: "Elite" (FAANG-ready, top 5%)
- 75-84: "Strong" (top 15%, most good companies)
- 65-74: "Competitive" (average shortlist threshold)
- 55-64: "Developing" (needs work to compete)
- 0-54: "Needs Overhaul" (significant gaps)
"""

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are a strict senior technical recruiter. Return only valid JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.1,
            max_tokens=2000,
        )

        raw = response.choices[0].message.content.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        raw = raw.strip()

        result = json.loads(raw)
        result["success"] = True
        return result

    except Exception as e:
        print(f"[ResumeScorer] Error: {e}")
        return {"success": False, "error": str(e)}


def chat_with_resume(
    parsed_resume: dict,
    score_result: dict,
    conversation_history: list,
    user_message: str,
) -> str:
    """
    AI chat for resume improvement advice.
    Maintains conversation context.
    """

    resume_context = _build_resume_summary(parsed_resume, "")
    score_context = _build_score_context(score_result)

    system_prompt = f"""
You are an expert career coach and resume consultant — brutally honest, deeply experienced, and genuinely helpful.
You've helped 500+ people land jobs at Google, McKinsey, ISRO, Goldman Sachs, and top Indian startups.

CANDIDATE'S RESUME SUMMARY:
{resume_context}

RESUME SCORE ANALYSIS:
{score_context}

Your job:
- Answer questions about their resume specifically
- Suggest concrete, actionable improvements with examples
- Be honest — don't sugarcoat weak areas
- When suggesting rewrites, show before/after examples
- Reference their actual resume content in answers
- Keep responses concise but complete (150-250 words max unless showing rewrites)
- Use bullet points for lists, but keep prose natural

You know the candidate's name, skills, experience, and score breakdown. Reference specifics.
"""

    messages = [{"role": "system", "content": system_prompt}]
    
    # Add conversation history (last 8 turns to stay within context)
    for turn in conversation_history[-8:]:
        messages.append({"role": turn["role"], "content": turn["content"]})
    
    messages.append({"role": "user", "content": user_message})

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            temperature=0.4,
            max_tokens=800,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        return f"Sorry, I couldn't process that. Error: {str(e)}"


def _build_resume_summary(parsed_resume: dict, raw_text: str) -> str:
    parts = []
    
    if parsed_resume.get("name"):
        parts.append(f"Name: {parsed_resume['name']}")
    if parsed_resume.get("current_title"):
        parts.append(f"Current Title: {parsed_resume['current_title']}")
    if parsed_resume.get("summary"):
        parts.append(f"Summary: {parsed_resume['summary']}")
    
    skills = parsed_resume.get("skills", [])
    if skills:
        parts.append(f"Skills ({len(skills)} total): {', '.join(skills[:20])}")
    
    experience = parsed_resume.get("experience", [])
    if experience:
        parts.append(f"\nExperience ({len(experience)} positions):")
        for exp in experience[:5]:
            exp_text = f"  - {exp.get('title', 'Unknown')} at {exp.get('company', 'Unknown')}"
            if exp.get("duration"):
                exp_text += f" ({exp['duration']})"
            if exp.get("description"):
                exp_text += f"\n    {exp['description'][:300]}"
            parts.append(exp_text)
    
    education = parsed_resume.get("education", [])
    if education:
        parts.append(f"\nEducation:")
        for edu in education:
            parts.append(f"  - {edu.get('degree', '')} from {edu.get('school', '')} ({edu.get('year', '')})")
    
    projects = parsed_resume.get("projects", [])
    if projects:
        parts.append(f"\nProjects ({len(projects)}):")
        for proj in projects[:4]:
            parts.append(f"  - {proj.get('name', '')}: {proj.get('description', '')[:200]}")
    
    certs = parsed_resume.get("certifications", [])
    if certs:
        parts.append(f"\nCertifications: {', '.join(certs[:5])}")
    
    if raw_text:
        parts.append(f"\nRaw text excerpt: {raw_text[:500]}")
    
    return "\n".join(parts)


def _build_score_context(score_result: dict) -> str:
    if not score_result or not score_result.get("success"):
        return "Score not available"
    
    lines = [f"Total Score: {score_result.get('total_score')}/100 ({score_result.get('overall_grade')}) - {score_result.get('tier')}"]
    
    dims = score_result.get("dimension_scores", {})
    for key, val in dims.items():
        lines.append(f"  {key}: {val.get('score')}/{val.get('max')} — {val.get('verdict', '')}")
    
    fixes = score_result.get("top_3_critical_fixes", [])
    if fixes:
        lines.append(f"Critical fixes needed: {'; '.join(fixes)}")
    
    return "\n".join(lines)