"""
Skill Analyzer — Groq-powered skill gap analysis and roadmap generation.
Sentence Transformers handles similarity. This handles REASONING.
"""

import os
import json
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))


def analyze_skill_gap(
    resume_skills: list,
    job_title: str,
    job_description: str,
    base_match_score: float,
) -> dict:
    """
    Uses Groq to intelligently analyze skill gaps.
    Called only for top 15 jobs by semantic score.
    Returns structured gap analysis + roadmap.
    """

    prompt = f"""
You are a senior technical recruiter and career coach.
Analyze the skill gap between this candidate and job.

CANDIDATE SKILLS: {", ".join(resume_skills) if resume_skills else "None listed"}

JOB TITLE: {job_title}
JOB DESCRIPTION (excerpt): {job_description[:800]}
CURRENT MATCH SCORE: {base_match_score}%

Your task:
1. Identify skills the candidate is MISSING for this specific role
2. For each missing skill, classify criticality:
   - CRITICAL: Must-have, role cannot be performed without it
   - IMPORTANT: Strongly preferred, impacts performance significantly  
   - MINOR: Good to have, nice but not blocking
3. For each CRITICAL skill, provide a learning roadmap
4. Estimate new match score after learning critical skills
5. Be SMART about equivalents — if job needs "Node.js" and candidate knows "Django/FastAPI", 
   note the ecosystem gap but acknowledge transferable backend knowledge

IMPORTANT RULES:
- Do NOT list skills already in candidate's skill set
- Think like an interviewer: would this candidate get an interview?
- Consider ecosystem equivalents (e.g. Flask → FastAPI → Django are similar)
- Government/Research roles: prioritize domain knowledge over specific tools
- Be concise and realistic

Return ONLY valid JSON, no markdown, no explanation:
{{
  "missing_skills": [
    {{
      "skill": "skill name",
      "criticality": "CRITICAL" | "IMPORTANT" | "MINOR",
      "reason": "one sentence why this matters for the role",
      "ecosystem_note": "optional — if candidate has equivalent skill"
    }}
  ],
  "critical_roadmaps": [
    {{
      "skill": "skill name",
      "why_critical": "one sentence explanation",
      "steps": [
        "Step 1: description (X weeks)",
        "Step 2: description (X weeks)"
      ],
      "total_time": "X-Y weeks",
      "resources": "specific resources to learn this",
      "priority_order": 1
    }}
  ],
  "estimated_score_after_upskilling": 85,
  "interviewer_verdict": "one sentence — would you call this candidate for interview?",
  "quick_wins": ["skills that can be learned in under 1 week to boost match"]
}}
"""

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": "You are a technical recruiter. Return only valid JSON."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.2,
            max_tokens=1500,
        )

        raw = response.choices[0].message.content.strip()

        # clean markdown if model added it
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        raw = raw.strip()

        result = json.loads(raw)
        return result

    except Exception as e:
        print(f"[SkillAnalyzer] Groq error for '{job_title}': {e}")
        return {
            "missing_skills": [],
            "critical_roadmaps": [],
            "estimated_score_after_upskilling": base_match_score,
            "interviewer_verdict": "Analysis unavailable",
            "quick_wins": []
        }


def get_criticality_emoji(criticality: str) -> str:
    return {
        "CRITICAL":  "🔴",
        "IMPORTANT": "🟡",
        "MINOR":     "🟢",
    }.get(criticality.upper(), "⚪")


def format_skill_gap_for_frontend(gap_analysis: dict) -> dict:
    """
    Converts raw Groq output into clean frontend-ready format.
    """
    missing = gap_analysis.get("missing_skills", [])
    roadmaps = gap_analysis.get("critical_roadmaps", [])

    # format missing skills with emoji
    formatted_missing = []
    for item in missing:
        formatted_missing.append({
            "skill":         item.get("skill", ""),
            "criticality":   item.get("criticality", "MINOR"),
            "emoji":         get_criticality_emoji(item.get("criticality", "MINOR")),
            "reason":        item.get("reason", ""),
            "ecosystem_note": item.get("ecosystem_note", ""),
        })

    # sort by criticality: CRITICAL first, then IMPORTANT, then MINOR
    order = {"CRITICAL": 0, "IMPORTANT": 1, "MINOR": 2}
    formatted_missing.sort(key=lambda x: order.get(x["criticality"], 3))

    # format roadmaps
    formatted_roadmaps = []
    for r in sorted(roadmaps, key=lambda x: x.get("priority_order", 99)):
        formatted_roadmaps.append({
            "skill":          r.get("skill", ""),
            "why_critical":   r.get("why_critical", ""),
            "steps":          r.get("steps", []),
            "total_time":     r.get("total_time", ""),
            "resources":      r.get("resources", ""),
            "priority_order": r.get("priority_order", 1),
        })

    return {
        "missing_skills":                  formatted_missing,
        "critical_count":                  len([m for m in missing if m.get("criticality") == "CRITICAL"]),
        "important_count":                 len([m for m in missing if m.get("criticality") == "IMPORTANT"]),
        "minor_count":                     len([m for m in missing if m.get("criticality") == "MINOR"]),
        "roadmaps":                        formatted_roadmaps,
        "estimated_score_after_upskilling": gap_analysis.get("estimated_score_after_upskilling", 0),
        "interviewer_verdict":             gap_analysis.get("interviewer_verdict", ""),
        "quick_wins":                      gap_analysis.get("quick_wins", []),
    }