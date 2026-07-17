"""
Money Moves - Financial Decision Simulator Engine
Production-ready financial decision simulator with realistic calculations
"""

import json
from typing import Dict, List, Any
from real_data import get_federal_tax_2024, get_state_tax_2024, get_payroll_tax

class FinancialState:
    """Tracks user's financial state throughout simulation"""
    
    def __init__(self, age: int, salary: int, monthly_expenses: int, 
                 savings: int, debt: int, investment_percent: int):
        self.age = age
        self.salary = salary
        self.monthly_expenses = monthly_expenses
        self.savings = savings
        self.debt = debt
        self.investment_percent = investment_percent
        self.investments = 0  # Separate from savings
        
        # Derived
        self.calculate_annual_state()
    
    def calculate_annual_state(self):
        """Calculate derived financial metrics"""
        # Taxes (using real calculations)
        self.federal_tax = get_federal_tax_2024(self.salary)
        self.state_tax = get_state_tax_2024(self.salary, 'PA')
        self.payroll_tax = get_payroll_tax(self.salary)
        self.total_tax = self.federal_tax + self.state_tax + self.payroll_tax
        
        # Income after tax
        self.after_tax_income = self.salary - self.total_tax
        
        # Annual expenses
        self.annual_expenses = self.monthly_expenses * 12
        
        # Disposable income
        self.disposable = self.after_tax_income - self.annual_expenses
        
        # How much goes to investments
        self.annual_investment = max(0, self.disposable * (self.investment_percent / 100))
        
        # Investment growth (7% historical average)
        self.investments *= 1.07
        self.investments += self.annual_investment
        
        # Net worth
        self.net_worth = self.savings + self.investments - self.debt
        
        # Financial health score (0-100)
        self._calculate_health_score()
    
    def _calculate_health_score(self):
        """Calculate financial health metric"""
        score = 50  # Base
        
        # Emergency fund bonus
        emergency_fund_target = self.monthly_expenses * 6
        if self.savings >= emergency_fund_target:
            score += 20
        elif self.savings >= emergency_fund_target * 0.5:
            score += 10
        
        # Debt ratio
        if self.debt == 0:
            score += 15
        elif self.debt < self.salary:
            score += 5
        else:
            score -= 10
        
        # Investment ratio
        if self.investment_percent >= 20:
            score += 10
        elif self.investment_percent >= 10:
            score += 5
        
        # Cap score
        self.health_score = min(100, max(0, score))
    
    def estimate_retirement_age(self):
        retirement_need = self.annual_expenses * 25
        if self.net_worth >= retirement_need:
            return self.age
        annual_growth = self.annual_investment * 1.07 + (self.disposable * 0.07)
        if annual_growth <= 0:
            return min(100, self.age + 50)  # Max reasonable age
        years_to_retirement = (retirement_need - self.net_worth) / annual_growth
        estimated_age = int(self.age + years_to_retirement)
        return min(85, max(self.age, estimated_age))  # Between current age and 85
    
    def to_dict(self):
        """Convert state to JSON-serializable dict"""
        return {
            'age': self.age,
            'salary': self.salary,
            'after_tax_income': int(self.after_tax_income),
            'monthly_expenses': self.monthly_expenses,
            'annual_expenses': self.annual_expenses,
            'savings': int(self.savings),
            'investments': int(self.investments),
            'debt': int(self.debt),
            'net_worth': int(self.net_worth),
            'investment_percent': self.investment_percent,
            'annual_investment': int(self.annual_investment),
            'disposable': int(self.disposable),
            'health_score': self.health_score,
            'retirement_age': self.estimate_retirement_age(),
            'total_tax': int(self.total_tax)
        }


class DecisionCard:
    """Represents a single financial decision"""
    
    def __init__(self, title: str, description: str, options: List[Dict]):
        self.title = title
        self.description = description
        self.options = options  # [{name: str, impact: callable}, ...]
    
    def apply_option(self, state: FinancialState, option_index: int):
        """Apply the chosen option to financial state"""
        if option_index < len(self.options):
            impact_fn = self.options[option_index]['impact']
            impact_fn(state)


class MoneyMovesSimulator:
    """Main simulator - orchestrates decisions and state"""
    
    def __init__(self, age: int, salary: int, monthly_expenses: int,
                 savings: int, debt: int, investment_percent: int):
        self.initial_state = FinancialState(age, salary, monthly_expenses, 
                                           savings, debt, investment_percent)
        self.current_state = FinancialState(age, salary, monthly_expenses,
                                           savings, debt, investment_percent)
        self.history = [self.current_state.to_dict()]
        self.decisions_made = []
        self.current_decision_index = 0
    
    def get_decisions(self) -> List[Dict]:
        """Return all decision cards"""
        return [
            DecisionCard(
                title="You Got a 15% Raise!",
                description="Congratulations! Your salary increased from ${:,} to ${:,}. What now?".format(
                    int(self.current_state.salary),
                    int(self.current_state.salary * 1.15)
                ),
                options=[
                    {
                        'name': '📈 Increase Investing',
                        'description': 'Boost investment % from {}% to {}%'.format(
                            self.current_state.investment_percent,
                            self.current_state.investment_percent + 10
                        ),
                        'impact': lambda s: (
                            setattr(s, 'salary', s.salary * 1.15),
                            setattr(s, 'investment_percent', min(50, s.investment_percent + 10))
                        )
                    },
                    {
                        'name': '🏠 Upgrade Lifestyle',
                        'description': 'Increase monthly expenses by $500',
                        'impact': lambda s: (
                            setattr(s, 'salary', s.salary * 1.15),
                            setattr(s, 'monthly_expenses', s.monthly_expenses + 500)
                        )
                    },
                    {
                        'name': '💳 Pay Off Debt',
                        'description': 'Use raise to pay down debt by $5,000/year',
                        'impact': lambda s: (
                            setattr(s, 'salary', s.salary * 1.15),
                            setattr(s, 'debt', max(0, s.debt - 5000))
                        )
                    }
                ]
            ),
            DecisionCard(
                title="Market Crash! 📉 Down 25%",
                description="The stock market has dropped 25%. Your investments have fallen too. What do you do?",
                options=[
                    {
                        'name': '😱 Panic Sell',
                        'description': 'Lock in losses, move to cash',
                        'impact': lambda s: (
                            setattr(s, 'investments', s.investments * 0.75),
                            setattr(s, 'savings', s.savings + (s.investments * 0.75)),
                            setattr(s, 'investments', 0)
                        )
                    },
                    {
                        'name': '🧘 Hold Tight',
                        'description': 'Do nothing. Stay invested.',
                        'impact': lambda s: setattr(s, 'investments', s.investments * 0.75)
                    },
                    {
                        'name': '🚀 Buy the Dip',
                        'description': 'Invest MORE during the crash',
                        'impact': lambda s: (
                            setattr(s, 'investments', s.investments * 0.75 + 5000),
                            setattr(s, 'savings', s.savings - 5000)
                        )
                    }
                ]
            ),
            DecisionCard(
                title="401(k) Match Available 💼",
                description="Your employer will match 50% of your 401(k) contributions up to 6% of salary. That's FREE MONEY!",
                options=[
                    {
                        'name': '💰 Full Match (6%)',
                        'description': 'Contribute 6% to get full employer match',
                        'impact': lambda s: (
                            setattr(s, 'investment_percent', s.investment_percent + 6),
                            setattr(s, 'investments', s.investments + (s.salary * 0.06 * 1.5))
                        )
                    },
                    {
                        'name': '🤔 Half Match (3%)',
                        'description': 'Only contribute 3%',
                        'impact': lambda s: (
                            setattr(s, 'investment_percent', s.investment_percent + 3),
                            setattr(s, 'investments', s.investments + (s.salary * 0.03 * 1.5))
                        )
                    },
                    {
                        'name': '❌ Skip It',
                        'description': 'Too complicated, ignore it',
                        'impact': lambda s: None  # No change
                    }
                ]
            ),
            DecisionCard(
                title="Surprise $10,000 Bonus! 🎁",
                description="You received an unexpected bonus. How do you use it?",
                options=[
                    {
                        'name': '🛡️ Emergency Fund',
                        'description': 'Build financial security',
                        'impact': lambda s: setattr(s, 'savings', s.savings + 10000)
                    },
                    {
                        'name': '📈 Invest It',
                        'description': 'Let compound growth work',
                        'impact': lambda s: setattr(s, 'investments', s.investments + 10000)
                    },
                    {
                        'name': '🎉 Vacation',
                        'description': 'You deserve a break!',
                        'impact': lambda s: setattr(s, 'savings', s.savings - 10000)
                    },
                    {
                        'name': '💳 Pay Debt',
                        'description': 'Eliminate a burden',
                        'impact': lambda s: setattr(s, 'debt', max(0, s.debt - 10000))
                    }
                ]
            ),
            DecisionCard(
                title="Car Purchase Decision 🚗",
                description="Your car is reliable but getting older. Should you buy a new one?",
                options=[
                    {
                        'name': '💳 Finance $35k',
                        'description': '5-year loan, $700/month, $35,000 debt',
                        'impact': lambda s: (
                            setattr(s, 'debt', s.debt + 35000),
                            setattr(s, 'monthly_expenses', s.monthly_expenses + 700)
                        )
                    },
                    {
                        'name': '💰 Pay Cash',
                        'description': 'Buy outright, drain savings',
                        'impact': lambda s: setattr(s, 'savings', s.savings - 35000)
                    },
                    {
                        'name': '🔧 Keep Current',
                        'description': 'Fix what you have. Maintain $1500/year',
                        'impact': lambda s: (
                            setattr(s, 'monthly_expenses', s.monthly_expenses - 50)  # No car payment
                        )
                    }
                ]
            ),
            DecisionCard(
                title="Career Change Opportunity 🎯",
                description="Switch to high-growth tech company. 30% salary increase, but demanding role.",
                options=[
                    {
                        'name': '🚀 Take It',
                        'description': '+30% salary, but higher stress',
                        'impact': lambda s: setattr(s, 'salary', int(s.salary * 1.30))
                    },
                    {
                        'name': '😌 Stay Comfortable',
                        'description': 'Keep current job, predictable income',
                        'impact': lambda s: None  # No change
                    },
                    {
                        'name': '💼 Negotiate',
                        'description': '+20% salary, better work-life balance',
                        'impact': lambda s: setattr(s, 'salary', int(s.salary * 1.20))
                    }
                ]
            )
        ]
    
    def make_decision(self, decision_index: int, option_index: int):
        """Process a user's decision"""
        decisions = self.get_decisions()
        
        if decision_index < len(decisions):
            decision = decisions[decision_index]
            
            # Apply the choice
            decision.apply_option(self.current_state, option_index)
            
            # Recalculate state
            self.current_state.calculate_annual_state()
            
            # Record decision
            self.decisions_made.append({
                'decision': decision.title,
                'option': decision.options[option_index]['name'],
                'state_before': self.history[-1] if self.history else None,
                'state_after': self.current_state.to_dict()
            })
            
            # Add to history
            self.history.append(self.current_state.to_dict())
            self.current_decision_index += 1
    
    def get_current_status(self) -> Dict:
        """Get current financial status"""
        return self.current_state.to_dict()
    
    def generate_report(self) -> Dict:
        """Generate end-of-simulation report"""
        return {
            'beginning_net_worth': int(self.initial_state.net_worth),
            'ending_net_worth': int(self.current_state.net_worth),
            'net_worth_change': int(self.current_state.net_worth - self.initial_state.net_worth),
            'beginning_debt': int(self.initial_state.debt),
            'ending_debt': int(self.current_state.debt),
            'debt_eliminated': int(self.initial_state.debt - self.current_state.debt),
            'investment_growth': int(self.current_state.investments - self.initial_state.investments),
            'beginning_retirement_age': self.initial_state.estimate_retirement_age(),
            'ending_retirement_age': self.current_state.estimate_retirement_age(),
            'years_saved': max(0, self.initial_state.estimate_retirement_age() - self.current_state.estimate_retirement_age()),
            'beginning_health_score': self.initial_state.health_score,
            'ending_health_score': self.current_state.health_score,
            'total_decisions': len(self.decisions_made),
            'decisions_made': self.decisions_made,
            'net_worth_history': [state['net_worth'] for state in self.history],
            'investment_history': [state['investments'] for state in self.history],
            'debt_history': [state['debt'] for state in self.history]
        }
