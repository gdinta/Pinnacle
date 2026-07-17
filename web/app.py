# app.py - Pinnacle Financial
# Updated to serve React Money Moves app from build folder

import os
from flask import Flask, render_template, request, jsonify, send_from_directory
from analysis_engine import analyze_job
from real_data import get_all_real_data
from money_moves_engine import MoneyMovesSimulator
import uuid

# ============================================
# FLASK APP SETUP
# ============================================

app = Flask(__name__)
app.secret_key = 'pinnacle-financial-secret-key'

# ============================================
# MAIN ROUTES
# ============================================

@app.route('/')
def index():
    """Serve the main Pinnacle page"""
    return render_template('index.html')


@app.route('/analyze', methods=['POST'])
def analyze():
    """Analyze a job using real FREE data"""
    try:
        data = request.get_json()
        result = analyze_job(data)
        return jsonify(result)
    except Exception as e:
        print(f"Error during analysis: {e}")
        return jsonify({'error': str(e)}), 400


@app.route('/sample-job')
def sample_job():
    """Return sample job data for testing"""
    sample = {
        'jobTitle': 'Identity and Access Management Analyst',
        'company': 'Microsoft',
        'location': 'Philadelphia, PA',
        'workType': 'Hybrid',
        'jobDescription': 'We are seeking an Identity and Access Management (IAM) Analyst to join our security team.',
        'age': '28',
        'offerSalary': '85000',
        'expenses': '2800',
        'savings': '6000',
        'loans': '25000',
        'investmentPercent': '20',
        'currentLocation': 'Malvern, PA'
    }
    return jsonify(sample)


@app.route('/health')
def health():
    """Health check endpoint"""
    return jsonify({'status': 'healthy'})


@app.route('/test-data')
def test_data():
    """Test endpoint"""
    try:
        real_data = get_all_real_data(
            job_title='Software Developer',
            company_name='Microsoft',
            location='Philadelphia, PA',
            state_code='PA'
        )
        return jsonify({'status': 'success', 'data': real_data})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500


# ============================================
# MONEY MOVES ROUTES
# ============================================

money_moves_simulators = {}


@app.route('/money-moves')
def money_moves():
    """Serve React Money Moves app from build folder"""
    build_index = os.path.join('money-moves-app', 'build', 'index.html')
    if os.path.exists(build_index):
        return send_from_directory(os.path.join('money-moves-app', 'build'), 'index.html')
    return jsonify({'error': 'Money Moves build not found'}), 500


@app.route('/money-moves/<path:subpath>')
def serve_money_moves_assets(subpath):
    """Serve Money Moves static files from React build"""
    build_path = os.path.join('money-moves-app', 'build', subpath)
    if os.path.exists(build_path):
        return send_from_directory(os.path.join('money-moves-app', 'build'), subpath)
    return send_from_directory(os.path.join('money-moves-app', 'build'), 'index.html')


@app.route('/api/money-moves/start', methods=['POST'])
def money_moves_start():
    """Initialize a new Money Moves simulation"""
    try:
        data = request.json
        simulator = MoneyMovesSimulator(
            age=int(data.get('age', 28)),
            salary=int(data.get('salary', 80000)),
            monthly_expenses=int(data.get('monthly_expenses', 2500)),
            savings=int(data.get('savings', 10000)),
            debt=int(data.get('debt', 0)),
            investment_percent=int(data.get('investment_percent', 15))
        )
        simulation_id = str(uuid.uuid4())
        money_moves_simulators[simulation_id] = simulator
        decisions = simulator.get_decisions()
        first_decision = decisions[0]
        return jsonify({
            'simulation_id': simulation_id,
            'status': 'started',
            'current_decision': 1,
            'total_decisions': len(decisions),
            'initial_state': simulator.get_current_status(),
            'decision': {
                'index': 0,
                'title': first_decision.title,
                'description': first_decision.description,
                'options': [{'index': i, 'name': opt['name'], 'description': opt['description']} for i, opt in enumerate(first_decision.options)]
            }
        })
    except Exception as e:
        print(f"Error starting Money Moves: {e}")
        return jsonify({'error': str(e)}), 400


@app.route('/api/money-moves/decide', methods=['POST'])
def money_moves_decide():
    """Process a decision and advance to next"""
    try:
        data = request.json
        simulation_id = data.get('simulation_id')
        decision_index = int(data.get('decision_index', 0))
        option_index = int(data.get('option_index', 0))
        simulator = money_moves_simulators.get(simulation_id)
        if not simulator:
            return jsonify({'error': 'Simulation not found'}), 404
        simulator.make_decision(decision_index, option_index)
        decisions = simulator.get_decisions()
        current_index = simulator.current_decision_index
        is_complete = current_index >= len(decisions)
        response = {
            'simulation_id': simulation_id,
            'current_decision': current_index + 1,
            'total_decisions': len(decisions),
            'status': 'complete' if is_complete else 'in_progress',
            'current_state': simulator.get_current_status(),
            'decision_made': {
                'decision': decisions[decision_index].title,
                'option': decisions[decision_index].options[option_index]['name']
            }
        }
        if not is_complete and current_index < len(decisions):
            next_decision = decisions[current_index]
            response['next_decision'] = {
                'index': current_index,
                'title': next_decision.title,
                'description': next_decision.description,
                'options': [{'index': i, 'name': opt['name'], 'description': opt['description']} for i, opt in enumerate(next_decision.options)]
            }
        return jsonify(response)
    except Exception as e:
        print(f"Error processing decision: {e}")
        return jsonify({'error': str(e)}), 400


@app.route('/api/money-moves/complete', methods=['POST'])
def money_moves_complete():
    """Get final report"""
    try:
        data = request.json
        simulation_id = data.get('simulation_id')
        simulator = money_moves_simulators.get(simulation_id)
        if not simulator:
            return jsonify({'error': 'Simulation not found'}), 404
        report = simulator.generate_report()
        return jsonify({'simulation_id': simulation_id, 'report': report})
    except Exception as e:
        print(f"Error generating report: {e}")
        return jsonify({'error': str(e)}), 400


# ============================================
# STATIC FILE ROUTES
# ============================================

@app.route('/static/css/<filename>')
def serve_css(filename):
    """Serve CSS - React build first, then Pinnacle"""
    react_path = os.path.join('money-moves-app', 'build', 'static', 'css', filename)
    if os.path.exists(react_path):
        return send_from_directory(os.path.join('money-moves-app', 'build', 'static', 'css'), filename)
    main_path = os.path.join('static', filename)
    if os.path.exists(main_path):
        return send_from_directory('static', filename)
    return jsonify({'error': 'CSS not found'}), 404


@app.route('/static/js/<filename>')
def serve_js(filename):
    """Serve JS - React build first, then Pinnacle"""
    react_path = os.path.join('money-moves-app', 'build', 'static', 'js', filename)
    if os.path.exists(react_path):
        return send_from_directory(os.path.join('money-moves-app', 'build', 'static', 'js'), filename)
    main_path = os.path.join('static', filename)
    if os.path.exists(main_path):
        return send_from_directory('static', filename)
    return jsonify({'error': 'JS not found'}), 404


@app.route('/static/<path:filepath>')
def serve_static(filepath):
    """Serve other static files - Pinnacle first"""
    main_path = os.path.join('static', filepath)
    if os.path.exists(main_path):
        return send_from_directory('static', filepath)
    react_path = os.path.join('money-moves-app', 'build', 'static', filepath)
    if os.path.exists(react_path):
        return send_from_directory(os.path.join('money-moves-app', 'build', 'static'), filepath)
    return jsonify({'error': 'File not found'}), 404


@app.route('/manifest.json')
def serve_manifest():
    """Serve manifest.json"""
    path = os.path.join('money-moves-app', 'build', 'manifest.json')
    if os.path.exists(path):
        return send_from_directory(os.path.join('money-moves-app', 'build'), 'manifest.json')
    return jsonify({'error': 'Manifest not found'}), 404


@app.route('/logo192.png')
@app.route('/logo512.png')
def serve_logo(filename=None):
    """Serve logo files"""
    fname = filename or 'logo192.png'
    path = os.path.join('money-moves-app', 'build', fname)
    if os.path.exists(path):
        return send_from_directory(os.path.join('money-moves-app', 'build'), fname)
    return jsonify({'error': 'Logo not found'}), 404

@app.route('/characters/<path:filename>')
def serve_characters(filename):
    """Serve Money Moves character art from the React build"""
    path = os.path.join('money-moves-app', 'build', 'characters', filename)
    if os.path.exists(path):
        return send_from_directory(os.path.join('money-moves-app', 'build', 'characters'), filename)
    return jsonify({'error': 'Character asset not found'}), 404

# ============================================
# ERROR HANDLING
# ============================================

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404


@app.errorhandler(500)
def server_error(error):
    return jsonify({'error': 'Server error'}), 500


# ============================================
# MAIN
# ============================================

if __name__ == '__main__':
    print("\n" + "="*60)
    print(" Pinnacle Financial - Career ROI Analysis")
    print("="*60)
    print(" Features:")
    print("   ✓ Job Analysis with real salary data (BLS)")
    print("   ✓ Money Moves simulator with avatar customization")
    print("   ✓ 5 financial decision scenarios")
    print("   ✓ Real investment compounding calculations")
    print("="*60)
    print("\n Starting server at http://127.0.0.1:5000")
    print(" Money Moves: http://127.0.0.1:5000/money-moves")
    print(" Test data: http://127.0.0.1:5000/test-data")
    print("="*60 + "\n")
    app.run(host='0.0.0.0', debug=True, port=5000)