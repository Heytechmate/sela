import math
import random
from datetime import datetime

FUEL_PRICE_BASE = 0.82  # USD per liter

def calculate_distance(lat1, lon1, lat2, lon2):
    """Haversine formula — real distance between two airports."""
    R = 6371
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    return int(R * c)

def calculate_ticket_price(distance_km, aircraft_type, demand):
    """Dynamic ticket pricing based on distance, aircraft and demand."""
    base = 0.12 * distance_km
    if aircraft_type == "Regional":
        base *= 0.85
    elif aircraft_type in ["Widebody", "Superjumbo"]:
        base *= 1.15
    elif aircraft_type == "Next-Gen":
        base *= 1.25
    demand_factor = 0.8 + (demand * 0.4)
    return round(base * demand_factor, 2)

def calculate_fuel_cost(distance_km, seats, fuel_efficiency, daily_flights, fuel_price=FUEL_PRICE_BASE):
    """Calculate daily fuel cost for a route."""
    liters_per_km = {
        "Ultra": 0.025,
        "Excellent": 0.032,
        "Good": 0.040,
        "Average": 0.052,
        "Poor": 0.065,
    }.get(fuel_efficiency, 0.040)
    liters = distance_km * liters_per_km * seats * daily_flights
    return round(liters * fuel_price, 2)

def calculate_route_profit(route, aircraft, bonuses=None):
    """Full P&L calculation for a route per day."""
    if bonuses is None:
        bonuses = {}

    load_factor = min(0.98, route.demand_base + bonuses.get("load_factor", 0))
    ticket_multiplier = 1 + bonuses.get("ticket_bonus", 0)
    pax_multiplier = 1 + bonuses.get("pax_bonus", 0)
    fuel_discount = 1 - bonuses.get("fuel_saving", 0)
    alliance_bonus = 1 + bonuses.get("alliance_bonus", 0)

    pax = int(aircraft.seats * load_factor * route.daily_flights * pax_multiplier)
    revenue = pax * route.ticket_price * ticket_multiplier * alliance_bonus

    fuel_cost = calculate_fuel_cost(
        route.distance_km,
        aircraft.seats,
        aircraft.fuel_efficiency,
        route.daily_flights
    ) * fuel_discount

    total_cost = fuel_cost + aircraft.daily_cost
    profit = revenue - total_cost

    return {
        "pax": pax,
        "revenue": round(revenue, 2),
        "fuel_cost": round(fuel_cost, 2),
        "total_cost": round(total_cost, 2),
        "profit": round(profit, 2),
        "load_factor": round(load_factor, 4),
    }

def get_season_modifier(day):
    """Seasonal demand — peaks in summer and holidays."""
    cycle = day % 365
    if 150 <= cycle <= 240:
        return 1.25   # Summer peak
    elif 330 <= cycle <= 365 or cycle <= 10:
        return 1.20   # Christmas/New Year
    elif 80 <= cycle <= 100:
        return 0.85   # Low season
    return 1.0

def get_fuel_price(day):
    """Simulate fuel price volatility."""
    base = FUEL_PRICE_BASE
    volatility = math.sin(day * 0.05) * 0.08
    noise = random.uniform(-0.03, 0.03)
    return round(max(0.55, base + volatility + noise), 3)

def get_demand_modifier(day):
    """Random demand fluctuations."""
    return round(random.uniform(0.90, 1.10), 3)