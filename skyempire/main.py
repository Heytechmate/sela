import json
import random
from fastapi import FastAPI, Depends, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from database import engine, get_db, Base
from models import (
    GameState, PlayerAirline, Aircraft, AircraftCatalog,
    Airport, Route, Competitor, Loan, Stock, Transaction,
    Staff, StaffTraining
)
from engine.economics import (
    calculate_route_profit, get_season_modifier,
    get_fuel_price, calculate_ticket_price, calculate_distance
)
from engine.events import get_daily_events, apply_event
from engine.ai_competitors import simulate_competitor_day, COMPETITOR_TEMPLATES
from engine.stock_market import simulate_stock_day, get_loan_options
from pydantic import BaseModel

# ===== CREATE ALL TABLES =====
Base.metadata.create_all(bind=engine)

app = FastAPI(title="SkyEmpire 2026")

# ===== SERVE STATIC FILES =====
app.mount("/static", StaticFiles(directory="static"), name="static")

# ===== PYDANTIC SCHEMAS =====
class BuyAircraftRequest(BaseModel):
    catalog_id: int

class OpenRouteRequest(BaseModel):
    from_code: str
    to_code: str
    aircraft_id: int
    daily_flights: int = 2

class TakeLoanRequest(BaseModel):
    loan_type: str

class BuyStockRequest(BaseModel):
    airline_name: str
    shares: int

class SellStockRequest(BaseModel):
    airline_name: str
    shares: int

class HireStaffRequest(BaseModel):
    staff_id: int

class TrainStaffRequest(BaseModel):
    staff_id: int
    training_type: str

class MaintenanceRequest(BaseModel):
    aircraft_id: int

class SetTicketPriceRequest(BaseModel):
    route_id: int
    price: float

# ===== DATABASE SEEDING =====
def seed_database(db: Session):
    """Seed the database with initial data on first run."""

    # Game state
    if not db.query(GameState).first():
        db.add(GameState(id=1, day=1))
        db.commit()

    # Player airline
    if not db.query(PlayerAirline).first():
        db.add(PlayerAirline(
            id=1, name="SkyEmpire Airlines", hub="DOH",
            balance=50_000_000.0, reputation=3.0, level=1
        ))
        db.commit()

    # Airports
    if not db.query(Airport).first():
        with open("data/airports.json") as f:
            airports = json.load(f)
        for a in airports:
            db.add(Airport(**a))
        db.commit()

    # Aircraft catalog
    if not db.query(AircraftCatalog).first():
        with open("data/aircraft_catalog.json") as f:
            catalog = json.load(f)
        for c in catalog:
            db.add(AircraftCatalog(**c))
        db.commit()

    # Starter fleet
    if not db.query(Aircraft).filter(Aircraft.owner == "player").first():
        db.add(Aircraft(
            name="SkyEmpire-001", model="Boeing 737-800", emoji="✈",
            owner="player", seats=162, range_km=5765, speed_kmh=842,
            daily_cost=18000, condition=95.0, fuel_efficiency="Good",
            aircraft_type="Narrowbody"
        ))
        db.add(Aircraft(
            name="SkyEmpire-002", model="Airbus A320neo", emoji="🛩",
            owner="player", seats=165, range_km=6300, speed_kmh=833,
            daily_cost=16000, condition=98.0, fuel_efficiency="Excellent",
            aircraft_type="Narrowbody"
        ))
        db.commit()

    # Competitors
    if not db.query(Competitor).first():
        for t in COMPETITOR_TEMPLATES:
            db.add(Competitor(**t))
        db.commit()

    # Stocks
    if not db.query(Stock).first():
        airlines = ["SkyEmpire Airlines", "Gulf Wings", "Arabian Sky", "Eastern Connect", "Atlas Air"]
        prices = [10.0, 14.0, 9.0, 18.0, 7.5]
        for name, price in zip(airlines, prices):
            db.add(Stock(
                airline_name=name, current_price=price,
                previous_price=price, high_52w=price, low_52w=price
            ))
        db.commit()

    # Staff pool
    if not db.query(Staff).first():
        staff_pool = [
            Staff(name="Capt. Amara Al-Farsi", emoji="👨‍✈️", role="Chief Pilot", category="pilot", skill=92, salary=15000, bonus_effect="delay_reduction"),
            Staff(name="Priya Sharma", emoji="👩‍💼", role="Revenue Manager", category="management", skill=88, salary=12000, bonus_effect="ticket_bonus"),
            Staff(name="Thiago Costa", emoji="🧑‍🔧", role="Head Engineer", category="engineer", skill=85, salary=13000, bonus_effect="maintenance_discount"),
            Staff(name="Rachel Kim", emoji="👩‍💼", role="Marketing Director", category="management", skill=79, salary=10000, bonus_effect="load_factor_boost"),
            Staff(name="Omar Hassan", emoji="👨‍💻", role="IT & Data Chief", category="management", skill=90, salary=14000, bonus_effect="ai_route_bonus"),
            Staff(name="Capt. Sofia Reyes", emoji="🧑‍✈️", role="Senior Pilot", category="pilot", skill=95, salary=18000, bonus_effect="longhaul_unlock"),
            Staff(name="Mei Lin", emoji="👩‍✈️", role="Cabin Crew Manager", category="cabin", skill=82, salary=9000, bonus_effect="reputation_boost"),
            Staff(name="James O'Brien", emoji="👨‍💼", role="CFO", category="management", skill=91, salary=16000, bonus_effect="loan_rate_reduction"),
            Staff(name="Aisha Nour", emoji="👩‍🔧", role="Safety Officer", category="engineer", skill=87, salary=11000, bonus_effect="condition_preservation"),
            Staff(name="Raj Patel", emoji="👨‍💼", role="Ground Operations", category="general", skill=75, salary=8000, bonus_effect="turnaround_speed"),
        ]
        for s in staff_pool:
            db.add(s)
        db.commit()


# ===== STARTUP =====
@app.on_event("startup")
async def startup():
    db = next(get_db())
    seed_database(db)


# ===== ROUTES =====

@app.get("/")
async def root():
    return FileResponse("static/index.html")

# ----- GAME STATE -----
@app.get("/api/state")
def get_state(db: Session = Depends(get_db)):
    game = db.query(GameState).first()
    airline = db.query(PlayerAirline).first()
    fuel_price = get_fuel_price(game.day)
    active_routes = db.query(Route).filter(Route.owner == "player", Route.active == True).count()
    fleet_size = db.query(Aircraft).filter(Aircraft.owner == "player").count()
    hired_staff = db.query(Staff).filter(Staff.hired == True).count()
    active_loans = db.query(Loan).filter(Loan.paid_off == False).count()
    return {
        "day": game.day,
        "airline": {
            "name": airline.name,
            "hub": airline.hub,
            "balance": airline.balance,
            "reputation": airline.reputation,
            "level": airline.level,
            "xp": airline.xp,
            "total_revenue": airline.total_revenue,
            "total_costs": airline.total_costs,
            "total_pax": airline.total_pax,
            "loan_balance": airline.loan_balance,
            "stock_price": airline.stock_price,
        },
        "fuel_price": fuel_price,
        "active_routes": active_routes,
        "fleet_size": fleet_size,
        "hired_staff": hired_staff,
        "active_loans": active_loans,
        "season_modifier": get_season_modifier(game.day),
    }

# ----- ADVANCE DAY -----
@app.post("/api/advance-day")
def advance_day(db: Session = Depends(get_db)):
    game = db.query(GameState).first()
    airline = db.query(PlayerAirline).first()
    game.day += 1
    day = game.day

    results = {
        "day": day,
        "route_results": [],
        "events": [],
        "competitor_news": [],
        "stock_updates": [],
        "loan_payments": [],
        "research_updates": [],
    }

    # --- Route revenue ---
    active_routes = db.query(Route).filter(Route.owner == "player", Route.active == True).all()
    day_revenue = 0
    day_costs = 0
    day_pax = 0

    # Build bonuses from hired staff
    bonuses = {}
    hired = db.query(Staff).filter(Staff.hired == True).all()
    for s in hired:
        if s.bonus_effect == "ticket_bonus":
            bonuses["ticket_bonus"] = bonuses.get("ticket_bonus", 0) + 0.05
        if s.bonus_effect == "load_factor_boost":
            bonuses["load_factor"] = bonuses.get("load_factor", 0) + 0.08
        if s.bonus_effect == "ai_route_bonus":
            bonuses["load_factor"] = bonuses.get("load_factor", 0) + 0.03
        if s.bonus_effect == "reputation_boost":
            airline.reputation = min(5.0, airline.reputation + 0.01)

    # Alliance bonus
    if airline.alliance:
        bonuses["alliance_bonus"] = 0.10

    for route in active_routes:
        aircraft = db.query(Aircraft).filter(Aircraft.id == route.aircraft_id).first()
        if not aircraft:
            continue

        calc = calculate_route_profit(route, aircraft, bonuses)
        season_mod = get_season_modifier(day)
        calc["revenue"] *= season_mod
        calc["profit"] = calc["revenue"] - calc["total_cost"]
        calc["pax"] = int(calc["pax"] * season_mod)

        route.profit_per_day = calc["profit"]
        route.pax_per_day = calc["pax"]
        day_revenue += calc["revenue"]
        day_costs += calc["total_cost"]
        day_pax += calc["pax"]

        # Aircraft wear
        wear = 0.3 + random.uniform(0, 0.3)
        if any(s.bonus_effect == "condition_preservation" for s in hired):
            wear *= 0.7
        aircraft.condition = max(0, aircraft.condition - wear)
        aircraft.age_days += 1

        results["route_results"].append({
            "route": f"{route.from_code} ↔ {route.to_code}",
            "revenue": round(calc["revenue"], 2),
            "cost": round(calc["total_cost"], 2),
            "profit": round(calc["profit"], 2),
            "pax": calc["pax"],
            "load_factor": calc["load_factor"],
        })

    # Staff morale & fatigue
    for s in hired:
        s.fatigue = min(100, s.fatigue + random.uniform(1, 3))
        s.morale = max(0, s.morale - random.uniform(0.1, 0.5))
        s.xp += random.randint(5, 20)
        if s.xp >= s.level * 500:
            s.level += 1
            s.xp = 0
            s.skill = min(100, s.skill + 2)

    # Monthly staff salary
    if day % 30 == 0:
        monthly_salary = sum(s.salary for s in hired)
        airline.balance -= monthly_salary
        day_costs += monthly_salary
        db.add(Transaction(
            day=day, description="Monthly Staff Payroll",
            amount=-monthly_salary, category="staff",
            balance_after=airline.balance
        ))
        results["research_updates"].append(f"💼 Payroll paid: ${monthly_salary:,.0f}")

    # Loan repayments
    active_loans = db.query(Loan).filter(Loan.paid_off == False).all()
    for loan in active_loans:
        payment = min(loan.daily_payment, loan.remaining)
        loan.remaining -= payment
        airline.balance -= payment
        airline.loan_balance -= payment
        day_costs += payment
        results["loan_payments"].append({
            "amount": round(payment, 2),
            "remaining": round(loan.remaining, 2),
        })
        if loan.remaining <= 0:
            loan.paid_off = True
            results["loan_payments"].append({"message": "✅ Loan fully repaid!"})

    # Update airline financials
    airline.balance += day_revenue - day_costs + sum(l["amount"] for l in results["loan_payments"] if "amount" in l) * -1 + sum(l["amount"] for l in results["loan_payments"] if "amount" in l)
    airline.total_revenue += day_revenue
    airline.total_costs += day_costs
    airline.total_pax += day_pax

    # XP
    xp_gain = int(day_pax / 10) + 20
    airline.xp += xp_gain
    level_xp = [0,1000,2500,5000,10000,18000,30000,50000,75000,100000]
    while airline.level < len(level_xp) - 1 and airline.xp >= level_xp[airline.level]:
        airline.xp -= level_xp[airline.level]
        airline.level += 1
        results["events"].append({
            "title": f"⭐ Level Up! You are now Level {airline.level}",
            "type": "positive",
            "emoji": "⭐",
        })

    # Log revenue transaction
    if day_revenue > 0:
        db.add(Transaction(
            day=day, description=f"Day {day} Route Revenue",
            amount=day_revenue, category="revenue",
            balance_after=airline.balance
        ))

    # Random events
    events = get_daily_events(day)
    for event in events:
        apply_event(event, airline)
        results["events"].append({
            "title": event["title"],
            "message": event["message"],
            "type": event["type"],
            "emoji": event["emoji"],
        })

    # AI competitors
    competitors = db.query(Competitor).filter(Competitor.active == True).all()
    for comp in competitors:
        comp_result = simulate_competitor_day(comp, day)
        for ev in comp_result["events"]:
            results["competitor_news"].append(ev["message"])

    # Stock market
    stocks = db.query(Stock).all()
    player_stock = db.query(Stock).filter(Stock.airline_name == airline.name).first()
    active_route_count = len(active_routes)
    for stock in stocks:
        performance = None
        if stock.airline_name == airline.name:
            performance = {
                "daily_profit": day_revenue - day_costs,
                "reputation": airline.reputation,
                "active_routes": active_route_count,
            }
        updated = simulate_stock_day(stock, performance)
        results["stock_updates"].append(updated)

    if player_stock:
        airline.stock_price = player_stock.current_price

    db.commit()

    results["summary"] = {
        "day_revenue": round(day_revenue, 2),
        "day_costs": round(day_costs, 2),
        "day_profit": round(day_revenue - day_costs, 2),
        "day_pax": day_pax,
        "balance": round(airline.balance, 2),
        "xp_gained": xp_gain,
    }

    return results

# ----- FLEET -----
@app.get("/api/fleet")
def get_fleet(db: Session = Depends(get_db)):
    aircraft = db.query(Aircraft).filter(Aircraft.owner == "player").all()
    result = []
    for a in aircraft:
        route = db.query(Route).filter(Route.aircraft_id == a.id).first()
        result.append({
            "id": a.id,
            "name": a.name,
            "model": a.model,
            "emoji": a.emoji,
            "seats": a.seats,
            "range_km": a.range_km,
            "speed_kmh": a.speed_kmh,
            "daily_cost": a.daily_cost,
            "condition": round(a.condition, 1),
            "age_days": a.age_days,
            "status": a.status,
            "fuel_efficiency": a.fuel_efficiency,
            "aircraft_type": a.aircraft_type,
            "route": f"{route.from_code} ↔ {route.to_code}" if route else None,
            "route_id": route.id if route else None,
        })
    return result

@app.get("/api/market")
def get_market(db: Session = Depends(get_db)):
    airline = db.query(PlayerAirline).first()
    catalog = db.query(AircraftCatalog).all()
    return [{
        "id": c.id,
        "model": c.model,
        "manufacturer": c.manufacturer,
        "emoji": c.emoji,
        "seats": c.seats,
        "range_km": c.range_km,
        "speed_kmh": c.speed_kmh,
        "price": c.price,
        "daily_cost": c.daily_cost,
        "fuel_efficiency": c.fuel_efficiency,
        "aircraft_type": c.aircraft_type,
        "min_level": c.min_level,
        "can_afford": airline.balance >= c.price,
        "level_met": airline.level >= c.min_level,
    } for c in catalog]

@app.post("/api/fleet/buy")
def buy_aircraft(req: BuyAircraftRequest, db: Session = Depends(get_db)):
    airline = db.query(PlayerAirline).first()
    catalog = db.query(AircraftCatalog).filter(AircraftCatalog.id == req.catalog_id).first()
    if not catalog:
        raise HTTPException(status_code=404, detail="Aircraft not found")
    if airline.balance < catalog.price:
        raise HTTPException(status_code=400, detail="Insufficient funds")
    if airline.level < catalog.min_level:
        raise HTTPException(status_code=400, detail=f"Requires Level {catalog.min_level}")

    fleet_count = db.query(Aircraft).filter(Aircraft.owner == "player").count()
    new_aircraft = Aircraft(
        name=f"SkyEmpire-{str(fleet_count + 1).zfill(3)}",
        model=catalog.model, emoji=catalog.emoji,
        owner="player", seats=catalog.seats,
        range_km=catalog.range_km, speed_kmh=catalog.speed_kmh,
        daily_cost=catalog.daily_cost, condition=100.0,
        fuel_efficiency=catalog.fuel_efficiency,
        aircraft_type=catalog.aircraft_type,
    )
    airline.balance -= catalog.price
    airline.total_costs += catalog.price
    airline.xp += 500
    db.add(new_aircraft)
    db.add(Transaction(
        day=db.query(GameState).first().day,
        description=f"Purchased {catalog.model}",
        amount=-catalog.price, category="cost",
        balance_after=airline.balance
    ))
    db.commit()
    db.refresh(new_aircraft)
    return {"success": True, "aircraft_id": new_aircraft.id, "balance": airline.balance}

@app.post("/api/fleet/maintenance")
def do_maintenance(req: MaintenanceRequest, db: Session = Depends(get_db)):
    airline = db.query(PlayerAirline).first()
    aircraft = db.query(Aircraft).filter(Aircraft.id == req.aircraft_id).first()
    if not aircraft:
        raise HTTPException(status_code=404, detail="Aircraft not found")
    cost = round((100 - aircraft.condition) * 800, 2)
    if airline.balance < cost:
        raise HTTPException(status_code=400, detail="Insufficient funds")
    airline.balance -= cost
    airline.total_costs += cost
    aircraft.condition = 100.0
    db.add(Transaction(
        day=db.query(GameState).first().day,
        description=f"Maintenance: {aircraft.name}",
        amount=-cost, category="cost",
        balance_after=airline.balance
    ))
    db.commit()
    return {"success": True, "cost": cost, "balance": airline.balance}

# ----- ROUTES -----
@app.get("/api/routes")
def get_routes(db: Session = Depends(get_db)):
    routes = db.query(Route).filter(Route.owner == "player").all()
    return [{
        "id": r.id,
        "from_code": r.from_code,
        "to_code": r.to_code,
        "from_city": r.from_city,
        "to_city": r.to_city,
        "distance_km": r.distance_km,
        "active": r.active,
        "aircraft_id": r.aircraft_id,
        "daily_flights": r.daily_flights,
        "ticket_price": r.ticket_price,
        "demand_base": r.demand_base,
        "profit_per_day": r.profit_per_day,
        "pax_per_day": r.pax_per_day,
    } for r in routes]

@app.get("/api/airports")
def get_airports(db: Session = Depends(get_db)):
    airports = db.query(Airport).all()
    return [{
        "code": a.code, "name": a.name, "city": a.city,
        "country": a.country, "lat": a.lat, "lon": a.lon, "size": a.size
    } for a in airports]

@app.post("/api/routes/open")
def open_route(req: OpenRouteRequest, db: Session = Depends(get_db)):
    airline = db.query(PlayerAirline).first()
    aircraft = db.query(Aircraft).filter(
        Aircraft.id == req.aircraft_id, Aircraft.owner == "player"
    ).first()
    if not aircraft:
        raise HTTPException(status_code=404, detail="Aircraft not found")
    if aircraft.status != "idle":
        raise HTTPException(status_code=400, detail="Aircraft not available")

    from_ap = db.query(Airport).filter(Airport.code == req.from_code).first()
    to_ap = db.query(Airport).filter(Airport.code == req.to_code).first()
    if not from_ap or not to_ap:
        raise HTTPException(status_code=404, detail="Airport not found")

    distance = calculate_distance(from_ap.lat, from_ap.lon, to_ap.lat, to_ap.lon)
    if distance > aircraft.range_km:
        raise HTTPException(status_code=400, detail=f"Route too long for this aircraft. Max range: {aircraft.range_km}km")

    demand = round(random.uniform(0.65, 0.92), 2)
    ticket_price = calculate_ticket_price(distance, aircraft.aircraft_type, demand)

    route = Route(
        owner="player",
        from_code=req.from_code, to_code=req.to_code,
        from_city=from_ap.city, to_city=to_ap.city,
        distance_km=distance, active=True,
        aircraft_id=aircraft.id,
        daily_flights=req.daily_flights,
        ticket_price=ticket_price,
        demand_base=demand,
    )
    aircraft.status = "flying"
    aircraft.route_id = None
    db.add(route)
    db.commit()
    db.refresh(route)
    aircraft.route_id = route.id
    airline.xp += 200
    db.commit()
    return {
        "success": True,
        "route_id": route.id,
        "distance_km": distance,
        "ticket_price": ticket_price,
        "demand": demand,
    }

@app.post("/api/routes/{route_id}/close")
def close_route(route_id: int, db: Session = Depends(get_db)):
    route = db.query(Route).filter(Route.id == route_id, Route.owner == "player").first()
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")
    aircraft = db.query(Aircraft).filter(Aircraft.id == route.aircraft_id).first()
    if aircraft:
        aircraft.status = "idle"
        aircraft.route_id = None
    route.active = False
    route.aircraft_id = None
    db.commit()
    return {"success": True}

@app.post("/api/routes/set-price")
def set_ticket_price(req: SetTicketPriceRequest, db: Session = Depends(get_db)):
    route = db.query(Route).filter(Route.id == req.route_id, Route.owner == "player").first()
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")
    route.ticket_price = req.price
    db.commit()
    return {"success": True, "new_price": req.price}

# ----- FINANCE -----
@app.get("/api/finance")
def get_finance(db: Session = Depends(get_db)):
    airline = db.query(PlayerAirline).first()
    loans = db.query(Loan).filter(Loan.paid_off == False).all()
    transactions = db.query(Transaction).order_by(Transaction.id.desc()).limit(30).all()
    stocks = db.query(Stock).all()
    player_stocks = db.query(Stock).filter(Stock.shares_owned > 0).all()
    return {
        "balance": airline.balance,
        "total_revenue": airline.total_revenue,
        "total_costs": airline.total_costs,
        "profit": airline.total_revenue - airline.total_costs,
        "loan_balance": airline.loan_balance,
        "stock_price": airline.stock_price,
        "loans": [{
            "id": l.id, "amount": l.amount, "remaining": l.remaining,
            "interest_rate": l.interest_rate, "daily_payment": l.daily_payment,
            "due_on_day": l.due_on_day, "loan_type": l.loan_type,
        } for l in loans],
        "transactions": [{
            "day": t.day, "description": t.description,
            "amount": t.amount, "category": t.category,
            "balance_after": t.balance_after,
        } for t in transactions],
        "stocks": [{
            "airline": s.airline_name, "price": s.current_price,
            "previous": s.previous_price, "change_pct": s.change_pct,
            "high_52w": s.high_52w, "low_52w": s.low_52w,
            "shares_owned": s.shares_owned, "volatile": s.volatile,
        } for s in stocks],
        "loan_options": get_loan_options(airline.balance, db.query(GameState).first().day),
    }

@app.post("/api/finance/loan")
def take_loan(req: TakeLoanRequest, db: Session = Depends(get_db)):
    airline = db.query(PlayerAirline).first()
    game = db.query(GameState).first()
    options = get_loan_options(airline.balance, game.day)
    option = next((o for o in options if o["id"] == req.loan_type), None)
    if not option:
        raise HTTPException(status_code=404, detail="Loan type not found")
    loan = Loan(
        amount=option["amount"], remaining=option["amount"] * (1 + option["interest_rate"]),
        interest_rate=option["interest_rate"],
        daily_payment=option["daily_payment"],
        taken_on_day=game.day,
        due_on_day=game.day + option["duration_days"],
        loan_type=req.loan_type,
    )
    airline.balance += option["amount"]
    airline.loan_balance += option["amount"]
    db.add(loan)
    db.add(Transaction(
        day=game.day, description=f"Loan: {option['name']}",
        amount=option["amount"], category="loan",
        balance_after=airline.balance
    ))
    db.commit()
    return {"success": True, "amount": option["amount"], "balance": airline.balance}

@app.post("/api/finance/stock/buy")
def buy_stock(req: BuyStockRequest, db: Session = Depends(get_db)):
    airline = db.query(PlayerAirline).first()
    stock = db.query(Stock).filter(Stock.airline_name == req.airline_name).first()
    if not stock:
        raise HTTPException(status_code=404, detail="Stock not found")
    cost = stock.current_price * req.shares
    if airline.balance < cost:
        raise HTTPException(status_code=400, detail="Insufficient funds")
    airline.balance -= cost
    stock.shares_owned += req.shares
    db.add(Transaction(
        day=db.query(GameState).first().day,
        description=f"Bought {req.shares} shares of {req.airline_name}",
        amount=-cost, category="stock",
        balance_after=airline.balance
    ))
    db.commit()
    return {"success": True, "shares": stock.shares_owned, "cost": cost, "balance": airline.balance}

@app.post("/api/finance/stock/sell")
def sell_stock(req: SellStockRequest, db: Session = Depends(get_db)):
    airline = db.query(PlayerAirline).first()
    stock = db.query(Stock).filter(Stock.airline_name == req.airline_name).first()
    if not stock or stock.shares_owned < req.shares:
        raise HTTPException(status_code=400, detail="Not enough shares")
    revenue = stock.current_price * req.shares
    airline.balance += revenue
    stock.shares_owned -= req.shares
    db.add(Transaction(
        day=db.query(GameState).first().day,
        description=f"Sold {req.shares} shares of {req.airline_name}",
        amount=revenue, category="stock",
        balance_after=airline.balance
    ))
    db.commit()
    return {"success": True, "revenue": revenue, "balance": airline.balance}

# ----- COMPETITORS -----
@app.get("/api/competitors")
def get_competitors(db: Session = Depends(get_db)):
    competitors = db.query(Competitor).all()
    return [{
        "id": c.id, "name": c.name, "hub": c.hub, "emoji": c.emoji,
        "balance": c.balance, "reputation": c.reputation,
        "fleet_size": c.fleet_size, "route_count": c.route_count,
        "total_pax": c.total_pax, "aggression": c.aggression,
        "strategy": c.strategy, "stock_price": c.stock_price,
        "alliance": c.alliance, "active": c.active,
    } for c in competitors]

# ----- STAFF -----
@app.get("/api/staff")
def get_staff(db: Session = Depends(get_db)):
    staff = db.query(Staff).filter(Staff.owner == "player").all()
    return [{
        "id": s.id, "name": s.name, "emoji": s.emoji, "role": s.role,
        "category": s.category, "skill": s.skill, "xp": s.xp,
        "level": s.level, "morale": round(s.morale, 1),
        "salary": s.salary, "hired": s.hired,
        "fatigue": round(s.fatigue, 1), "bonus_effect": s.bonus_effect,
    } for s in staff]

@app.post("/api/staff/hire")
def hire_staff(req: HireStaffRequest, db: Session = Depends(get_db)):
    airline = db.query(PlayerAirline).first()
    game = db.query(GameState).first()
    staff = db.query(Staff).filter(Staff.id == req.staff_id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff not found")
    if staff.hired:
        raise HTTPException(status_code=400, detail="Already hired")
    hiring_cost = staff.salary * 2
    if airline.balance < hiring_cost:
        raise HTTPException(status_code=400, detail="Insufficient funds")
    airline.balance -= hiring_cost
    airline.total_costs += hiring_cost
    staff.hired = True
    staff.hire_day = game.day
    db.add(Transaction(
        day=game.day, description=f"Hired {staff.name}",
        amount=-hiring_cost, category="staff",
        balance_after=airline.balance
    ))
    db.commit()
    return {"success": True, "balance": airline.balance}

@app.post("/api/staff/train")
def train_staff(req: TrainStaffRequest, db: Session = Depends(get_db)):
    airline = db.query(PlayerAirline).first()
    game = db.query(GameState).first()
    staff = db.query(Staff).filter(Staff.id == req.staff_id).first()
    if not staff or not staff.hired:
        raise HTTPException(status_code=400, detail="Staff not hired")

    training_costs = {
        "basic": {"cost": 50000, "days": 3, "skill_gain": 5},
        "advanced": {"cost": 150000, "days": 7, "skill_gain": 12},
        "elite": {"cost": 400000, "days": 14, "skill_gain": 25},
    }
    training = training_costs.get(req.training_type)
    if not training:
        raise HTTPException(status_code=400, detail="Invalid training type")
    if airline.balance < training["cost"]:
        raise HTTPException(status_code=400, detail="Insufficient funds")

    airline.balance -= training["cost"]
    staff.skill = min(100, staff.skill + training["skill_gain"])
    db.add(StaffTraining(
        staff_id=staff.id, training_type=req.training_type,
        cost=training["cost"], duration_days=training["days"],
        progress=training["days"], completed=True,
        started_day=game.day, skill_gain=training["skill_gain"]
    ))
    db.add(Transaction(
        day=game.day, description=f"Training: {staff.name} ({req.training_type})",
        amount=-training["cost"], category="staff",
        balance_after=airline.balance
    ))
    db.commit()
    return {"success": True, "new_skill": staff.skill, "balance": airline.balance}

# ----- MAP DATA -----
@app.get("/api/map-data")
def get_map_data(db: Session = Depends(get_db)):
    airports = db.query(Airport).all()
    player_routes = db.query(Route).filter(Route.owner == "player", Route.active == True).all()
    competitors = db.query(Competitor).filter(Competitor.active == True).all()

    airport_map = {a.code: {"lat": a.lat, "lon": a.lon, "city": a.city, "size": a.size} for a in airports}

    routes_data = []
    for r in player_routes:
        f = airport_map.get(r.from_code)
        t = airport_map.get(r.to_code)
        if f and t:
            routes_data.append({
                "from": r.from_code, "to": r.to_code,
                "from_lat": f["lat"], "from_lon": f["lon"],
                "to_lat": t["lat"], "to_lon": t["lon"],
                "profit": r.profit_per_day, "owner": "player",
            })

    return {
        "airports": [{"code": a.code, "lat": a.lat, "lon": a.lon, "city": a.city, "size": a.size} for a in airports],
        "routes": routes_data,
        "competitors": [{"name": c.name, "hub": c.hub, "emoji": c.emoji} for c in competitors],
    }