import fitz
from groq import Groq
import json
import os
from dotenv import load_dotenv

load_dotenv()

# create the Groq client — works exactly like OpenAI
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def extract_text_from_pdf(file_path: str) -> str:
    """Pull raw text out of the PDF"""
    doc = fitz.open(file_path)
    full_text = ""
    for page in doc:
        full_text += page.get_text()
    return full_text

def parse_resume(file_path: str) -> dict:
    """Send raw text to Groq AI, get back clean JSON"""
    
    # Step 1 — extract text from PDF
    raw_text = extract_text_from_pdf(file_path)
    
    # Step 2 — build the prompt
    prompt = f"""
    You are an expert resume parser. Your job is to extract ONLY real professional 
    work experience — not projects, not extracurricular activities, not volunteering,
    not college clubs, not hackathons.
    
    STRICT RULES:
    - "experience" must ONLY contain paid full-time or part-time jobs and internships
    - If something looks like a college project, club, hackathon, or personal project — 
      put it in "projects" instead, NOT in experience
    - "current_title" must be the title from their most recent REAL job or internship
    - If the person is a student with no real job yet, set current_title to their 
      degree name like "Computer Science Student"
    - Company names must be exact — copy them exactly as written in the resume
    - If you are not sure something is a real job, put it in projects
    - Skills must only be technical skills and tools — not soft skills like 
      "teamwork" or "communication"
    
    Return ONLY a raw JSON object. No explanation, no markdown, 
    no code blocks, no backticks. Just the JSON itself.
    
    Use exactly these keys:
    {{
        "name": "full name",
        "email": "email address",
        "phone": "phone number",
        "location": "city, country",
        "linkedin": "linkedin url or empty string",
        "current_title": "most recent real job title or degree if student",
        "summary": "2-3 sentence professional summary based on their actual experience",
        "skills": ["only technical skills and tools"],
        "experience": [
            {{
                "company": "exact company name as written in resume",
                "title": "exact job title as written in resume",
                "dates": "start date - end date",
                "description": "what they actually did in this role in 1-2 sentences",
                "type": "full-time or internship"
            }}
        ],
        "education": [
            {{
                "school": "exact university name",
                "degree": "degree type and field",
                "year": "graduation year or expected year"
            }}
        ],
        "projects": [
            {{
                "name": "project name",
                "description": "what it does in 1 sentence",
                "tech": ["technologies used"]
            }}
        ],
        "extracurricular": [
            {{
                "activity": "club or activity name",
                "role": "their role if mentioned"
            }}
        ]
    }}
    
    Here is the resume text — parse it carefully:
    {raw_text[:4000]}
    """
    
    # Step 3 — send to Groq and get response
    # llama-3.3-70b-versatile is free and very accurate
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "system",
                "content": "You are a resume parser. Always return valid JSON only."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0.1  # low temperature = more consistent output
    )
    
    # Step 4 — get the text from response
    result_text = response.choices[0].message.content.strip()
    
    # Step 5 — clean up backticks if model added them
    if result_text.startswith("```"):
        result_text = result_text.split("```")[1]
        if result_text.startswith("json"):
            result_text = result_text[4:]
    
    # Step 6 — convert JSON string to Python dictionary
    parsed_data = json.loads(result_text)
    
    return parsed_data