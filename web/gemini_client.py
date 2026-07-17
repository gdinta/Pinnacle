"""
gemini_client.py - Gemini AI for career timeline generation ONLY
Generates job-specific 5-year career progression paths

All other Gemini functions (job description analysis, summary generation)
have been removed. This file focuses ONLY on career timeline generation.
"""

import requests
import json
import re
import time
import os
from dotenv import load_dotenv  
load_dotenv()  # ← ADD THIS

# ============================================
# CONFIGURATION
# ============================================

GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '')  
GEMINI_MODEL = "gemini-pro"
GEMINI_TIMEOUT = 30
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"
GEMINI_MAX_RETRIES = 3
GEMINI_RETRY_BACKOFF = 2  # seconds, doubles each retry

GEMINI_CONFIGURED = bool(GEMINI_API_KEY)


class GeminiError(Exception):
    """Raised on any Gemini call failure - callers should catch this 
    and fall back to the existing local implementation."""
    pass

def test_gemini_key():
    """Test if Gemini API key works"""
    if not GEMINI_API_KEY:
        print("❌ No API key set")
        return
    
    print(f"✅ API Key found: {GEMINI_API_KEY[:10]}...")
    print(f"📍 Model: {GEMINI_MODEL}")
    print(f"🔗 URL: {GEMINI_URL}")
    
    # Try a simple call
    try:
        response = requests.post(
            GEMINI_URL,
            params={"key": GEMINI_API_KEY},
            json={"contents": [{"parts": [{"text": "Hello"}]}]},
            timeout=10
        )
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text[:200]}")
    except Exception as e:
        print(f"❌ Error: {e}")

# Run at startup
test_gemini_key()
# ============================================
# LOW-LEVEL GEMINI API CALL
# ============================================

def _call_gemini(prompt, json_response=True):
    """
    Low-level call to the Gemini API with retry logic.
    
    Raises GeminiError on any failure so callers can fall back cleanly.
    Retries on 503 (model overloaded) and 429 (rate limited) with backoff.
    Does NOT retry on 4xx errors (missing key, bad model name, etc).
    
    Args:
        prompt: String prompt to send to Gemini
        json_response: If True, request JSON format response
        
    Returns:
        Response text from Gemini
        
    Raises:
        GeminiError: On any failure
    """
    if not GEMINI_API_KEY:
        raise GeminiError("GEMINI_API_KEY not configured")

    body = {
        "contents": [{"parts": [{"text": prompt}]}],
    }
    if json_response:
        body["generationConfig"] = {"responseMimeType": "application/json"}

    last_error = None
    for attempt in range(GEMINI_MAX_RETRIES):
        try:
            response = requests.post(
                GEMINI_URL,
                params={"key": GEMINI_API_KEY},
                json=body,
                timeout=GEMINI_TIMEOUT
            )
            
            # Retry on service unavailable or rate limit (with backoff)
            if response.status_code in (503, 429) and attempt < GEMINI_MAX_RETRIES - 1:
                wait_time = GEMINI_RETRY_BACKOFF ** attempt
                print(f"⏳ Gemini rate limited, retrying in {wait_time}s...")
                time.sleep(wait_time)
                continue
            
            # Raise on other errors
            response.raise_for_status()
            
            # Parse response
            data = response.json()
            text = data["candidates"][0]["content"]["parts"][0]["text"]
            return text
            
        except Exception as e:
            last_error = e
            if attempt < GEMINI_MAX_RETRIES - 1 and "503" in str(e):
                wait_time = GEMINI_RETRY_BACKOFF ** attempt
                time.sleep(wait_time)
                continue
            break

    raise GeminiError(f"Gemini API call failed after {GEMINI_MAX_RETRIES} retries: {last_error}")


# ============================================
# CAREER TIMELINE GENERATION (MAIN FUNCTION)
# ============================================

def generate_career_timeline(job_title, company_name="", overall_score=0, job_description=""):
    """
    Generate a job-specific 5-year career progression timeline using Gemini AI.
    
    Returns a dictionary with 5 years of career progression:
    {
        "year_1": {"title": "...", "salary_increase": 0, "skills": [...]},
        "year_2": {"title": "...", "salary_increase": 15, "skills": [...]},
        ...
        "year_5": {"title": "...", "salary_increase": 50, "skills": [...]}
    }
    
    If Gemini fails, falls back to rule-based timeline.
    
    Args:
        job_title: Current job title (e.g., "Software Developer")
        company_name: Current company (optional, for context)
        overall_score: Wealth score 0-100 (optional, for context)
        job_description: Job posting text (optional, for context)
        
    Returns:
        Dictionary with 5 years of career progression
    """
    
    if not GEMINI_CONFIGURED:
        print("⚠️ Gemini API key not configured, using default career path")
        return get_default_career_timeline(job_title)
    
    try:
        prompt = f"""Based on this job, provide a realistic 5-year career progression path.

Job Title: {job_title}"""
        
        if company_name:
            prompt += f"\nCompany: {company_name}"
        
        if overall_score > 0:
            prompt += f"\nCareer Score: {overall_score}/100"
        
        prompt += """

Return ONLY a JSON object (no markdown, no explanation) with exactly this structure - NO other text:

{
    "year_1": {"title": "job title here", "salary_increase": 0, "skills": ["skill1", "skill2"]},
    "year_2": {"title": "job title here", "salary_increase": 15, "skills": ["skill1", "skill2"]},
    "year_3": {"title": "job title here", "salary_increase": 25, "skills": ["skill1", "skill2"]},
    "year_4": {"title": "job title here", "salary_increase": 35, "skills": ["skill1", "skill2"]},
    "year_5": {"title": "job title here", "salary_increase": 50, "skills": ["skill1", "skill2"]}
}

Requirements:
- Be specific to this role and realistic based on industry standards
- salary_increase is cumulative percentage increase from year 1
- Each title should be a realistic progression
- Include 2-3 specific skills for each level
- NO markdown, NO explanation, ONLY the JSON object"""

        if job_description and job_description.strip():
            prompt += f"\n\nJob description for additional context:\n{job_description[:1000]}"

        # Call Gemini with retry logic
        text = _call_gemini(prompt, json_response=True)

        # Parse response
        try:
            timeline = json.loads(text)
        except json.JSONDecodeError as e:
            print(f"⚠️ Gemini returned invalid JSON: {e}")
            return get_default_career_timeline(job_title)

        # Validate response structure
        if not isinstance(timeline, dict):
            print(f"⚠️ Gemini response was not a dict: {type(timeline)}")
            return get_default_career_timeline(job_title)

        # Ensure all 5 years are present
        for year in range(1, 6):
            year_key = f"year_{year}"
            if year_key not in timeline:
                print(f"⚠️ Gemini response missing {year_key}")
                return get_default_career_timeline(job_title)
            
            year_data = timeline[year_key]
            if not isinstance(year_data, dict):
                print(f"⚠️ {year_key} data is not a dict")
                return get_default_career_timeline(job_title)
            
            # Validate required fields
            if "title" not in year_data or "salary_increase" not in year_data or "skills" not in year_data:
                print(f"⚠️ {year_key} missing required fields")
                return get_default_career_timeline(job_title)

        print("✅ Career timeline generated by Gemini AI")
        return timeline

    except GeminiError as e:
        print(f"⚠️ Gemini career timeline generation failed: {e}")
        return get_default_career_timeline(job_title)
    except Exception as e:
        print(f"⚠️ Unexpected error generating career timeline: {e}")
        return get_default_career_timeline(job_title)


# ============================================
# FALLBACK: RULE-BASED CAREER TIMELINES
# ============================================

def get_default_career_timeline(job_title):
    """
    Rule-based career timeline fallback (no AI needed).
    
    Uses curated career paths for common tech roles.
    Falls back to generic progression if job title doesn't match.
    
    Args:
        job_title: Job title to match
        
    Returns:
        Dictionary with 5 years of career progression
    """
    
    job_title_lower = job_title.lower()
    
    # Curated timelines for common roles
    timelines = {
        "software": {
            "year_1": {
                "title": "Software Developer",
                "salary_increase": 0,
                "skills": ["Core Development", "Code Review", "Team Collaboration"]
            },
            "year_2": {
                "title": "Senior Software Developer",
                "salary_increase": 15,
                "skills": ["Architecture Design", "Mentoring", "Technical Leadership"]
            },
            "year_3": {
                "title": "Staff Engineer / Tech Lead",
                "salary_increase": 25,
                "skills": ["System Design", "Strategic Planning", "Cross-team Leadership"]
            },
            "year_4": {
                "title": "Principal Engineer / Engineering Manager",
                "salary_increase": 35,
                "skills": ["Team Building", "Roadmap Planning", "Business Strategy"]
            },
            "year_5": {
                "title": "Director of Engineering / VP Engineering",
                "salary_increase": 50,
                "skills": ["Executive Leadership", "Organizational Strategy", "Business Acumen"]
            }
        },
        "data": {
            "year_1": {
                "title": "Data Analyst",
                "salary_increase": 0,
                "skills": ["SQL", "Data Visualization", "Excel/Tableau"]
            },
            "year_2": {
                "title": "Senior Data Analyst",
                "salary_increase": 15,
                "skills": ["Advanced Analytics", "Python", "Statistical Analysis"]
            },
            "year_3": {
                "title": "Data Scientist",
                "salary_increase": 25,
                "skills": ["Machine Learning", "Statistical Modeling", "A/B Testing"]
            },
            "year_4": {
                "title": "Senior Data Scientist / Analytics Manager",
                "salary_increase": 35,
                "skills": ["Team Leadership", "Strategy", "Product Sense"]
            },
            "year_5": {
                "title": "Director of Data Science / Chief Data Officer",
                "salary_increase": 50,
                "skills": ["Executive Leadership", "Business Strategy", "P&L Responsibility"]
            }
        },
        "security": {
            "year_1": {
                "title": "Security Analyst",
                "salary_increase": 0,
                "skills": ["Threat Detection", "Incident Response", "Security Tools"]
            },
            "year_2": {
                "title": "Senior Security Analyst",
                "salary_increase": 15,
                "skills": ["Compliance", "Risk Management", "Security Architecture"]
            },
            "year_3": {
                "title": "Security Architect",
                "salary_increase": 25,
                "skills": ["System Design", "Certifications (CISSP)", "Threat Modeling"]
            },
            "year_4": {
                "title": "Senior Security Architect / Security Manager",
                "salary_increase": 35,
                "skills": ["Team Leadership", "Security Strategy", "Vendor Management"]
            },
            "year_5": {
                "title": "Chief Information Security Officer (CISO)",
                "salary_increase": 50,
                "skills": ["Executive Leadership", "Governance", "Board Communication"]
            }
        },
        "engineer": {
            "year_1": {
                "title": "Software Engineer",
                "salary_increase": 0,
                "skills": ["Implementation", "Testing", "Documentation"]
            },
            "year_2": {
                "title": "Senior Software Engineer",
                "salary_increase": 15,
                "skills": ["Design", "Optimization", "Code Review"]
            },
            "year_3": {
                "title": "Staff Engineer",
                "salary_increase": 25,
                "skills": ["Architecture", "Mentoring", "Innovation"]
            },
            "year_4": {
                "title": "Principal Engineer",
                "salary_increase": 35,
                "skills": ["Strategic Design", "Leadership", "Industry Influence"]
            },
            "year_5": {
                "title": "Engineering Director / Distinguished Engineer",
                "salary_increase": 50,
                "skills": ["Organizational Strategy", "Executive Presence", "Vision"]
            }
        }
    }
    
    # Try to match job title to timeline
    for key, timeline in timelines.items():
        if key in job_title_lower:
            return timeline
    
    # Generic fallback for unknown roles
    return {
        "year_1": {
            "title": job_title,
            "salary_increase": 0,
            "skills": ["Core Skills", "Team Fit", "Learning"]
        },
        "year_2": {
            "title": f"Senior {job_title}",
            "salary_increase": 15,
            "skills": ["Expertise", "Leadership", "Problem Solving"]
        },
        "year_3": {
            "title": f"Staff/Principal {job_title}",
            "salary_increase": 25,
            "skills": ["Strategy", "Mentoring", "Innovation"]
        },
        "year_4": {
            "title": f"Manager/Lead {job_title}",
            "salary_increase": 35,
            "skills": ["Team Building", "Planning", "Business Sense"]
        },
        "year_5": {
            "title": f"Director {job_title}",
            "salary_increase": 50,
            "skills": ["Executive Role", "Vision", "Leadership"]
        }
    }