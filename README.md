# Pinnacle Financial

A Flask-based web application for personal financial analysis and planning. The app is organized into a tabbed single-page interface covering financial input, analysis, results, and scenario simulation.

## Features

- **Home** — Landing/overview tab introducing the app.
- **Analyze** — Input and configuration tab for entering financial data to be analyzed.
- **Results** — Displays analysis output, likely including charts (via Chart.js) and exportable reports (via jsPDF).
- **Simulation ("Money Moves")** — Scenario/what-if simulation tab for modeling financial decisions.
- **About** — Information about the app and its creator.

## Tech Stack

- **Backend:** Python (Flask) — serves templates via `render_template` and `url_for`, using Jinja2 includes for modular tab content.
- **Frontend:**
  - HTML5 with a tab-based single-page navigation pattern (tab switching handled client-side via `script_tabs.js`).
  - [Chart.js 3.9.1](https://www.chartjs.org/) for data visualization.
  - [jsPDF 2.5.1](https://github.com/parallax/jsPDF) for generating PDF exports in the browser.
  - Google Fonts: **Inter** and **Sora**.
- **Styling:** Modular CSS per section:
  - `styles_tabs.css` — shared tab navigation styles
  - `home_light.css` — Home tab
  - `analyze_light.css` — Analyze tab
  - `results_light.css` — Results tab
  - `about_light.css` — About tab

## Project Structure

```
web/
├── templates/
│   ├── index.html            # Main layout, nav, and tab containers
│   └── tabs/
│       ├── _home.html
│       ├── _analyze.html
│       ├── _results.html
│       ├── _money_moves.html
│       └── _about.html
└── static/
    ├── logo.png
    ├── styles_tabs.css
    ├── home_light.css
    ├── analyze_light.css
    ├── results_light.css
    ├── about_light.css
    └── script_tabs.js
```



## Getting Started

These are typical steps for a Flask app structured this way; adjust as needed for your actual `app.py` / entry point.
1. **Clone the repository**
   ```bash
   git clone https://github.com/gdinta/<repo-name>.git
   cd <repo-name>
   ```

2. **Create a virtual environment and install dependencies**
   ```bash
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Run the app**
   ```bash
   flask run
   # or
   python app.py
   ```

4. **Open in browser**
   Navigate to `http://localhost:5000`.

## Usage

1. Start on the **Home** tab for an overview.
2. Go to **Analyze** and enter your financial details.
3. View computed output on the **Results** tab, with charts and a PDF export option.
4. Use the **Simulation** tab to model different financial "money moves" and compare outcomes.
5. Visit **About** for more information on the project.

## Credits

Built by **Godasrita** ([@gdinta](https://github.com/gdinta) on GitHub).


