import random

EVENTS = [
    {
        "id": "storm",
        "title": "Severe Storm Warning",
        "message": "A severe storm has disrupted flights across the region. Revenue down today.",
        "type": "negative",
        "emoji": "⛈",
        "effect": {"balance": -80000, "reputation": -0.1},
        "probability": 0.08,
    },
    {
        "id": "fuel_drop",
        "title": "Fuel Prices Drop",
        "message": "Global oil prices fall sharply. Fuel costs reduced for 7 days.",
        "type": "positive",
        "emoji": "⛽",
        "effect": {"fuel_saving_days": 7, "fuel_saving": 0.10},
        "probability": 0.07,
    },
    {
        "id": "travel_boom",
        "title": "Travel Boom",
        "message": "A viral travel trend boosts passenger demand by 20% today!",
        "type": "positive",
        "emoji": "🌍",
        "effect": {"balance": 150000, "total_pax": 5000},
        "probability": 0.06,
    },
    {
        "id": "media_feature",
        "title": "Media Feature",
        "message": "SkyEmpire featured in Aviation Weekly. Reputation boost!",
        "type": "positive",
        "emoji": "📺",
        "effect": {"reputation": 0.2},
        "probability": 0.05,
    },
    {
        "id": "strike",
        "title": "Staff Strike Warning",
        "message": "Ground staff threatening strike. Morale needs attention.",
        "type": "negative",
        "emoji": "✊",
        "effect": {"reputation": -0.15, "balance": -50000},
        "probability": 0.05,
    },
    {
        "id": "tech_failure",
        "title": "IT System Failure",
        "message": "Booking system outage for 6 hours. Some revenue lost.",
        "type": "negative",
        "emoji": "💻",
        "effect": {"balance": -60000},
        "probability": 0.05,
    },
    {
        "id": "award",
        "title": "Aviation Award Won",
        "message": "SkyEmpire wins Best Airline of the Year 2026!",
        "type": "positive",
        "emoji": "🏆",
        "effect": {"reputation": 0.3, "balance": 50000},
        "probability": 0.03,
    },
    {
        "id": "new_airport",
        "title": "New Airport Terminal Opens",
        "message": "A new terminal opens at your hub. Capacity and demand increase.",
        "type": "positive",
        "emoji": "🏗",
        "effect": {"balance": 0, "reputation": 0.1},
        "probability": 0.04,
    },
    {
        "id": "pandemic_scare",
        "title": "Health Scare Alert",
        "message": "A health advisory reduces travel demand for 5 days.",
        "type": "negative",
        "emoji": "😷",
        "effect": {"balance": -120000, "reputation": -0.1},
        "probability": 0.03,
    },
    {
        "id": "fuel_spike",
        "title": "Fuel Price Spike",
        "message": "Oil prices surge due to geopolitical tensions. Higher fuel costs ahead.",
        "type": "negative",
        "emoji": "🛢",
        "effect": {"balance": -90000},
        "probability": 0.06,
    },
    {
        "id": "celebrity",
        "title": "Celebrity Passenger",
        "message": "A celebrity flew SkyEmpire and posted about it. Brand boost!",
        "type": "positive",
        "emoji": "⭐",
        "effect": {"reputation": 0.25, "balance": 20000},
        "probability": 0.04,
    },
    {
        "id": "competitor_bankrupt",
        "title": "Competitor in Trouble",
        "message": "A rival airline is struggling financially. Opportunity to steal their routes!",
        "type": "positive",
        "emoji": "📉",
        "effect": {"balance": 0},
        "probability": 0.03,
    },
]

def get_daily_events(day):
    """Roll for random events each day."""
    triggered = []
    for event in EVENTS:
        if random.random() < event["probability"]:
            triggered.append(event)
    return triggered

def apply_event(event, airline):
    """Apply event effects to the player airline."""
    effect = event.get("effect", {})
    changes = {}

    if "balance" in effect:
        airline.balance += effect["balance"]
        changes["balance"] = effect["balance"]

    if "reputation" in effect:
        airline.reputation = round(
            max(0.0, min(5.0, airline.reputation + effect["reputation"])), 2
        )
        changes["reputation"] = effect["reputation"]

    if "total_pax" in effect:
        airline.total_pax += effect["total_pax"]
        changes["total_pax"] = effect["total_pax"]

    return changes