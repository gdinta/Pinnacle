# analysis_engine.py - FIXED
# Updated to properly extract values from dictionary returns

import urllib.parse
import re
from real_data import (
    get_salary_bls,
    get_demand_free,
    get_company_health_free,
    get_col_free,
    get_automation_risk_free,
    get_federal_tax_2024,
    get_state_tax_2024,
    get_local_tax_2024,
    get_payroll_tax
)
from gemini_client import (
    generate_career_timeline,
    GeminiError,
    GEMINI_CONFIGURED
)

# ============================================
# MAIN ANALYSIS FUNCTION - USES REAL DATA
# ============================================

def get_debt_payment_estimate(loan_balance, annual_rate=0.055, term_months=120):
    """
    Estimate a monthly debt payment using standard amortization
    (default: 10-year term at 5.5%, a reasonable stand-in for a typical
    federal student loan rate). This is a simplified estimate - actual
    payments depend on the real rate, term, and repayment plan.
    Returns the estimated MONTHLY payment.
    """
    if loan_balance <= 0:
        return 0
    monthly_rate = annual_rate / 12
    payment = loan_balance * (monthly_rate * (1 + monthly_rate) ** term_months) / \
        ((1 + monthly_rate) ** term_months - 1)
    return round(payment)


# ============================================
# JOB DESCRIPTION ANALYSIS
# ============================================
# Rule-based (keyword/regex) parsing of pasted job description text -
# no external NLP/LLM call, consistent with the rest of this app's
# free-data-sources approach. This is intentionally conservative: it
# flags patterns, it doesn't claim to understand the posting.

JD_SKILL_KEYWORDS = [
    "python", "java", "javascript", "typescript", "sql", "aws", "azure", "gcp",
    "docker", "kubernetes", "react", "node.js", "c++", "c#", "machine learning",
    "tensorflow", "pytorch", "security+", "cissp", "active directory",
    "azure ad", "entra id", "sailpoint", "okta", "terraform", "ci/cd",
    "agile", "scrum", "tableau", "power bi", "excel", "project management",
]

JD_BENEFIT_CATEGORIES = {
    "Retirement (401k/pension)": ["401(k)", "401k", "retirement plan", "pension"],
    "Health Coverage": ["health insurance", "medical insurance", "dental", "vision"],
    "Paid Time Off": ["pto", "paid time off", "vacation days", "unlimited pto"],
    "Equity / Bonus": ["stock options", "equity", "rsu", "signing bonus", "annual bonus", "bonus"],
    "Parental Leave": ["parental leave", "maternity leave", "paternity leave"],
    "Other Perks": ["tuition reimbursement", "gym membership", "wellness stipend",
                     "relocation assistance", "remote work", "flexible schedule"],
}

JD_RED_FLAG_PATTERNS = [
    (r'\bwear(?:ing)? many hats\b', 'Broad/Undefined Scope',
     '"Wear many hats" often means responsibilities beyond the listed role - worth asking what that looks like day-to-day.'),
    (r'\bother duties as assigned\b', 'Open-Ended Responsibilities',
     'This phrase gives the employer room to add tasks beyond the posted description.'),
    (r'\b(rockstar|ninja|guru|ninja)\b', 'Buzzword-Heavy Listing',
     'Buzzwords like this can signal a less clearly defined role - worth asking for specifics in the interview.'),
    (r'\bunlimited pto\b', 'Ambiguous Time Off Policy',
     '"Unlimited PTO" sometimes means no guaranteed minimum - worth asking how much time off people on the team actually take.'),
    (r'\bmust be willing to work (weekends|nights|extended hours)\b', 'Overtime Expectation',
     'The posting explicitly expects work outside standard hours.'),
    (r'\bfast-paced environment\b', 'Fast-Paced Environment',
     'Common phrasing, but can also indicate understaffing or high pressure - worth asking about workload and turnover.'),
    (r'\bequity in lieu of\b', 'Below-Market Cash Compensation',
     'Equity offered in place of salary/cash - worth getting a real valuation before treating it as pay.'),
]


def analyze_job_description(description):
    """
    Parse a free-text job description for skills mentioned, benefits
    mentioned, required years of experience, and culture/compensation
    red flags. Returns a dict; if description is empty, returns neutral
    defaults rather than penalizing the analysis.
    """
    if not description or not description.strip():
        return {
            'has_description': False,
            'detected_skills': [],
            'benefits_detected': [],
            'years_experience_required': None,
            'red_flags': [],
            'benefits_score': 70,  # neutral - no info either way
        }

    text = description.lower()

    detected_skills = sorted({kw for kw in JD_SKILL_KEYWORDS if kw in text})

    benefits_detected = []
    for category, keywords in JD_BENEFIT_CATEGORIES.items():
        if any(kw in text for kw in keywords):
            benefits_detected.append(category)

    years_match = re.search(r'(\d+)\+?\s*(?:to\s*\d+\s*)?years?\s*(?:of\s*)?experience', text)
    years_experience_required = int(years_match.group(1)) if years_match else None

    red_flags = []
    for pattern, flag_name, flag_description in JD_RED_FLAG_PATTERNS:
        if re.search(pattern, text):
            red_flags.append({
                'flag': flag_name,
                'description': flag_description,
                'severity': 'info'
            })

    # Score scales with how many distinct benefit categories were
    # mentioned (out of 6) - a rough proxy for total-comp richness,
    # not a precise valuation.
    benefits_score = min(100, 40 + len(benefits_detected) * 12)

    return {
        'has_description': True,
        'detected_skills': detected_skills,
        'benefits_detected': benefits_detected,
        'years_experience_required': years_experience_required,
        'red_flags': red_flags,
        'benefits_score': benefits_score,
    }


def estimate_benefits_dollar_value(salary_midpoint, benefits_detected):
    """
    Very rough dollar estimate of benefits value, only applied when a
    job description was actually provided and specific benefit
    categories were detected in it. This is meant as a directional
    estimate, not a precise valuation.
    """
    value = 0.0
    if "Retirement (401k/pension)" in benefits_detected:
        value += salary_midpoint * 0.03  # rough typical employer match
    if "Health Coverage" in benefits_detected:
        value += 6000  # rough average employer health plan value
    if "Equity / Bonus" in benefits_detected:
        value += salary_midpoint * 0.05
    if "Other Perks" in benefits_detected:
        value += 1500
    return round(value)


def analyze_job(form_data):
    """
    Analyze a job opportunity using REAL FREE data
    """
    
    # Extract form data
    job_title = form_data.get('jobTitle', '')
    company_name = form_data.get('company', '')
    job_location = form_data.get('location', '')
    work_type = form_data.get('workType', 'On-site')
    age = int(form_data.get('age', 30))
    current_salary = int(form_data.get('currentSalary', 0))
    monthly_expenses = int(form_data.get('expenses', 2500))
    current_savings = int(form_data.get('savings', 5000))
    student_loans = int(form_data.get('loans', 0))
    investment_pct = int(form_data.get('investmentPercent', 20))
    current_location = form_data.get('currentLocation', 'Malvern, PA')
    offer_salary = int(form_data.get('offerSalary', 85000))
    job_description = form_data.get('jobDescription', '')

    if not GEMINI_CONFIGURED:
        print("ℹ️ Gemini API key not configured - using local fallbacks for job "
              "description analysis, AI summary, and career timeline "
              "(set GEMINI_API_KEY near the top of gemini_client.py). "
              "Get a free key at https://aistudio.google.com/apikey")
    
    # Extract state code from location
    state_code = extract_state_code(job_location)
    jd_insights = analyze_job_description(job_description)
    
    # ============================================
    # GET REAL DATA FROM FREE APIs
    # ============================================
    
    # 1. SALARY - Real from BLS
    salary_data = get_salary_bls(job_title, state_code)
    salary_low = salary_data['salary_low']
    salary_high = salary_data['salary_high']
    salary_mid = salary_data['salary_mid']
    salary_range = f"${salary_low:,} - ${salary_high:,}"
    salary_midpoint = salary_mid
    
    # Use offer salary if provided, otherwise use BLS midpoint
    if offer_salary > 0:
        salary_midpoint = offer_salary
    
    # 2. MARKET DEMAND - Real from Stack Overflow
    demand_data = get_demand_free(job_title)
    market_demand = demand_data['demand_score']
    
    # 3. COMPANY HEALTH - Real from Yahoo Finance
    company_data = get_company_health_free(company_name)
    company_health = company_data['health_score']
    
    # 4. COST OF LIVING - Research data
    col_data = get_col_free(job_location)
    col_multiplier = col_data['multiplier']
    adjusted_expenses = monthly_expenses * 12 * col_multiplier
    
    # 5. AUTOMATION RISK - Research data
    automation_data = get_automation_risk_free(job_title)
    automation_risk = automation_data['risk_percentage']
    automation_safety = automation_data['safety_score']
    
    # 6. TAXES - Official IRS rates
    federal_tax = get_federal_tax_2024(salary_midpoint)
    state_tax = get_state_tax_2024(salary_midpoint, state_code)
    local_tax = get_local_tax_2024(salary_midpoint, job_location, state_code)
    payroll_tax = get_payroll_tax(salary_midpoint)
    total_tax = federal_tax + state_tax + local_tax + payroll_tax
    
    # ============================================
    # CALCULATE SCORES
    # ============================================
    
    # Tax Efficiency Score (0-100)
    tax_rate = total_tax / salary_midpoint if salary_midpoint > 0 else 0
    tax_efficiency = int(100 * (1 - tax_rate))
    tax_efficiency = max(0, min(100, tax_efficiency))
    
    # Cost of Living Score (0-100)
    # Lower multiplier = better score
    col_score = max(50, 100 - (col_multiplier * 30))
    col_score = max(0, min(100, col_score))
    
    # Investment Potential Score (0-100)
    after_tax = salary_midpoint - total_tax
    investable_income = (after_tax - adjusted_expenses) * (investment_pct / 100)
    
    if investable_income > 15000:
        investment_potential = 90
    elif investable_income > 10000:
        investment_potential = 80
    elif investable_income > 5000:
        investment_potential = 60
    else:
        investment_potential = 40
    
    # Salary Growth Score (0-100)
    # Based on salary level
    if salary_midpoint > 150000:
        salary_growth = 95
    elif salary_midpoint > 120000:
        salary_growth = 85
    elif salary_midpoint > 90000:
        salary_growth = 75
    elif salary_midpoint > 60000:
        salary_growth = 65
    else:
        salary_growth = 50
    
    # Benefits & Perks Score (0-100) - from job description analysis.
    # Neutral (70) if no description was provided.
    benefits_score = jd_insights['benefits_score']

    # Overall Score (weighted) - rebalanced to make room for benefits_score
    overall_score = (
        (salary_growth * 0.20) +
        (market_demand * 0.15) +
        (company_health * 0.15) +
        (automation_safety * 0.15) +
        (col_score * 0.10) +
        (tax_efficiency * 0.05) +
        (investment_potential * 0.10) +
        (benefits_score * 0.10)
    )
    
    overall_score = int(max(0, min(100, overall_score)))
    
    # ============================================
    # GENERATE RECOMMENDATION
    # ============================================
    
    if overall_score >= 85:
        level = "Highly Recommended"
        description = "This is an excellent wealth-building opportunity with strong fundamentals across all metrics."
        color = "#f59e0b"  # Orange
    elif overall_score >= 70:
        level = "Worth Considering"
        description = "This role has solid potential for wealth building. Review trade-offs carefully."
        color = "#3b82f6"  # Blue
    elif overall_score >= 50:
        level = "Proceed With Caution"
        description = "This role has moderate wealth-building potential. Consider alternatives before accepting."
        color = "#f59e0b"  # Orange
    else:
        level = "Not Recommended"
        description = "This role has limited wealth-building potential. Strongly consider other opportunities."
        color = "#ef4444"  # Red
    
    # ============================================
    # CALCULATE FINANCIAL IMPACT
    # ============================================
    
    # Debt payments - estimated via standard amortization (see
    # get_debt_payment_estimate), capped so we never subtract more than
    # what's actually left after taxes and expenses.
    monthly_debt_payment = get_debt_payment_estimate(student_loans)
    disposable_before_debt = max(0, after_tax - adjusted_expenses)
    annual_debt_payment = min(disposable_before_debt, monthly_debt_payment * 12)
    disposable_after_debt = disposable_before_debt - annual_debt_payment

    # NOTE: annual_investable is a PORTION of disposable_after_debt, and
    # flexible_income is what's left AFTER setting that portion aside -
    # the two no longer overlap (previously "flexible" included the
    # investable amount too, double-counting it in the income-allocation
    # chart).
    annual_investable = disposable_after_debt * (investment_pct / 100)
    flexible_income = disposable_after_debt - annual_investable

    # Rough, directional dollar value of benefits mentioned in the job
    # description (0 if no description was provided).
    benefits_dollar_value = estimate_benefits_dollar_value(salary_midpoint, jd_insights['benefits_detected'])
    estimated_total_compensation = salary_midpoint + benefits_dollar_value
    
    # Investment growth projections (7% annual return)
    projection_5yr = calculate_investment_value(annual_investable, 0.07, 5)
    projection_10yr = calculate_investment_value(annual_investable, 0.07, 10)
    projection_20yr = calculate_investment_value(annual_investable, 0.07, 20)
    
    # Income allocation
    income_allocation = {
        'taxes': int(total_tax),
        'expenses': int(adjusted_expenses),
        'debtPayments': int(annual_debt_payment),
        'investableIncome': int(annual_investable),
        'flexibleIncome': int(flexible_income)
    }
    
    # ============================================
    # RISK FLAGS
    # ============================================
    
    risk_flags = []
    
    # Check automation risk
    if automation_risk > 70:
        risk_flags.append({
            'flag': 'High Automation Risk',
            'description': f'This role has a {automation_risk}% risk of automation in the next 10 years. Consider building complementary skills.',
            'severity': 'warning'
        })
    
    # Check company health
    if company_health < 60:
        risk_flags.append({
            'flag': 'Company Stability Concern',
            'description': f'Company health score is {company_health}/100. Review financials before accepting.',
            'severity': 'warning'
        })
    
    # Check low salary
    if salary_midpoint < 60000:
        risk_flags.append({
            'flag': 'Limited Earning Potential',
            'description': 'This salary may limit your ability to build wealth significantly.',
            'severity': 'info'
        })
    
    # Check high COL
    if col_multiplier > 1.3:
        risk_flags.append({
            'flag': 'High Cost of Living',
            'description': f'This location has {col_multiplier:.1f}x cost of living. Budget carefully.',
            'severity': 'info'
        })
    
    # Check low demand
    if market_demand < 60:
        risk_flags.append({
            'flag': 'Lower Market Demand',
            'description': 'Market demand for this role is moderate. Consider leverage and negotiation.',
            'severity': 'info'
        })
    
    # Check debt burden (annual debt payments as a share of gross salary)
    if salary_midpoint > 0 and (annual_debt_payment / salary_midpoint) > 0.15:
        risk_flags.append({
            'flag': 'High Debt Burden',
            'description': f'Estimated annual debt payments (~${int(annual_debt_payment):,}) are a significant share of this salary. This will meaningfully limit what you can invest.',
            'severity': 'warning'
        })
    
    # Fold in any culture/compensation red flags found in the pasted
    # job description (empty list if no description was provided).
    risk_flags.extend(jd_insights['red_flags'])
    
    # ============================================
    # SKILL RECOMMENDATIONS
    # ============================================
    
    skill_suggestions = get_skill_suggestions(job_title)
    
    # ============================================
    # ADJACENT ROLES / CAREER TIMELINE
    # ============================================
    # Try Gemini first - it can generate a plausible progression path for
    # ANY job title, not just the handful curated in get_adjacent_roles().
    # There's no authoritative dataset being bypassed here (there's no
    # BLS-equivalent for "years to promotion"), so this is a case where
    # an LLM's estimate and the curated table are both just estimates -
    # Gemini's just covers more ground. Falls back to the curated table
    # on any failure.
    # Skip Gemini - use rule-based timeline
    career_timeline = get_career_timeline(job_title)
    
    # ============================================
    # AI SUMMARY
    # ============================================
    # Try Gemini for a summary that reasons across all score dimensions
    # in real prose, rather than filling a fixed sentence template.
    # Use rule-based summary (no Gemini)
    ai_summary = generate_summary(
        job_title, company_name, overall_score, automation_safety,
        market_demand, salary_midpoint, annual_investable, projection_20yr)
    
    # ============================================
    # RETURN COMPLETE ANALYSIS
    # ============================================
    
    return {
        'jobInfo': {
            'jobTitle': job_title,
            'companyName': company_name,
            'jobLocation': job_location,
            'workType': work_type
        },
        'scores': {
            'salaryGrowth': int(salary_growth),
            'marketDemand': int(market_demand),
            'companyHealth': int(company_health),
            'automationSafety': int(automation_safety),
            'costOfLiving': int(col_score),
            'taxEfficiency': int(tax_efficiency),
            'investmentPotential': int(investment_potential),
            'benefitsScore': int(benefits_score),
            'overallScore': int(overall_score)
        },
        'recommendation': {
            'level': level,
            'description': description,
            'color': color
        },
        'financialImpact': {
            'salaryRange': salary_range,
            'salaryLow': int(salary_low),
            'salaryHigh': int(salary_high),
            'salaryMidpoint': int(salary_midpoint),
            'estimatedTotalCompensation': int(estimated_total_compensation),
            'federalTax': int(federal_tax),
            'stateTax': int(state_tax),
            'localTax': int(local_tax),
            'payrollTax': int(payroll_tax),
            'totalTax': int(total_tax),
            'afterTaxIncome': int(after_tax),
            'adjustedAnnualExpenses': int(adjusted_expenses),
            'monthlyDebtPayment': int(monthly_debt_payment),
            'annualDebtPayment': int(annual_debt_payment),
            'annualInvestableIncome': int(annual_investable),
            'flexibleIncome': int(flexible_income),
            'investmentProjection5yr': int(projection_5yr),
            'investmentProjection10yr': int(projection_10yr),
            'investmentProjection20yr': int(projection_20yr)
        },
        'incomeAllocation': income_allocation,
        'riskFlags': risk_flags,
        'skillSuggestions': skill_suggestions,
        'careerTimeline': career_timeline,
        'aiSummary': ai_summary,
        'jobDescriptionInsights': {
            'hasDescription': jd_insights['has_description'],
            'detectedSkills': jd_insights['detected_skills'],
            'benefitsDetected': jd_insights['benefits_detected'],
            'yearsExperienceRequired': jd_insights['years_experience_required']
        },
        'dataSources': {
            'salary': salary_data['source'],
            'demand': demand_data['source'],
            'company': company_data['source'],
            'taxes': 'IRS Official Rates 2024',
            'col': col_data['source'],
            'jdAnalysis': jd_insights.get('source', 'Rule-based (keyword matching)')
        }
    }


# ============================================
# HELPER FUNCTIONS
# ============================================

def extract_state_code(location):
    """Extract state code from location string"""
    state_map = {
        'Pennsylvania': 'PA', 'PA': 'PA',
        'California': 'CA', 'CA': 'CA',
        'New York': 'NY', 'NY': 'NY',
        'Texas': 'TX', 'TX': 'TX',
        'Florida': 'FL', 'FL': 'FL',
        'Washington': 'WA', 'WA': 'WA',
        'Illinois': 'IL', 'IL': 'IL',
        'Massachusetts': 'MA', 'MA': 'MA',
        'Colorado': 'CO', 'CO': 'CO',
    }
    
    # Try to extract state code
    parts = location.split(',')
    if len(parts) > 1:
        state = parts[-1].strip()
        return state_map.get(state, state)
    
    return 'PA'  # Default


def calculate_investment_value(annual_contribution, annual_rate, years):
    """Calculate future value of regular investments"""
    if annual_contribution <= 0 or years <= 0:
        return 0
    
    # Future Value of Annuity formula
    # FV = PMT × [((1 + r)^n - 1) / r]
    fv = annual_contribution * (((1 + annual_rate) ** years - 1) / annual_rate)
    return fv


# Curated learning resources per skill. Anything not in this map falls
# back to a generic search link generated at lookup time, so every skill
# this function can ever return still gets a usable link - not just the
# ones we happened to curate.
SKILL_RESOURCES = {
    'Python (Advanced)': [
        {'label': 'Real Python', 'url': 'https://realpython.com/'},
        {'label': 'Coursera: Python 3 Programming', 'url': 'https://www.coursera.org/specializations/python-3-programming'},
    ],
    'System Design': [
        {'label': 'ByteByteGo (system design)', 'url': 'https://bytebytego.com/'},
        {'label': 'GitHub: system-design-primer', 'url': 'https://github.com/donnemartin/system-design-primer'},
    ],
    'Database Design': [
        {'label': 'freeCodeCamp: Relational Databases', 'url': 'https://www.freecodecamp.org/learn/relational-database/'},
    ],
    'Cloud Platforms (AWS/Azure)': [
        {'label': 'AWS Skill Builder', 'url': 'https://skillbuilder.aws/'},
        {'label': 'Microsoft Learn: Azure', 'url': 'https://learn.microsoft.com/en-us/training/azure/'},
    ],
    'API Development': [
        {'label': 'freeCodeCamp: APIs', 'url': 'https://www.freecodecamp.org/news/tag/apis/'},
    ],
    'SQL & Database Design': [
        {'label': 'Mode SQL Tutorial', 'url': 'https://mode.com/sql-tutorial/'},
    ],
    'Data Visualization (Tableau, Power BI)': [
        {'label': 'Tableau Free Training', 'url': 'https://www.tableau.com/learn/training'},
        {'label': 'Microsoft Learn: Power BI', 'url': 'https://learn.microsoft.com/en-us/training/powerplatform/power-bi'},
    ],
    'Statistics & Probability': [
        {'label': 'Khan Academy: Statistics', 'url': 'https://www.khanacademy.org/math/statistics-probability'},
    ],
    'Excel/Google Sheets Master': [
        {'label': 'Google Sheets Training', 'url': 'https://workspace.google.com/learning/content/sheets'},
    ],
    'Security+ Certification': [
        {'label': 'CompTIA Security+', 'url': 'https://www.comptia.org/certifications/security'},
    ],
    'Entra ID / Azure AD': [
        {'label': 'Microsoft Learn: Entra ID', 'url': 'https://learn.microsoft.com/en-us/entra/fundamentals/'},
    ],
    'Active Directory': [
        {'label': 'Microsoft Learn: AD DS', 'url': 'https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/ad-ds-getting-started'},
    ],
    'SIEM Tools (Splunk, Datadog)': [
        {'label': 'Splunk Free Training', 'url': 'https://www.splunk.com/en_us/training.html'},
    ],
    'Python Security Automation': [
        {'label': 'Black Hat Python (book)', 'url': 'https://nostarch.com/black-hat-python2E'},
    ],
    'SailPoint': [
        {'label': 'SailPoint Identity University', 'url': 'https://www.sailpoint.com/identity-university/'},
    ],
    'Cloud Security (AWS/Azure)': [
        {'label': 'AWS Security Learning', 'url': 'https://skillbuilder.aws/'},
        {'label': 'Microsoft Learn: Azure Security', 'url': 'https://learn.microsoft.com/en-us/training/paths/describe-basic-security-concepts/'},
    ],
    'Machine Learning Frameworks (TensorFlow, PyTorch)': [
        {'label': 'TensorFlow Tutorials', 'url': 'https://www.tensorflow.org/tutorials'},
        {'label': 'PyTorch Tutorials', 'url': 'https://pytorch.org/tutorials/'},
    ],
    'Communication Skills': [
        {'label': 'Coursera: Improving Communication Skills', 'url': 'https://www.coursera.org/learn/wharton-communication-skills'},
    ],
    'Problem Solving': [
        {'label': 'Coursera: Effective Problem-Solving', 'url': 'https://www.coursera.org/learn/problem-solving'},
    ],
    'Leadership': [
        {'label': 'Coursera: Leadership Skills', 'url': 'https://www.coursera.org/browse/business/leadership-and-management'},
    ],
    'Time Management': [
        {'label': 'Coursera: Work Smarter, Not Harder', 'url': 'https://www.coursera.org/learn/work-smarter-not-harder'},
    ],
}


def get_skill_resources(skill_name):
    """Return curated resources for a skill, or a generic search fallback
    so every skill this app can produce still has somewhere to click."""
    if skill_name in SKILL_RESOURCES:
        return SKILL_RESOURCES[skill_name]
    query = urllib.parse.quote_plus(skill_name)
    return [
        {'label': 'Search on Coursera', 'url': f'https://www.coursera.org/search?query={query}'},
        {'label': 'Search on YouTube', 'url': f'https://www.youtube.com/results?search_query={query}+tutorial'},
    ]


def get_skill_suggestions(job_title):
    """Get skill suggestions based on job title, each with learning resources"""
    
    skills_by_role = {
        'Software Developer': [
            'Python (Advanced)',
            'System Design',
            'Database Design',
            'Cloud Platforms (AWS/Azure)',
            'API Development',
        ],
        'Software Engineer': [
            'Python (Advanced)',
            'System Design',
            'Database Design',
            'Cloud Platforms (AWS/Azure)',
            'API Development',
        ],
        'Data Analyst': [
            'SQL & Database Design',
            'Data Visualization (Tableau, Power BI)',
            'Python (Advanced)',
            'Statistics & Probability',
            'Excel/Google Sheets Master',
        ],
        'Cybersecurity Analyst': [
            'Security+ Certification',
            'Entra ID / Azure AD',
            'Active Directory',
            'SIEM Tools (Splunk, Datadog)',
            'Python Security Automation',
        ],
        'IAM Analyst': [
            'Entra ID / Azure AD',
            'Security+ Certification',
            'Active Directory',
            'SailPoint',
            'Cloud Security (AWS/Azure)',
        ],
        'Machine Learning Engineer': [
            'Python (Advanced)',
            'Machine Learning Frameworks (TensorFlow, PyTorch)',
            'Statistics & Probability',
            'SQL & Database Design',
            'Cloud Platforms (AWS/Azure)',
        ],
    }
    
    skill_names = skills_by_role.get(job_title, [
        'Communication Skills',
        'Problem Solving',
        'Leadership',
        'Time Management'
    ])

    return [
        {'skill': name, 'resources': get_skill_resources(name)}
        for name in skill_names
    ]


CAREER_LADDERS = {
    'Tech': [
        {'level': 1, 'titles': ['IT Support', 'QA Tester', 'Junior Analyst']},
        {'level': 2, 'titles': ['Business Analyst', 'Data Analyst', 'Security Analyst']},
        {'level': 3, 'titles': ['Software Engineer', 'Data Engineer', 'Security Engineer']},
        {'level': 4, 'titles': ['Senior Engineer', 'Senior Analyst', 'Lead Analyst']},
        {'level': 5, 'titles': ['Tech Lead', 'Engineering Manager', 'Security Manager']},
        {'level': 6, 'titles': ['Director', 'VP', 'CTO/CISO']},
    ],
    'Finance': [
        {'level': 1, 'titles': ['Finance Intern', 'Operations Associate']},
        {'level': 2, 'titles': ['Financial Analyst', 'Credit Analyst', 'Risk Analyst']},
        {'level': 3, 'titles': ['Senior Analyst', 'Associate', 'Portfolio Analyst']},
        {'level': 4, 'titles': ['Manager', 'AVP', 'Senior Associate']},
        {'level': 5, 'titles': ['VP', 'Director']},
        {'level': 6, 'titles': ['Managing Director', 'CFO', 'Partner']},
    ],
}

FINANCE_KEYWORDS = [
    'financ', 'credit', 'risk', 'portfolio', 'invest', 'bank', 'treasury',
    'accounting', 'audit', 'actuar', 'underwrit', 'wealth', 'trading',
    'equity research', 'hedge fund', 'private equity', 'fp&a', 'fp & a',
    'cfo', 'chief financial officer',
]


def _detect_industry_and_level(job_title):
    """
    Maps a job title onto one of the two curated career ladders (Tech or
    Finance) and estimates which level of that ladder the title sits at.

    This is a heuristic, not a lookup against a real leveling dataset -
    it first tries a direct match against each level's example titles,
    then falls back to seniority keywords (junior/senior/lead/director/
    etc.) if nothing matches directly.
    """
    title_lower = job_title.lower()

    industry = 'Finance' if any(kw in title_lower for kw in FINANCE_KEYWORDS) else 'Tech'
    ladder = CAREER_LADDERS[industry]

    matched_level = None
    for level in ladder:
        for candidate in level['titles']:
            candidate_lower = candidate.lower()
            if candidate_lower in title_lower or title_lower in candidate_lower:
                matched_level = level['level']
                break
        if matched_level:
            break

    if matched_level is None:
        if any(k in title_lower for k in ['chief', 'cto', 'ciso', 'cfo', 'partner', 'managing director']):
            matched_level = 6
        elif 'vp' in title_lower or 'vice president' in title_lower or 'director' in title_lower:
            matched_level = 5
        elif 'lead' in title_lower or 'manager' in title_lower or 'head of' in title_lower:
            matched_level = 4
        elif 'senior' in title_lower or 'sr.' in title_lower or 'sr ' in title_lower:
            matched_level = 4
        elif 'junior' in title_lower or 'jr.' in title_lower or 'intern' in title_lower:
            matched_level = 1
        else:
            matched_level = 3  # default: assume an independent mid-level contributor

    matched_level = max(1, min(matched_level, len(ladder)))
    return industry, ladder, matched_level


def get_career_timeline(job_title):
    """
    Builds a 5-step forward-looking career timeline (Now, 1-2 yrs,
    3-5 yrs, 5-10 yrs, 10+ yrs) by mapping the job title onto a 6-level
    Tech or Finance career ladder and projecting forward from its
    current level.

    These are general industry patterns illustrated with example
    titles from the curated ladder, not a personalized prediction -
    actual paths vary a lot by company, performance, and market
    conditions.
    """
    industry, ladder, current_level = _detect_industry_and_level(job_title)

    bucket_labels = ['Now', '1-2 Yrs', '3-5 Yrs', '5-10 Yrs', '10+ Yrs']
    templates = [
        'Build skills, deliver value early, and negotiate your next raise.',
        'Deepen your expertise, earn strong performance reviews, and aim for a {next_title} role.',
        'Move into a {next_title} role, expanding your scope and leadership.',
        'Lead projects and mentor others as a {next_title}, maximizing your earning potential.',
        "Leverage the wealth you've built through consistent investing and compounding.",
    ]

    steps = []
    for i, label in enumerate(bucket_labels):
        target_level = min(current_level + i, len(ladder))
        next_title = ladder[target_level - 1]['titles'][0]
        description = templates[i].format(next_title=next_title)
        steps.append({
            'label': label,
            'role': job_title if i == 0 else next_title,
            'description': description,
        })

    return {'industry': industry, 'steps': steps}


def generate_summary(job_title, company, score, safety, demand, salary, investable, projection_20):
    """Generate AI-powered summary"""
    
    summary = f"This {job_title} role at {company} "
    
    if score >= 85:
        summary += f"is an excellent wealth-building opportunity. "
    elif score >= 70:
        summary += f"has solid wealth-building potential. "
    else:
        summary += f"has moderate wealth-building potential. "
    
    summary += f"The role is in a high-demand field ({demand}/100 demand score), "
    
    if safety >= 80:
        summary += f"with strong job security ({safety}/100 automation safety). "
    else:
        summary += f"with moderate job security ({safety}/100 automation safety). "
    
    summary += f"At an estimated ${salary:,} salary, you could invest approximately ${investable:,.0f} annually, "
    summary += f"potentially growing to ${projection_20:,.0f} over 20 years at 7% returns. "
    
    summary += "Consider the skills required, career growth potential, and company stability before deciding."
    
    return summary


# ============================================
# TEST
# ============================================

if __name__ == '__main__':
    test_data = {
        'jobTitle': 'Software Developer',
        'company': 'Microsoft',
        'location': 'Seattle, WA',
        'workType': 'Hybrid',
        'age': '28',
        'currentSalary': '0',
        'offerSalary': '120000',
        'expenses': '2800',
        'savings': '50000',
        'loans': '25000',
        'investmentPercent': '20',
        'currentLocation': 'Malvern, PA'
    }
    
    result = analyze_job(test_data)
    print("\n" + "="*60)
    print("✅ REAL DATA ANALYSIS COMPLETE")
    print("="*60)
    print(f"Job: {result['jobInfo']['jobTitle']}")
    print(f"Company: {result['jobInfo']['companyName']}")
    print(f"Score: {result['scores']['overallScore']}/100")
    print(f"Recommendation: {result['recommendation']['level']}")
    print(f"Annual Investable: ${result['financialImpact']['annualInvestableIncome']:,}")
    print(f"20-Year Projection: ${result['financialImpact']['investmentProjection20yr']:,}")
    print("="*60)