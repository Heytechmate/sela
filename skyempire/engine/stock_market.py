import random
import math

def simulate_stock_day(stock, airline_performance=None):
    """Simulate one day of stock price movement."""

    # Base random walk
    change = random.uniform(-1.5, 1.5)

    # Trend based on airline performance
    if airline_performance:
        profit = airline_performance.get("daily_profit", 0)
        reputation = airline_performance.get("reputation", 3.0)
        routes = airline_performance.get("active_routes", 0)

        if profit > 500_000:
            change += random.uniform(0.5, 2.0)
        elif profit > 100_000:
            change += random.uniform(0.1, 0.8)
        elif profit < 0:
            change -= random.uniform(0.3, 1.5)

        if reputation >= 4.5:
            change += 0.3
        elif reputation < 2.0:
            change -= 0.5

        if routes >= 5:
            change += 0.2

    # Volatility spike
    if stock.volatile:
        change *= random.uniform(1.5, 3.0)

    # Random volatility event
    if random.random() < 0.05:
        stock.volatile = True
        change *= 2.0
    else:
        stock.volatile = False

    # Apply change
    stock.previous_price = stock.current_price
    stock.current_price = round(max(0.50, stock.current_price + change), 2)
    stock.change_pct = round(
        ((stock.current_price - stock.previous_price) / stock.previous_price) * 100, 2
    )

    # Update 52 week high/low
    if stock.current_price > stock.high_52w:
        stock.high_52w = stock.current_price
    if stock.current_price < stock.low_52w:
        stock.low_52w = stock.current_price

    return {
        "airline": stock.airline_name,
        "price": stock.current_price,
        "previous": stock.previous_price,
        "change_pct": stock.change_pct,
        "high_52w": stock.high_52w,
        "low_52w": stock.low_52w,
        "volatile": stock.volatile,
    }

def calculate_portfolio_value(stocks_owned, stock_prices):
    """Calculate total value of player stock portfolio."""
    total = 0.0
    breakdown = []
    for airline_name, shares in stocks_owned.items():
        price = stock_prices.get(airline_name, 0)
        value = shares * price
        total += value
        breakdown.append({
            "airline": airline_name,
            "shares": shares,
            "price": price,
            "value": round(value, 2),
        })
    return {
        "total_value": round(total, 2),
        "breakdown": breakdown,
    }

def get_loan_options(current_balance, day):
    """Return available loan options based on game progression."""
    options = [
        {
            "id": "small",
            "name": "Short Term Loan",
            "amount": 5_000_000,
            "interest_rate": 0.04,
            "duration_days": 30,
            "daily_payment": round(5_000_000 * 1.04 / 30, 2),
            "description": "Quick capital for small purchases.",
        },
        {
            "id": "medium",
            "name": "Growth Loan",
            "amount": 20_000_000,
            "interest_rate": 0.06,
            "duration_days": 60,
            "daily_payment": round(20_000_000 * 1.06 / 60, 2),
            "description": "Fund fleet expansion.",
        },
        {
            "id": "large",
            "name": "Expansion Loan",
            "amount": 50_000_000,
            "interest_rate": 0.08,
            "duration_days": 90,
            "daily_payment": round(50_000_000 * 1.08 / 90, 2),
            "description": "Major airline expansion capital.",
        },
        {
            "id": "emergency",
            "name": "Emergency Loan",
            "amount": 10_000_000,
            "interest_rate": 0.12,
            "duration_days": 20,
            "daily_payment": round(10_000_000 * 1.12 / 20, 2),
            "description": "High interest. Use only if desperate.",
        },
    ]
    return options