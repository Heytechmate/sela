// ===== SKYEMPIRE WORLD MAP =====
// Leaflet.js interactive map with airports, routes and competitors

const SkyMap = {
    map: null,
    airportMarkers: {},
    routeLayers: [],
    initialized: false,
  
    init() {
      if (this.initialized) return;
  
      this.map = L.map('map', {
        center: [25, 55],
        zoom: 3,
        minZoom: 2,
        maxZoom: 8,
        zoomControl: true,
        attributionControl: false,
      });
  
      // Dark tile layer
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '©OpenStreetMap ©CartoDB',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(this.map);
  
      this.initialized = true;
      console.log('🗺 Map initialized');
    },
  
    // ===== AIRPORT ICONS =====
    getAirportIcon(size, isHub = false) {
      const colors = {
        hub:    { bg: '#f0b429', border: '#c88a00', size: 14 },
        large:  { bg: '#00c8ff', border: '#0084ff', size: 11 },
        medium: { bg: '#6a85b0', border: '#3a5080', size: 8  },
        small:  { bg: '#3a5080', border: '#1a2d52', size: 6  },
      };
      const c = colors[size] || colors.medium;
      return L.divIcon({
        className: '',
        html: `<div style="
          width:${c.size}px; height:${c.size}px;
          background:${c.bg}; border:2px solid ${c.border};
          border-radius:50%;
          box-shadow: 0 0 ${isHub ? 10 : 5}px ${c.bg}88;
          cursor:pointer;
        "></div>`,
        iconSize: [c.size, c.size],
        iconAnchor: [c.size / 2, c.size / 2],
      });
    },
  
    // ===== LOAD AIRPORTS =====
    async loadAirports() {
      try {
        const airports = await API.getAirports();
        airports.forEach(ap => {
          const icon = this.getAirportIcon(ap.size, ap.size === 'hub');
          const marker = L.marker([ap.lat, ap.lon], { icon })
            .addTo(this.map)
            .bindTooltip(`
              <div style="font-family:'Exo 2',sans-serif; font-size:12px; background:#0d1628; border:1px solid #1a2d52; border-radius:6px; padding:8px 12px; color:#c8d8f0;">
                <div style="font-weight:700; color:#00c8ff; font-size:14px;">${ap.code}</div>
                <div>${ap.city}, ${ap.country}</div>
                <div style="color:#6a85b0; font-size:11px; margin-top:2px;">${ap.name}</div>
                <div style="color:#f0b429; font-size:11px; margin-top:4px;">Click to open route from here</div>
              </div>
            `, {
              permanent: false,
              direction: 'top',
              offset: [0, -8],
              opacity: 1,
            });
  
          marker.on('click', () => {
            this.onAirportClick(ap);
          });
  
          this.airportMarkers[ap.code] = { marker, data: ap };
        });
  
        console.log(`✅ Loaded ${airports.length} airports`);
      } catch (err) {
        console.error('Failed to load airports:', err);
      }
    },
  
    // ===== AIRPORT CLICK =====
    onAirportClick(airport) {
      // Trigger route opening UI from app.js
      if (typeof App !== 'undefined' && App.onMapAirportClick) {
        App.onMapAirportClick(airport);
      }
    },
  
    // ===== DRAW ROUTE =====
    drawRoute(fromLat, fromLon, toLat, toLon, options = {}) {
      const {
        color = '#00c8ff',
        weight = 2,
        opacity = 0.7,
        dashed = false,
        label = '',
      } = options;
  
      // Curved arc using intermediate points
      const points = this.generateArc(fromLat, fromLon, toLat, toLon);
  
      const lineOptions = {
        color,
        weight,
        opacity,
        smoothFactor: 1,
      };
  
      if (dashed) {
        lineOptions.dashArray = '6, 8';
      }
  
      const line = L.polyline(points, lineOptions).addTo(this.map);
  
      if (label) {
        line.bindTooltip(label, {
          permanent: false,
          sticky: true,
          opacity: 0.9,
        });
      }
  
      this.routeLayers.push(line);
      return line;
    },
  
    // ===== ARC GENERATION =====
    generateArc(lat1, lon1, lat2, lon2, numPoints = 50) {
      const points = [];
      for (let i = 0; i <= numPoints; i++) {
        const t = i / numPoints;
        // Interpolate with slight upward curve
        const lat = lat1 + (lat2 - lat1) * t;
        const lon = lon1 + (lon2 - lon1) * t;
        // Add curve offset
        const curvature = Math.sin(Math.PI * t) * this.getArcHeight(lat1, lon1, lat2, lon2);
        points.push([lat + curvature, lon]);
      }
      return points;
    },
  
    getArcHeight(lat1, lon1, lat2, lon2) {
      const dist = Math.sqrt(Math.pow(lat2 - lat1, 2) + Math.pow(lon2 - lon1, 2));
      return dist * 0.15;
    },
  
    // ===== CLEAR ROUTES =====
    clearRoutes() {
      this.routeLayers.forEach(layer => this.map.removeLayer(layer));
      this.routeLayers = [];
    },
  
    // ===== REFRESH ROUTES =====
    async refreshRoutes() {
      this.clearRoutes();
      try {
        const data = await API.getMapData();
  
        // Draw player routes
        data.routes.forEach(r => {
          const profitColor = r.profit >= 0 ? '#00e676' : '#ff3d5a';
          this.drawRoute(r.from_lat, r.from_lon, r.to_lat, r.to_lon, {
            color: profitColor,
            weight: 2.5,
            opacity: 0.8,
            label: `
              <div style="font-family:'Exo 2',sans-serif; background:#0d1628; border:1px solid #1a2d52; border-radius:6px; padding:8px 12px; font-size:12px; color:#c8d8f0;">
                <div style="font-weight:700; color:#00c8ff;">${r.from} ↔ ${r.to}</div>
                <div style="color:${profitColor};">${r.profit >= 0 ? '+' : ''}$${Math.round(r.profit).toLocaleString()}/day</div>
              </div>
            `,
          });
        });
  
        // Draw competitor hub markers
        data.competitors.forEach(comp => {
          const hubAp = this.airportMarkers[comp.hub];
          if (hubAp) {
            L.circle([hubAp.data.lat, hubAp.data.lon], {
              radius: 80000,
              color: '#ff7a00',
              fillColor: '#ff7a0022',
              fillOpacity: 0.2,
              weight: 1,
            }).addTo(this.map).bindTooltip(`
              <div style="font-family:'Exo 2',sans-serif; background:#0d1628; border:1px solid #1a2d52; border-radius:6px; padding:8px 12px; font-size:12px; color:#c8d8f0;">
                <div style="font-weight:700; color:#ff7a00;">${comp.emoji} ${comp.name}</div>
                <div style="color:#6a85b0;">Hub: ${comp.hub}</div>
              </div>
            `);
          }
        });
  
      } catch (err) {
        console.error('Failed to refresh routes:', err);
      }
    },
  
    // ===== HIGHLIGHT AIRPORT =====
    highlightAirport(code, active = true) {
      const ap = this.airportMarkers[code];
      if (!ap) return;
      if (active) {
        ap.marker.setIcon(L.divIcon({
          className: '',
          html: `<div style="
            width:16px; height:16px;
            background:#f0b429; border:2px solid #fff;
            border-radius:50%;
            box-shadow: 0 0 14px #f0b42999;
            animation: pulse 1s infinite;
          "></div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        }));
      } else {
        ap.marker.setIcon(this.getAirportIcon(ap.data.size));
      }
    },
  
    // ===== FLY TO AIRPORT =====
    flyTo(code) {
      const ap = this.airportMarkers[code];
      if (ap) {
        this.map.flyTo([ap.data.lat, ap.data.lon], 5, { duration: 1.2 });
      }
    },
  
    // ===== FIT ROUTES =====
    fitToRoutes() {
      if (this.routeLayers.length > 0) {
        const group = L.featureGroup(this.routeLayers);
        this.map.fitBounds(group.getBounds().pad(0.2));
      }
    },
  };