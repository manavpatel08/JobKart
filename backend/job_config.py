# ═══════════════════════════════════════════════════════════
# COMPREHENSIVE JOB SEARCH CONFIGURATION
# ═══════════════════════════════════════════════════════════

# ── TOP COMPANIES ──────────────────────────────────────────
BIG_TECH_GLOBAL = [
    "Google", "Microsoft", "Amazon", "Meta", "Apple",
    "Netflix", "Adobe", "Salesforce", "IBM", "Oracle",
    "Intel", "Nvidia", "Qualcomm", "AMD", "Cisco",
    "VMware", "ServiceNow", "Atlassian", "Slack", "Zoom",
    "Uber", "Airbnb", "LinkedIn", "Twitter", "Pinterest",
    "Snap", "Spotify", "Stripe", "Square", "PayPal",
]

BIG_TECH_INDIA = [
    "Flipkart", "PhonePe", "Razorpay", "CRED", "Zepto",
    "Swiggy", "Zomato", "Ola", "Paytm", "Meesho",
    "Dream11", "PolicyBazaar", "Nykaa", "Sharechat", "Byju's",
    "Unacademy", "Upstox", "Groww", "Licious", "UrbanCompany",
    "Cars24", "Delhivery", "Dunzo", "FirstCry", "Pristyn Care",
]

CONSULTING_FIRMS = [
    "McKinsey", "BCG", "Bain", "Deloitte", "PwC",
    "EY", "KPMG", "Accenture", "Capgemini", "Cognizant",
    "McKinsey & Company", "Boston Consulting Group",
    "Oliver Wyman", "A.T. Kearney", "Roland Berger",
]

FINANCE_TECH = [
    "Goldman Sachs", "JPMorgan", "Morgan Stanley", "Citi",
    "Deutsche Bank", "HSBC", "Barclays", "Credit Suisse",
    "American Express", "Visa", "Mastercard", "Bloomberg",
    "JP Morgan Chase", "Wells Fargo",
]

SERVICE_BASED = [
    "TCS", "Infosys", "Wipro", "HCL", "Tech Mahindra",
    "LTI Mindtree", "Mphasis", "Persistent Systems", "Coforge",
    "Tata Consultancy Services",
]

ECOMMERCE_RETAIL = [
    "Amazon India", "Flipkart", "Myntra", "Ajio", "Tata Cliq",
    "Reliance Digital", "BigBasket", "Grofers", "Blinkit",
]

AUTOMOTIVE_TECH = [
    "Tesla", "Rivian", "Ola Electric", "Ather", "Hero Electric",
]

# ── GOVERNMENT & RESEARCH ORGS ─────────────────────────────
GOVERNMENT_ORGS = [
    "ISRO", "DRDO", "BARC", "CSIR", "DAE",
    "ONGC", "BHEL", "NTPC", "SAIL", "HAL",
    "BEL", "ECIL", "NIC", "C-DAC", "NIELIT",
    "Indian Space Research Organisation",
    "Defence Research and Development Organisation",
]

RESEARCH_INSTITUTES = [
    # IITs
    "IIT Bombay", "IIT Delhi", "IIT Madras", "IIT Kanpur",
    "IIT Kharagpur", "IIT Roorkee", "IIT Hyderabad", "IIT Bangalore",
    "IIT Guwahati", "IIT BHU", "IIT Indore", "IIT Dhanbad",
    "IIT Patna", "IIT Jodhpur", "IIT Gandhinagar", "IIT Tirupati",
    "IIT Mandi", "IIT Palakkad", "IIT Dharwad", "IIT Bhilai",
    # IISc & TIFR
    "IISc", "IISc Bangalore", "Indian Institute of Science",
    "TIFR", "Tata Institute of Fundamental Research",
    # IISERs
    "IISER", "IISER Pune", "IISER Kolkata", "IISER Bhopal",
    "IISER Mohali", "IISER Tirupati", "IISER Thiruvananthapuram",
    # Other premier
    "IMSc", "ISI", "CMI", "ICTS",
    "IIM Ahmedabad", "IIM Bangalore", "IIM Calcutta",
    "BITS Pilani",
    # NITs (top)
    "NIT Trichy", "NIT Warangal", "NIT Surathkal", "NIT Calicut",
]

ALL_BIG_COMPANIES = (
    BIG_TECH_GLOBAL + BIG_TECH_INDIA + CONSULTING_FIRMS +
    FINANCE_TECH + SERVICE_BASED + ECOMMERCE_RETAIL +
    AUTOMOTIVE_TECH + GOVERNMENT_ORGS + RESEARCH_INSTITUTES
)

# ── ASPIRATIONAL COMPANIES (shown even at low match) ───────
ASPIRATIONAL_COMPANIES = (
    BIG_TECH_GLOBAL[:15] +
    ["McKinsey", "BCG", "Bain", "Goldman Sachs", "Visa",
     "Mastercard", "Stripe", "PayPal", "Bloomberg"] +
    GOVERNMENT_ORGS +
    RESEARCH_INSTITUTES
)

# ── JOB TITLES BY DEGREE/FIELD ─────────────────────────────
DEGREE_TO_ROLES = {
    "computer science": [
        "Software Engineer", "Software Developer", "SDE",
        "Backend Developer", "Frontend Developer", "Full Stack Developer",
        "DevOps Engineer", "Cloud Engineer", "Data Engineer",
        "Machine Learning Engineer", "AI Engineer", "ML Engineer",
        "Mobile Developer", "Android Developer", "iOS Developer",
        "Systems Engineer", "Platform Engineer", "Site Reliability Engineer",
        "Blockchain Developer", "Web Developer", "Application Developer",
    ],
    "information technology": [
        "Software Developer", "IT Analyst", "System Administrator",
        "Network Engineer", "Database Administrator", "DevOps Engineer",
        "Cloud Engineer", "Technical Support Engineer", "IT Consultant",
    ],
    "electronics": [
        "Embedded Software Engineer", "Firmware Engineer", "IoT Developer",
        "Hardware Engineer", "VLSI Engineer", "Chip Design Engineer",
        "Systems Engineer", "Automation Engineer",
    ],
    "mechanical": [
        "Product Engineer", "Design Engineer", "CAD Engineer",
        "Manufacturing Engineer", "Simulation Engineer", "R&D Engineer",
    ],
    "data science": [
        "Data Scientist", "Data Analyst", "ML Engineer",
        "Business Analyst", "Data Engineer", "Analytics Engineer",
        "AI Researcher", "Research Scientist",
    ],
    "mba": [
        "Product Manager", "Business Analyst", "Consultant",
        "Strategy Analyst", "Operations Manager", "Marketing Manager",
        "Finance Analyst", "Management Trainee",
    ],
    "default": [
        "Software Engineer", "Software Developer", "Analyst",
        "Engineer", "Intern", "Associate",
    ],
}

# ── SEARCH STRATEGY ────────────────────────────────────────
RESULTS_PER_QUERY = 10
MAX_QUERIES       = 20    # expanded to support IIT-specific queries
DATE_POSTED       = "month"

# ── SKILL CATEGORIES ───────────────────────────────────────
SKILL_CATEGORIES = {
    "programming_languages": [
        "Python", "Java", "JavaScript", "C++", "C", "Go", "Rust",
        "TypeScript", "Ruby", "PHP", "Swift", "Kotlin", "Scala",
        "C#", "R", "MATLAB", "Perl", "Dart", "Objective-C",
    ],
    "frontend": [
        "React", "Angular", "Vue", "HTML", "CSS", "Next.js",
        "Tailwind", "Bootstrap", "jQuery", "Svelte", "Redux",
        "Material UI", "Chakra UI", "SASS", "LESS", "Webpack",
        "Vite", "Figma", "Adobe XD",
    ],
    "backend": [
        "Node.js", "Django", "Flask", "FastAPI", "Spring Boot",
        "Express", "Rails", "Laravel", "ASP.NET", "NestJS",
        "GraphQL", "REST API", "gRPC", "Microservices",
        "Serverless", "API Gateway",
    ],
    "databases": [
        "SQL", "PostgreSQL", "MySQL", "MongoDB", "Redis",
        "Cassandra", "DynamoDB", "Elasticsearch", "Neo4j",
        "Firebase", "Supabase", "Oracle DB", "SQL Server",
        "MariaDB", "CouchDB", "InfluxDB", "TimescaleDB",
    ],
    "cloud_devops": [
        "AWS", "Amazon Web Services", "EC2", "S3", "Lambda",
        "RDS", "CloudFront", "ECS", "EKS",
        "Azure", "Microsoft Azure", "Azure Functions", "Azure DevOps",
        "GCP", "Google Cloud", "Cloud Run", "BigQuery",
        "Docker", "Kubernetes", "K8s", "Terraform", "Ansible",
        "Jenkins", "GitLab CI", "GitHub Actions", "CircleCI",
        "CI/CD", "Prometheus", "Grafana", "DataDog",
    ],
    "data_ml_ai": [
        "Machine Learning", "ML", "Deep Learning", "Neural Networks",
        "TensorFlow", "PyTorch", "Keras", "Scikit-learn",
        "XGBoost", "LightGBM", "Transformers", "Hugging Face",
        "NLP", "Natural Language Processing", "Computer Vision",
        "OpenCV", "BERT", "GPT", "LLM", "Generative AI",
        "Spark", "Hadoop", "Kafka", "Airflow", "dbt",
        "Databricks", "Snowflake", "Redshift",
        "Pandas", "NumPy", "Matplotlib", "Jupyter",
        "Power BI", "Tableau", "MLOps", "MLflow",
    ],
    "mobile_development": [
        "Android", "iOS", "React Native", "Flutter", "Swift",
        "Kotlin", "Xamarin", "Ionic", "Mobile Development",
    ],
    "security": [
        "Cybersecurity", "Security", "Penetration Testing",
        "Ethical Hacking", "OWASP", "OAuth", "JWT",
        "Encryption", "Firewall", "Zero Trust", "SIEM",
    ],
    "blockchain_web3": [
        "Blockchain", "Ethereum", "Solidity", "Smart Contracts",
        "Web3", "DeFi", "NFT",
    ],
    "testing_qa": [
        "Testing", "QA", "Selenium", "Jest", "Pytest",
        "JUnit", "Cypress", "Test Automation",
        "Unit Testing", "Integration Testing",
    ],
    "tools_platforms": [
        "Git", "GitHub", "GitLab", "JIRA", "Confluence",
        "Postman", "Linux", "Unix", "Bash", "Shell Scripting",
        "Agile", "Scrum", "Kanban", "Figma Design",
    ],
}

# ── COMPANY PRIORITY TIERS ─────────────────────────────────
COMPANY_TIERS = {
    "tier_1": BIG_TECH_GLOBAL[:10] + ["Stripe", "Visa", "Mastercard"],
    "tier_2": BIG_TECH_GLOBAL[10:] + BIG_TECH_INDIA[:15],
    "tier_3": BIG_TECH_INDIA[15:] + CONSULTING_FIRMS + FINANCE_TECH[:8],
    "tier_4": SERVICE_BASED + FINANCE_TECH[8:],
    "government": GOVERNMENT_ORGS,
    "research": RESEARCH_INSTITUTES,
}

# ── JOB CATEGORY LABELS (used by frontend filters) ─────────
JOB_CATEGORIES = {
    "full_time":            "Full-time",
    "internship":           "Internship",
    "summer_internship":    "Summer Internship",
    "research_internship":  "Research Internship",
    "part_time":            "Part-time",
    "government":           "Government",
    "consulting":           "Consulting",
    "product_management":   "Product Management",
    "startup":              "Startup",
    "aspirational":         "Aspirational",
}

# Human-readable labels for frontend filter display
JOB_CATEGORY_LABELS = {v: k for k, v in JOB_CATEGORIES.items()}

# Work mode options for frontend filters
WORK_MODES = ["remote", "hybrid", "on-site"]