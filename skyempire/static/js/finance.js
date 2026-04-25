// ===== SKYEMPIRE FINANCE & STOCK MARKET =====

const Finance = {
    stockChart: null,
    profitChart: null,
    stockHistory: {},
    profitHistory: { labels: [], revenue: [], costs: [], profit: [] },
  
    // ===== INIT CHARTS =====
    initCharts() {
      this.initStockChart();
      this.initProfitChart();
    },
  
    // ===== STOCK CHART =====
    initStockChart() {
      const ctx = document.getElementById('stock-chart');
      if (!ctx) return;
  
      this.stockChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: [],
          datasets: [],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: { duration: 400 },
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: {
              labels: {
                color: '#6a85b0',
                font: { family: 'Exo 2', size: 12 },
                boxWidth: 12,
              },
            },
            tooltip: {
              backgroundColor: '#0d1628',
              borderColor: '#1a2d52',
              borderWidth: 1,
              titleColor: '#00c8ff',
              bodyColor: '#c8d8f0',
              padding: 10,
              callbacks: {
                label: ctx => ` ${ctx.dataset.label}: $${ctx.parsed.y.toFixed(2)}`,
              },
            },
          },
          scales: {
            x: {
              ticks: { color: '#3a5080', font: { size: 10 } },
              grid:  { color: 'rgba(26,45,82,0.4)' },
            },
            y: {
              ticks: {
                color: '#6a85b0',
                font: { family: 'Share Tech Mono', size: 11 },
                callback: v => '$' + v.toFixed(2),
              },
              grid: { color: 'rgba(26,45,82,0.4)' },
            },
          },
        },
      });
    },
  
    // ===== PROFIT CHART =====
    initProfitChart() {
      const ctx = document.getElementById('profit-chart');
      if (!ctx) return;
  
      this.profitChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: [],
          datasets: [
            {
              label: 'Revenue',
              data: [],
              backgroundColor: 'rgba(0,200,255,0.25)',
              borderColor: '#00c8ff',
              borderWidth: 1,
              borderRadius: 4,
            },
            {
              label: 'Costs',
              data: [],
              backgroundColor: 'rgba(255,61,90,0.25)',
              borderColor: '#ff3d5a',
              borderWidth: 1,
              borderRadius: 4,
            },
            {
              label: 'Profit',
              data: [],
              backgroundColor: 'rgba(0,230,118,0.25)',
              borderColor: '#00e676',
              borderWidth: 1,
              borderRadius: 4,
              type: 'line',
              tension: 0.4,
              fill: false,
              pointRadius: 3,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: { duration: 400 },
          plugins: {
            legend: {
              labels: {
                color: '#6a85b0',
                font: { family: 'Exo 2', size: 12 },
                boxWidth: 12,
              },
            },
            tooltip: {
              backgroundColor: '#0d1628',
              borderColor: '#1a2d52',
              borderWidth: 1,
              titleColor: '#00c8ff',
              bodyColor: '#c8d8f0',
              padding: 10,
              callbacks: {
                label: ctx => ` ${ctx.dataset.label}: $${Math.round(ctx.parsed.y).toLocaleString()}`,
              },
            },
          },
          scales: {
            x: {
              ticks: { color: '#3a5080', font: { size: 10 } },
              grid:  { color: 'rgba(26,45,82,0.4)' },
            },
            y: {
              ticks: {
                color: '#6a85b0',
                font: { family: 'Share Tech Mono', size: 11 },
                callback: v => '$' + (v >= 1000 ? (v/1000).toFixed(0)+'K' : v),
              },
              grid: { color: 'rgba(26,45,82,0.4)' },
            },
          },
        },
      });
    },
  
    // ===== UPDATE STOCK CHART =====
    updateStockChart(stocks, day) {
      if (!this.stockChart) return;
  
      const label = `Day ${day}`;
      const colors = {
        'SkyEmpire Airlines': '#00c8ff',
        'Gulf Wings':         '#f0b429',
        'Arabian Sky':        '#00e676',
        'Eastern Connect':    '#a855f7',
        'Atlas Air':          '#ff3d5a',
      };
  
      // Init history
      stocks.forEach(s => {
        if (!this.stockHistory[s.airline]) {
          this.stockHistory[s.airline] = [];
        }
        this.stockHistory[s.airline].push(s.price);
        // Keep last 30 days
        if (this.stockHistory[s.airline].length > 30) {
          this.stockHistory[s.airline].shift();
        }
      });
  
      // Build labels
      const maxLen = Math.max(...Object.values(this.stockHistory).map(h => h.length));
      const labels = Array.from({ length: maxLen }, (_, i) => `Day ${day - maxLen + i + 1}`);
  
      this.stockChart.data.labels = labels;
      this.stockChart.data.datasets = stocks.map(s => ({
        label: s.airline,
        data: this.stockHistory[s.airline] || [],
        borderColor: colors[s.airline] || '#6a85b0',
        backgroundColor: (colors[s.airline] || '#6a85b0') + '18',
        borderWidth: 2,
        tension: 0.4,
        fill: false,
        pointRadius: 2,
        pointHoverRadius: 5,
      }));
  
      this.stockChart.update();
    },
  
    // ===== UPDATE PROFIT CHART =====
    updateProfitChart(day, revenue, costs, profit) {
      if (!this.profitChart) return;
  
      this.profitHistory.labels.push(`Day ${day}`);
      this.profitHistory.revenue.push(Math.round(revenue));
      this.profitHistory.costs.push(Math.round(costs));
      this.profitHistory.profit.push(Math.round(profit));
  
      // Keep last 20 days
      if (this.profitHistory.labels.length > 20) {
        this.profitHistory.labels.shift();
        this.profitHistory.revenue.shift();
        this.profitHistory.costs.shift();
        this.profitHistory.profit.shift();
      }
  
      this.profitChart.data.labels                  = this.profitHistory.labels;
      this.profitChart.data.datasets[0].data        = this.profitHistory.revenue;
      this.profitChart.data.datasets[1].data        = this.profitHistory.costs;
      this.profitChart.data.datasets[2].data        = this.profitHistory.profit;
      this.profitChart.update();
    },
  
    // ===== RENDER FINANCE VIEW =====
    async render() {
      try {
        const data = await API.getFinance();
        this.renderSummary(data);
        this.renderStocks(data.stocks);
        this.renderLoans(data.loans, data.loan_options);
        this.renderTransactions(data.transactions);
      } catch (err) {
        console.error('Finance render error:', err);
      }
    },
  
    // ===== SUMMARY CARDS =====
    renderSummary(data) {
      const profit = data.total_revenue - data.total_costs;
      const el = document.getElementById('finance-summary');
      if (!el) return;
      el.innerHTML = `
        <div class="grid-4 mb-16">
          <div class="card card-gold">
            <div class="card-label">Total Revenue</div>
            <div class="card-value">${App.fmt(data.total_revenue)}</div>
            <div class="card-sub">Lifetime earnings</div>
          </div>
          <div class="card ${profit >= 0 ? 'card-green' : 'card-red'}">
            <div class="card-label">Net Profit</div>
            <div class="card-value ${profit >= 0 ? 'green' : 'red'}">${App.fmt(profit)}</div>
            <div class="card-sub ${profit >= 0 ? 'up' : 'down'}">${profit >= 0 ? '↑ Profitable' : '↓ Operating loss'}</div>
          </div>
          <div class="card">
            <div class="card-label">Total Costs</div>
            <div class="card-value red">${App.fmt(data.total_costs)}</div>
            <div class="card-sub">All expenses</div>
          </div>
          <div class="card">
            <div class="card-label">Loan Balance</div>
            <div class="card-value ${data.loan_balance > 0 ? 'red' : 'green'}">${App.fmt(data.loan_balance)}</div>
            <div class="card-sub">${data.loan_balance > 0 ? 'Outstanding debt' : 'Debt free ✅'}</div>
          </div>
        </div>
      `;
    },
  
    // ===== STOCK MARKET =====
    renderStocks(stocks) {
      const el = document.getElementById('stock-list');
      if (!el) return;
      el.innerHTML = stocks.map(s => {
        const changeClass = s.change_pct >= 0 ? 'stock-change-up' : 'stock-change-down';
        const changeIcon  = s.change_pct >= 0 ? '▲' : '▼';
        return `
          <div class="stock-row">
            <div>
              <div class="stock-name">${s.airline}</div>
              <div class="stock-ticker">52W: $${s.low_52w.toFixed(2)} — $${s.high_52w.toFixed(2)}
                ${s.volatile ? '<span class="badge badge-red" style="margin-left:6px;">⚡ VOLATILE</span>' : ''}
              </div>
            </div>
            <div style="text-align:right;">
              <div class="stock-price">$${s.price.toFixed(2)}</div>
              <div class="${changeClass}">${changeIcon} ${Math.abs(s.change_pct).toFixed(2)}%</div>
            </div>
            <div style="display:flex; gap:6px; margin-left:16px;">
              <button class="btn btn-green btn-sm" onclick="Finance.showBuyStock('${s.airline}', ${s.price})">Buy</button>
              ${s.shares_owned > 0
                ? `<button class="btn btn-danger btn-sm" onclick="Finance.showSellStock('${s.airline}', ${s.price}, ${s.shares_owned})">Sell (${s.shares_owned})</button>`
                : ''
              }
            </div>
          </div>
        `;
      }).join('');
    },
  
    // ===== LOANS =====
    renderLoans(activeLoans, loanOptions) {
      const el = document.getElementById('loan-section');
      if (!el) return;
  
      const activeHtml = activeLoans.length ? activeLoans.map(l => `
        <div class="loan-card">
          <div class="flex-between mb-8">
            <span class="badge badge-red">Active Loan</span>
            <span class="mono gold">$${Math.round(l.remaining).toLocaleString()} remaining</span>
          </div>
          <div style="font-size:12px; color:var(--text2);">
            Daily payment: <span class="mono">$${Math.round(l.daily_payment).toLocaleString()}</span>
            &nbsp;•&nbsp; Due: Day ${l.due_on_day}
            &nbsp;•&nbsp; Rate: ${(l.interest_rate * 100).toFixed(0)}%
          </div>
          <div class="progress-bar mt-4">
            <div class="progress-fill red" style="width:${Math.min(100, (l.remaining / l.amount) * 100)}%"></div>
          </div>
        </div>
      `).join('') : `<div style="color:var(--green); font-size:13px; margin-bottom:12px;">✅ No active loans — you are debt free!</div>`;
  
      const optionsHtml = loanOptions.map(o => `
        <div class="loan-card">
          <div class="flex-between mb-8">
            <div>
              <div style="font-size:15px; font-weight:700; color:var(--text);">${o.name}</div>
              <div style="font-size:12px; color:var(--text2);">${o.description}</div>
            </div>
            <span class="badge badge-gold">$${(o.amount/1_000_000).toFixed(0)}M</span>
          </div>
          <div style="font-size:12px; color:var(--text2);">
            Interest: <span class="mono red">${(o.interest_rate * 100).toFixed(0)}%</span>
            &nbsp;•&nbsp; Duration: <span class="mono">${o.duration_days} days</span>
            &nbsp;•&nbsp; Daily: <span class="mono">$${Math.round(o.daily_payment).toLocaleString()}</span>
          </div>
          <button class="btn btn-gold btn-sm mt-8" onclick="Finance.takeLoan('${o.id}', '${o.name}', ${o.amount})">
            💰 Take Loan
          </button>
        </div>
      `).join('');
  
      el.innerHTML = `
        <div style="font-size:13px; font-weight:700; color:var(--text2); letter-spacing:2px; text-transform:uppercase; margin-bottom:10px;">Active Loans</div>
        ${activeHtml}
        <div style="font-size:13px; font-weight:700; color:var(--text2); letter-spacing:2px; text-transform:uppercase; margin:16px 0 10px;">Available Loans</div>
        ${optionsHtml}
      `;
    },
  
    // ===== TRANSACTIONS =====
    renderTransactions(transactions) {
      const el = document.getElementById('tx-list');
      if (!el) return;
      if (!transactions.length) {
        el.innerHTML = '<div style="color:var(--text3); font-size:13px;">No transactions yet.</div>';
        return;
      }
      el.innerHTML = transactions.map(t => `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:9px 0; border-bottom:1px solid rgba(26,45,82,0.35);">
          <div>
            <div style="font-size:13px; color:var(--text);">${t.description}</div>
            <div style="font-size:10px; color:var(--text3); font-family:'Share Tech Mono',monospace;">Day ${t.day} • ${t.category}</div>
          </div>
          <div style="text-align:right;">
            <div class="mono" style="color:${t.amount >= 0 ? 'var(--green)' : 'var(--red)'}; font-size:14px; font-weight:700;">
              ${t.amount >= 0 ? '+' : ''}$${Math.abs(Math.round(t.amount)).toLocaleString()}
            </div>
            <div style="font-size:10px; color:var(--text3);">Bal: $${Math.round(t.balance_after).toLocaleString()}</div>
          </div>
        </div>
      `).join('');
    },
  
    // ===== BUY STOCK MODAL =====
    showBuyStock(airline, price) {
      const html = `
        <div class="modal-title">📈 Buy Stock — ${airline}</div>
        <div class="modal-row">
          <span class="modal-lbl">Current Price</span>
          <span class="modal-val gold">$${price.toFixed(2)}</span>
        </div>
        <div class="modal-row">
          <span class="modal-lbl">Shares to Buy</span>
          <input type="number" id="buy-shares" value="100" min="1" max="10000" style="max-width:140px;">
        </div>
        <div class="modal-row">
          <span class="modal-lbl">Estimated Cost</span>
          <span class="modal-val" id="buy-cost">$${(price * 100).toLocaleString()}</span>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" onclick="App.closeModal()">Cancel</button>
          <button class="btn btn-primary" onclick="Finance.confirmBuyStock('${airline}', ${price})">✅ Buy</button>
        </div>
      `;
      App.showModal(html);
  
      document.getElementById('buy-shares').addEventListener('input', e => {
        const shares = parseInt(e.target.value) || 0;
        document.getElementById('buy-cost').textContent = '$' + (price * shares).toLocaleString();
      });
    },
  
    async confirmBuyStock(airline, price) {
      const shares = parseInt(document.getElementById('buy-shares').value);
      if (!shares || shares < 1) { App.notify('⚠️ Invalid', 'Enter a valid number of shares.', 'red'); return; }
      try {
        const res = await API.buyStock(airline, shares);
        App.closeModal();
        App.notify('📈 Shares Purchased!', `Bought ${shares} shares of ${airline} for $${(price * shares).toLocaleString()}`, 'green');
        App.updateTopStats();
        this.render();
      } catch (err) {
        App.notify('⚠️ Purchase Failed', err.message, 'red');
      }
    },
  
    // ===== SELL STOCK MODAL =====
    showSellStock(airline, price, owned) {
      const html = `
        <div class="modal-title">📉 Sell Stock — ${airline}</div>
        <div class="modal-row">
          <span class="modal-lbl">Current Price</span>
          <span class="modal-val gold">$${price.toFixed(2)}</span>
        </div>
        <div class="modal-row">
          <span class="modal-lbl">Shares Owned</span>
          <span class="modal-val blue">${owned}</span>
        </div>
        <div class="modal-row">
          <span class="modal-lbl">Shares to Sell</span>
          <input type="number" id="sell-shares" value="${owned}" min="1" max="${owned}" style="max-width:140px;">
        </div>
        <div class="modal-row">
          <span class="modal-lbl">Estimated Revenue</span>
          <span class="modal-val green" id="sell-rev">$${(price * owned).toLocaleString()}</span>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" onclick="App.closeModal()">Cancel</button>
          <button class="btn btn-danger" onclick="Finance.confirmSellStock('${airline}', ${price}, ${owned})">💰 Sell</button>
        </div>
      `;
      App.showModal(html);
  
      document.getElementById('sell-shares').addEventListener('input', e => {
        const shares = parseInt(e.target.value) || 0;
        document.getElementById('sell-rev').textContent = '$' + (price * shares).toLocaleString();
      });
    },
  
    async confirmSellStock(airline, price, maxOwned) {
      const shares = parseInt(document.getElementById('sell-shares').value);
      if (!shares || shares < 1 || shares > maxOwned) { App.notify('⚠️ Invalid', 'Enter a valid number of shares.', 'red'); return; }
      try {
        await API.sellStock(airline, shares);
        App.closeModal();
        App.notify('💰 Shares Sold!', `Sold ${shares} shares of ${airline} for $${(price * shares).toLocaleString()}`, 'gold');
        App.updateTopStats();
        this.render();
      } catch (err) {
        App.notify('⚠️ Sale Failed', err.message, 'red');
      }
    },
  
    // ===== TAKE LOAN =====
    async takeLoan(loanType, name, amount) {
      try {
        await API.takeLoan(loanType);
        App.notify('💰 Loan Approved!', `${name} — $${(amount/1_000_000).toFixed(0)}M credited to your account.`, 'gold');
        App.updateTopStats();
        this.render();
      } catch (err) {
        App.notify('⚠️ Loan Denied', err.message, 'red');
      }
    },
  };