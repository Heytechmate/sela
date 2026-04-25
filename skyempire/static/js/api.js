// ===== SKYEMPIRE API LAYER =====
// All communication with the FastAPI backend goes through here

const API = {

    base: "",
  
    async get(endpoint) {
      try {
        const res = await fetch(`${this.base}${endpoint}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
      } catch (err) {
        console.error(`GET ${endpoint} failed:`, err);
        throw err;
      }
    },
  
    async post(endpoint, body = {}) {
      try {
        const res = await fetch(`${this.base}${endpoint}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.detail || `HTTP ${res.status}`);
        }
        return await res.json();
      } catch (err) {
        console.error(`POST ${endpoint} failed:`, err);
        throw err;
      }
    },
  
    // ---- GAME ----
    getState:        () => API.get("/api/state"),
    advanceDay:      () => API.post("/api/advance-day"),
  
    // ---- FLEET ----
    getFleet:        () => API.get("/api/fleet"),
    getMarket:       () => API.get("/api/market"),
    buyAircraft:     (catalog_id) => API.post("/api/fleet/buy", { catalog_id }),
    doMaintenance:   (aircraft_id) => API.post("/api/fleet/maintenance", { aircraft_id }),
  
    // ---- ROUTES ----
    getRoutes:       () => API.get("/api/routes"),
    getAirports:     () => API.get("/api/airports"),
    openRoute:       (from_code, to_code, aircraft_id, daily_flights) =>
                       API.post("/api/routes/open", { from_code, to_code, aircraft_id, daily_flights }),
    closeRoute:      (route_id) => API.post(`/api/routes/${route_id}/close`),
    setTicketPrice:  (route_id, price) => API.post("/api/routes/set-price", { route_id, price }),
  
    // ---- FINANCE ----
    getFinance:      () => API.get("/api/finance"),
    takeLoan:        (loan_type) => API.post("/api/finance/loan", { loan_type }),
    buyStock:        (airline_name, shares) => API.post("/api/finance/stock/buy", { airline_name, shares }),
    sellStock:       (airline_name, shares) => API.post("/api/finance/stock/sell", { airline_name, shares }),
  
    // ---- COMPETITORS ----
    getCompetitors:  () => API.get("/api/competitors"),
  
    // ---- STAFF ----
    getStaff:        () => API.get("/api/staff"),
    hireStaff:       (staff_id) => API.post("/api/staff/hire", { staff_id }),
    trainStaff:      (staff_id, training_type) => API.post("/api/staff/train", { staff_id, training_type }),
  
    // ---- MAP ----
    getMapData:      () => API.get("/api/map-data"),
  };