import random
from engine.economics import calculate_route_profit, calculate_ticket_price

COMPETITOR_TEMPLATES = [
    {
        "name": "Gulf Wings",
        "hub": "DXB",
        "emoji": "🟡",
        "balance": 60_000_000.0,
        "reputation": 3.5,
        "fleet_size": 4,
        "route_count": 3,
        "aggression": 0.7,
        "strategy": "expansion",
        "stock_price": 14.0,
    },
    {
        "name": "Arabian Sky",
        "hub": "RUH",
        "emoji": "🟢",
        "balance": 45_000_000.0,
        "reputation": 3.0,
        "fleet_size": 3,
        "route_count": 2,
        "aggression": 0.5,
        "strategy": "budget",
        "stock_price": 9.0,
    },
    {
        "name": "Eastern Connect",
        "hub": "SIN",
        "emoji": "🔵",
        "balance": 55_000_000.0,
        "reputation": 3.8,
        "fleet_size": 5,
        "route_count": 4,
        "aggression": 0.4,
        "strategy": "luxury",
        "stock_price": 18.0,
    },
    {
        "name": "Atlas Air",
        "hub": "IST",
        "emoji": "🔴",
        "balance": 35_000_000.0,
        "reputation": 2.8,
        "fleet_size": 2,
        "route_count": 2,
        "aggression": 0.8,
        "strategy": "balanced",
        "stock_price": 7.5,
    },
]

def simulate_competitor_day(competitor, day):
    """Simulate one day of AI competitor activity."""
    events = []
    balance_change = 0

    # Base daily revenue based on routes and fleet
    base_revenue = competitor.route_count * competitor.fleet_size * random.uniform(80000, 150000)

    # Strategy modifiers
    if competitor.strategy == "budget":
        base_revenue *= 0.85
    elif competitor.strategy == "luxury":
        base_revenue *= 1.25
    elif competitor.strategy == "expansion":
        base_revenue *= 1.10

    # Reputation modifier
    rep_modifier = 0.8 + (competitor.reputation / 5.0) * 0.4
    base_revenue *= rep_modifier

    # Daily costs
    daily_costs = competitor.fleet_size * random.uniform(15000, 35000)
    daily_profit = base_revenue - daily_costs
    balance_change += daily_profit

    # Aggressive competitor expands
    if competitor.aggression > 0.6 and random.random() < 0.05:
        if competitor.balance > 20_000_000:
            competitor.fleet_size += 1
            competitor.balance -= random.uniform(15_000_000, 30_000_000)
            events.append({
                "type": "expansion",
                "message": f"✈ {competitor.name} purchased a new aircraft and is expanding!",
            })

    # Open new routes
    if random.random() < 0.04 * competitor.aggression:
        competitor.route_count += 1
        events.append({
            "type": "new_route",
            "message": f"🗺 {competitor.name} opened a new route from {competitor.hub}.",
        })

    # Reputation changes
    rep_change = random.uniform(-0.05, 0.08)
    competitor.reputation = round(max(0.5, min(5.0, competitor.reputation + rep_change)), 2)

    # Passenger growth
    pax_today = int(competitor.fleet_size * competitor.route_count * random.uniform(200, 500))
    competitor.total_pax += pax_today

    # Update balance
    competitor.balance += balance_change

    # Stock price simulation
    stock_change = random.uniform(-0.8, 1.2)
    if daily_profit > 0:
        stock_change += 0.3
    if competitor.aggression > 0.6:
        stock_change += random.uniform(-0.5, 0.5)
    competitor.stock_price = round(max(1.0, competitor.stock_price + stock_change), 2)

    # Bankruptcy check
    if competitor.balance < -10_000_000:
        competitor.active = False
        events.append({
            "type": "bankrupt",
            "message": f"💀 {competitor.name} has gone bankrupt and ceased operations!",
        })

    return {
        "competitor": competitor.name,
        "daily_profit": round(daily_profit, 2),
        "balance": round(competitor.balance, 2),
        "fleet_size": competitor.fleet_size,
        "route_count": competitor.route_count,
        "stock_price": competitor.stock_price,
        "events": events,
    }

def get_competitor_threat_level(competitor, player_airline):
    """Assess how much of a threat a competitor is to the player."""
    threat = 0.0

    if competitor.route_count >= player_airline.level * 2:
        threat += 0.3
    if competitor.reputation > player_airline.reputation:
        threat += 0.2
    if competitor.fleet_size > len([]):
        threat += 0.1
    if competitor.aggression > 0.6:
        threat += 0.2
    if competitor.strategy == "expansion":
        threat += 0.2

    if threat >= 0.7:
        return "HIGH"
    elif threat >= 0.4:
        return "MEDIUM"
    return "LOW"