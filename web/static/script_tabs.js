// web/static/script_tabs.js - Tabbed Interface with Scroll Animations

// ============================================
// TAB SWITCHING
// ============================================

function switchTab(tabName) {
    // Hide all tabs
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => tab.classList.remove('active'));

    // Deactivate all buttons
    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(btn => btn.classList.remove('active'));

    // Show selected tab
    const selectedTab = document.getElementById(`${tabName}-tab`);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }

    // Activate button
    const selectedBtn = document.querySelector(`[data-tab="${tabName}"]`);
    if (selectedBtn) {
        selectedBtn.classList.add('active');
    }

    // Scroll to top
    window.scrollTo(0, 0);
}

// Tab button click handlers
document.querySelectorAll('.tab-btn').forEach(button => {
    button.addEventListener('click', () => {
        const tabName = button.getAttribute('data-tab');
        switchTab(tabName);
    });
});

// ============================================
// SCROLL ANIMATIONS
// ============================================

// Intersection Observer for scroll-triggered animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.animation = 'none';
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observe all animation elements
document.querySelectorAll('.scroll-fade, .scroll-up').forEach(el => {
    observer.observe(el);
});

// ============================================
// INVESTMENT SLIDER
// ============================================

const investmentSlider = document.getElementById('investmentPercent');
const investmentDisplay = document.getElementById('investmentDisplay');

if (investmentSlider) {
    investmentSlider.addEventListener('input', (e) => {
        investmentDisplay.textContent = e.target.value + '%';
    });
}

// ============================================
// TRY SAMPLE JOB
// ============================================

const trySampleJobBtn = document.getElementById('trySampleJobBtn');

if (trySampleJobBtn) {
    trySampleJobBtn.addEventListener('click', async () => {
        trySampleJobBtn.disabled = true;
        const originalContent = trySampleJobBtn.innerHTML;
        trySampleJobBtn.textContent = 'Loading sample...';

        try {
            const response = await fetch('/sample-job');
            if (!response.ok) throw new Error('Failed to load sample job');
            const sample = await response.json();

            // Populate every form field that has a matching key in the
            // sample response - skips anything not present in the form.
            Object.keys(sample).forEach(key => {
                const field = document.getElementById(key);
                if (field) field.value = sample[key];
            });

            // Keep the investment percent slider's display label in sync
            if (investmentSlider && investmentDisplay) {
                investmentDisplay.textContent = investmentSlider.value + '%';
            }

            // Keep the job description character counter in sync too
            if (jobDescriptionField && jobDescCounter) {
                jobDescCounter.textContent = `${jobDescriptionField.value.length}/2000`;
            }

            switchTab('analyze');
        } catch (error) {
            console.error('Error loading sample job:', error);
            alert('Could not load the sample job. Please try again.');
        } finally {
            trySampleJobBtn.disabled = false;
            trySampleJobBtn.innerHTML = originalContent;
        }
    });
}

// ============================================
// FORM SUBMISSION
// ============================================

const analysisForm = document.getElementById('analysisForm');

if (analysisForm) {
    analysisForm.addEventListener('reset', () => {
        // Native reset clears field values immediately, but doesn't fire
        // 'input' events - sync the slider label and char counter manually.
        setTimeout(() => {
            if (investmentDisplay && investmentSlider) investmentDisplay.textContent = investmentSlider.value + '%';
            if (jobDescCounter) jobDescCounter.textContent = '0/2000';
        }, 0);
    });

    analysisForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Collect form data
       const formData = {
        jobTitle: document.getElementById('jobTitle').value,
        company: document.getElementById('company').value,
        location: document.getElementById('location').value,
        workType: document.getElementById('workType').value,
        jobDescription: document.getElementById('jobDescription').value,
        age: document.getElementById('age').value,
        offerSalary: parseInt(document.getElementById('offerSalary').value) || 0,
        expenses: document.getElementById('expenses').value,
        savings: document.getElementById('savings').value,
        loans: document.getElementById('loans').value,
        investmentPercent: document.getElementById('investmentPercent').value,
        currentLocation: document.getElementById('currentLocation').value
    };

        try {
            // Send to backend
            const response = await fetch('/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) throw new Error('Analysis failed');

            const result = await response.json();
            
            // Display results (pass along the submitted form data too, since
            // the backend response doesn't echo back expenses/savings/etc.)
            displayResults(result, formData);
            
            // Switch to results tab
            switchTab('results');

        } catch (error) {
            console.error('Error:', error);
            alert('Failed to analyze job. Please try again.');
        }
    });
}

// ============================================
// DISPLAY RESULTS
// ============================================

function displayResults(data, formData) {
    // Remember the latest result/inputs so Compare / Save / Export /
    // scenario hovers can all reuse them without re-fetching.
    window.lastAnalysisResult = data;
    window.lastFormData = formData;

    const resultsContainer = document.getElementById('resultsContainer');
    const noResults = document.getElementById('noResults');

    noResults.style.display = 'none';
    resultsContainer.style.display = 'block';

    const scores = data.scores || {};
    const financial = data.financialImpact || {};
    const rec = data.recommendation || {};
    const jobInfo = data.jobInfo || {};

    // Overall score + recommendation (straight from the backend)
    const score = Math.round(scores.overallScore || 0);
    document.getElementById('overallScore').textContent = score;
    document.getElementById('recommendation').textContent = rec.level || 'Analyze a Job';
    document.getElementById('recommendationDesc').textContent = rec.description || 'Fill out the form to get started';

    const card = document.getElementById('recommendationCard');
    if (card && rec.color) card.style.borderColor = rec.color;

    populateScoreBreakdown(scores);
    populateSalaryVisualization(financial);
    populateFinancialGrid(financial, formData);
    populateInvestmentProjections(financial);
    populateRiskFlags(data.riskFlags || []);
    populateSkillSuggestions(data.skillSuggestions || []);
    populateJobBoardLinks(jobInfo.jobTitle, jobInfo.jobLocation || formData?.currentLocation, financial);
    populateProgressionTimeline(data.careerTimeline);
    populateJdInsights(data.jobDescriptionInsights || {});

    document.getElementById('aiSummary').textContent = data.aiSummary || '';

    populateScenarios(data, formData);

    // Reset to the first result tab on every fresh analysis, so a previous
    // run left on e.g. "Risks" doesn't carry over and confuse the new one.
    const firstTabBtn = document.querySelector('.result-tab-btn[data-tab="moves"]');
    if (firstTabBtn) firstTabBtn.click();

    // Charts are no longer rendered automatically - cache the data so the
    // "Show Charts" toggle can build them on demand (see CHARTS section).
    window.lastChartData = data;
    window.lastChartFormData = formData;
    chartsRendered = false;
    const chartsSection = document.getElementById('chartsSection');
    const showChartsBtn = document.getElementById('showChartsBtn');
    if (chartsSection) chartsSection.classList.add('hidden');
    if (showChartsBtn) showChartsBtn.innerHTML = 'Show Charts <span id="showChartsArrow">&darr;</span>';
}

// ============================================
// RESULT TABS (Money Moves / Score Breakdown /
// Skills & Roles / Risks / Investing & Timeline /
// Details & Charts)
// ============================================

document.querySelectorAll('.result-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.result-tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.result-tab-panel').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        const panel = document.getElementById('tab-' + btn.dataset.tab);
        if (panel) panel.classList.add('active');
    });
});

// ============================================
// SCORE BREAKDOWN
// ============================================

function getScoreLabel(score) {
    if (score === null || score === undefined || Number.isNaN(Number(score))) return 'No Data';
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Great';
    if (score >= 70) return 'Good';
    if (score >= 60) return 'Fair';
    return 'Needs Work';
}

function getScoreIcon(label) {
    const icons = {
        'Salary Growth': {
            color: 'blue',
            svg: `
                <line x1="12" y1="1" x2="12" y2="23"></line>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            `
        },
        'Market Demand': {
            color: 'green',
            svg: `
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                <polyline points="17 6 23 6 23 12"></polyline>
            `
        },
        'Company Health': {
            color: 'purple',
            svg: `
                <rect x="3" y="3" width="18" height="18" rx="2"></rect>
                <path d="M8 21V9"></path>
                <path d="M16 21V9"></path>
                <path d="M3 9h18"></path>
            `
        },
        'Automation Safety': {
            color: 'purple',
            svg: `
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"></path>
                <path d="m9 12 2 2 4-4"></path>
            `
        },
        'Cost of Living': {
            color: 'blue',
            svg: `
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                <circle cx="12" cy="10" r="3"></circle>
            `
        },
        'Tax Efficiency': {
            color: 'amber',
            svg: `
                <path d="M4 19h16"></path>
                <path d="M4 15h16"></path>
                <path d="M4 11h16"></path>
                <path d="M4 7h16"></path>
            `
        },
        'Investment Potential': {
            color: 'green',
            svg: `
                <path d="M3 17l6-6 4 4 8-8"></path>
                <path d="M14 7h7v7"></path>
            `
        },
        'Benefits & Perks': {
            color: 'cyan',
            svg: `
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
            `
        }
    };

    return icons[label] || icons['Salary Growth'];
}

function normalizeScore(value) {
    if (value === null || value === undefined || value === '') return null;

    const num = Number(value);
    if (Number.isNaN(num)) return null;

    return Math.max(0, Math.min(100, Math.round(num)));
}

function populateScoreBreakdown(scores = {}) {
    const scoresGrid = document.getElementById('scoresGrid');
    if (!scoresGrid) return;

    scoresGrid.innerHTML = '';

    const scoreItems = [
        {
            label: 'Salary Growth',
            description: 'Income upside and long-term earning power',
            value: normalizeScore(scores.salaryGrowth)
        },
        {
            label: 'Market Demand',
            description: 'How strong demand is for this role',
            value: normalizeScore(scores.marketDemand)
        },
        {
            label: 'Company Health',
            description: 'Employer stability and long-term strength',
            value: normalizeScore(scores.companyHealth)
        },
        {
            label: 'Automation Safety',
            description: 'How resilient this role is to AI disruption',
            value: normalizeScore(scores.automationSafety)
        },
        {
            label: 'Cost of Living',
            description: 'How location affects your savings power',
            value: normalizeScore(scores.costOfLiving)
        },
        {
            label: 'Tax Efficiency',
            description: 'Take-home pay and tax impact',
            value: normalizeScore(scores.taxEfficiency)
        },
        {
            label: 'Investment Potential',
            description: 'How much this role helps you invest',
            value: normalizeScore(scores.investmentPotential)
        },
        {
            label: 'Benefits & Perks',
            description: 'Equity, retirement, insurance, and perks',
            value: normalizeScore(scores.benefitsScore)
        }
    ];

    scoresGrid.innerHTML = scoreItems.map(item => {
        const score = item.value;
        const barWidth = score === null ? 0 : score;
        const displayScore = score === null ? '—' : score;
        const icon = getScoreIcon(item.label);

        return `
            <div class="score-factor-row">
                <div class="score-factor-left">
                    <span class="score-factor-icon ${icon.color}">
                        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            ${icon.svg}
                        </svg>
                    </span>

                    <div>
                        <h4>${item.label}</h4>
                        <p>${item.description}</p>
                    </div>
                </div>

                <div class="score-factor-middle">
                    <div class="factor-meter">
                        <i style="width: ${barWidth}%;"></i>
                    </div>
                </div>

                <div class="score-factor-result">
                    <strong>${displayScore}</strong>
                    <span>${getScoreLabel(score)}</span>
                </div>
            </div>
        `;
    }).join('');
}

// ============================================
// SALARY RANGE VISUALIZATION
// ============================================

function populateSalaryVisualization(financial) {
    const point = document.getElementById('salaryPoint');
    const caption = document.getElementById('salaryRangeCaption');
    if (!point || !caption) return;

    const low = financial.salaryLow || 0;
    const high = financial.salaryHigh || 0;
    const mid = financial.salaryMidpoint || 0;

    let percent = 50;
    if (high > low) {
        percent = ((mid - low) / (high - low)) * 100;
        percent = Math.min(100, Math.max(0, percent));
    }

    point.style.left = `${percent}%`;
    caption.textContent = `Estimated range: $${low.toLocaleString()} – $${high.toLocaleString()} · Your figure: $${mid.toLocaleString()}`;
}

// ============================================
// FINANCIAL GRID
// ============================================

function populateFinancialGrid(financial, formData) {
    const financialGrid = document.getElementById('financialGrid');
    financialGrid.innerHTML = '';

    const fmt = (n) => `$${Math.round(n || 0).toLocaleString()}`;

    const groups = [
        {
            title: 'Compensation',
            icon: 'blue',
            items: [
                { label: 'Estimated Salary Range', value: financial.salaryRange || '—' },
                { label: 'Estimated Annual Salary', value: fmt(financial.salaryMidpoint) }
            ]
        },
        {
            title: 'Taxes',
            icon: 'orange',
            items: [
                { label: 'Federal Tax (Est.)', value: fmt(financial.federalTax) },
                { label: 'State Tax (Est.)', value: fmt(financial.stateTax) },
                { label: 'Local Tax (Est.)', value: fmt(financial.localTax) },
                { label: 'Payroll Tax (FICA)', value: fmt(financial.payrollTax) },
                {
                    label: 'Total Tax',
                    value: fmt((financial.federalTax || 0) + (financial.stateTax || 0) + (financial.localTax || 0) + (financial.payrollTax || 0)),
                    highlightOrange: true
                }
            ]
        },
        {
            title: 'Cash Flow',
            icon: 'green',
            items: [
                { label: 'After-Tax Income', value: fmt(financial.afterTaxIncome), highlight: true },
                { label: 'Adjusted Annual Expenses', value: fmt(financial.adjustedAnnualExpenses) },
                { label: 'Est. Monthly Debt Payment', value: fmt(financial.monthlyDebtPayment) },
                { label: 'Annual Investable Income', value: fmt(financial.annualInvestableIncome), highlight: true },
                { label: 'Flexible Income', value: fmt(financial.flexibleIncome) }
            ]
        }
    ];

    financialGrid.innerHTML = groups.map(group => `
        <div class="fin-group">
            <div class="fin-group-header">
                <span class="fin-group-icon ${group.icon}"></span>
                <h4>${group.title}</h4>
            </div>
            <div class="fin-group-cards">
                ${group.items.map(item => `
                    <div class="fin-card${item.highlight ? ' highlight' : ''}${item.highlightOrange ? ' highlight-orange' : ''}">
                        <label>${item.label}</label>
                        <div class="fin-card-value">${item.value}</div>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

function populateInvestmentProjections(financial) {
    const fmt = (n) => `$${Math.round(n || 0).toLocaleString()}`;
    document.getElementById('projection5yr').textContent = fmt(financial.investmentProjection5yr);
    document.getElementById('projection10yr').textContent = fmt(financial.investmentProjection10yr);
    document.getElementById('projection20yr').textContent = fmt(financial.investmentProjection20yr);
}

// ============================================
// JOB DESCRIPTION INSIGHTS
// ============================================

function populateJdInsights(insights) {
    const container = document.getElementById('jdInsights');
    if (!container) return;

    if (!insights.hasDescription) {
        container.innerHTML = '<p class="jd-insights-empty">Paste a job description in the Analyze tab to detect required skills, benefits mentioned, and any culture/compensation red flags.</p>';
        return;
    }

    const skills = insights.detectedSkills || [];
    const benefits = insights.benefitsDetected || [];
    const years = insights.yearsExperienceRequired;

    let html = '';

    if (years !== null && years !== undefined) {
        html += `
            <div class="jd-insights-row">
                <div class="jd-insights-label">Experience Required</div>
                <div>${years}+ years</div>
            </div>
        `;
    }

    html += `
        <div class="jd-insights-row">
            <div class="jd-insights-label">Skills Detected in Posting</div>
            <div class="jd-tag-list">
                ${skills.length > 0
                    ? skills.map(s => `<span class="jd-tag">${s}</span>`).join('')
                    : '<span class="jd-insights-empty">No specific tech skills detected in the text.</span>'}
            </div>
        </div>
    `;

    html += `
        <div class="jd-insights-row">
            <div class="jd-insights-label">Benefits Mentioned</div>
            <div class="jd-tag-list">
                ${benefits.length > 0
                    ? benefits.map(b => `<span class="jd-tag benefit">${b}</span>`).join('')
                    : '<span class="jd-insights-empty">No specific benefits called out in the text.</span>'}
            </div>
        </div>
    `;

    container.innerHTML = html;
}

// ============================================
// RISK FLAGS / SKILLS / ADJACENT ROLES
// ============================================

function populateRiskFlags(flags) {
    const container = document.getElementById('riskFlags');
    container.innerHTML = '';

    if (!flags || flags.length === 0) {
        container.innerHTML = '<p style="color: var(--accent-green);">No significant risk flags identified.</p>';
        return;
    }

    const iconMap = { warning: '⚠️', danger: '❌', info: 'ℹ️' };

    flags.forEach(flag => {
        const el = document.createElement('div');
        el.className = `risk-flag ${flag.severity || 'info'}`;
        el.innerHTML = `
            <div class="risk-flag-icon">${iconMap[flag.severity] || '•'}</div>
            <div class="risk-flag-content">
                <h5>${flag.flag}</h5>
                <p>${flag.description}</p>
            </div>
        `;
        container.appendChild(el);
    });
}

function populateSkillSuggestions(skills) {
    const container = document.getElementById('skillSuggestions');
    container.innerHTML = '';
    (skills || []).forEach(item => {
        // Support both the new {skill, resources} shape and a plain string,
        // in case older cached/saved analyses are loaded.
        const skillName = typeof item === 'string' ? item : item.skill;
        const resources = typeof item === 'string' ? [] : (item.resources || []);

        const el = document.createElement('div');
        el.className = 'skill-item';

        const linksHtml = resources.map(r =>
            `<a href="${r.url}" target="_blank" rel="noopener">${r.label}</a>`
        ).join('');

        el.innerHTML = `
            <div class="skill-item-name">${skillName}</div>
            ${linksHtml ? `<div class="skill-item-links">${linksHtml}</div>` : ''}
        `;
        container.appendChild(el);
    });
}

function jobSearchUrls(role, location) {
    const q = encodeURIComponent(role);
    const loc = encodeURIComponent(location || '');
    return {
        linkedin: `https://www.linkedin.com/jobs/search/?keywords=${q}&location=${loc}`,
        indeed: `https://www.indeed.com/jobs?q=${q}&l=${loc}`,
        glassdoor: `https://www.glassdoor.com/Job/jobs.htm?sc.keyword=${q}&locT=C&locKeyword=${loc}`,
        ziprecruiter: `https://www.ziprecruiter.com/candidate/search?search=${q}&location=${loc}`
    };
}

function populateJobBoardLinks(jobTitle, jobLocation, financial) {
    const container = document.getElementById('adjacentRoles');
    container.innerHTML = '';

    if (!jobTitle) {
        container.innerHTML = '<p class="jd-insights-empty">Run an analysis to see live openings for this title.</p>';
        return;
    }

    const fmt = (n) => `$${Math.round(n || 0).toLocaleString()}`;
    const links = jobSearchUrls(jobTitle, jobLocation);

    const boards = [
        { name: 'LinkedIn', url: links.linkedin, icon: '💼' },
        { name: 'Indeed', url: links.indeed, icon: '🔍' },
        { name: 'Glassdoor', url: links.glassdoor, icon: '🏢' },
        { name: 'ZipRecruiter', url: links.ziprecruiter, icon: '⚡' }
    ];

    container.innerHTML = boards.map(board => `
        <a href="${board.url}" target="_blank" rel="noopener" class="job-board-card">
            <span class="job-board-icon">${board.icon}</span>
            <div class="job-board-main">
                <h3>${jobTitle}</h3>
                <p>Open roles on ${board.name}${jobLocation ? ` near ${jobLocation}` : ''}</p>
                <div class="job-board-salary">
                    <span class="job-board-salary-label">Est. Annual Salary</span>
                    <strong class="job-board-salary-value">${fmt(financial?.salaryMidpoint)}</strong>
                </div>
            </div>
            <div class="job-board-range">
                <span class="job-board-range-badge">BLS Range</span>
                <strong class="job-board-range-value">${fmt(financial?.salaryLow)}-${fmt(financial?.salaryHigh)}</strong>
            </div>
        </a>
    `).join('');
}

// ============================================
// CAREER PROGRESSION TIMELINE
// ============================================
// Renders the 5-step ladder-based timeline computed on the backend
// (get_career_timeline) - illustrative industry patterns, not a
// personalized prediction. See analysis_engine.py for the Tech/Finance
// ladder this is based on.

function populateProgressionTimeline(careerTimeline) {
    const container = document.getElementById('progressionTimeline');
    if (!container) return;
    container.innerHTML = '';

    const steps = (careerTimeline && careerTimeline.steps) || [];

    container.innerHTML = steps.map(step => `
        <div class="progression-step">
            <div class="progression-marker"></div>
            <div class="progression-content">
                <div class="progression-label">${step.label}</div>
                <p class="progression-description">${step.description}</p>
            </div>
        </div>
    `).join('');
}

// ============================================
// WHAT-IF SCENARIOS (computed from the real result)
// ============================================

function calculateFV(annualContribution, rate, years) {
    if (annualContribution <= 0 || years <= 0) return 0;
    return annualContribution * (((1 + rate) ** years - 1) / rate);
}

function populateScenarios(data, formData) {
    const financial = data.financialImpact || {};
    const afterTax = financial.afterTaxIncome || 0;
    const expenses = financial.adjustedAnnualExpenses || 0;
    const investable = financial.annualInvestableIncome || 0;
    const totalTax = financial.totalTax || 0;
    const salary = financial.salaryMidpoint || 0;
    const investPct = parseFloat(formData?.investmentPercent) || 20;
    const RATE = 0.07;
    const fmt = (n) => `$${Math.round(n || 0).toLocaleString()}`;

    // 1. Reduce Expenses 20%
    const expenseReduction = expenses * 0.2;
    const newExpenses = expenses - expenseReduction;
    const newInvestableExp = investable + expenseReduction * (investPct / 100);
    const newValueExp = calculateFV(newInvestableExp, RATE, 20);
    document.getElementById('scenario-expenses').innerHTML = `
        <h4>💰 Reduce Expenses by 20%</h4>
        <div class="scenario-content">
            <p><strong>Current Annual Expenses:</strong> ${fmt(expenses)}</p>
            <p><strong>New Annual Expenses:</strong> ${fmt(newExpenses)}</p>
            <p><strong>Extra Annual Investable Income:</strong> ${fmt(newInvestableExp - investable)}</p>
            <p><strong>New 20-Year Investment Value:</strong> ${fmt(newValueExp)} (vs. ${fmt(financial.investmentProjection20yr)} today)</p>
            <p style="color: var(--accent-green); font-weight: bold; margin-top: 10px;">✓ Small lifestyle changes compound into real wealth over 20 years.</p>
        </div>
    `;

    // 2. Invest 10% more of investable income
    const newPct = Math.min(100, investPct + 10);
    const newInvestableInv = (afterTax - expenses) * (newPct / 100);
    const newValueInv = calculateFV(newInvestableInv, RATE, 20);
    document.getElementById('scenario-invest').innerHTML = `
        <h4>📈 Invest ${newPct}% Instead of ${investPct}%</h4>
        <div class="scenario-content">
            <p><strong>Current Annual Investment (${investPct}%):</strong> ${fmt(investable)}/year</p>
            <p><strong>New Annual Investment (${newPct}%):</strong> ${fmt(newInvestableInv)}/year</p>
            <p><strong>Current 20-Year Value:</strong> ${fmt(financial.investmentProjection20yr)}</p>
            <p><strong>New 20-Year Value:</strong> ${fmt(newValueInv)}</p>
            <p style="color: var(--accent-green); font-weight: bold; margin-top: 10px;">✓ ${fmt(newValueInv - (financial.investmentProjection20yr || 0))} more over 20 years just by upping your investment rate.</p>
        </div>
    `;

    // 3. Switch to remote (illustrative estimate - commuting/relocation savings
    // aren't part of the core analysis, so this is a rough estimate, not a
    // number derived directly from official data sources)
    const estCommuteSavings = 2400;
    const estRelocationSavingsLow = expenses * 0.05;
    const estRelocationSavingsHigh = expenses * 0.12;
    document.getElementById('scenario-remote').innerHTML = `
        <h4>🏠 Switch to Remote Work</h4>
        <div class="scenario-content">
            <p>This one is an illustrative estimate rather than a figure from official data — actual savings depend heavily on your specific commute and location.</p>
            <p><strong>Typical commuting cost saved:</strong> ~${fmt(estCommuteSavings)}/year</p>
            <p><strong>Potential cost-of-living arbitrage:</strong> ~${fmt(estRelocationSavingsLow)}–${fmt(estRelocationSavingsHigh)}/year if you relocate somewhere cheaper</p>
            <p style="color: var(--accent-green); font-weight: bold; margin-top: 10px;">✓ Worth exploring if remote options exist for this role.</p>
        </div>
    `;

    // 4. Career growth path (+15% salary), approximated using the
    // analysis's own effective tax rate rather than re-running the full tax calc
    const effectiveTaxRate = salary > 0 ? totalTax / salary : 0;
    const newSalary = salary * 1.15;
    const additionalAfterTax = (newSalary - salary) * (1 - effectiveTaxRate);
    const newInvestableGrowth = investable + additionalAfterTax * (investPct / 100);
    const newValueGrowth = calculateFV(newInvestableGrowth, RATE, 20);
    document.getElementById('scenario-growth').innerHTML = `
        <h4>📊 Career Growth Path (+15% Raise)</h4>
        <div class="scenario-content">
            <p><strong>Current Salary:</strong> ${fmt(salary)}</p>
            <p><strong>With 15% Raise:</strong> ${fmt(newSalary)}</p>
            <p><strong>Additional After-Tax Income:</strong> ${fmt(additionalAfterTax)}/year (using your current effective tax rate)</p>
            <p><strong>New 20-Year Investment Value:</strong> ${fmt(newValueGrowth)} (vs. ${fmt(financial.investmentProjection20yr)} today)</p>
            <p style="color: var(--accent-green); font-weight: bold; margin-top: 10px;">✓ Career growth + consistent investing compounds fastest.</p>
        </div>
    `;
}

// Wire up hover behavior once (elements are static in the DOM; only their
// content is refreshed by populateScenarios on each analysis).
document.querySelectorAll('.scenario-buttons .btn').forEach(button => {
    const scenarioType = button.getAttribute('data-scenario');
    const detailElement = document.getElementById(`scenario-${scenarioType}`);
    if (!detailElement) return;

    button.addEventListener('mouseover', () => {
        document.querySelectorAll('.scenario-detail').forEach(el => el.classList.add('hidden'));
        detailElement.classList.remove('hidden');
    });
    button.addEventListener('mouseout', () => {
        setTimeout(() => detailElement.classList.add('hidden'), 200);
    });
    // Also support tap-to-toggle on touch devices where hover doesn't apply
    button.addEventListener('click', () => {
        const isHidden = detailElement.classList.contains('hidden');
        document.querySelectorAll('.scenario-detail').forEach(el => el.classList.add('hidden'));
        if (isHidden) detailElement.classList.remove('hidden');
    });
});

document.querySelectorAll('.scenario-detail').forEach(detail => {
    detail.addEventListener('mouseover', function() { this.classList.remove('hidden'); });
    detail.addEventListener('mouseout', function() {
        setTimeout(() => this.classList.add('hidden'), 200);
    });
});

// ============================================
// CHARTS
// ============================================

let scoreChart = null;
let incomeChart = null;
let growthChart = null;

function createCharts(data, formData) {
    createScoreChart(data.scores || {});
    createIncomeChart(data.incomeAllocation || {});
    createGrowthChart(data.financialImpact || {}, formData);
}

function createScoreChart(scores) {
    const ctx = document.getElementById('scoreChart');
    if (!ctx) return;
    if (scoreChart) scoreChart.destroy();

    const labels = ['Salary Growth', 'Market Demand', 'Company Health', 'Automation Safety', 'Cost of Living', 'Tax Efficiency', 'Investment Potential', 'Benefits & Perks'];
    const values = [
        scores.salaryGrowth, scores.marketDemand, scores.companyHealth,
        scores.automationSafety, scores.costOfLiving, scores.taxEfficiency,
        scores.investmentPotential, scores.benefitsScore
    ].map(v => v ?? 0);

    scoreChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Score (0-100)',
                data: values,
                backgroundColor: 'rgba(16, 185, 129, 0.7)',
                borderColor: 'rgba(16, 185, 129, 1)',
                borderWidth: 2,
                borderRadius: 6
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: true,
            plugins: { legend: { display: false } },
            scales: {
                x: { beginAtZero: true, max: 100, ticks: { color: '#cbd5e1' }, grid: { color: 'rgba(255,255,255,0.1)' } },
                y: { ticks: { color: '#cbd5e1' }, grid: { display: false } }
            }
        }
    });
}

function createIncomeChart(allocation) {
    const ctx = document.getElementById('incomeChart');
    if (!ctx) return;
    if (incomeChart) incomeChart.destroy();

    incomeChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Taxes', 'Expenses', 'Debt Payments', 'Investable Income', 'Flexible Income'],
            datasets: [{
                data: [
                    allocation.taxes || 0,
                    allocation.expenses || 0,
                    allocation.debtPayments || 0,
                    allocation.investableIncome || 0,
                    allocation.flexibleIncome || 0
                ],
                backgroundColor: ['#ef4444', '#f59e0b', '#a855f7', '#10b981', '#06b6d4'],
                borderColor: '#1e293b',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { position: 'bottom', labels: { color: '#cbd5e1', padding: 16, font: { size: 12 } } }
            }
        }
    });
}

function createGrowthChart(financial, formData) {
    const ctx = document.getElementById('growthChart');
    if (!ctx) return;
    if (growthChart) growthChart.destroy();

    const initialSavings = parseFloat(formData?.savings) || 0;

    // Total projected wealth = starting savings + the backend's own
    // investment-growth projections at each horizon (so this stays
    // consistent with the "Investment Growth Projections" cards above).
    growthChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Now', '5 Years', '10 Years', '20 Years'],
            datasets: [{
                label: 'Total Projected Wealth (Savings + Investments)',
                data: [
                    initialSavings,
                    initialSavings + (financial.investmentProjection5yr || 0),
                    initialSavings + (financial.investmentProjection10yr || 0),
                    initialSavings + (financial.investmentProjection20yr || 0)
                ],
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.3,
                pointBackgroundColor: '#10b981',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: { legend: { labels: { color: '#cbd5e1' } } },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: '#cbd5e1', callback: (v) => '$' + (v / 1000).toFixed(0) + 'K' },
                    grid: { color: 'rgba(255,255,255,0.1)' }
                },
                x: { ticks: { color: '#cbd5e1' }, grid: { color: 'rgba(255,255,255,0.1)' } }
            }
        }
    });
}

// ============================================
// CHARTS TOGGLE (lazy render - charts are hidden
// by default and only built when the user asks)
// ============================================

let chartsRendered = false;

const showChartsBtn = document.getElementById('showChartsBtn');
if (showChartsBtn) {
    showChartsBtn.addEventListener('click', () => {
        const chartsSection = document.getElementById('chartsSection');
        if (!chartsSection) return;

        const isHidden = chartsSection.classList.contains('hidden');

        if (isHidden) {
            if (!chartsRendered) {
                if (!window.lastChartData) {
                    alert('Run an analysis first to see charts.');
                    return;
                }
                createCharts(window.lastChartData, window.lastChartFormData);
                chartsRendered = true;
            }
            chartsSection.classList.remove('hidden');
            showChartsBtn.innerHTML = 'Hide Charts <span>&uarr;</span>';
            chartsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
            chartsSection.classList.add('hidden');
            showChartsBtn.innerHTML = 'Show Charts <span>&darr;</span>';
        }
    });
}

// ============================================
// COMPARE OPPORTUNITIES
// ============================================

let comparisonList = [];

function renderComparisonGrid() {
    const grid = document.getElementById('comparisonGrid');
    grid.innerHTML = '';

    if (comparisonList.length === 0) {
        grid.innerHTML = '<p class="comparison-empty">No jobs added yet — analyze a role and click above to start comparing.</p>';
        return;
    }

    comparisonList.forEach(entry => {
        const card = document.createElement('div');
        card.className = 'comparison-card';
        card.innerHTML = `
            <h4>${entry.jobTitle}</h4>
            <p>${entry.company}</p>
            <div class="comparison-stat"><span>Overall Score</span><strong>${entry.overallScore}/100</strong></div>
            <div class="comparison-stat"><span>Annual Salary</span><strong>$${entry.salary.toLocaleString()}</strong></div>
            <div class="comparison-stat"><span>Total Tax</span><strong>$${entry.totalTax.toLocaleString()}</strong></div>
            <div class="comparison-stat"><span>Annual Investable</span><strong>$${entry.investable.toLocaleString()}</strong></div>
            <div class="comparison-stat"><span>20-Year Projection</span><strong>$${entry.projection20yr.toLocaleString()}</strong></div>
            <button type="button" class="btn btn-secondary btn-sm" data-remove-id="${entry.id}">Remove</button>
        `;
        grid.appendChild(card);
    });

    grid.querySelectorAll('[data-remove-id]').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-remove-id');
            comparisonList = comparisonList.filter(e => String(e.id) !== id);
            renderComparisonGrid();
        });
    });
}

const addComparisonBtn = document.getElementById('addComparisonBtn');
if (addComparisonBtn) {
    addComparisonBtn.addEventListener('click', () => {
        const result = window.lastAnalysisResult;
        if (!result) {
            alert('Run an analysis first, then add it to the comparison.');
            return;
        }
        const jobInfo = result.jobInfo || {};
        const scores = result.scores || {};
        const financial = result.financialImpact || {};

        comparisonList.push({
            id: Date.now(),
            jobTitle: jobInfo.jobTitle || 'Untitled Role',
            company: jobInfo.companyName || 'Unknown Company',
            overallScore: Math.round(scores.overallScore || 0),
            salary: Math.round(financial.salaryMidpoint || 0),
            totalTax: Math.round(financial.totalTax || 0),
            investable: Math.round(financial.annualInvestableIncome || 0),
            projection20yr: Math.round(financial.investmentProjection20yr || 0)
        });

        renderComparisonGrid();
    });
}

// ============================================
// SAVE / LOAD ANALYSES (browser localStorage —
// stays on this device only, nothing is sent anywhere)
// ============================================

const SAVED_ANALYSES_KEY = 'wealthpath_saved_analyses';

function getSavedAnalyses() {
    try {
        return JSON.parse(localStorage.getItem(SAVED_ANALYSES_KEY)) || [];
    } catch (e) {
        return [];
    }
}

function setSavedAnalyses(list) {
    localStorage.setItem(SAVED_ANALYSES_KEY, JSON.stringify(list));
}

function renderSavedAnalyses() {
    const panel = document.getElementById('savedAnalysesPanel');
    const saved = getSavedAnalyses();

    if (saved.length === 0) {
        panel.innerHTML = '<p class="comparison-empty">No saved analyses yet.</p>';
        return;
    }

    panel.innerHTML = saved.map(entry => `
        <div class="saved-analysis-item">
            <div class="saved-analysis-info">
                <strong>${entry.jobTitle} @ ${entry.company}</strong>
                <span>Saved ${new Date(entry.savedAt).toLocaleString()} · Score: ${entry.overallScore}/100</span>
            </div>
            <div class="saved-analysis-actions">
                <button type="button" class="btn btn-secondary btn-sm" data-load-id="${entry.id}">Load</button>
                <button type="button" class="btn btn-tertiary btn-sm" data-delete-id="${entry.id}">Delete</button>
            </div>
        </div>
    `).join('');

    panel.querySelectorAll('[data-load-id]').forEach(btn => {
        btn.addEventListener('click', () => {
            const entry = getSavedAnalyses().find(e => String(e.id) === btn.getAttribute('data-load-id'));
            if (entry) {
                displayResults(entry.result, entry.formData);
                panel.classList.add('hidden');
                switchTab('results');
            }
        });
    });

    panel.querySelectorAll('[data-delete-id]').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-delete-id');
            const remaining = getSavedAnalyses().filter(e => String(e.id) !== id);
            setSavedAnalyses(remaining);
            renderSavedAnalyses();
        });
    });
}

const saveAnalysisBtn = document.getElementById('saveAnalysisBtn');
if (saveAnalysisBtn) {
    saveAnalysisBtn.addEventListener('click', () => {
        const result = window.lastAnalysisResult;
        const formData = window.lastFormData;
        if (!result) {
            alert('Run an analysis first, then save it.');
            return;
        }
        const jobInfo = result.jobInfo || {};
        const saved = getSavedAnalyses();
        saved.push({
            id: Date.now(),
            savedAt: new Date().toISOString(),
            jobTitle: jobInfo.jobTitle || 'Untitled Role',
            company: jobInfo.companyName || 'Unknown Company',
            overallScore: Math.round((result.scores || {}).overallScore || 0),
            result,
            formData
        });
        setSavedAnalyses(saved);
        alert('Analysis saved on this device.');
    });
}

const viewSavedBtn = document.getElementById('viewSavedBtn');
if (viewSavedBtn) {
    viewSavedBtn.addEventListener('click', () => {
        const panel = document.getElementById('savedAnalysesPanel');
        const isHidden = panel.classList.contains('hidden');
        if (isHidden) {
            renderSavedAnalyses();
            panel.classList.remove('hidden');
        } else {
            panel.classList.add('hidden');
        }
    });
}

// ============================================
// EXPORT REPORT
// ============================================

function generateReportText(result) {
    const jobInfo = result.jobInfo || {};
    const scores = result.scores || {};
    const financial = result.financialImpact || {};
    const recommendation = result.recommendation || {};
    const fmt = (n) => `$${Math.round(n || 0).toLocaleString()}`;

    return `
================================================================================
                     WEALTHPATH AI - CAREER ANALYSIS REPORT
================================================================================

ANALYSIS DATE: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}

================================================================================
JOB OPPORTUNITY
================================================================================

Job Title:              ${jobInfo.jobTitle || ''}
Company:                ${jobInfo.companyName || ''}
Location:               ${jobInfo.jobLocation || ''}
Work Type:              ${jobInfo.workType || ''}

================================================================================
RECOMMENDATION
================================================================================

Overall WealthPath Score:  ${Math.round(scores.overallScore || 0)}/100
Recommendation Level:      ${recommendation.level || ''}
${recommendation.description || ''}

================================================================================
DETAILED SCORES (0-100)
================================================================================

Salary Growth Score:        ${Math.round(scores.salaryGrowth || 0)}/100
Market Demand Score:        ${Math.round(scores.marketDemand || 0)}/100
Company Health Score:       ${Math.round(scores.companyHealth || 0)}/100
Automation Safety Score:    ${Math.round(scores.automationSafety || 0)}/100
Cost of Living Score:       ${Math.round(scores.costOfLiving || 0)}/100
Tax Efficiency Score:       ${Math.round(scores.taxEfficiency || 0)}/100
Investment Potential Score: ${Math.round(scores.investmentPotential || 0)}/100
Benefits & Perks Score:     ${Math.round(scores.benefitsScore || 0)}/100

================================================================================
FINANCIAL PROJECTIONS
================================================================================

Estimated Salary Range:        ${financial.salaryRange || ''}
Estimated Annual Salary:       ${fmt(financial.salaryMidpoint)}
Federal Tax (Estimated):       ${fmt(financial.federalTax)}
State Tax (Estimated):         ${fmt(financial.stateTax)}
Local Tax (Estimated):         ${fmt(financial.localTax)}
After-Tax Income:              ${fmt(financial.afterTaxIncome)}
Adjusted Annual Expenses:      ${fmt(financial.adjustedAnnualExpenses)}
Est. Monthly Debt Payment:     ${fmt(financial.monthlyDebtPayment)}
Annual Investable Income:      ${fmt(financial.annualInvestableIncome)}
Flexible Income (After All):   ${fmt(financial.flexibleIncome)}

================================================================================
INVESTMENT PROJECTIONS (7% Annual Return)
================================================================================

5-Year Value:          ${fmt(financial.investmentProjection5yr)}
10-Year Value:         ${fmt(financial.investmentProjection10yr)}
20-Year Value:         ${fmt(financial.investmentProjection20yr)}

================================================================================
JOB DESCRIPTION INSIGHTS
================================================================================

${result.jobDescriptionInsights && result.jobDescriptionInsights.hasDescription
    ? [
        result.jobDescriptionInsights.yearsExperienceRequired != null
            ? `Experience Required: ${result.jobDescriptionInsights.yearsExperienceRequired}+ years`
            : null,
        `Skills Detected: ${(result.jobDescriptionInsights.detectedSkills || []).join(', ') || 'None detected'}`,
        `Benefits Mentioned: ${(result.jobDescriptionInsights.benefitsDetected || []).join(', ') || 'None detected'}`
      ].filter(Boolean).join('\n')
    : 'No job description was provided for this analysis.'}

================================================================================
KEY INSIGHTS
================================================================================

${result.aiSummary || ''}

================================================================================
RISK ASSESSMENT
================================================================================

${(result.riskFlags && result.riskFlags.length > 0)
    ? result.riskFlags.map(flag => `[${(flag.severity || '').toUpperCase()}] ${flag.flag}\n${flag.description}`).join('\n\n')
    : 'No significant risk flags identified.'}

================================================================================
RECOMMENDED SKILLS TO DEVELOP
================================================================================

${(result.skillSuggestions || []).map((item, i) => `${i + 1}. ${typeof item === 'string' ? item : item.skill}`).join('\n')}

================================================================================
CAREER PROGRESSION TIMELINE
================================================================================

${((result.careerTimeline && result.careerTimeline.steps) || []).map(s => `${s.label}: ${s.description}`).join('\n')}

================================================================================
DISCLAIMER
================================================================================

This is an educational estimate for demo purposes and should NOT be treated as
financial, tax, investment, or career advice. All projections are based on
simplified calculations and should be verified against current data.

Consult with:
- Financial advisors for investment and tax planning
- Career counselors for career decisions
- Tax professionals for accurate tax estimates

================================================================================
Generated by WealthPath AI - Career ROI Analysis Tool
================================================================================
    `.trim();
}

function downloadFile(content, filename) {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
}

// ============================================
// PDF REPORT
// ============================================

function generateReportPDF(result) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'pt', format: 'letter' });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginX = 48;
    const contentWidth = pageWidth - marginX * 2;
    let y = 56;

    const NAVY = [7, 23, 53];
    const BLUE = [20, 103, 255];
    const MUTED = [100, 116, 139];
    const GREEN = [16, 152, 90];
    const BORDER = [220, 231, 245];

    const fmt = (n) => `$${Math.round(n || 0).toLocaleString()}`;

    function ensureSpace(height) {
        if (y + height > pageHeight - 56) {
            doc.addPage();
            y = 56;
        }
    }

    function sectionHeader(title) {
        ensureSpace(34);
        doc.setFillColor(...BLUE);
        doc.rect(marginX, y - 11, 4, 16, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(...NAVY);
        doc.text(title, marginX + 12, y);
        y += 22;
    }

    function keyValueRow(label, value) {
        ensureSpace(18);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(...MUTED);
        doc.text(label, marginX, y);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...NAVY);
        doc.text(String(value), pageWidth - marginX, y, { align: 'right' });
        y += 16;
    }

    function paragraph(text, opts = {}) {
        if (!text) return;
        doc.setFont('helvetica', opts.bold ? 'bold' : 'normal');
        doc.setFontSize(opts.size || 10);
        doc.setTextColor(...(opts.color || NAVY));
        const lines = doc.splitTextToSize(text, contentWidth);
        lines.forEach(line => {
            ensureSpace(14);
            doc.text(line, marginX, y);
            y += 14;
        });
    }

    function spacer(height = 12) {
        y += height;
    }

    function divider() {
        ensureSpace(14);
        doc.setDrawColor(...BORDER);
        doc.line(marginX, y, pageWidth - marginX, y);
        y += 18;
    }

    const jobInfo = result.jobInfo || {};
    const scores = result.scores || {};
    const financial = result.financialImpact || {};
    const recommendation = result.recommendation || {};

    // ---- Title ----
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(19);
    doc.setTextColor(...NAVY);
    doc.text('Pinnacle Financial', marginX, y);
    y += 20;
    doc.setFontSize(12);
    doc.setTextColor(...BLUE);
    doc.text('Career Wealth Analysis Report', marginX, y);
    y += 14;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    doc.text(
        `Generated ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
        marginX, y
    );
    y += 24;
    divider();

    // ---- Job Opportunity ----
    sectionHeader('Job Opportunity');
    keyValueRow('Job Title', jobInfo.jobTitle || '—');
    keyValueRow('Company', jobInfo.companyName || '—');
    keyValueRow('Location', jobInfo.jobLocation || '—');
    keyValueRow('Work Type', jobInfo.workType || '—');
    spacer();

    // ---- Recommendation ----
    sectionHeader('Recommendation');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(26);
    doc.setTextColor(...GREEN);
    doc.text(`${Math.round(scores.overallScore || 0)}/100`, marginX, y + 6);
    doc.setFontSize(12);
    doc.setTextColor(...NAVY);
    doc.text(recommendation.level || '', marginX + 90, y);
    y += 24;
    paragraph(recommendation.description || '', { color: MUTED });
    spacer();

    // ---- Detailed Scores ----
    sectionHeader('Detailed Scores (0-100)');
    keyValueRow('Salary Growth', Math.round(scores.salaryGrowth || 0));
    keyValueRow('Market Demand', Math.round(scores.marketDemand || 0));
    keyValueRow('Company Health', Math.round(scores.companyHealth || 0));
    keyValueRow('Automation Safety', Math.round(scores.automationSafety || 0));
    keyValueRow('Cost of Living', Math.round(scores.costOfLiving || 0));
    keyValueRow('Tax Efficiency', Math.round(scores.taxEfficiency || 0));
    keyValueRow('Investment Potential', Math.round(scores.investmentPotential || 0));
    keyValueRow('Benefits & Perks', Math.round(scores.benefitsScore || 0));
    spacer();

    // ---- Financial Projections ----
    sectionHeader('Financial Projections');
    keyValueRow('Estimated Salary Range', financial.salaryRange || '—');
    keyValueRow('Estimated Annual Salary', fmt(financial.salaryMidpoint));
    keyValueRow('Federal Tax (Est.)', fmt(financial.federalTax));
    keyValueRow('State Tax (Est.)', fmt(financial.stateTax));
    keyValueRow('Local Tax (Est.)', fmt(financial.localTax));
    keyValueRow('After-Tax Income', fmt(financial.afterTaxIncome));
    keyValueRow('Adjusted Annual Expenses', fmt(financial.adjustedAnnualExpenses));
    keyValueRow('Est. Monthly Debt Payment', fmt(financial.monthlyDebtPayment));
    keyValueRow('Annual Investable Income', fmt(financial.annualInvestableIncome));
    keyValueRow('Flexible Income', fmt(financial.flexibleIncome));
    spacer();

    // ---- Investment Projections ----
    sectionHeader('Investment Projections (7% Annual Return)');
    keyValueRow('5-Year Value', fmt(financial.investmentProjection5yr));
    keyValueRow('10-Year Value', fmt(financial.investmentProjection10yr));
    keyValueRow('20-Year Value', fmt(financial.investmentProjection20yr));
    spacer();

    // ---- Job Description Insights ----
    sectionHeader('Job Description Insights');
    const jdInsights = result.jobDescriptionInsights || {};
    if (jdInsights.hasDescription) {
        if (jdInsights.yearsExperienceRequired != null) {
            keyValueRow('Experience Required', `${jdInsights.yearsExperienceRequired}+ years`);
        }
        paragraph(`Skills Detected: ${(jdInsights.detectedSkills || []).join(', ') || 'None detected'}`);
        paragraph(`Benefits Mentioned: ${(jdInsights.benefitsDetected || []).join(', ') || 'None detected'}`);
    } else {
        paragraph('No job description was provided for this analysis.', { color: MUTED });
    }
    spacer();

    // ---- Key Insights ----
    sectionHeader('Key Insights');
    paragraph(result.aiSummary || '—');
    spacer();

    // ---- Risk Assessment ----
    sectionHeader('Risk Assessment');
    if (result.riskFlags && result.riskFlags.length > 0) {
        result.riskFlags.forEach(flag => {
            paragraph(`[${(flag.severity || '').toUpperCase()}] ${flag.flag}`, { bold: true, size: 10 });
            paragraph(flag.description || '', { color: MUTED });
            spacer(6);
        });
    } else {
        paragraph('No significant risk flags identified.', { color: MUTED });
    }
    spacer();

    // ---- Recommended Skills ----
    sectionHeader('Recommended Skills to Develop');
    (result.skillSuggestions || []).forEach((item, i) => {
        paragraph(`${i + 1}. ${typeof item === 'string' ? item : item.skill}`);
    });
    spacer();

    // ---- Where to Find This Role ----
    sectionHeader('Where to Find This Role');
    paragraph(`Live "${jobInfo.jobTitle || 'this role'}" openings at other companies:`, { color: MUTED });
    spacer(4);
    if (jobInfo.jobTitle) {
        const boardLinks = jobSearchUrls(jobInfo.jobTitle, jobInfo.jobLocation);
        const boards = [
            { name: 'LinkedIn', url: boardLinks.linkedin },
            { name: 'Indeed', url: boardLinks.indeed },
            { name: 'Glassdoor', url: boardLinks.glassdoor },
            { name: 'ZipRecruiter', url: boardLinks.ziprecruiter }
        ];
        boards.forEach(board => {
            ensureSpace(14);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.setTextColor(...BLUE);
            doc.textWithLink(`${board.name} ->`, marginX, y, { url: board.url });
            y += 14;
        });
    }
    spacer();

    // ---- Disclaimer ----
    divider();
    paragraph(
        'This is an educational estimate for demo purposes and should NOT be treated as financial, ' +
        'tax, investment, or career advice. All projections are based on simplified calculations and ' +
        'should be verified against current data. Consult a financial advisor for investment and tax ' +
        'planning, a career counselor for career decisions, and a tax professional for accurate tax estimates.',
        { size: 8.5, color: MUTED }
    );
    spacer(6);
    paragraph('Generated by Pinnacle Financial - Career ROI Analysis Tool', { size: 8.5, color: MUTED });

    doc.save('pinnacle-financial-analysis.pdf');
}

const exportBtn = document.getElementById('exportBtn');
if (exportBtn) {
    exportBtn.addEventListener('click', () => {
        const result = window.lastAnalysisResult;
        if (!result) {
            alert('No analysis to export. Please run an analysis first.');
            return;
        }
        if (!window.jspdf || !window.jspdf.jsPDF) {
            console.error('[export] jsPDF library not found on window.jspdf - check that the jsPDF <script> tag is present in index.html and loads before script_tabs.js.');
            alert('PDF export isn\'t available right now (the PDF library didn\'t load). Please refresh the page and try again.');
            return;
        }
        try {
            generateReportPDF(result);
        } catch (err) {
            console.error('[export] Failed to generate PDF:', err);
            alert('Something went wrong generating the PDF. Check the browser console for details.');
        }
    });
}

// ============================================
// NEW ANALYSIS
// ============================================

const newAnalysisBtn = document.getElementById('newAnalysisBtn');
if (newAnalysisBtn) {
    newAnalysisBtn.addEventListener('click', () => {
        if (analysisForm) analysisForm.reset();
        if (investmentDisplay && investmentSlider) investmentDisplay.textContent = investmentSlider.value + '%';
        if (jobDescCounter) jobDescCounter.textContent = '0/2000';
        switchTab('analyze');
    });
}

// ============================================
// JOB DESCRIPTION CHARACTER COUNTER
// ============================================

const jobDescriptionField = document.getElementById('jobDescription');
const jobDescCounter = document.getElementById('jobDescCounter');
if (jobDescriptionField && jobDescCounter) {
    jobDescriptionField.addEventListener('input', () => {
        jobDescCounter.textContent = `${jobDescriptionField.value.length}/2000`;
    });
}

// ============================================
// INITIALIZATION
// ============================================

console.log('WealthPath AI Tabbed Interface Loaded');