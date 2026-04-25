// 1. MENU DATA CONFIGURATION
// Edit this object to change items, prices, or descriptions.
const menuData = {
  signature: {
    title: "Focus Flight",
    price: "2,900",
    description: "Three 120ml pours to set your pace",
    badge: "Signature",
    items: [
      { name: "Lemongrass Cold Brew", price: "1,100" },
      { name: "Yuzu Spark", price: "1,200" },
      { name: "Cacao Calm", price: "1,200" }
    ]
  },
  categories: [
    {
      id: "cold-brew",
      title: "Cold Brew",
      featured: true, // Shows on homepage
      items: [
        { name: "Colombo Classic", price: "1,100", desc: "Single-origin cold brew, chocolate notes" },
        { name: "Coconut Drift", price: "1,200", desc: "Cold brew, toasted coconut, light sweetness" },
        { name: "Orange Peel Tonic", price: "1,250", desc: "Brew over ice with bitter orange tonic" }
      ]
    },
    {
      id: "sparkling",
      title: "Sparkling",
      featured: true,
      items: [
        { name: "Ginger Zest", price: "1,100", desc: "Fresh ginger, lime leaf, soda" },
        { name: "Pink Pomelo", price: "1,200", desc: "Pomelo, rosemary, bubbles, no added sugar" },
        { name: "Espresso Spritz", price: "1,300", desc: "Light espresso, tonic, orange mist" }
      ]
    },
    {
      id: "tea-lab",
      title: "Tea Lab",
      featured: true,
      items: [
        { name: "Jasmine Cloud", price: "950", desc: "Jasmine green, lychee peel, light honey" },
        { name: "Ceylon Gold", price: "900", desc: "Single-estate black, bergamot, milk optional" },
        { name: "Spiced Chai Oat", price: "1,050", desc: "Cardamom, clove, oat milk micro-foam" }
      ]
    },
    {
      id: "comfort",
      title: "Comfort",
      featured: false, // Modal only
      items: [
        { name: "Cacao Cozy", price: "1,100", desc: "Dark cacao, cinnamon, oat, sea salt" },
        { name: "Lavender Latte", price: "1,150", desc: "House espresso, lavender syrup, steamed milk" },
        { name: "Golden Calm", price: "1,000", desc: "Turmeric, ginger, pepper, coconut milk" }
      ]
    },
    {
      id: "snacks",
      title: "Snacks", // Display title for homepage
      modalTitle: "Snacks & Bites", // specific title for modal if different
      featured: true,
      items: [
        { name: "Pol Roti Chips", price: "950", desc: "Coconut flatbread crisps, mango salsa" },
        { name: "Hummus Trio", price: "1,350", desc: "Beet, classic, green chili with crudités" },
        { name: "Protein Oat Bar", price: "750", desc: "House-made oats, seeds, cacao nibs" }
      ]
    },
    {
      id: "boosts",
      title: "Boosts",
      featured: false,
      items: [
        { name: "Focus Shot", price: "450", desc: "L-theanine + B12" },
        { name: "Protein Oat Boost", price: "650", desc: "15g plant protein" },
        { name: "Chill Drop", price: "450", desc: "Chamomile + magnesium" }
      ]
    }
  ]
};

// 2. HELPER FUNCTIONS TO GENERATE HTML
function renderFeaturedMenu() {
  const cats = menuData.categories.filter(c => c.featured);
  return cats.map(cat => `
    <div class="menu-category">
      <h4>${cat.title}</h4>
      <ul>
        ${cat.items.map(item => `
          <li><span>${item.name}</span><span>${item.price}</span></li>
        `).join('')}
      </ul>
    </div>
  `).join('');
}

function renderFullMenu() {
  // First render the Signature Flight manually as it has unique structure
  let html = `
    <div class="menu-category-full">
      <h4>Signature Flight</h4>
      <div class="menu-item-full">
        <div>
          <strong>${menuData.signature.title} · LKR ${menuData.signature.price}</strong>
          <p>${menuData.signature.description}</p>
        </div>
      </div>
      ${menuData.signature.items.map(item => `
        <div class="menu-item-full">
          <div>
            <strong>${item.name}</strong>
            <p>Included in flight</p>
          </div>
          <span class="price">${item.price}</span>
        </div>
      `).join('')}
    </div>
  `;

  // Render rest of categories
  html += menuData.categories.map(cat => `
    <div class="menu-category-full">
      <h4>${cat.modalTitle || cat.title}</h4>
      ${cat.items.map(item => `
        <div class="menu-item-full">
          <div>
            <strong>${item.name}</strong>
            <p>${item.desc}</p>
          </div>
          <span class="price">${item.price}</span>
        </div>
      `).join('')}
    </div>
  `).join('');

  return html;
}

// 3. MAIN RENDER FUNCTION
const markup = `
  <header class="header">
    <div class="header__inner">
      <div class="brand">
        <span class="logo">⏱️</span>
        <span class="name">OverTime</span>
      </div>
      <nav class="nav">
        <a href="#home">Home</a>
        <a href="#menu">Menu</a>
        <a href="#spaces">Spaces</a>
        <a href="#membership">Membership</a>
      </nav>
      <div class="header__actions">
        <button class="btn-text" data-menu-open>Menu</button>
        <button class="btn-primary" data-auth-open>Join</button>
      </div>
    </div>
  </header>

  <main>
    <section class="hero" id="home">
      <div class="hero__content">
        <div class="hero__text">
          <p class="hero__location">Colombo · Sri Lanka</p>
          <h1 class="hero__title">
            <span class="title-line">Late-night</span>
            <span class="title-line">café for</span>
            <span class="title-line highlight">calm minds</span>
          </h1>
          <p class="hero__desc">
            Zero-proof bar first. Specialty coffee, tea lab, tonics, comfort snacks. Add quiet pods, creative nooks, membership-only deep work floors. No nightlife chaos—just focus and ease.
          </p>
          <div class="hero__cta">
            <button class="btn-large" data-menu-open>View Menu</button>
            <a href="#membership" class="btn-link">See Membership →</a>
          </div>
        </div>
        <div class="hero__side">
          <div class="floating-card card-1">
            <div class="card-number">01</div>
            <h3>12+ Zero-Proof</h3>
            <p>Cold brew, tea lab, sparkling tonics</p>
          </div>
          <div class="floating-card card-2">
            <div class="card-number">02</div>
            <h3>Comfort Bites</h3>
            <p>Pol roti chips, hummus, oat bars</p>
          </div>
          <div class="floating-card card-3">
            <div class="card-number">03</div>
            <h3>Quiet Spaces</h3>
            <p>Pods, craft tables, board games</p>
          </div>
        </div>
      </div>
      <div class="hero__status">
        <div class="status-item">
          <span class="status-label">Tonight</span>
          <span class="status-value">6 seats open</span>
        </div>
        <div class="status-item">
          <span class="status-label">Pods</span>
          <span class="status-value">2 available</span>
        </div>
        <div class="status-item">
          <span class="status-label">Hours</span>
          <span class="status-value">3 PM – 1 AM</span>
        </div>
      </div>
    </section>

    <section class="menu-section" id="menu">
      <div class="section-intro">
        <span class="section-number">01</span>
        <div>
          <p class="section-label">Café Menu</p>
          <h2 class="section-title">Zero-proof bar with<br />Sri Lankan warmth</h2>
        </div>
      </div>
      <div class="menu-showcase">
        <div class="menu-featured">
          <div class="featured-badge">${menuData.signature.badge}</div>
          <h3>${menuData.signature.title}</h3>
          <p class="featured-desc">${menuData.signature.description}</p>
          <div class="featured-items">
            ${menuData.signature.items.map(item => `
              <div class="featured-item">
                <span>${item.name}</span>
                <span class="price">LKR ${item.price}</span>
              </div>
            `).join('')}
          </div>
          <div class="featured-total">LKR ${menuData.signature.price}</div>
        </div>
        <div class="menu-grid">
          ${renderFeaturedMenu()}
        </div>
      </div>
      <button class="btn-outline" data-menu-open>View Full Menu</button>
    </section>

    <section class="spaces-section" id="spaces">
      <div class="section-intro">
        <span class="section-number">02</span>
        <div>
          <p class="section-label">Spaces</p>
          <h2 class="section-title">Choose your<br />pace</h2>
        </div>
      </div>
      <div class="spaces-grid">
        <div class="space-card">
          <div class="space-icon">Focus</div>
          <h3>Deep Work Rooms</h3>
          <p>Noise-zoned pods, ergonomic seats, monitor docks</p>
        </div>
        <div class="space-card">
          <div class="space-icon">Make</div>
          <h3>Maker Tables</h3>
          <p>Paint, craft, prototype with easy-clean setups</p>
        </div>
        <div class="space-card">
          <div class="space-icon">Play</div>
          <h3>Board Game Lounge</h3>
          <p>Soft banquettes, curated games, snack-friendly</p>
        </div>
        <div class="space-card">
          <div class="space-icon">Rest</div>
          <h3>Sleep Pods</h3>
          <p>Ventilated pods, soft lighting, timed wake-ups</p>
        </div>
      </div>
    </section>

    <section class="membership-section" id="membership">
      <div class="section-intro">
        <span class="section-number">03</span>
        <div>
          <p class="section-label">Membership</p>
          <h2 class="section-title">Start with coffee,<br />add access later</h2>
        </div>
      </div>
      <div class="membership-cards">
        <div class="membership-card">
          <div class="membership-badge">Day Pass</div>
          <div class="membership-price">LKR 2,900</div>
          <p>Café + common zones. Includes one signature drink.</p>
          <ul>
            <li>Seat for 3 hours</li>
            <li>Wi‑Fi + charging</li>
            <li>Books + games access</li>
          </ul>
          <button class="btn-outline">Grab a pass</button>
        </div>
        <div class="membership-card featured">
          <div class="membership-badge">Focus Member</div>
          <div class="membership-price">LKR 19,900<span>/mo</span></div>
          <p>Unlimited quiet zone access, pod discounts, guest passes.</p>
          <ul>
            <li>Priority booking daily</li>
            <li>5 pod hours included</li>
            <li>2 guest passes / month</li>
          </ul>
          <button class="btn-primary">Become a member</button>
        </div>
        <div class="membership-card">
          <div class="membership-badge">Team Night</div>
          <div class="membership-price">LKR 49,000</div>
          <p>Up to 10 people · 4 hours · room + lounge + tea service.</p>
          <ul>
            <li>Private room booking</li>
            <li>Retro or game host</li>
            <li>Snacks & zero-proof pairings</li>
          </ul>
          <button class="btn-outline">Book the team</button>
        </div>
      </div>
    </section>

    <section class="contact-section" id="contact">
      <div class="contact-content">
        <div class="contact-text">
          <p class="section-label">Visit</p>
          <h2>Opening soon<br />in Colombo</h2>
          <p>Join the early list for invites, pre-opening passes, and member drops.</p>
          <form class="contact-form" data-newsletter>
            <input type="email" placeholder="you@example.com" required />
            <select>
              <option>Deep work</option>
              <option>Study</option>
              <option>Board games</option>
              <option>Creative nights</option>
              <option>Team sessions</option>
            </select>
            <button type="submit" class="btn-primary">Join the list</button>
          </form>
        </div>
        <div class="contact-info">
          <div class="info-block">
            <span class="info-label">Hours</span>
            <span>Weekdays 3 PM – 1 AM<br />Weekends 10 AM – 1 AM</span>
          </div>
          <div class="info-block">
            <span class="info-label">Address</span>
            <span>Colombo 07<br />Exact pin drops to members first</span>
          </div>
          <div class="info-block">
            <span class="info-label">Contact</span>
            <span>hello@overtimecafe.com<br />+94 (0)11 234 5678</span>
          </div>
        </div>
      </div>
    </section>
  </main>

  <footer class="footer">
    <div class="footer__content">
      <div class="brand">
        <span class="logo">⏱️</span>
        <span class="name">OverTime Café</span>
      </div>
      <p>Calm nights, creative energy, and community without the chaos.</p>
      <nav class="footer-nav">
        <a href="#menu">Menu</a>
        <a href="#spaces">Spaces</a>
        <a href="#membership">Membership</a>
        <a href="#contact">Visit</a>
      </nav>
    </div>
  </footer>

  <div class="menu-modal" data-menu-modal>
    <div class="modal-content">
      <div class="modal-header">
        <div>
          <p class="section-label">Full Menu</p>
          <h3>Café-first: drinks + bites</h3>
        </div>
        <button class="modal-close" data-menu-close>×</button>
      </div>
      <div class="modal-body">
        ${renderFullMenu()}
      </div>
    </div>
  </div>

  <div class="auth-modal" data-auth-modal>
    <div class="modal-content">
      <div class="modal-header">
        <div>
          <p class="section-label">Member Access</p>
          <h3>Login or create your account</h3>
        </div>
        <button class="modal-close" data-auth-close>×</button>
      </div>
      <div class="modal-body">
        <div class="auth-tabs">
          <button class="auth-tab active" data-auth-tab="login">Login</button>
          <button class="auth-tab" data-auth-tab="signup">Sign up</button>
        </div>
        <form class="auth-form" data-auth-form="login">
          <label>Email
            <input name="email" type="email" placeholder="you@example.com" required />
          </label>
          <label>Password
            <input name="password" type="password" placeholder="••••••••" required />
          </label>
          <div class="form-options">
            <label class="checkbox">
              <input type="checkbox" />
              <span>Remember me</span>
            </label>
            <a href="#" class="link">Forgot password?</a>
          </div>
          <button type="submit" class="btn-primary">Login</button>
        </form>
        <form class="auth-form hidden" data-auth-form="signup">
          <label>Full name
            <input name="name" type="text" placeholder="Amaya Perera" required />
          </label>
          <label>Email
            <input name="email" type="email" placeholder="you@example.com" required />
          </label>
          <label>Password
            <input name="password" type="password" placeholder="At least 8 characters" required />
          </label>
          <button type="submit" class="btn-primary">Create account</button>
        </form>
      </div>
    </div>
  </div>
`;

function render() {
  const app = document.getElementById("app");
  if (!app) return;
  app.innerHTML = markup;

  // Smooth scroll
  const links = app.querySelectorAll('a[href^="#"]');
  links.forEach((link) => {
    link.addEventListener("click", (e) => {
      const targetId = link.getAttribute("href");
      if (!targetId || targetId === "#") return;
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth" });
      }
    });
  });

  // Newsletter
  const newsletter = app.querySelector("[data-newsletter]");
  if (newsletter) {
    newsletter.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = newsletter.querySelector("input[type='email']")?.value;
      const intent = newsletter.querySelector("select")?.value;
      alert(`Thanks for joining! We'll reach out to ${email} about ${intent}.`);
    });
  }

  // Auth modal
  const authModal = app.querySelector("[data-auth-modal]");
  const authOpeners = app.querySelectorAll("[data-auth-open]");
  const authCloser = app.querySelector("[data-auth-close]");
  const authTabs = app.querySelectorAll("[data-auth-tab]");
  const authForms = app.querySelectorAll("[data-auth-form]");

  const openAuth = () => authModal?.classList.add("open");
  const closeAuth = () => authModal?.classList.remove("open");

  authOpeners.forEach((btn) => btn.addEventListener("click", openAuth));
  authCloser?.addEventListener("click", closeAuth);
  authModal?.addEventListener("click", (e) => {
    if (e.target === authModal) closeAuth();
  });

  authTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = tab.getAttribute("data-auth-tab");
      authTabs.forEach((t) => t.classList.toggle("active", t === tab));
      authForms.forEach((form) => {
        const isTarget = form.getAttribute("data-auth-form") === target;
        form.classList.toggle("hidden", !isTarget);
      });
    });
  });

  authForms.forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const formType = form.getAttribute("data-auth-form");
      const email = form.querySelector("input[type='email']")?.value;
      alert(`(${formType}) Ready to connect to Firebase for ${email}.`);
      closeAuth();
    });
  });

  // Menu modal
  const menuModal = app.querySelector("[data-menu-modal]");
  const menuOpeners = app.querySelectorAll("[data-menu-open]");
  const menuCloser = app.querySelector("[data-menu-close]");
  const openMenu = () => menuModal?.classList.add("open");
  const closeMenu = () => menuModal?.classList.remove("open");
  
  menuOpeners.forEach((btn) => btn.addEventListener("click", openMenu));
  menuCloser?.addEventListener("click", closeMenu);
  menuModal?.addEventListener("click", (e) => {
    if (e.target === menuModal) closeMenu();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeAuth();
      closeMenu();
    }
  });
}

render();