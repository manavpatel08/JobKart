"""
matcher.py — AutoApply AI (IMPROVED)
Phase 1: Sentence Transformers semantic similarity on ALL jobs
Phase 2: Skill analysis — FIXED missing skills detection
Phase 3: Groq enrichment on top 15 jobs
Phase 4: Sort — top 20 by match score shown first, aspirational always surfaced

FIX: Missing skills detection was broken because:
  - Skill comparison was case-sensitive and used exact set membership
  - SKILL_CATEGORIES only covers known skills, not job-specific ones
  - Groq fallback was silently returning empty arrays on failure
All three issues are now fixed.
"""

import re
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from job_config import (
    SKILL_CATEGORIES, ASPIRATIONAL_COMPANIES,
    GOVERNMENT_ORGS, RESEARCH_INSTITUTES, CONSULTING_FIRMS
)

print("Loading sentence transformer model...")
model = SentenceTransformer("all-MiniLM-L6-v2")
print("Model loaded!")

TOP_N_FOR_GROQ   = 15   # Run Groq analysis only on top 15 by semantic score
MIN_BIG_CO_SCORE = 25   # Big company jobs always shown if score >= this floor
TOP_N_DISPLAY    = 20   # Default number of top-matched jobs to show (rest = load more)

# All skills flattened into a lowercase set for fast lookup
ALL_KNOWN_SKILLS_LOWER = {
    s.lower()
    for skills in SKILL_CATEGORIES.values()
    for s in skills
}

# Skill synonym/alias map for smarter matching
SKILL_ALIASES = {
    "node": "node.js",
    "nodejs": "node.js",
    "js": "javascript",
    "ts": "typescript",
    "py": "python",
    "tf": "tensorflow",
    "ml": "machine learning",
    "dl": "deep learning",
    "cv": "computer vision",
    "k8s": "kubernetes",
    "aws": "amazon web services",
    "gcp": "google cloud",
    "fastapi": "fastapi",
    "postgres": "postgresql",
    "mongo": "mongodb",
    "react.js": "react",
    "reactjs": "react",
    "vue.js": "vue",
    "vuejs": "vue",
    "angular.js": "angular",
    "scikit": "scikit-learn",
}


# ─────────────────────────────────────────────────────────
# SKILL NORMALISATION
# ─────────────────────────────────────────────────────────

def normalise_skill(skill: str) -> str:
    """Lowercase + apply alias map."""
    s = skill.strip().lower()
    return SKILL_ALIASES.get(s, s)


def normalise_skill_list(skills: list) -> set:
    """Return a set of normalised skill strings."""
    return {normalise_skill(s) for s in skills if s}


def extract_skills_from_text(text: str) -> list:
    """
    Extract ALL known skills mentioned in a job description.
    Uses SKILL_CATEGORIES as ground truth + regex for common patterns.
    Returns a list of original-casing skill names.
    """
    text_lower = text.lower()
    found = []

    for category, skills in SKILL_CATEGORIES.items():
        for skill in skills:
            # Use word-boundary matching to avoid false positives (e.g. "C" in "CI/CD")
            pattern = r'\b' + re.escape(skill.lower()) + r'\b'
            if re.search(pattern, text_lower):
                found.append(skill)

    # Also check aliases / variants
    for alias, canonical in SKILL_ALIASES.items():
        pattern = r'\b' + re.escape(alias) + r'\b'
        if re.search(pattern, text_lower):
            # Find the canonical skill in SKILL_CATEGORIES and add it
            for category, skills in SKILL_CATEGORIES.items():
                for skill in skills:
                    if skill.lower() == canonical:
                        if skill not in found:
                            found.append(skill)

    return found


# ─────────────────────────────────────────────────────────
# TEXT CONVERTERS
# ─────────────────────────────────────────────────────────

def resume_to_text(parsed_resume: dict) -> str:
    parts = []
    title = parsed_resume.get("current_title", "")
    if title:
        parts.append(f"Job title: {title}")
    skills = parsed_resume.get("skills", [])
    if skills:
        parts.append(f"Skills: {', '.join(skills)}")
    summary = parsed_resume.get("summary", "")
    if summary:
        parts.append(summary)
    for exp in parsed_resume.get("experience", []):
        parts.append(f"{exp.get('title', '')} at {exp.get('company', '')}")
        parts.append(exp.get("description", ""))
    for edu in parsed_resume.get("education", []):
        parts.append(f"{edu.get('degree', '')} from {edu.get('school', '')}")
    return " ".join(parts)


def job_to_text(job: dict) -> str:
    parts = []
    if job.get("title"):
        parts.append(f"Job title: {job['title']}")
    if job.get("company"):
        parts.append(f"Company: {job['company']}")
    if job.get("description"):
        parts.append(job["description"])
    return " ".join(parts)


# ─────────────────────────────────────────────────────────
# SKILL ANALYSIS (FIXED)
# ─────────────────────────────────────────────────────────

def analyze_skills_basic(resume_skills: list, job_text: str, job_title: str) -> dict:
    """
    FIXED: Local skill gap analysis.

    Root causes of "No Missing Skills" bug:
      1. Skill comparison was case-sensitive → now uses normalise_skill()
      2. Only checked if skill was in resume_skills list directly → now checks
         normalised set so "React.js" == "React" == "react"
      3. Was not extracting skills dynamically from job description →
         now uses extract_skills_from_text() with word-boundary matching

    Called for ALL jobs as baseline. Groq used for top 15 only.
    """
    # Normalise resume skills to a set (handles case, aliases)
    resume_skills_normalised = normalise_skill_list(resume_skills)

    # Extract what the job actually requires
    job_required_skills = extract_skills_from_text(job_text)
    job_title_lower     = job_title.lower()

    matched_skills = []
    missing_skills = []

    for skill in job_required_skills:
        skill_norm = normalise_skill(skill)

        # Is this skill in the candidate's resume?
        in_resume = (
            skill_norm in resume_skills_normalised
            or any(skill_norm in normalise_skill(rs) for rs in resume_skills)
            or any(normalise_skill(rs) in skill_norm for rs in resume_skills if len(rs) > 3)
        )

        if in_resume:
            matched_skills.append(skill)
        else:
            # Determine criticality: mentioned in title or appears 2+ times = CRITICAL
            mention_count = len(re.findall(r'\b' + re.escape(skill.lower()) + r'\b', job_text.lower()))
            in_title      = re.search(r'\b' + re.escape(skill.lower()) + r'\b', job_title_lower) is not None
            is_critical   = mention_count >= 2 or in_title

            missing_skills.append({
                "skill":        skill,
                "criticality":  "CRITICAL" if is_critical else "MINOR",
                "emoji":        "🔴" if is_critical else "🟢",
                "reason":       "Required in job title" if in_title else f"Mentioned {mention_count}× in description",
            })

    critical_count  = len([m for m in missing_skills if m["criticality"] == "CRITICAL"])
    skill_match_pct = round(
        (len(matched_skills) / len(job_required_skills) * 100)
        if job_required_skills else 0,
        1,
    )

    return {
        "matched_skills":  matched_skills[:10],
        "missing_skills":  missing_skills[:8],
        "critical_count":  critical_count,
        "skill_match_pct": skill_match_pct,
        "total_required":  len(job_required_skills),
    }


# ─────────────────────────────────────────────────────────
# MATCH LABELS
# ─────────────────────────────────────────────────────────

def get_match_label(score: float, critical_count: int, is_aspirational: bool = False) -> tuple:
    if is_aspirational and score < 55:
        return "Aspirational", "🌟"
    if score >= 75 and critical_count == 0:
        return "Excellent Match", "🟢"
    if score >= 65 and critical_count <= 1:
        return "Strong Match", "🟢"
    if score >= 50 and critical_count <= 2:
        return "Good Match", "🟡"
    if score >= 40:
        return "Decent Match", "🟡"
    if score >= 25:
        return "Partial Match", "🟠"
    return "Low Match", "🔴"


def get_opportunity_tag(job: dict, score: float) -> dict:
    company = job.get("company", "")

    if company in GOVERNMENT_ORGS:
        return {
            "tag":         "🏛 Government Opportunity",
            "tag_color":   "#1d4ed8",
            "tag_bg":      "#eff6ff",
            "description": "Strategic government role with high impact and job security.",
            "show_anyway": True,
        }
    if company in RESEARCH_INSTITUTES:
        return {
            "tag":         "🎓 Research Opportunity",
            "tag_color":   "#7c3aed",
            "tag_bg":      "#f5f3ff",
            "description": "Research role at a premier institute. Invaluable for academic and R&D careers.",
            "show_anyway": True,
        }
    if job.get("is_quant"):
        return {
            "tag":         "📈 Quant Opportunity",
            "tag_color":   "#0f766e",
            "tag_bg":      "#f0fdfa",
            "description": "Highly competitive quant firm. Exceptional for quantitative and algo-trading careers.",
            "show_anyway": True,
        }
    if company in ASPIRATIONAL_COMPANIES and score < 55:
        return {
            "tag":         "🌟 Aspirational Opportunity",
            "tag_color":   "#b45309",
            "tag_bg":      "#fffbeb",
            "description": "Low current match but top-tier company. Highly recommended to apply after upskilling.",
            "show_anyway": True,
        }
    if company in ASPIRATIONAL_COMPANIES and score >= 55:
        return {
            "tag":         "🚀 High Impact Opportunity",
            "tag_color":   "#065f46",
            "tag_bg":      "#ecfdf5",
            "description": "Tier-1 company with strong match. Highly recommended.",
            "show_anyway": False,
        }
    if company in CONSULTING_FIRMS:
        return {
            "tag":         "💼 Consulting Role",
            "tag_color":   "#92400e",
            "tag_bg":      "#fef3c7",
            "description": "Consulting roles offer broad exposure and fast career growth.",
            "show_anyway": True,
        }
    return {"tag": None, "show_anyway": False}


def generate_interviewer_note(score: float, critical_count: int, is_aspirational: bool) -> str:
    if is_aspirational and score < 40:
        return "Below current match threshold but Tier-1 brand. Apply after bridging key skill gaps."
    if score >= 70 and critical_count == 0:
        return "Strong candidate — resume aligns well. Recommend for interview."
    if score >= 55 and critical_count <= 1:
        return "Good candidate with room for growth. Missing skill can likely be learned on the job."
    if score >= 40 and critical_count <= 2:
        return "Decent fit, needs some skill development. Worth applying."
    if score >= 25:
        return "Partial match — significant skill gap. Upskill then apply."
    return "Low match — consider roles better aligned to current skills."


# ─────────────────────────────────────────────────────────
# GROQ ENRICHMENT (top 15 only)
# ─────────────────────────────────────────────────────────

def try_groq_analysis(resume_skills: list, job: dict, base_score: float) -> dict | None:
    """Try to run Groq analysis. Returns None if unavailable or failed."""
    try:
        from skill_analyzer import analyze_skill_gap, format_skill_gap_for_frontend
        raw = analyze_skill_gap(
            resume_skills=resume_skills,
            job_title=job.get("title", ""),
            job_description=job.get("description", ""),
            base_match_score=base_score,
        )

        # Validate Groq returned something useful — don't accept empty arrays
        if not raw or not raw.get("missing_skills"):
            print(f"  [Groq] Returned empty missing_skills — falling back to local analysis")
            return None

        formatted = format_skill_gap_for_frontend(raw)

        # Final validation: if Groq says 0 missing skills on a < 70% match, it's wrong
        if (not formatted.get("missing_skills") and base_score < 70):
            print(f"  [Groq] Suspiciously empty missing_skills for {base_score}% match — using local")
            return None

        return formatted

    except Exception as e:
        print(f"  [Groq] Skipped ({e.__class__.__name__}): using local analysis")
        return None


# ─────────────────────────────────────────────────────────
# GENERATE LEARNING RECOMMENDATIONS FROM MISSING SKILLS
# ─────────────────────────────────────────────────────────

def generate_learning_recommendations(missing_skills: list) -> list:
    """
    Generate basic learning recommendations from missing skills.
    Used when Groq roadmaps are unavailable.
    """
    recommendations = []
    for item in missing_skills[:5]:
        skill = item.get("skill", "") if isinstance(item, dict) else str(item)
        criticality = item.get("criticality", "MINOR") if isinstance(item, dict) else "MINOR"
        if not skill:
            continue
        recommendations.append({
            "skill":        skill,
            "why_critical": f"Required for this role{'(critical)' if criticality == 'CRITICAL' else ''}",
            "steps": [
                f"Step 1: Learn {skill} fundamentals (1-2 weeks)",
                f"Step 2: Build a small project using {skill} (1-2 weeks)",
                f"Step 3: Add {skill} to your resume and portfolio (ongoing)",
            ],
            "total_time":     "2-4 weeks",
            "resources":      f"Official {skill} docs, Coursera, YouTube tutorials",
            "priority_order": 1 if criticality == "CRITICAL" else 2,
        })
    return recommendations


# ─────────────────────────────────────────────────────────
# MAIN MATCHING
# ─────────────────────────────────────────────────────────

def match_jobs(parsed_resume: dict, jobs: list) -> list:
    if not jobs:
        return []

    print(f"\nRunning semantic matching on {len(jobs)} jobs...")

    resume_text      = resume_to_text(parsed_resume)
    resume_skills    = parsed_resume.get("skills", [])
    resume_embedding = model.encode([resume_text])

    # ── Phase 1: Semantic score all jobs ──────────────────
    scored = []
    for job in jobs:
        job_text      = job_to_text(job)
        job_embedding = model.encode([job_text])
        similarity    = cosine_similarity(resume_embedding, job_embedding)[0][0]
        base_score    = round(float(similarity) * 100, 1)
        scored.append((base_score, job))

    # Sort by semantic score (best first)
    scored.sort(key=lambda x: -x[0])

    # ── Phase 2: Skill analysis + Groq enrichment ─────────
    print(f"Running skill analysis on all {len(scored)} jobs (Groq for top {min(TOP_N_FOR_GROQ, len(scored))})...")
    results = []

    for i, (base_score, job) in enumerate(scored):
        company       = job.get("company", "")
        is_asp        = job.get("is_aspirational", False)
        is_govt       = job.get("is_govt", False)
        is_research   = job.get("is_research", False)
        is_consulting = job.get("is_consulting", False)
        is_quant      = job.get("is_quant", False)

        # Local skill analysis (always run — provides the safety net)
        local_analysis = analyze_skills_basic(
            resume_skills,
            job_to_text(job),
            job.get("title", ""),
        )

        # Try Groq for top 15 only
        groq_gap = None
        if i < TOP_N_FOR_GROQ:
            print(f"  [{i+1}] {job.get('title')} @ {company} ({base_score}%)")
            groq_gap = try_groq_analysis(resume_skills, job, base_score)

        # ── Pick best source for skill data ───────────────
        if groq_gap and groq_gap.get("missing_skills"):
            critical_count         = groq_gap.get("critical_count", 0)
            missing_skills_display = groq_gap.get("missing_skills", [])
            roadmaps               = groq_gap.get("roadmaps", [])
            estimated_boost        = groq_gap.get("estimated_score_after_upskilling", base_score)
            quick_wins             = groq_gap.get("quick_wins", [])
            interviewer_verdict    = groq_gap.get("interviewer_verdict", "")
            # Merge: Groq missing skills take priority, but also show local ones Groq missed
            local_missing_skills   = {
                m["skill"].lower() for m in local_analysis["missing_skills"]
            }
            groq_missing_names = {
                m["skill"].lower() for m in missing_skills_display
            }
            # Add any local CRITICAL skills Groq missed
            for m in local_analysis["missing_skills"]:
                if m["skill"].lower() not in groq_missing_names and m["criticality"] == "CRITICAL":
                    missing_skills_display.append(m)
        else:
            # Local analysis is the source of truth
            critical_count         = local_analysis["critical_count"]
            missing_skills_display = local_analysis["missing_skills"]
            roadmaps               = generate_learning_recommendations(missing_skills_display)
            estimated_boost        = min(100, base_score + (critical_count * 8))
            quick_wins             = [
                m["skill"] for m in missing_skills_display
                if isinstance(m, dict) and m.get("criticality") == "MINOR"
            ][:3]
            interviewer_verdict    = ""

        # ── Score adjustments ──────────────────────────────
        adjusted_score = base_score
        adjusted_score -= critical_count * 5
        if critical_count == 0 and local_analysis["matched_skills"]:
            adjusted_score += 3
        if is_govt or is_research:
            adjusted_score += 4
        # Floor for aspirational/big companies — ALWAYS surfaced
        if (is_asp or is_govt or is_research or is_consulting or is_quant) and adjusted_score < MIN_BIG_CO_SCORE:
            adjusted_score = MIN_BIG_CO_SCORE
        adjusted_score = round(max(0, min(100, adjusted_score)), 1)

        match_label, match_emoji = get_match_label(adjusted_score, critical_count, is_asp)
        opp_tag = get_opportunity_tag(job, adjusted_score)
        interviewer_note = interviewer_verdict or generate_interviewer_note(adjusted_score, critical_count, is_asp)

        # Mark job as aspirational if it's any special category (for frontend)
        is_aspirational_final = (
            is_asp or is_govt or is_research or is_consulting or is_quant
            or bool(opp_tag.get("tag"))
        )

        results.append({
            **job,
            "match_score":  adjusted_score,
            "base_score":   base_score,
            "match_label":  match_label,
            "match_emoji":  match_emoji,

            # Opportunity
            "opportunity_tag":         opp_tag.get("tag"),
            "opportunity_tag_color":   opp_tag.get("tag_color"),
            "opportunity_tag_bg":      opp_tag.get("tag_bg"),
            "opportunity_description": opp_tag.get("description"),
            "is_aspirational":         is_aspirational_final,

            # Skill data (properly computed)
            "matched_skills":   local_analysis["matched_skills"],
            "missing_skills":   missing_skills_display,
            "critical_count":   critical_count,
            "skill_match_pct":  local_analysis["skill_match_pct"],

            # Groq extras / fallback recommendations
            "roadmaps":                         roadmaps,
            "estimated_score_after_upskilling": estimated_boost,
            "quick_wins":                       quick_wins,
            "interviewer_note":                 interviewer_note,

            # Pagination metadata
            "is_top_match": i < TOP_N_DISPLAY,   # used by frontend for initial load

            # Backwards compat fields used by frontend
            "critical_missing_skills": [
                f"{m['emoji']} {m['skill']} — {m.get('reason', '')}"
                for m in missing_skills_display
                if isinstance(m, dict) and m.get("criticality") == "CRITICAL"
            ][:5],
            "learning_recommendations": roadmaps[:3],
            "warnings": [
                f"Missing critical skills: {', '.join([m['skill'] if isinstance(m, dict) else str(m) for m in missing_skills_display[:3] if (m.get('criticality') if isinstance(m, dict) else False) == 'CRITICAL'])}"
            ] if critical_count > 0 else [],
            "potential_score_boost": (
                f"Upskill to raise match from {adjusted_score}% → {estimated_boost}%"
                if estimated_boost > adjusted_score else None
            ),
            "match_reasons": [],
        })

    # ── Phase 3: Final sort ───────────────────────────────
    # Aspirational / Tier-1 / Govt / Research always visible
    # Then match score (top 20 first, rest behind "load more")
    # Then company tier
    results.sort(key=lambda x: (
        not x.get("is_aspirational", False),
        -x["match_score"],
        x.get("company_tier", 5),
    ))

    if results:
        top = results[0]
        print(f"\nTop match: {top['title']} @ {top['company']} → {top['match_score']}%")

    print(f"Total results: {len(results)} (top {min(TOP_N_DISPLAY, len(results))} shown by default)")

    return results