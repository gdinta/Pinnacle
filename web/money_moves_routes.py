"""
Flask routes for Money Moves simulator
Add these to your web/app.py
"""

from flask import request, jsonify, render_template, session
from money_moves_engine import MoneyMovesSimulator
import uuid

# ============================================
# MONEY MOVES ROUTES
# ============================================

@app.route('/money-moves')
def money_moves():
    """Render Money Moves page"""
    return render_template('money_moves.html')

@app.route('/api/money-moves/start', methods=['POST'])
def money_moves_start():
    """Initialize a new Money Moves simulation"""
    data = request.json
    
    # Create simulator
    simulator = MoneyMovesSimulator(
        age=int(data.get('age', 28)),
        salary=int(data.get('salary', 80000)),
        monthly_expenses=int(data.get('monthly_expenses', 2500)),
        savings=int(data.get('savings', 10000)),
        debt=int(data.get('debt', 0)),
        investment_percent=int(data.get('investment_percent', 15))
    )
    
    # Store in session
    simulation_id = str(uuid.uuid4())
    session[f'simulator_{simulation_id}'] = simulator
    
    # Get first decision
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
            'options': [
                {
                    'index': i,
                    'name': opt['name'],
                    'description': opt['description']
                }
                for i, opt in enumerate(first_decision.options)
            ]
        }
    })

@app.route('/api/money-moves/decide', methods=['POST'])
def money_moves_decide():
    """Process a decision and advance to next"""
    data = request.json
    simulation_id = data.get('simulation_id')
    decision_index = int(data.get('decision_index', 0))
    option_index = int(data.get('option_index', 0))
    
    # Get simulator from session
    simulator = session.get(f'simulator_{simulation_id}')
    if not simulator:
        return jsonify({'error': 'Simulation not found'}), 404
    
    # Make decision
    simulator.make_decision(decision_index, option_index)
    
    # Get next decision
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
            'options': [
                {
                    'index': i,
                    'name': opt['name'],
                    'description': opt['description']
                }
                for i, opt in enumerate(next_decision.options)
            ]
        }
    
    # Store updated simulator
    session[f'simulator_{simulation_id}'] = simulator
    
    return jsonify(response)

@app.route('/api/money-moves/complete', methods=['POST'])
def money_moves_complete():
    """Get final report"""
    data = request.json
    simulation_id = data.get('simulation_id')
    
    simulator = session.get(f'simulator_{simulation_id}')
    if not simulator:
        return jsonify({'error': 'Simulation not found'}), 404
    
    report = simulator.generate_report()
    
    return jsonify({
        'simulation_id': simulation_id,
        'report': report
    })

@app.route('/api/money-moves/compare', methods=['POST'])
def money_moves_compare():
    """Compare two simulation scenarios"""
    data = request.json
    scenario_a_id = data.get('scenario_a_id')
    scenario_b_id = data.get('scenario_b_id')
    
    sim_a = session.get(f'simulator_{scenario_a_id}')
    sim_b = session.get(f'simulator_{scenario_b_id}')
    
    if not sim_a or not sim_b:
        return jsonify({'error': 'One or both simulations not found'}), 404
    
    report_a = sim_a.generate_report()
    report_b = sim_b.generate_report()
    
    return jsonify({
        'scenario_a': {
            'net_worth': report_a['ending_net_worth'],
            'debt': report_a['ending_debt'],
            'retirement_age': report_a['ending_retirement_age'],
            'health_score': report_a['ending_health_score'],
            'investment_growth': report_a['investment_growth']
        },
        'scenario_b': {
            'net_worth': report_b['ending_net_worth'],
            'debt': report_b['ending_debt'],
            'retirement_age': report_b['ending_retirement_age'],
            'health_score': report_b['ending_health_score'],
            'investment_growth': report_b['investment_growth']
        },
        'deltas': {
            'net_worth_diff': report_b['ending_net_worth'] - report_a['ending_net_worth'],
            'retirement_age_diff': report_a['ending_retirement_age'] - report_b['ending_retirement_age'],
            'debt_diff': report_a['ending_debt'] - report_b['ending_debt']
        }
    })
