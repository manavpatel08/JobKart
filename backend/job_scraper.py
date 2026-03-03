"""
job_scraper.py — AutoApply AI (IMPROVED)
Search strategy:
  1. Role-based queries (what the candidate can do) — broad, no branch filters
  2. FAANG + top India startups — ALWAYS shown
  3. Consulting firms — ALWAYS shown
  4. Govt / Research (ISRO, DRDO etc.) — ALWAYS shown
  5. IIT-specific — research internships, normal internships, full-time jobs
  6. Glassdoor, LinkedIn, Company career pages, Quant firms, MNCs, Unicorns
  7. Multi-source pagination for breadth — aspirational even at low match score

IMPORTANT: We NEVER reduce search breadth. We expand it.
"""

import requests
import os
from dotenv import load_dotenv
from job_config import (
    BIG_TECH_GLOBAL, BIG_TECH_INDIA, CONSULTING_FIRMS, FINANCE_TECH,
    GOVERNMENT_ORGS, RESEARCH_INSTITUTES,
    DEGREE_TO_ROLES, COMPANY_TIERS,
    ALL_BIG_COMPANIES, ASPIRATIONAL_COMPANIES,
    RESULTS_PER_QUERY, DATE_POSTED,
)

load_dotenv()
SERPAPI_KEY = os.getenv("SERPAPI_KEY", "")

# ── Curated company lists ───────────────────────────────────────────────────
FAANG_PLUS = [
    "Google", "Microsoft", "Amazon", "Meta", "Apple",
    "Netflix", "Adobe", "Salesforce", "IBM", "Oracle",
]
TOP_INDIA = [
    "Flipkart", "PhonePe", "Razorpay", "CRED", "Zepto",
    "Swiggy", "Zomato", "Meesho", "Ola", "Paytm",
    "Dream11", "Groww", "Upstox", "ShareChat",
]
TOP_CONSULTING = [
    "McKinsey", "BCG", "Bain", "Deloitte", "Accenture",
    "PwC", "EY", "KPMG", "Oliver Wyman", "Capgemini",
]
TOP_FINTECH = [
    "Goldman Sachs", "JPMorgan", "Visa", "Mastercard",
    "Stripe", "Bloomberg", "Morgan Stanley", "Citi",
]
QUANT_FIRMS = [
    "Optiver", "Jane Street", "Citadel", "DE Shaw",
    "Two Sigma", "Virtu Financial", "Jump Trading",
    "WorldQuant", "Squarepoint Capital", "IMC Trading",
    "Tower Research Capital", "Quantitative Brokers",
]
TOP_GOVT = [
    "ISRO", "DRDO", "BARC", "CSIR", "C-DAC", "BEL", "HAL", "NTPC", "BHEL",
]
UNICORN_STARTUPS = [
    "Byju's", "Unacademy", "Nykaa", "PolicyBazaar", "OYO",
    "Delhivery", "Cars24", "Pristyn Care", "Licious", "Purplle",
    "Mamaearth", "boAt", "Vedantu", "Physics Wallah", "Slice",
    "Jar", "Rupeek", "Spinny", "Darwinbox",
]
SERVICE_MNCS = [
    "TCS", "Infosys", "Wipro", "HCL", "Tech Mahindra",
    "Cognizant", "LTIMindtree", "Mphasis", "Persistent Systems",
    "Intel", "Qualcomm", "AMD", "Nvidia", "Cisco",
]

# All IIT campuses
IIT_NAMES = [
    "IIT Bombay", "IIT Delhi", "IIT Madras", "IIT Kanpur",
    "IIT Kharagpur", "IIT Roorkee", "IIT Hyderabad", "IIT Bangalore",
    "IIT Guwahati", "IIT BHU", "IIT Indore", "IIT Dhanbad",
    "IISc Bangalore", "IISc", "Indian Institute of Science",
    "TIFR", "IISER", "IISER Pune", "IISER Kolkata",
]

# Noise sources to reject
REJECT_COMPANIES = {
    "Naukri", "Indeed", "Foundit", "Shine", "Monster",
    "HireMee", "Instahyre", "Apna", "WorkIndia",
}

REJECT_TITLE_KEYWORDS = [
    "data entry", "back office", "telecaller", "telesales", "bpo",
    "call center", "customer care executive",
]


# ── Resume profile helpers ──────────────────────────────────────────────────

def is_student(parsed_resume: dict) -> bool:
    title = parsed_resume.get("current_title", "").lower()
    student_keywords = [
        "student", "undergraduate", "b.tech", "b.e", "bachelor",
        "pursuing", "fresher", "final year", "third year", "second year",
    ]
    if any(kw in title for kw in student_keywords):
        return True
    for edu in parsed_resume.get("education", []):
        grad_year = str(edu.get("year", ""))
        if grad_year in ["2025", "2026", "2027", "2028", "2029"]:
            return True
    return False


def detect_degree_field(parsed_resume: dict) -> str:
    for edu in parsed_resume.get("education", []):
        degree = edu.get("degree", "").lower()
        if any(x in degree for x in ["computer science", "cs", "cse", "information technology",
                                      "software", "ict", "bca", "mca", "it"]):
            return "computer science"
        if any(x in degree for x in ["electronics", "ece", "eee", "electrical"]):
            return "electronics"
        if any(x in degree for x in ["mechanical", "mech"]):
            return "mechanical"
        if any(x in degree for x in ["data science", "data analytics", "ai", "machine learning",
                                      "statistics", "mathematics"]):
            return "data science"
        if "mba" in degree or "management" in degree:
            return "mba"
        if any(x in degree for x in ["civil", "architecture"]):
            return "civil"
        if any(x in degree for x in ["chemical", "biotech", "biomedical", "bio"]):
            return "biotech"
        if "finance" in degree or "economics" in degree:
            return "finance"

    title  = parsed_resume.get("current_title", "").lower()
    skills = [s.lower() for s in parsed_resume.get("skills", [])]

    if any(x in title for x in ["software", "developer", "engineer", "sde", "backend", "frontend", "fullstack"]):
        return "computer science"
    if any(x in skills for x in ["python", "java", "javascript", "c++", "react", "node", "typescript"]):
        return "computer science"
    if any(x in skills for x in ["machine learning", "deep learning", "tensorflow", "pytorch", "nlp"]):
        return "data science"
    if any(x in skills for x in ["quant", "quantitative", "algo", "trading", "stochastic"]):
        return "finance"

    return "default"


def get_top_skills(parsed_resume: dict, count: int = 5) -> list:
    return parsed_resume.get("skills", [])[:count]


# Overly niche / compound titles that produce zero results when used verbatim
NICHE_TITLE_KEYWORDS = [
    "mentor", "trainer", "coach", "educator", "instructor", "tutor",
    "generative ai", "gen ai", "genai", "prompt engineer",
    "content creator", "influencer", "freelancer",
]

def sanitize_title_for_search(title: str, field: str) -> str:
    """Replace niche/compound titles with broad field-based role for cleaner queries."""
    if not title:
        return DEGREE_TO_ROLES.get(field, DEGREE_TO_ROLES["default"])[0]
    title_lower = title.lower()
    if any(kw in title_lower for kw in NICHE_TITLE_KEYWORDS):
        broad = DEGREE_TO_ROLES.get(field, DEGREE_TO_ROLES["default"])[0]
        print(f"  [Scraper] Niche title '{title}' → using broad role '{broad}' for queries")
        return broad
    words = title.split()
    if len(words) > 4:
        return " ".join(words[:3])
    return title


# ── Job classification helpers ──────────────────────────────────────────────

def get_company_tier(company_name: str) -> int:
    name = company_name.strip()
    if name in COMPANY_TIERS.get("tier_1", []):  return 1
    if name in COMPANY_TIERS.get("tier_2", []):  return 2
    if name in COMPANY_TIERS.get("tier_3", []):  return 3
    if name in GOVERNMENT_ORGS:                  return 2
    if name in RESEARCH_INSTITUTES:              return 2
    if name in QUANT_FIRMS:                      return 1
    if any(iit in name for iit in ["IIT", "IISc", "TIFR", "IISER"]):
        return 2
    return 4


def classify_job_category(job: dict, search_label: str) -> str:
    company = job.get("company", "")
    title   = job.get("title", "").lower()
    label   = search_label.lower()

    if (("research" in title and "intern" in title)
            or "iit_research" in label or "research_intern" in label):
        return "research_internship"
    if company in RESEARCH_INSTITUTES or any(iit in company for iit in ["IIT", "IISc", "TIFR", "IISER"]):
        if "intern" in title or "intern" in label:
            return "research_internship"
        return "full_time"
    if company in GOVERNMENT_ORGS or "govt" in label or "government" in label:
        return "government"
    if company in CONSULTING_FIRMS or company in TOP_CONSULTING or "consult" in label:
        return "consulting"
    if company in QUANT_FIRMS or "quant" in label:
        return "full_time"
    if any(x in title for x in ["product manager", "product management"]):
        return "product_management"
    if "summer" in title or "summer" in label:
        return "summer_internship"
    if "part" in title and "time" in title:
        return "part_time"
    if "intern" in label or "intern" in title:
        return "internship"
    return "full_time"


def classify_work_mode(job: dict) -> str:
    loc   = job.get("location", "").lower()
    title = job.get("title", "").lower()
    desc  = job.get("description", "").lower()

    if "remote" in loc or "remote" in title or "remote" in desc[:200]:
        return "remote"
    if "hybrid" in loc or "hybrid" in desc[:200]:
        return "hybrid"
    return "on-site"


def is_big_company(company_name: str) -> bool:
    return (
        company_name in ALL_BIG_COMPANIES
        or company_name in QUANT_FIRMS
        or company_name in UNICORN_STARTUPS
    )


def is_aspirational_company(company_name: str) -> bool:
    return (
        company_name in ASPIRATIONAL_COMPANIES
        or company_name in QUANT_FIRMS
        or company_name in UNICORN_STARTUPS
        or any(iit in company_name for iit in ["IIT", "IISc", "TIFR", "IISER"])
    )


# ── SerpAPI fetch ───────────────────────────────────────────────────────────

def fetch_jobs_from_serpapi(query: str, location: str, num: int = None) -> list:
    """
    Call SerpAPI Google Jobs engine and return normalized job list.
    """
    major_cities = ["bangalore", "mumbai", "delhi", "hyderabad", "chennai", "pune", "india"]
    loc_lower    = (location or "").lower()
    search_loc   = location if any(c in loc_lower for c in major_cities) else "India"

    params = {
        "engine":   "google_jobs",
        "q":        query,
        "location": search_loc,
        "api_key":  SERPAPI_KEY,
        "chips":    f"date_posted:{DATE_POSTED}",
        "num":      num or RESULTS_PER_QUERY,
    }

    print(f"  [Search] '{query}' @ {search_loc}")

    try:
        resp = requests.get("https://serpapi.com/search", params=params, timeout=15)
        resp.raise_for_status()
        data = resp.json()
    except Exception as e:
        print(f"  [Error] {e}")
        return []

    raw = data.get("jobs_results", [])
    if not raw:
        print("  [Result] 0 jobs")
        return []

    jobs = []
    for job in raw:
        apply_options = job.get("apply_options", [])
        apply_link    = apply_options[0].get("link", "") if apply_options else ""
        company_name  = job.get("company_name", "").strip()
        extensions    = job.get("detected_extensions", {})
        salary        = extensions.get("salary", "Not listed")

        jobs.append({
            "title":        job.get("title", ""),
            "company":      company_name,
            "location":     job.get("location", ""),
            "description":  job.get("description", "")[:1500],
            "apply_link":   apply_link,
            "posted":       extensions.get("posted_at", ""),
            "job_type":     extensions.get("schedule_type", "Full-time"),
            "salary":       salary,
            # Flags
            "is_big_company":  is_big_company(company_name),
            "is_aspirational": is_aspirational_company(company_name),
            "is_govt":         company_name in GOVERNMENT_ORGS,
            "is_research": (
                company_name in RESEARCH_INSTITUTES
                or any(iit in company_name for iit in ["IIT", "IISc", "TIFR", "IISER"])
            ),
            "is_consulting":   company_name in CONSULTING_FIRMS or company_name in TOP_CONSULTING,
            "is_quant":        company_name in QUANT_FIRMS,
            "company_tier":    get_company_tier(company_name),
        })

    print(f"  [Result] {len(jobs)} jobs")
    return jobs


# ── Quality filter ──────────────────────────────────────────────────────────

def quality_filter(job: dict) -> bool:
    company = job.get("company", "")
    title   = job.get("title", "").lower()
    if company in REJECT_COMPANIES:
        return False
    if any(kw in title for kw in REJECT_TITLE_KEYWORDS):
        return False
    if not job.get("apply_link"):
        return False
    return True


# ── Query builder ───────────────────────────────────────────────────────────

def build_search_queries(parsed_resume: dict) -> list:
    """
    Build a VERY BROAD set of search queries across all major platforms and sources.
    No artificial branch filters. Searches naturally. Always includes aspirational companies.
    """
    field       = detect_degree_field(parsed_resume)
    student     = is_student(parsed_resume)
    location    = parsed_resume.get("location", "India")
    role_titles = DEGREE_TO_ROLES.get(field, DEGREE_TO_ROLES["default"])
    top_skills  = get_top_skills(parsed_resume, 5)
    skill_1 = top_skills[0] if len(top_skills) > 0 else "software"
    skill_2 = top_skills[1] if len(top_skills) > 1 else ""
    skill_3 = top_skills[2] if len(top_skills) > 2 else ""
    primary   = role_titles[0] if role_titles else "Software Engineer"
    secondary = role_titles[1] if len(role_titles) > 1 else primary

    # ── Generic role terms used in company-targeted queries ──────────────────
    # These are ALWAYS clean, generic strings — never the user's actual title.
    # Reason: "Goldman Sachs intern" → results. "Goldman Sachs Generative AI Mentor" → 0 results.
    # We let the matching engine figure out relevance after fetching.
    if student:
        company_role = "intern"           # what we append to every company name
        company_role2 = "summer intern"
        company_role3 = "internship 2026"
    else:
        company_role  = primary           # e.g. "Software Engineer"
        company_role2 = "SDE"
        company_role3 = f"{field} engineer"

    if student:
        queries = [
            # ── General role / skill-based (broad) ──────────────────────────
            # These DO use primary/skills — they're role-search, not company-search
            {"q": f"{primary} intern 2025 2026",                              "location": location, "label": "role_intern"},
            {"q": f"{skill_1} intern fresher India",                          "location": location, "label": "skill_intern"},
            {"q": f"SDE software engineer intern 2026",                       "location": location, "label": "sde_intern"},
            {"q": f"{skill_1} {skill_2} internship India 2026",              "location": location, "label": "skill2_intern"},
            {"q": f"internship 2026 India {field}",                           "location": location, "label": "general_intern"},
            {"q": f"summer internship 2026 India",                            "location": location, "label": "summer_generic"},

            # ── Glassdoor / LinkedIn sourced ─────────────────────────────────
            {"q": f"{primary} internship Glassdoor 2026 India",               "location": "India", "label": "glassdoor_intern"},
            {"q": f"{skill_1} internship LinkedIn India 2026",                "location": "India", "label": "linkedin_intern"},

            # ── FAANG — clean company + generic role, no user title ──────────
            {"q": f"Google {company_role3}",                                  "location": "India", "label": "google_intern"},
            {"q": f"Microsoft {company_role3}",                               "location": "India", "label": "msft_intern"},
            {"q": f"Amazon {company_role3}",                                  "location": "India", "label": "amzn_intern"},
            {"q": f"Meta {company_role3}",                                    "location": "India", "label": "meta_intern"},
            {"q": f"Apple {company_role3}",                                   "location": "India", "label": "apple_intern"},
            {"q": f"Adobe {company_role3}",                                   "location": "India", "label": "adobe_intern"},
            {"q": f"Salesforce {company_role3}",                              "location": "India", "label": "sf_intern"},
            {"q": f"Oracle IBM {company_role3}",                              "location": "India", "label": "oracle_ibm_intern"},

            # ── Top India startups / Unicorns ────────────────────────────────
            {"q": f"Flipkart {company_role3}",                                "location": "India", "label": "flipkart_intern"},
            {"q": f"PhonePe Razorpay {company_role3}",                        "location": "India", "label": "phonepe_intern"},
            {"q": f"CRED Zepto {company_role3}",                              "location": "India", "label": "cred_intern"},
            {"q": f"Swiggy Zomato {company_role3}",                           "location": "India", "label": "food_intern"},
            {"q": f"Groww Upstox Dream11 {company_role3}",                    "location": "India", "label": "fintech_intern"},
            {"q": f"unicorn startup {company_role3} India",                   "location": "India", "label": "unicorn_intern"},

            # ── MNC career pages ─────────────────────────────────────────────
            {"q": f"MNC {company_role3} India {skill_1}",                    "location": "India", "label": "mnc_intern"},
            {"q": f"TCS Infosys Wipro {company_role3}",                       "location": "India", "label": "service_intern"},
            {"q": f"Intel Qualcomm AMD Nvidia {company_role3}",              "location": "India", "label": "chip_intern"},

            # ── Consulting ───────────────────────────────────────────────────
            {"q": f"McKinsey BCG Bain {company_role3}",                       "location": "India", "label": "mbb_intern"},
            {"q": f"Deloitte Accenture EY KPMG {company_role3}",             "location": "India", "label": "big4_intern"},
            {"q": "consulting internship India 2026",                         "location": "India", "label": "consulting_intern"},

            # ── Quant firms ──────────────────────────────────────────────────
            {"q": "quant researcher intern India 2026",                       "location": "India", "label": "quant_intern"},
            {"q": f"Optiver Jane Street Citadel {company_role3}",             "location": "India", "label": "quant_firms_intern"},
            {"q": f"DE Shaw WorldQuant Two Sigma {company_role3}",            "location": "India", "label": "quant_india_intern"},
            {"q": "quantitative analyst intern 2026",                         "location": "India", "label": "quant_analyst_intern"},

            # ── Finance ──────────────────────────────────────────────────────
            {"q": f"Goldman Sachs {company_role3}",                           "location": "India", "label": "gs_intern"},
            {"q": f"JP Morgan Morgan Stanley {company_role3}",                "location": "India", "label": "jpm_intern"},
            {"q": f"Visa Mastercard {company_role3}",                         "location": "India", "label": "card_intern"},

            # ══ IIT — Research Internships ════════════════════════════════════
            {"q": f"IIT research intern {skill_1} 2025 2026",                "location": "India", "label": "iit_research"},
            {"q": f"IIT Bombay IIT Delhi research internship {field}",       "location": "India", "label": "iit_research_top"},
            {"q": f"IIT Madras IIT Kanpur summer research intern",           "location": "India", "label": "iit_research_south"},
            {"q": f"IISc TIFR IISER research internship 2026",               "location": "India", "label": "iit_research_inst"},
            {"q": f"summer research internship IIT {skill_1}",               "location": "India", "label": "iit_summer_research"},
            {"q": "SRFP summer research fellowship IIT IISc",                "location": "India", "label": "srfp_research"},

            # ══ IIT — Normal Internships ══════════════════════════════════════
            {"q": f"IIT internship {primary} 2026",                          "location": "India", "label": "iit_normal_intern"},
            {"q": f"IIT Bombay IIT Delhi internship {skill_1}",              "location": "India", "label": "iit_intern_top"},
            {"q": f"IIT Roorkee IIT Kharagpur IIT BHU intern 2026",         "location": "India", "label": "iit_intern_rest"},
            {"q": f"summer internship IIT {field} 2026",                     "location": "India", "label": "iit_summer_intern"},

            # ── Govt / Public Sector ─────────────────────────────────────────
            {"q": f"ISRO DRDO internship {field} 2026",                      "location": "India", "label": "govt_intern"},
            {"q": "BARC CSIR C-DAC summer internship 2026",                  "location": "India", "label": "barc_intern"},
            {"q": f"government internship India 2026 {field}",               "location": "India", "label": "govt_generic"},
            {"q": "public sector internship India 2026",                     "location": "India", "label": "public_sector_intern"},

            # ── Research fellowships & academic ──────────────────────────────
            {"q": f"research internship India 2026 {skill_1}",               "location": "India", "label": "research_intern_gen"},
            {"q": f"fellowship program India 2026 {field}",                  "location": "India", "label": "fellowship_intern"},
            {"q": "academic internship university India 2026",               "location": "India", "label": "academic_intern"},
        ]
    else:
        # For professionals: title is used only in role-based queries.
        # Company-targeted queries use clean generic role terms only.
        raw_title = parsed_resume.get("current_title", primary)
        title = sanitize_title_for_search(raw_title, field)

        queries = [
            # ── Role-based — these DO use title/skills ───────────────────────
            {"q": f"{title} {skill_1}",                                       "location": location, "label": "exact_title"},
            {"q": f"{secondary} {skill_1} {skill_2}",                        "location": location, "label": "field_role"},
            {"q": f"{skill_1} {skill_2} {skill_3} India jobs",               "location": location, "label": "skill_combo"},
            {"q": f"{primary} jobs India 2025 2026",                         "location": location, "label": "primary_jobs"},

            # ── Glassdoor / LinkedIn ─────────────────────────────────────────
            {"q": f"{primary} Glassdoor India jobs",                         "location": "India", "label": "glassdoor_full"},
            {"q": f"{primary} LinkedIn India jobs",                          "location": "India", "label": "linkedin_full"},

            # ── FAANG — company + clean role, never user's title ─────────────
            {"q": f"Google {company_role} India",                             "location": "India", "label": "google_roles"},
            {"q": f"Microsoft {company_role} India",                          "location": "India", "label": "msft_roles"},
            {"q": f"Amazon {company_role} India",                             "location": "India", "label": "amzn_roles"},
            {"q": f"Meta {company_role} India",                               "location": "India", "label": "meta_roles"},
            {"q": f"Apple {company_role} India",                              "location": "India", "label": "apple_roles"},
            {"q": f"Adobe Salesforce {company_role} India",                   "location": "India", "label": "adobe_sf_roles"},
            {"q": f"Oracle IBM {company_role} India",                         "location": "India", "label": "oracle_ibm_roles"},

            # ── Top India startups / Unicorns ────────────────────────────────
            {"q": f"Flipkart {company_role} India",                           "location": "India", "label": "flipkart_roles"},
            {"q": f"PhonePe Razorpay CRED {company_role} India",              "location": "India", "label": "fintech_india"},
            {"q": f"Swiggy Zomato Meesho {company_role} India",               "location": "India", "label": "food_tech"},
            {"q": f"unicorn startup {company_role} India",                    "location": "India", "label": "unicorn_full"},

            # ── Consulting ───────────────────────────────────────────────────
            {"q": f"McKinsey BCG Bain analyst {field} India",                "location": "India", "label": "mbb_roles"},
            {"q": f"Deloitte Accenture KPMG {company_role} India",           "location": "India", "label": "big4_roles"},
            {"q": "consulting jobs India",                                    "location": "India", "label": "consulting_generic"},

            # ── Quant firms ──────────────────────────────────────────────────
            {"q": f"quant researcher {field} India",                         "location": "India", "label": "quant_roles"},
            {"q": f"Optiver Jane Street DE Shaw {company_role2} India",       "location": "India", "label": "quant_firms"},
            {"q": f"WorldQuant Citadel Tower Research {company_role2} India", "location": "India", "label": "quant_india"},
            {"q": f"quantitative analyst {skill_1} India",                   "location": "India", "label": "quant_analyst"},

            # ── Finance ──────────────────────────────────────────────────────
            {"q": f"Goldman Sachs {company_role} India",                      "location": "India", "label": "gs_roles"},
            {"q": f"JP Morgan Morgan Stanley {company_role} India",           "location": "India", "label": "jpm_roles"},
            {"q": f"Visa Mastercard American Express {company_role} India",  "location": "India", "label": "card_networks"},
            {"q": f"Bloomberg Barclays Deutsche Bank {company_role} India",  "location": "India", "label": "ibank_roles"},

            # ── MNC career pages ─────────────────────────────────────────────
            {"q": f"MNC {company_role} India {skill_1}",                     "location": "India", "label": "mnc_swe"},
            {"q": f"TCS Infosys Wipro HCL {company_role} India",             "location": "India", "label": "service_roles"},
            {"q": f"Intel Qualcomm Nvidia AMD {company_role} India",         "location": "India", "label": "chip_roles"},

            # ── Govt & Research ──────────────────────────────────────────────
            {"q": f"ISRO DRDO BARC {field} scientist engineer",             "location": "India", "label": "govt_roles"},
            {"q": f"government jobs India {field} 2025 2026",               "location": "India", "label": "govt_generic"},
            {"q": f"public sector jobs India {skill_1}",                    "location": "India", "label": "public_sector"},

            # ══ IIT — Full-time Jobs ══════════════════════════════════════════
            {"q": f"IIT recruitment full time {primary} engineer",           "location": "India", "label": "iit_fulltime_eng"},
            {"q": f"IIT Bombay IIT Delhi full time job {field}",            "location": "India", "label": "iit_fulltime_top"},
            {"q": f"IIT Madras IIT Kanpur job opening {skill_1}",           "location": "India", "label": "iit_fulltime_south"},
            {"q": "IISc TIFR IISER project scientist engineer",              "location": "India", "label": "iit_project_sci"},
            {"q": f"IIT research associate {field} {skill_1}",              "location": "India", "label": "iit_research_assoc"},

            # ── Research ─────────────────────────────────────────────────────
            {"q": f"research scientist India {skill_1} jobs",               "location": "India", "label": "research_scientist"},
            {"q": f"fellowship program researcher India {field}",           "location": "India", "label": "fellowship_full"},
        ]

    return queries


# ── Deduplication helper ────────────────────────────────────────────────────

def is_duplicate(job: dict, seen: set) -> bool:
    link      = job.get("apply_link", "")
    title_key = f"{job.get('company', '')}::{job.get('title', '').lower()}"
    if link and link in seen:
        return True
    if title_key in seen:
        return True
    return False


def mark_seen(job: dict, seen: set):
    link      = job.get("apply_link", "")
    title_key = f"{job.get('company', '')}::{job.get('title', '').lower()}"
    if link:
        seen.add(link)
    seen.add(title_key)


# ── Main search entrypoint ──────────────────────────────────────────────────

def search_jobs(parsed_resume: dict) -> list:
    student = is_student(parsed_resume)
    field   = detect_degree_field(parsed_resume)

    print(f"\n[Scraper] {'Student' if student else 'Professional'} | Field: {field}")
    print("[Scraper] Starting broad job search...\n")

    queries  = build_search_queries(parsed_resume)
    all_jobs = []
    seen     = set()

    for query_info in queries:
        raw_jobs = fetch_jobs_from_serpapi(query_info["q"], query_info["location"])

        for job in raw_jobs:
            if is_duplicate(job, seen):
                continue
            if not quality_filter(job):
                continue

            mark_seen(job, seen)
            job["search_label"] = query_info["label"]
            job["job_category"] = classify_job_category(job, query_info["label"])
            job["work_mode"]    = classify_work_mode(job)
            all_jobs.append(job)

    print(f"\n[Scraper] Total quality jobs collected: {len(all_jobs)}")

    # Sort: aspirational + tier-1 always first, then by company tier
    all_jobs.sort(key=lambda x: (
        not x.get("is_aspirational", False),
        x.get("company_tier", 5),
        not x.get("is_big_company", False),
    ))

    return all_jobs


# ── Custom search ───────────────────────────────────────────────────────────

def search_jobs_custom(query: str, location: str = "India") -> list:
    """
    Free-text search triggered by user from frontend.
    The ENTIRE query string is passed as-is to SerpAPI — we never split, parse,
    or re-interpret it. "Juspay SDE" stays "Juspay SDE", not skill=SDE company=Juspay.
    We only append light suffixes (India, internship etc.) to broaden coverage.
    """
    print(f"\n[Custom Search] Query: '{query}' | Location: {location}")

    q = query.strip()  # preserve exactly as the user typed it

    variants = [
        {"q": q,                          "location": location, "label": "custom_exact"},
        {"q": f"{q} India",               "location": "India",  "label": "custom_india"},
        {"q": f"{q} internship India",    "location": "India",  "label": "custom_intern"},
        {"q": f"{q} full time job India", "location": "India",  "label": "custom_fulltime"},
        {"q": f"{q} 2025 2026",           "location": location, "label": "custom_year"},
        {"q": f"{q} remote India",        "location": "India",  "label": "custom_remote"},
    ]

    all_jobs = []
    seen     = set()

    for v in variants:
        raw_jobs = fetch_jobs_from_serpapi(v["q"], v["location"], num=8)
        for job in raw_jobs:
            if is_duplicate(job, seen):
                continue
            if not quality_filter(job):
                continue
            mark_seen(job, seen)
            job["search_label"] = v["label"]
            job["job_category"] = classify_job_category(job, v["label"])
            job["work_mode"]    = classify_work_mode(job)
            all_jobs.append(job)

    print(f"[Custom Search] Found: {len(all_jobs)} jobs")

    all_jobs.sort(key=lambda x: (
        not x.get("is_aspirational", False),
        x.get("company_tier", 5),
    ))

    return all_jobs