// ===== SKYEMPIRE 2026 — MAIN APP CONTROLLER =====

const App = {
    state: null,
    airports: [],
    fleet: [],
    routes: [],
    advancing: false,
  
    // ===== BOOT =====
    async init() {
      console.log('🛫 SkyEmpire 2026 booting...');
      try {
        await this.loadState();
        await this.loadAirports();
        this.bindNav();
        this.bindTopActions();
        this.showView('dashboard');
        this.startTicker();
        Finance.initCharts();
        this.notify('🛫 Welcome back, CEO!', 'SkyEmpire Airlines is ready for your command.', 'gold');
        console.log('✅ Boot complete');
      } catch (err) {
        console.error('Boot failed:', err);
      }
    },
  
    // ===== STATE =====
    async loadState() {
      this.state = await API.getState();
      this.updateTopStats();
      this.updateDashboard();
    },
  
    async loadAirports() {
      this.airports = await API.getAirports();
    },
  
    // ===== TOP STATS =====
    updateTopStats() {
      if (!this.state) return;
      const a = this.state.airline;
      this.setText('stat-balance', this.fmt(a.balance));
      this.setText('stat-day',     'Day ' + this.state.day);
      this.setText('stat-fleet',   this.state.fleet_size);
      this.setText('stat-routes',  this.state.active_routes);
      this.setText('stat-rep',     this.repStars(a.reputation));
  
      const dailyEst = this.routes.filter(r => r.active).reduce((s, r) => s + r.profit_per_day, 0);
      const revEl = document.getElementById('stat-revenue');
      if (revEl) {
        revEl.textContent = (dailyEst >= 0 ? '+' : '') + this.fmt(dailyEst);
        revEl.className   = 'top-stat-value ' + (dailyEst >= 0 ? 'green' : 'red');
      }
    },
  
    // ===== DASHBOARD =====
    async updateDashboard() {
      if (!this.state) return;
      const a = this.state.airline;
  
      this.setText('d-balance',    this.fmt(a.balance));
      this.setText('d-revenue',    this.fmt(a.total_revenue));
      this.setText('d-pax',        this.fmtNum(a.total_pax));
      this.setText('d-level',      'Level ' + a.level);
      this.setText('d-fuel',       '$' + this.state.fuel_price + '/L');
      this.setText('d-season',     (this.state.season_modifier >= 1.1 ? '🔥 Peak' : this.state.season_modifier <= 0.9 ? '❄️ Low' : '✅ Normal'));
      this.setText('d-routes-count', this.state.active_routes + ' active');
      this.setText('d-fleet-count',  this.state.fleet_size + ' aircraft');
  
      const profit = a.total_revenue - a.total_costs;
      const profitEl = document.getElementById('d-profit');
      if (profitEl) {
        profitEl.textContent = this.fmt(profit);
        profitEl.className   = 'card-value ' + (profit >= 0 ? 'green' : 'red');
      }
  
      // XP bar
      const xpThresholds = [0,1000,2500,5000,10000,18000,30000,50000,75000,100000];
      const xpMax  = xpThresholds[Math.min(a.level, xpThresholds.length - 1)];
      const xpPct  = Math.min(100, (a.xp / xpMax) * 100);
      this.setWidth('xp-bar', xpPct);
      this.setText('d-xp', `${this.fmtNum(a.xp)} / ${this.fmtNum(xpMax)} XP`);
  
      // Reputation bar
      const repPct = (a.reputation / 5) * 100;
      this.setWidth('rep-bar', repPct);
      this.setText('d-rep-val', a.reputation.toFixed(1) + ' / 5.0');
    },
  
    // ===== ADVANCE DAY =====
    async advanceDay() {
      if (this.advancing) return;
      this.advancing = true;
      const btn = document.getElementById('btn-advance');
      if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Processing...'; }
  
      try {
        const result = await API.advanceDay();
        this.state = await API.getState();
  
        this.updateTopStats();
        this.updateDashboard();
  
        // Route results notifications
        const s = result.summary;
        if (s.day_revenue > 0 || s.day_pax > 0) {
          const profitColor = s.day_profit >= 0 ? 'green' : 'red';
          this.notify(
            `📅 Day ${result.day} Complete`,
            `Revenue: ${this.fmt(s.day_revenue)} | Profit: ${this.fmt(s.day_profit)} | Pax: ${this.fmtNum(s.day_pax)}`,
            profitColor
          );
          Finance.updateProfitChart(result.day, s.day_revenue, s.day_costs, s.day_profit);
        } else {
          this.notify(`📅 Day ${result.day}`, 'No active routes. Open routes to start earning!', 'blue');
        }
  
        // Game events
        result.events.forEach(ev => {
          this.notify(ev.emoji + ' ' + ev.title, ev.message || '', ev.type === 'positive' ? 'green' : 'red');
          this.addNews(ev.emoji + ' ' + ev.title + (ev.message ? ' — ' + ev.message : ''), ev.type === 'positive' ? 'green' : 'red');
        });
  
        // Competitor news
        result.competitor_news.forEach(msg => {
          this.addNews(msg, 'neutral');
        });
  
        // Loan payments
        result.loan_payments.forEach(lp => {
          if (lp.message) this.addNews(lp.message, 'green');
        });
  
        // Stock updates
        if (result.stock_updates.length > 0) {
          Finance.updateStockChart(result.stock_updates, result.day);
        }
  
        // Refresh map routes
        if (SkyMap.initialized) {
          SkyMap.refreshRoutes();
        }
  
        // Refresh active view
        this.refreshActiveView();
  
      } catch (err) {
        this.notify('⚠️ Error', err.message, 'red');
      } finally {
        this.advancing = false;
        if (btn) { btn.disabled = false; btn.innerHTML = '⏭ Next Day'; }
      }
    },
  
    // ===== VIEWS =====
    showView(name) {
      document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  
      const view = document.getElementById('view-' + name);
      const nav  = document.querySelector(`[data-view="${name}"]`);
      if (view) view.classList.add('active');
      if (nav)  nav.classList.add('active');
  
      // Load view data
      this.loadView(name);
    },
  
    async loadView(name) {
      switch (name) {
        case 'dashboard':
          await this.loadState();
          break;
        case 'map':
          this.loadMapView();
          break;
        case 'fleet':
          this.renderFleet();
          break;
        case 'routes':
          this.renderRoutes();
          break;
        case 'market':
          this.renderMarket();
          break;
        case 'competitors':
          this.renderCompetitors();
          break;
        case 'staff':
          this.renderStaff();
          break;
        case 'finance':
          Finance.render();
          break;
      }
    },
  
    refreshActiveView() {
      const active = document.querySelector('.view.active');
      if (active) this.loadView(active.id.replace('view-', ''));
    },
  
    // ===== MAP VIEW =====
    async loadMapView() {
      setTimeout(() => {
        if (!SkyMap.initialized) {
          SkyMap.init();
          SkyMap.loadAirports().then(() => SkyMap.refreshRoutes());
        } else {
          SkyMap.map.invalidateSize();
          SkyMap.refreshRoutes();
        }
      }, 100);
    },
  
    // ===== MAP AIRPORT CLICK =====
    onMapAirportClick(airport) {
      this.showOpenRouteModal(airport.code);
    },
  
    // ===== FLEET =====
    async renderFleet() {
      this.fleet = await API.getFleet();
      const tbody = document.getElementById('fleet-tbody');
      if (!tbody) return;
  
      if (!this.fleet.length) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--text3); padding:32px;">
          No aircraft in fleet. Visit the Market to purchase your first plane!
        </td></tr>`;
        return;
      }
  
      tbody.innerHTML = this.fleet.map(p => {
        const condColor = p.condition > 70 ? 'green' : p.condition > 40 ? 'gold' : 'red';
        const statusBadge = {
          flying:      '<span class="badge badge-green">✈ Flying</span>',
          maintenance: '<span class="badge badge-red">🔧 Maintenance</span>',
          idle:        '<span class="badge badge-blue">💤 Idle</span>',
        }[p.status] || '';
  
        return `<tr>
          <td>
            <div style="font-weight:700; color:var(--text);">${p.emoji} ${p.name}</div>
            <div style="font-size:11px; color:var(--accent); font-family:'Share Tech Mono',monospace;">${p.model}</div>
          </td>
          <td>${statusBadge}</td>
          <td style="font-family:'Share Tech Mono',monospace; color:var(--accent);">
            ${p.route || '<span style="color:var(--text3);">Unassigned</span>'}
          </td>
          <td>
            <div style="font-size:12px; color:var(--${condColor});">${p.condition.toFixed(1)}%</div>
            <div class="progress-bar"><div class="progress-fill ${condColor}" style="width:${p.condition}%"></div></div>
          </td>
          <td><span class="badge badge-blue">${p.seats}</span></td>
          <td style="font-size:12px; color:var(--text2);">${p.fuel_efficiency}</td>
          <td>
            <div style="display:flex; gap:6px;">
              <button class="btn btn-ghost btn-sm" onclick="App.showMaintenanceModal(${p.id}, ${p.condition})">🔧</button>
              ${p.status === 'idle'
                ? `<button class="btn btn-primary btn-sm" onclick="App.showOpenRouteModal(null, ${p.id})">📍 Assign</button>`
                : p.status === 'flying'
                ? `<button class="btn btn-danger btn-sm" onclick="App.unassignAircraft(${p.route_id})">✕ Unassign</button>`
                : ''
              }
            </div>
          </td>
        </tr>`;
      }).join('');
    },
  
    // ===== ROUTES =====
    async renderRoutes(filter = 'all') {
      this.routes = await API.getRoutes();
      const el = document.getElementById('routes-list');
      if (!el) return;
  
      let list = this.routes;
      if (filter === 'active')    list = list.filter(r => r.active);
      if (filter === 'inactive')  list = list.filter(r => !r.active);
  
      if (!list.length) {
        el.innerHTML = `<div style="color:var(--text3); font-size:13px; padding:24px; text-align:center;">
          ${filter === 'active' ? 'No active routes. Open routes from the map or below!' : 'No routes found.'}
        </div>`;
        return;
      }
  
      el.innerHTML = list.map(r => {
        const profitColor  = r.profit_per_day >= 0 ? 'var(--green)' : 'var(--red)';
        const statusBadge  = r.active
          ? '<span class="badge badge-green">✅ Active</span>'
          : '<span class="badge badge-blue">💤 Inactive</span>';
  
        return `<div class="route-card">
          <div class="airport-pair">
            <div>
              <div class="iata">${r.from_code}</div>
              <div class="iata-city">${r.from_city}</div>
            </div>
            <div class="route-arrow">↔</div>
            <div>
              <div class="iata">${r.to_code}</div>
              <div class="iata-city">${r.to_city}</div>
            </div>
          </div>
          <div class="route-meta">
            <div class="route-name">${r.from_city} — ${r.to_city} ${statusBadge}</div>
            <div class="route-detail">
              ${r.distance_km.toLocaleString()} km
              &nbsp;•&nbsp; ${r.daily_flights}x daily
              &nbsp;•&nbsp; $${r.ticket_price.toFixed(0)}/ticket
              &nbsp;•&nbsp; ${Math.round(r.demand_base * 100)}% demand
            </div>
          </div>
          <div class="route-kpi">
            <div class="kpi">
              <div class="kpi-val" style="color:${profitColor};">
                ${r.profit_per_day >= 0 ? '+' : ''}${this.fmt(r.profit_per_day)}
              </div>
              <div class="kpi-lbl">Daily P&L</div>
            </div>
            <div class="kpi">
              <div class="kpi-val gold">${r.pax_per_day.toLocaleString()}</div>
              <div class="kpi-lbl">Pax/Day</div>
            </div>
          </div>
          <div style="display:flex; flex-direction:column; gap:6px;">
            ${r.active
              ? `<button class="btn btn-danger btn-sm" onclick="App.closeRoute(${r.id})">✕ Close</button>
                 <button class="btn btn-ghost btn-sm" onclick="App.showPricingModal(${r.id}, ${r.ticket_price})">💲 Price</button>`
              : `<button class="btn btn-primary btn-sm" onclick="App.showOpenRouteModal('${r.from_code}', null, ${r.id})">✈ Reopen</button>`
            }
          </div>
        </div>`;
      }).join('');
  
      this.updateTopStats();
    },
  
    // ===== MARKET =====
    async renderMarket() {
      const catalog = await API.getMarket();
      const el = document.getElementById('market-grid');
      if (!el) return;
  
      el.innerHTML = catalog.map(a => {
        const locked    = !a.level_met;
        const canAfford = a.can_afford && a.level_met;
  
        return `<div class="aircraft-card ${locked ? 'locked' : ''}">
          <div class="ac-icon">${a.emoji}</div>
          <div class="ac-model">${a.model}</div>
          <div class="ac-mfr">${a.manufacturer} • ${a.aircraft_type}</div>
          <div style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:6px;">
            <span class="badge badge-blue">${a.seats} seats</span>
            <span class="badge badge-gold">${a.fuel_efficiency}</span>
            ${locked ? `<span class="badge badge-red">Lv.${a.min_level}+</span>` : ''}
          </div>
          <div class="ac-specs">
            <div>
              <div class="spec-lbl">Range</div>
              <div class="spec-val">${a.range_km.toLocaleString()} km</div>
            </div>
            <div>
              <div class="spec-lbl">Speed</div>
              <div class="spec-val">${a.speed_kmh} km/h</div>
            </div>
            <div>
              <div class="spec-lbl">Daily Cost</div>
              <div class="spec-val">$${(a.daily_cost/1000).toFixed(0)}K</div>
            </div>
            <div>
              <div class="spec-lbl">Price</div>
              <div class="spec-val gold">$${(a.price/1_000_000).toFixed(0)}M</div>
            </div>
          </div>
          <button
            class="btn ${canAfford ? 'btn-gold' : 'btn-ghost'} btn-sm btn-full mt-12"
            onclick="${locked
              ? `App.notify('🔒 Locked', 'Reach Level ${a.min_level} to unlock this aircraft.', 'red')`
              : `App.showBuyModal(${a.id}, '${a.model}', ${a.price})`}"
            ${!canAfford && !locked ? 'title="Insufficient funds"' : ''}
          >
            ${locked ? '🔒 Locked' : canAfford ? '💰 Purchase' : '⚠ Insufficient Funds'}
          </button>
        </div>`;
      }).join('');
    },
  
    // ===== COMPETITORS =====
    async renderCompetitors() {
      const comps = await API.getCompetitors();
      const el = document.getElementById('comp-grid');
      if (!el) return;
  
      el.innerHTML = comps.map(c => {
        const threatColor = c.aggression > 0.65 ? 'red' : c.aggression > 0.45 ? 'gold' : 'green';
        const strategyIcon = { budget:'💚', luxury:'👑', expansion:'📈', balanced:'⚖️' }[c.strategy] || '⚖️';
  
        return `<div class="comp-card">
          <div class="comp-header">
            <div class="comp-emoji">${c.emoji}</div>
            <div>
              <div class="comp-name">${c.name}</div>
              <div class="comp-hub">Hub: ${c.hub} &nbsp;•&nbsp; ${strategyIcon} ${c.strategy}</div>
            </div>
            <div style="margin-left:auto;">
              ${c.active
                ? '<span class="badge badge-green">Active</span>'
                : '<span class="badge badge-red">Bankrupt</span>'
              }
            </div>
          </div>
  
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:12px;">
            <div>
              <div class="spec-lbl">Balance</div>
              <div class="spec-val gold">${this.fmt(c.balance)}</div>
            </div>
            <div>
              <div class="spec-lbl">Stock Price</div>
              <div class="spec-val blue">$${c.stock_price.toFixed(2)}</div>
            </div>
            <div>
              <div class="spec-lbl">Fleet Size</div>
              <div class="spec-val">${c.fleet_size} aircraft</div>
            </div>
            <div>
              <div class="spec-lbl">Routes</div>
              <div class="spec-val">${c.route_count} routes</div>
            </div>
            <div>
              <div class="spec-lbl">Passengers</div>
              <div class="spec-val">${this.fmtNum(c.total_pax)}</div>
            </div>
            <div>
              <div class="spec-lbl">Reputation</div>
              <div class="spec-val">${c.reputation.toFixed(1)} / 5.0</div>
            </div>
          </div>
  
          <div>
            <div style="display:flex; justify-content:space-between; font-size:11px; color:var(--text2); margin-bottom:3px;">
              <span>Aggression</span>
              <span class="${threatColor}">${Math.round(c.aggression * 100)}%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill ${threatColor}" style="width:${c.aggression * 100}%"></div>
            </div>
          </div>
        </div>`;
      }).join('');
    },
  
    // ===== STAFF =====
    async renderStaff() {
      const staff = await API.getStaff();
      const el    = document.getElementById('staff-grid');
      if (!el) return;
  
      const bonusLabels = {
        ticket_bonus:        '+5% ticket prices',
        load_factor_boost:   '+8% load factor',
        ai_route_bonus:      '+3% load factor',
        maintenance_discount:'Slower aircraft wear',
        delay_reduction:     'Fewer flight delays',
        longhaul_unlock:     'Ultra-long routes',
        reputation_boost:    '+Rep per day',
        loan_rate_reduction: 'Better loan rates',
        condition_preservation: 'Slower wear rate',
        turnaround_speed:    'Faster turnarounds',
      };
  
      el.innerHTML = staff.map(s => {
        const moraleColor = s.morale > 70 ? 'green' : s.morale > 40 ? 'gold' : 'red';
        const skillColor  = s.skill  > 80 ? 'blue'  : s.skill  > 60 ? 'gold' : 'text2';
  
        return `<div class="staff-card">
          <div class="staff-avatar">${s.emoji}</div>
          <div class="staff-name">${s.name}</div>
          <div class="staff-role">${s.role}</div>
  
          <div style="margin-bottom:8px;">
            <span class="badge badge-${s.hired ? 'green' : 'blue'}">${s.hired ? '✅ Hired' : 'Available'}</span>
            &nbsp;
            <span class="badge badge-gold">Lv.${s.level}</span>
          </div>
  
          <div class="staff-bars">
            <div class="staff-bar-row">
              <span>Skill</span>
              <span class="${skillColor}">${s.skill.toFixed(0)}/100</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill blue" style="width:${s.skill}%"></div>
            </div>
  
            ${s.hired ? `
              <div class="staff-bar-row mt-4">
                <span>Morale</span>
                <span class="${moraleColor}">${s.morale.toFixed(0)}%</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill ${moraleColor}" style="width:${s.morale}%"></div>
              </div>
  
              <div class="staff-bar-row mt-4">
                <span>Fatigue</span>
                <span class="${s.fatigue > 70 ? 'red' : 'text2'}">${s.fatigue.toFixed(0)}%</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill red" style="width:${s.fatigue}%"></div>
              </div>
            ` : ''}
          </div>
  
          <div style="font-size:11px; color:var(--green); margin:8px 0;">
            ✨ ${bonusLabels[s.bonus_effect] || s.bonus_effect}
          </div>
  
          <div style="font-size:12px; color:var(--text2); margin-bottom:10px;">
            Salary: <span class="mono red">$${s.salary.toLocaleString()}/mo</span>
          </div>
  
          ${s.hired
            ? `<div style="display:flex; gap:6px; flex-wrap:wrap; justify-content:center;">
                 <button class="btn btn-ghost btn-sm" onclick="App.showTrainModal(${s.id}, '${s.name}')">📚 Train</button>
               </div>`
            : `<button class="btn btn-primary btn-sm btn-full" onclick="App.hireStaff(${s.id}, '${s.name}', ${s.salary})">
                 Hire — $${(s.salary*2).toLocaleString()}
               </button>`
          }
        </div>`;
      }).join('');
    },
  
    // ===== MODALS =====
    showModal(html) {
      document.getElementById('modal-content').innerHTML = html;
      document.getElementById('modal-overlay').classList.remove('hidden');
    },
  
    closeModal() {
      document.getElementById('modal-overlay').classList.add('hidden');
    },
  
    // ===== BUY AIRCRAFT MODAL =====
    showBuyModal(catalogId, model, price) {
      const bal = this.state?.airline?.balance || 0;
      this.showModal(`
        <div class="modal-title">💰 Purchase Aircraft</div>
        <div class="modal-row"><span class="modal-lbl">Model</span><span class="modal-val">${model}</span></div>
        <div class="modal-row"><span class="modal-lbl">Purchase Price</span><span class="modal-val gold">${this.fmt(price)}</span></div>
        <div class="modal-row"><span class="modal-lbl">Your Balance</span><span class="modal-val">${this.fmt(bal)}</span></div>
        <div class="modal-row"><span class="modal-lbl">Balance After</span><span class="modal-val ${bal - price >= 0 ? 'green' : 'red'}">${this.fmt(bal - price)}</span></div>
        <div class="modal-footer">
          <button class="btn btn-ghost" onclick="App.closeModal()">Cancel</button>
          <button class="btn btn-gold" onclick="App.confirmBuy(${catalogId}, '${model}')">✅ Confirm Purchase</button>
        </div>
      `);
    },
  
    async confirmBuy(catalogId, model) {
      try {
        await API.buyAircraft(catalogId);
        this.closeModal();
        this.state = await API.getState();
        this.updateTopStats();
        this.renderMarket();
        this.notify(`✈ ${model} Purchased!`, 'New aircraft added to your fleet. Assign it to a route!', 'gold');
        this.addNews(`✈ SkyEmpire acquires a ${model}. Fleet grows!`, 'gold');
      } catch (err) {
        this.notify('⚠️ Purchase Failed', err.message, 'red');
      }
    },
  
    // ===== OPEN ROUTE MODAL =====
    async showOpenRouteModal(fromCode = null, aircraftId = null, existingRouteId = null) {
      const fleet   = await API.getFleet();
      const idleFleet = fleet.filter(p => p.status === 'idle');
  
      if (!idleFleet.length) {
        this.notify('⚠️ No Idle Aircraft', 'All aircraft are assigned. Buy more or close a route first.', 'red');
        return;
      }
  
      const airportOpts = this.airports
        .map(a => `<option value="${a.code}" ${a.code === fromCode ? 'selected' : ''}>${a.code} — ${a.city}, ${a.country}</option>`)
        .join('');
  
      const planeOpts = idleFleet
        .map(p => `<option value="${p.id}" ${p.id === aircraftId ? 'selected' : ''}>${p.emoji} ${p.name} (${p.model}, ${p.seats} seats, ${p.range_km.toLocaleString()}km range)</option>`)
        .join('');
  
      const toAirports = this.airports.filter(a => a.code !== (fromCode || 'DOH'));
      const toOpts = toAirports
        .map(a => `<option value="${a.code}">${a.code} — ${a.city}, ${a.country}</option>`)
        .join('');
  
      this.showModal(`
        <div class="modal-title">✈ Open New Route</div>
        <div class="modal-row">
          <span class="modal-lbl">From Airport</span>
          <select id="route-from" style="max-width:240px;">${airportOpts}</select>
        </div>
        <div class="modal-row">
          <span class="modal-lbl">To Airport</span>
          <select id="route-to" style="max-width:240px;">${toOpts}</select>
        </div>
        <div class="modal-row">
          <span class="modal-lbl">Aircraft</span>
          <select id="route-aircraft" style="max-width:240px;">${planeOpts}</select>
        </div>
        <div class="modal-row">
          <span class="modal-lbl">Daily Flights</span>
          <select id="route-flights" style="max-width:120px;">
            <option value="1">1x daily</option>
            <option value="2" selected>2x daily</option>
            <option value="3">3x daily</option>
            <option value="4">4x daily</option>
          </select>
        </div>
        <div style="font-size:12px; color:var(--text2); margin-top:12px; padding:10px; background:var(--bg2); border-radius:6px;">
          💡 Ticket price is auto-calculated based on distance and demand. You can adjust it after opening the route.
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" onclick="App.closeModal()">Cancel</button>
          <button class="btn btn-primary" onclick="App.confirmOpenRoute()">🛫 Open Route</button>
        </div>
      `);
    },
  
    async confirmOpenRoute() {
      const from    = document.getElementById('route-from').value;
      const to      = document.getElementById('route-to').value;
      const planeId = parseInt(document.getElementById('route-aircraft').value);
      const flights = parseInt(document.getElementById('route-flights').value);
  
      if (from === to) { this.notify('⚠️ Invalid Route', 'Origin and destination cannot be the same.', 'red'); return; }
  
      try {
        const res = await API.openRoute(from, to, planeId, flights);
        this.closeModal();
        this.state = await API.getState();
        this.updateTopStats();
        this.renderRoutes();
        this.notify('🛫 Route Opened!', `${from} ↔ ${to} | ${res.distance_km.toLocaleString()}km | $${res.ticket_price.toFixed(0)}/ticket`, 'green');
        this.addNews(`✈ SkyEmpire launches new route: ${from} ↔ ${to}`, 'green');
        if (SkyMap.initialized) SkyMap.refreshRoutes();
      } catch (err) {
        this.notify('⚠️ Route Failed', err.message, 'red');
      }
    },
  
    // ===== CLOSE ROUTE =====
    async closeRoute(routeId) {
      try {
        await API.closeRoute(routeId);
        this.state = await API.getState();
        this.updateTopStats();
        this.renderRoutes();
        this.notify('❌ Route Closed', 'Aircraft returned to idle.', '');
        if (SkyMap.initialized) SkyMap.refreshRoutes();
      } catch (err) {
        this.notify('⚠️ Error', err.message, 'red');
      }
    },
  
    // ===== UNASSIGN AIRCRAFT =====
    async unassignAircraft(routeId) {
      await this.closeRoute(routeId);
      this.renderFleet();
    },
  
    // ===== MAINTENANCE MODAL =====
    showMaintenanceModal(aircraftId, condition) {
      const cost = Math.round((100 - condition) * 800);
      this.showModal(`
        <div class="modal-title">🔧 Aircraft Service</div>
        <div class="modal-row"><span class="modal-lbl">Current Condition</span><span class="modal-val ${condition > 70 ? 'green' : 'red'}">${condition.toFixed(1)}%</span></div>
        <div class="modal-row"><span class="modal-lbl">Service Cost</span><span class="modal-val gold">$${cost.toLocaleString()}</span></div>
        <div class="modal-row"><span class="modal-lbl">After Service</span><span class="modal-val green">100.0%</span></div>
        <div class="modal-footer">
          <button class="btn btn-ghost" onclick="App.closeModal()">Cancel</button>
          <button class="btn btn-primary" onclick="App.confirmMaintenance(${aircraftId}, ${cost})">✅ Service Now</button>
        </div>
      `);
    },
  
    async confirmMaintenance(aircraftId, cost) {
      try {
        await API.doMaintenance(aircraftId);
        this.closeModal();
        this.state = await API.getState();
        this.updateTopStats();
        this.renderFleet();
        this.notify('🔧 Service Complete!', `Aircraft restored to 100% condition. Cost: $${cost.toLocaleString()}`, 'green');
      } catch (err) {
        this.notify('⚠️ Maintenance Failed', err.message, 'red');
      }
    },
  
    // ===== PRICING MODAL =====
    showPricingModal(routeId, currentPrice) {
      this.showModal(`
        <div class="modal-title">💲 Set Ticket Price</div>
        <div class="modal-row">
          <span class="modal-lbl">Current Price</span>
          <span class="modal-val gold">$${currentPrice.toFixed(0)}</span>
        </div>
        <div class="modal-row">
          <span class="modal-lbl">New Price</span>
          <input type="number" id="new-price" value="${Math.round(currentPrice)}" min="50" max="5000" style="max-width:120px;">
        </div>
        <div style="font-size:12px; color:var(--text2); margin-top:10px;">
          💡 Lower prices increase demand. Higher prices earn more per seat but reduce load factor.
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" onclick="App.closeModal()">Cancel</button>
          <button class="btn btn-gold" onclick="App.confirmPricing(${routeId})">✅ Set Price</button>
        </div>
      `);
    },
  
    async confirmPricing(routeId) {
      const price = parseFloat(document.getElementById('new-price').value);
      if (!price || price < 50) { this.notify('⚠️ Invalid Price', 'Minimum ticket price is $50.', 'red'); return; }
      try {
        await API.setTicketPrice(routeId, price);
        this.closeModal();
        this.renderRoutes();
        this.notify('💲 Price Updated!', `Ticket price set to $${price.toFixed(0)}`, 'blue');
      } catch (err) {
        this.notify('⚠️ Error', err.message, 'red');
      }
    },
  
    // ===== HIRE STAFF =====
    async hireStaff(staffId, name, salary) {
      const cost = salary * 2;
      try {
        await API.hireStaff(staffId);
        this.state = await API.getState();
        this.updateTopStats();
        this.renderStaff();
        this.notify(`👋 ${name} Hired!`, `Joining fee: $${cost.toLocaleString()}. Salary: $${salary.toLocaleString()}/mo`, 'green');
      } catch (err) {
        this.notify('⚠️ Hiring Failed', err.message, 'red');
      }
    },
  
    // ===== TRAIN STAFF MODAL =====
    showTrainModal(staffId, name) {
      this.showModal(`
        <div class="modal-title">📚 Train Staff — ${name}</div>
        <div style="display:flex; flex-direction:column; gap:10px; margin-top:4px;">
          <div class="loan-card" style="cursor:pointer;" onclick="App.confirmTrain(${staffId}, 'basic')">
            <div class="flex-between">
              <div>
                <div style="font-weight:700; color:var(--text);">Basic Training</div>
                <div style="font-size:12px; color:var(--text2);">+5 skill points • 3 days</div>
              </div>
              <span class="badge badge-gold">$50,000</span>
            </div>
          </div>
          <div class="loan-card" style="cursor:pointer;" onclick="App.confirmTrain(${staffId}, 'advanced')">
            <div class="flex-between">
              <div>
                <div style="font-weight:700; color:var(--text);">Advanced Training</div>
                <div style="font-size:12px; color:var(--text2);">+12 skill points • 7 days</div>
              </div>
              <span class="badge badge-blue">$150,000</span>
            </div>
          </div>
          <div class="loan-card" style="cursor:pointer;" onclick="App.confirmTrain(${staffId}, 'elite')">
            <div class="flex-between">
              <div>
                <div style="font-weight:700; color:var(--text);">Elite Programme</div>
                <div style="font-size:12px; color:var(--text2);">+25 skill points • 14 days</div>
              </div>
              <span class="badge badge-purple">$400,000</span>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" onclick="App.closeModal()">Cancel</button>
        </div>
      `);
    },
  
    async confirmTrain(staffId, type) {
      try {
        const res = await API.trainStaff(staffId, type);
        this.closeModal();
        this.state = await API.getState();
        this.updateTopStats();
        this.renderStaff();
        this.notify('📚 Training Complete!', `Skill improved to ${res.new_skill.toFixed(0)}/100`, 'blue');
      } catch (err) {
        this.notify('⚠️ Training Failed', err.message, 'red');
      }
    },
  
    // ===== NEWS FEED =====
    addNews(text, type = 'neutral') {
      const list = document.getElementById('news-list');
      if (!list) return;
      const dotClass = { gold:'gold', green:'green', red:'red', positive:'green', negative:'red' }[type] || '';
      const time = `Day ${this.state?.day || 1} • ${String(Math.floor(Math.random()*14+7)).padStart(2,'0')}:${String(Math.floor(Math.random()*59)).padStart(2,'0')}`;
      const el = document.createElement('div');
      el.className = 'news-item';
      el.innerHTML = `
        <div class="news-dot ${dotClass}"></div>
        <div>
          <div class="news-text">${text}</div>
          <div class="news-time">${time}</div>
        </div>
      `;
      list.insertBefore(el, list.firstChild);
      while (list.children.length > 12) list.removeChild(list.lastChild);
    },
  
    // ===== NOTIFICATIONS =====
    notify(title, msg, type = '') {
      const icons = { gold:'✨', green:'✅', red:'⚠️', blue:'ℹ️', '':'📢' };
      const el = document.createElement('div');
      el.className = `notif ${type}`;
      el.innerHTML = `
        <div class="notif-icon">${icons[type] || '📢'}</div>
        <div class="notif-body">
          <div class="notif-title">${title}</div>
          <div class="notif-msg">${msg}</div>
        </div>
      `;
      document.getElementById('notif-stack').appendChild(el);
      setTimeout(() => {
        el.style.opacity = '0';
        el.style.transform = 'translateX(28px)';
        setTimeout(() => el.remove(), 420);
      }, 4500);
    },
  
    // ===== TICKER =====
    startTicker() {
      setInterval(async () => {
        try {
          const fin = await API.getFinance();
          const stocks = fin.stocks;
          const track  = document.getElementById('ticker-content');
          if (!track || !stocks.length) return;
          const items = stocks.map(s => {
            const cls = s.change_pct >= 0 ? 't-up' : 't-down';
            const icon = s.change_pct >= 0 ? '▲' : '▼';
            return `<span class="${cls}">✈ ${s.airline.split(' ')[0].toUpperCase()} $${s.price.toFixed(2)} ${icon}${Math.abs(s.change_pct).toFixed(2)}%</span>`;
          });
          const doubled = [...items, ...items].join('');
          track.innerHTML = doubled;
        } catch {}
      }, 15000);
    },
  
    // ===== NAV =====
    bindNav() {
      document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
          const view = item.dataset.view;
          if (view) this.showView(view);
        });
      });
    },
  
    bindTopActions() {
      document.getElementById('btn-advance')?.addEventListener('click', () => this.advanceDay());
      document.getElementById('btn-reset')?.addEventListener('click', () => {
        if (confirm('Reset all progress and start over?')) location.reload();
      });
      document.getElementById('modal-overlay')?.addEventListener('click', e => {
        if (e.target === e.currentTarget) this.closeModal();
      });
    },
  
    // ===== HELPERS =====
    fmt(n) {
      const abs  = Math.abs(n || 0);
      const sign = n < 0 ? '-' : '';
      if (abs >= 1_000_000_000) return sign + '$' + (abs / 1_000_000_000).toFixed(2) + 'B';
      if (abs >= 1_000_000)     return sign + '$' + (abs / 1_000_000).toFixed(2) + 'M';
      if (abs >= 1_000)         return sign + '$' + (abs / 1_000).toFixed(1) + 'K';
      return sign + '$' + Math.round(abs).toLocaleString();
    },
  
    fmtNum(n) {
      if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
      if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K';
      return (n || 0).toLocaleString();
    },
  
    repStars(rep) {
      const full  = Math.floor(rep);
      const empty = 5 - full;
      return '★'.repeat(full) + '☆'.repeat(empty);
    },
  
    setText(id, val) {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    },
  
    setWidth(id, pct) {
      const el = document.getElementById(id);
      if (el) el.style.width = Math.min(100, pct) + '%';
    },
  };
  
  // ===== BOOT =====
  document.addEventListener('DOMContentLoaded', () => App.init());