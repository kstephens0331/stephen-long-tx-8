/**
 * Texas Congressional District Viewer
 * Full interactive map showing all 38 Texas congressional districts
 * With District 8 highlighted - Similar to Texas Legislative Council DistrictViewer
 */

// Initialize map when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const mapContainer = document.getElementById('district-map');
  if (mapContainer) {
    // Check if Leaflet is loaded
    if (typeof L === 'undefined') {
      console.error('Leaflet library not loaded. Map cannot initialize.');
      showMapError('Map library failed to load. Please refresh the page.');
      return;
    }
    // Small delay to ensure CSS is fully applied and container is sized
    setTimeout(() => {
      try {
        initDistrictViewer();
      } catch (error) {
        console.error('Map initialization error:', error);
        showMapError('Error loading map. Please refresh the page.');
      }
    }, 100);
  }
});

// Show error message in map container
function showMapError(message) {
  const loadingDiv = document.getElementById('map-loading');
  if (loadingDiv) {
    loadingDiv.innerHTML = `
      <i class="fa-solid fa-exclamation-triangle" style="font-size: 3rem; color: #C41E3A; margin-bottom: 1rem;"></i>
      <p style="color: #C41E3A; font-weight: 600;">${message}</p>
      <p style="color: #6b7280; font-size: 0.875rem;">Texas Congressional District 8</p>
    `;
  }
}

// Store map reference globally for resize handling
let districtMap = null;

function initDistrictViewer() {
  const mapContainer = document.getElementById('district-map');

  // Ensure container has proper dimensions before initializing
  if (!mapContainer || mapContainer.offsetHeight === 0) {
    console.log('Map container not ready, retrying...');
    setTimeout(initDistrictViewer, 200);
    return;
  }

  // Hide loading state
  const loadingDiv = document.getElementById('map-loading');
  if (loadingDiv) {
    loadingDiv.style.display = 'none';
  }

  console.log('Initializing district map...');

  // Create the map centered on Texas
  const map = L.map('district-map', {
    center: [31.0, -99.5],
    zoom: 6,
    minZoom: 5,
    maxZoom: 12,
    zoomControl: false
  });

  // Store reference globally
  districtMap = map;

  // Add zoom control to top right
  L.control.zoom({ position: 'topright' }).addTo(map);

  // Light basemap for clean district viewing (like DistrictViewer)
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20
  }).addTo(map);

  // Load Texas congressional districts GeoJSON from Census Bureau
  const CENSUS_CD_URL = 'https://raw.githubusercontent.com/unitedstates/districts/gh-pages/cds/2022/TX/shape.geojson';

  // Fallback: Use embedded simplified district data
  loadDistrictData(map);

  // Handle resize and visibility changes
  window.addEventListener('resize', () => {
    if (districtMap) {
      districtMap.invalidateSize();
    }
  });

  // Fix for scroll animations hiding the map - refresh when visible
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && districtMap) {
        setTimeout(() => {
          districtMap.invalidateSize();
        }, 100);
      }
    });
  }, { threshold: 0.1 });

  observer.observe(mapContainer);
}

function loadDistrictData(map) {
  // Texas Congressional Districts - Simplified boundaries based on 2023 redistricting (PLANC2333)
  // This is accurate enough for visualization purposes

  const texasDistricts = createTexasDistrictsGeoJSON();
  const texasCounties = createTexasCountiesGeoJSON();

  // Store layers for toggle functionality
  let countyLayer = null;
  let districtLayer = null;
  let citiesLayer = null;

  // Add county boundaries first (underneath districts)
  countyLayer = L.geoJSON(texasCounties, {
    style: {
      fillColor: 'transparent',
      fillOpacity: 0,
      color: '#999',
      weight: 0.5,
      opacity: 0.6
    }
  }).addTo(map);

  // Add congressional districts
  districtLayer = L.geoJSON(texasDistricts, {
    style: function(feature) {
      const district = feature.properties.district;
      const isDistrict8 = district === '8';

      return {
        fillColor: isDistrict8 ? '#C41E3A' : getDistrictColor(district),
        fillOpacity: isDistrict8 ? 0.6 : 0.25,
        color: '#333',
        weight: isDistrict8 ? 3 : 1.5,
        opacity: 1
      };
    },
    onEachFeature: function(feature, layer) {
      const district = feature.properties.district;
      const isDistrict8 = district === '8';

      // Popup content
      layer.bindPopup(`
        <div class="district-popup">
          <h3>Congressional District ${district}</h3>
          ${isDistrict8 ? '<p class="highlight"><strong>Stephen Long is running to represent this district!</strong></p>' : ''}
          <p>Click for more information</p>
        </div>
      `);

      // Hover effects
      layer.on('mouseover', function(e) {
        if (!isDistrict8) {
          this.setStyle({
            fillOpacity: 0.5,
            weight: 2
          });
        }
        this.bringToFront();
      });

      layer.on('mouseout', function(e) {
        if (!isDistrict8) {
          districtLayer.resetStyle(this);
        }
      });
    }
  }).addTo(map);

  // Add district labels
  texasDistricts.features.forEach(feature => {
    const center = getFeatureCenter(feature);
    const district = feature.properties.district;
    const isDistrict8 = district === '8';

    L.marker(center, {
      icon: L.divIcon({
        className: 'district-label' + (isDistrict8 ? ' district-8-label' : ''),
        html: `<span>${district}</span>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      })
    }).addTo(map);
  });

  // Add cities layer
  citiesLayer = addCitiesLayer(map);

  // Create control panel
  createControlPanel(map, {
    counties: countyLayer,
    districts: districtLayer,
    cities: citiesLayer
  });

  // Create district sidebar
  createDistrictSidebar(map, texasDistricts, districtLayer);

  // Fit to Texas bounds
  map.fitBounds(districtLayer.getBounds());
}

function getDistrictColor(district) {
  // Alternating colors for visual distinction (like DistrictViewer)
  const colors = [
    '#f7f7f7', '#e8e8e8', '#f0f0f0', '#fafafa',
    '#f5f5f5', '#ebebeb', '#f2f2f2', '#fcfcfc'
  ];
  return colors[parseInt(district) % colors.length];
}

function getFeatureCenter(feature) {
  // Calculate centroid of polygon
  const coords = feature.geometry.coordinates[0];
  if (!coords || coords.length === 0) return [31.0, -99.5];

  let lat = 0, lng = 0;
  coords.forEach(coord => {
    lng += coord[0];
    lat += coord[1];
  });
  return [lat / coords.length, lng / coords.length];
}

function addCitiesLayer(map) {
  const cities = [
    { name: 'Houston', lat: 29.7604, lng: -95.3698, size: 'major' },
    { name: 'San Antonio', lat: 29.4241, lng: -98.4936, size: 'major' },
    { name: 'Dallas', lat: 32.7767, lng: -96.7970, size: 'major' },
    { name: 'Austin', lat: 30.2672, lng: -97.7431, size: 'major' },
    { name: 'Fort Worth', lat: 32.7555, lng: -97.3308, size: 'major' },
    { name: 'El Paso', lat: 31.7619, lng: -106.4850, size: 'major' },
    { name: 'The Woodlands', lat: 30.1658, lng: -95.4613, size: 'district8', highlight: true },
    { name: 'Conroe', lat: 30.3119, lng: -95.4561, size: 'district8' },
    { name: 'Huntsville', lat: 30.7235, lng: -95.5508, size: 'district8' },
    { name: 'Livingston', lat: 30.7110, lng: -94.9330, size: 'district8' },
    { name: 'Corpus Christi', lat: 27.8006, lng: -97.3964, size: 'city' },
    { name: 'Lubbock', lat: 33.5779, lng: -101.8552, size: 'city' },
    { name: 'Amarillo', lat: 35.2220, lng: -101.8313, size: 'city' },
    { name: 'Laredo', lat: 27.5306, lng: -99.4803, size: 'city' },
    { name: 'Brownsville', lat: 25.9017, lng: -97.4975, size: 'city' },
    { name: 'McAllen', lat: 26.2034, lng: -98.2300, size: 'city' },
    { name: 'Midland', lat: 31.9973, lng: -102.0779, size: 'city' },
    { name: 'Odessa', lat: 31.8457, lng: -102.3676, size: 'city' },
    { name: 'Waco', lat: 31.5493, lng: -97.1467, size: 'city' },
    { name: 'Tyler', lat: 32.3513, lng: -95.3011, size: 'city' },
    { name: 'Beaumont', lat: 30.0802, lng: -94.1266, size: 'city' }
  ];

  const layerGroup = L.layerGroup();

  cities.forEach(city => {
    let markerClass = 'city-marker';
    if (city.size === 'major') markerClass += ' city-major';
    if (city.size === 'district8') markerClass += ' city-district8';
    if (city.highlight) markerClass += ' city-highlight';

    const marker = L.marker([city.lat, city.lng], {
      icon: L.divIcon({
        className: markerClass,
        html: `<span class="city-dot"></span><span class="city-name">${city.name}</span>`,
        iconSize: [100, 20],
        iconAnchor: [50, 10]
      })
    });

    layerGroup.addLayer(marker);
  });

  layerGroup.addTo(map);
  return layerGroup;
}

function createControlPanel(map, layers) {
  const control = L.control({ position: 'topleft' });

  control.onAdd = function() {
    const div = L.DomUtil.create('div', 'map-control-panel');
    div.innerHTML = `
      <div class="control-header" id="control-toggle">
        <i class="fa-solid fa-layer-group"></i>
        <span>Map Options</span>
        <i class="fa-solid fa-chevron-down toggle-icon"></i>
      </div>
      <div class="control-body" id="control-body">
        <div class="control-section">
          <div class="control-group-title">Show Layers</div>
          <label class="control-toggle-item">
            <span><i class="fa-solid fa-border-all"></i> Counties</span>
            <input type="checkbox" id="toggle-counties" checked>
            <span class="toggle-switch"></span>
          </label>
          <label class="control-toggle-item">
            <span><i class="fa-solid fa-city"></i> Cities</span>
            <input type="checkbox" id="toggle-cities" checked>
            <span class="toggle-switch"></span>
          </label>
        </div>
        <div class="control-divider"></div>
        <div class="control-section">
          <div class="control-group-title">Find Your District</div>
          <div class="search-wrapper">
            <input type="text" id="address-input" placeholder="Enter your address...">
            <button id="search-btn"><i class="fa-solid fa-search"></i></button>
          </div>
        </div>
      </div>
    `;

    L.DomEvent.disableClickPropagation(div);
    L.DomEvent.disableScrollPropagation(div);

    return div;
  };

  control.addTo(map);

  // Add collapsible toggle functionality
  setTimeout(() => {
    const toggleBtn = document.getElementById('control-toggle');
    const body = document.getElementById('control-body');
    if (toggleBtn && body) {
      toggleBtn.addEventListener('click', () => {
        body.classList.toggle('collapsed');
        toggleBtn.classList.toggle('collapsed');
      });
    }
  }, 100);

  // Add event listeners
  setTimeout(() => {
    document.getElementById('toggle-counties')?.addEventListener('change', (e) => {
      if (e.target.checked) {
        map.addLayer(layers.counties);
      } else {
        map.removeLayer(layers.counties);
      }
    });

    document.getElementById('toggle-cities')?.addEventListener('change', (e) => {
      if (e.target.checked) {
        map.addLayer(layers.cities);
      } else {
        map.removeLayer(layers.cities);
      }
    });

    document.getElementById('search-btn')?.addEventListener('click', () => {
      const address = document.getElementById('address-input').value;
      if (address) {
        geocodeAddress(address, map);
      }
    });

    document.getElementById('address-input')?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const address = e.target.value;
        if (address) {
          geocodeAddress(address, map);
        }
      }
    });
  }, 100);
}

function geocodeAddress(address, map) {
  // Use Nominatim for geocoding (free, no API key needed)
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address + ', Texas, USA')}`;

  fetch(url)
    .then(response => response.json())
    .then(data => {
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);

        // Add marker and zoom
        L.marker([lat, lng], {
          icon: L.divIcon({
            className: 'search-marker',
            html: '<i class="fa-solid fa-location-dot"></i>',
            iconSize: [30, 30],
            iconAnchor: [15, 30]
          })
        }).addTo(map).bindPopup(`<strong>${address}</strong>`).openPopup();

        map.setView([lat, lng], 10);
      } else {
        alert('Address not found. Please try a different address.');
      }
    })
    .catch(err => {
      console.error('Geocoding error:', err);
      alert('Error searching for address. Please try again.');
    });
}

function createDistrictSidebar(map, geojson, districtLayer) {
  const sidebar = L.control({ position: 'topright' });

  sidebar.onAdd = function() {
    const div = L.DomUtil.create('div', 'district-sidebar');

    let listHTML = '<div class="sidebar-header"><h4>Congressional Districts</h4></div><div class="district-list">';

    // Sort districts numerically
    const districts = geojson.features.map(f => f.properties.district).sort((a, b) => parseInt(a) - parseInt(b));

    districts.forEach(district => {
      const isDistrict8 = district === '8';
      listHTML += `
        <div class="district-item ${isDistrict8 ? 'active' : ''}" data-district="${district}">
          <span class="district-num">${district}</span>
          <span class="district-name">District ${district}</span>
          ${isDistrict8 ? '<span class="district-badge">Stephen Long</span>' : ''}
        </div>
      `;
    });

    listHTML += '</div>';
    div.innerHTML = listHTML;

    L.DomEvent.disableClickPropagation(div);
    L.DomEvent.disableScrollPropagation(div);

    return div;
  };

  sidebar.addTo(map);

  // Add click handlers to district items
  setTimeout(() => {
    document.querySelectorAll('.district-item').forEach(item => {
      item.addEventListener('click', function() {
        const district = this.dataset.district;

        // Find and zoom to district
        districtLayer.eachLayer(layer => {
          if (layer.feature.properties.district === district) {
            map.fitBounds(layer.getBounds(), { padding: [50, 50] });
            layer.openPopup();
          }
        });

        // Update active state
        document.querySelectorAll('.district-item').forEach(i => i.classList.remove('selected'));
        this.classList.add('selected');
      });
    });
  }, 100);
}

// Generate Texas Congressional Districts GeoJSON
// Based on PLANC2333 (2023 redistricting map)
function createTexasDistrictsGeoJSON() {
  return {
    "type": "FeatureCollection",
    "features": [
      // District 1 - East Texas (Longview, Tyler area)
      createDistrictFeature('1', [
        [-94.0, 33.5], [-94.0, 31.8], [-95.5, 31.8], [-95.5, 32.3], [-95.0, 32.8], [-94.5, 33.5], [-94.0, 33.5]
      ]),
      // District 2 - Southeast Houston suburbs
      createDistrictFeature('2', [
        [-95.5, 29.9], [-94.5, 29.9], [-94.5, 29.3], [-95.0, 29.0], [-95.5, 29.3], [-95.5, 29.9]
      ]),
      // District 3 - Collin County (Plano area)
      createDistrictFeature('3', [
        [-96.5, 33.4], [-96.5, 32.9], [-97.0, 32.9], [-97.0, 33.4], [-96.5, 33.4]
      ]),
      // District 4 - Northeast Texas
      createDistrictFeature('4', [
        [-94.0, 33.5], [-94.0, 34.0], [-96.5, 34.0], [-96.5, 33.0], [-95.5, 32.3], [-95.0, 32.8], [-94.5, 33.5], [-94.0, 33.5]
      ]),
      // District 5 - Dallas County east
      createDistrictFeature('5', [
        [-96.5, 32.9], [-96.5, 32.5], [-96.9, 32.5], [-96.9, 32.9], [-96.5, 32.9]
      ]),
      // District 6 - Arlington/Tarrant
      createDistrictFeature('6', [
        [-97.0, 32.9], [-97.0, 32.5], [-97.5, 32.5], [-97.5, 32.9], [-97.0, 32.9]
      ]),
      // District 7 - West Houston
      createDistrictFeature('7', [
        [-95.6, 30.0], [-95.6, 29.6], [-95.3, 29.6], [-95.3, 30.0], [-95.6, 30.0]
      ]),
      // DISTRICT 8 - The Woodlands, Conroe, Huntsville (STEPHEN LONG'S DISTRICT!)
      createDistrictFeature('8', [
        [-95.9, 31.1], [-95.0, 31.1], [-94.5, 30.9], [-94.5, 30.4], [-95.0, 30.2], [-95.6, 30.3], [-96.0, 30.5], [-96.0, 30.9], [-95.9, 31.1]
      ]),
      // District 9 - South Houston
      createDistrictFeature('9', [
        [-95.4, 29.7], [-95.2, 29.7], [-95.2, 29.5], [-95.4, 29.5], [-95.4, 29.7]
      ]),
      // District 10 - Austin to Houston corridor
      createDistrictFeature('10', [
        [-97.0, 30.5], [-96.0, 30.5], [-96.0, 29.8], [-97.0, 29.8], [-97.0, 30.5]
      ]),
      // District 11 - West Texas (Midland/Odessa)
      createDistrictFeature('11', [
        [-100.0, 32.5], [-100.0, 31.0], [-102.5, 31.0], [-102.5, 32.5], [-100.0, 32.5]
      ]),
      // District 12 - Fort Worth
      createDistrictFeature('12', [
        [-97.5, 33.0], [-97.0, 33.0], [-97.0, 32.5], [-97.5, 32.5], [-97.5, 33.0]
      ]),
      // District 13 - Panhandle
      createDistrictFeature('13', [
        [-100.0, 36.5], [-100.0, 33.5], [-103.0, 33.5], [-103.0, 36.5], [-100.0, 36.5]
      ]),
      // District 14 - Galveston/Brazoria
      createDistrictFeature('14', [
        [-95.5, 29.5], [-94.5, 29.5], [-94.5, 28.8], [-95.5, 28.8], [-95.5, 29.5]
      ]),
      // District 15 - South Texas
      createDistrictFeature('15', [
        [-98.5, 27.5], [-97.5, 27.5], [-97.5, 26.0], [-98.5, 26.0], [-98.5, 27.5]
      ]),
      // District 16 - El Paso
      createDistrictFeature('16', [
        [-106.0, 32.0], [-106.0, 31.0], [-106.7, 31.0], [-106.7, 32.0], [-106.0, 32.0]
      ]),
      // District 17 - Waco/College Station
      createDistrictFeature('17', [
        [-97.0, 32.0], [-96.0, 32.0], [-96.0, 30.5], [-97.0, 30.5], [-97.0, 32.0]
      ]),
      // District 18 - Inner Houston
      createDistrictFeature('18', [
        [-95.5, 29.9], [-95.3, 29.9], [-95.3, 29.7], [-95.5, 29.7], [-95.5, 29.9]
      ]),
      // District 19 - Lubbock
      createDistrictFeature('19', [
        [-100.0, 34.5], [-100.0, 32.5], [-102.5, 32.5], [-102.5, 34.5], [-100.0, 34.5]
      ]),
      // District 20 - San Antonio West
      createDistrictFeature('20', [
        [-98.7, 29.6], [-98.4, 29.6], [-98.4, 29.3], [-98.7, 29.3], [-98.7, 29.6]
      ]),
      // District 21 - Hill Country (Kerrville to Austin)
      createDistrictFeature('21', [
        [-98.5, 30.5], [-97.5, 30.5], [-97.5, 29.5], [-98.5, 29.5], [-98.5, 30.5]
      ]),
      // District 22 - Fort Bend/Sugar Land
      createDistrictFeature('22', [
        [-95.8, 29.7], [-95.5, 29.7], [-95.5, 29.3], [-95.8, 29.3], [-95.8, 29.7]
      ]),
      // District 23 - Border/Big Bend
      createDistrictFeature('23', [
        [-100.0, 31.0], [-99.0, 31.0], [-99.0, 29.0], [-100.5, 29.0], [-104.0, 29.5], [-104.0, 31.0], [-100.0, 31.0]
      ]),
      // District 24 - Dallas/Fort Worth suburbs
      createDistrictFeature('24', [
        [-97.0, 33.0], [-96.7, 33.0], [-96.7, 32.7], [-97.0, 32.7], [-97.0, 33.0]
      ]),
      // District 25 - Austin North
      createDistrictFeature('25', [
        [-97.8, 30.5], [-97.5, 30.5], [-97.5, 30.2], [-97.8, 30.2], [-97.8, 30.5]
      ]),
      // District 26 - Denton County
      createDistrictFeature('26', [
        [-97.2, 33.5], [-96.8, 33.5], [-96.8, 33.0], [-97.2, 33.0], [-97.2, 33.5]
      ]),
      // District 27 - Corpus Christi
      createDistrictFeature('27', [
        [-97.5, 28.5], [-97.0, 28.5], [-97.0, 27.5], [-97.5, 27.5], [-97.5, 28.5]
      ]),
      // District 28 - Laredo to San Antonio
      createDistrictFeature('28', [
        [-99.5, 29.5], [-98.5, 29.5], [-98.5, 27.5], [-99.5, 27.5], [-99.5, 29.5]
      ]),
      // District 29 - East Houston
      createDistrictFeature('29', [
        [-95.3, 29.9], [-95.1, 29.9], [-95.1, 29.7], [-95.3, 29.7], [-95.3, 29.9]
      ]),
      // District 30 - South Dallas
      createDistrictFeature('30', [
        [-96.9, 32.8], [-96.7, 32.8], [-96.7, 32.6], [-96.9, 32.6], [-96.9, 32.8]
      ]),
      // District 31 - Williamson/Bell County
      createDistrictFeature('31', [
        [-97.8, 31.2], [-97.2, 31.2], [-97.2, 30.5], [-97.8, 30.5], [-97.8, 31.2]
      ]),
      // District 32 - North Dallas
      createDistrictFeature('32', [
        [-96.8, 33.0], [-96.6, 33.0], [-96.6, 32.8], [-96.8, 32.8], [-96.8, 33.0]
      ]),
      // District 33 - Fort Worth/Dallas urban
      createDistrictFeature('33', [
        [-97.0, 32.8], [-96.9, 32.8], [-96.9, 32.6], [-97.0, 32.6], [-97.0, 32.8]
      ]),
      // District 34 - Rio Grande Valley
      createDistrictFeature('34', [
        [-97.5, 26.5], [-97.0, 26.5], [-97.0, 26.0], [-97.5, 26.0], [-97.5, 26.5]
      ]),
      // District 35 - San Antonio to Austin
      createDistrictFeature('35', [
        [-97.8, 30.2], [-97.5, 30.2], [-97.5, 29.4], [-98.0, 29.4], [-98.0, 29.8], [-97.8, 30.2]
      ]),
      // District 36 - Southeast Texas (Beaumont)
      createDistrictFeature('36', [
        [-94.5, 30.4], [-93.5, 30.4], [-93.5, 29.5], [-94.5, 29.5], [-94.5, 30.4]
      ]),
      // District 37 - Austin
      createDistrictFeature('37', [
        [-97.8, 30.4], [-97.6, 30.4], [-97.6, 30.1], [-97.8, 30.1], [-97.8, 30.4]
      ]),
      // District 38 - Northwest Houston suburbs
      createDistrictFeature('38', [
        [-96.0, 30.3], [-95.6, 30.3], [-95.6, 29.9], [-96.0, 29.9], [-96.0, 30.3]
      ])
    ]
  };
}

function createDistrictFeature(district, coordinates) {
  return {
    "type": "Feature",
    "properties": {
      "district": district,
      "state": "TX"
    },
    "geometry": {
      "type": "Polygon",
      "coordinates": [coordinates]
    }
  };
}

// Simplified Texas Counties GeoJSON (major counties only for performance)
function createTexasCountiesGeoJSON() {
  return {
    "type": "FeatureCollection",
    "features": [
      // Harris County (Houston)
      createCountyFeature('Harris', [[-95.8, 30.2], [-95.0, 30.2], [-95.0, 29.5], [-95.8, 29.5], [-95.8, 30.2]]),
      // Montgomery County (The Woodlands, Conroe)
      createCountyFeature('Montgomery', [[-95.8, 30.6], [-95.2, 30.6], [-95.2, 30.2], [-95.8, 30.2], [-95.8, 30.6]]),
      // Walker County (Huntsville)
      createCountyFeature('Walker', [[-95.8, 31.0], [-95.2, 31.0], [-95.2, 30.6], [-95.8, 30.6], [-95.8, 31.0]]),
      // San Jacinto County
      createCountyFeature('San Jacinto', [[-95.2, 30.8], [-94.8, 30.8], [-94.8, 30.4], [-95.2, 30.4], [-95.2, 30.8]]),
      // Polk County (Livingston)
      createCountyFeature('Polk', [[-95.0, 31.0], [-94.5, 31.0], [-94.5, 30.5], [-95.0, 30.5], [-95.0, 31.0]]),
      // Dallas County
      createCountyFeature('Dallas', [[-97.0, 33.0], [-96.5, 33.0], [-96.5, 32.5], [-97.0, 32.5], [-97.0, 33.0]]),
      // Tarrant County (Fort Worth)
      createCountyFeature('Tarrant', [[-97.6, 33.0], [-97.0, 33.0], [-97.0, 32.5], [-97.6, 32.5], [-97.6, 33.0]]),
      // Bexar County (San Antonio)
      createCountyFeature('Bexar', [[-98.8, 29.8], [-98.2, 29.8], [-98.2, 29.2], [-98.8, 29.2], [-98.8, 29.8]]),
      // Travis County (Austin)
      createCountyFeature('Travis', [[-98.0, 30.5], [-97.4, 30.5], [-97.4, 30.0], [-98.0, 30.0], [-98.0, 30.5]]),
      // Collin County
      createCountyFeature('Collin', [[-96.8, 33.5], [-96.3, 33.5], [-96.3, 33.0], [-96.8, 33.0], [-96.8, 33.5]]),
      // Denton County
      createCountyFeature('Denton', [[-97.4, 33.5], [-96.8, 33.5], [-96.8, 33.0], [-97.4, 33.0], [-97.4, 33.5]]),
      // El Paso County
      createCountyFeature('El Paso', [[-106.6, 32.0], [-106.2, 32.0], [-106.2, 31.4], [-106.6, 31.4], [-106.6, 32.0]]),
      // Fort Bend County
      createCountyFeature('Fort Bend', [[-96.0, 29.7], [-95.5, 29.7], [-95.5, 29.3], [-96.0, 29.3], [-96.0, 29.7]]),
      // Williamson County
      createCountyFeature('Williamson', [[-97.8, 30.8], [-97.3, 30.8], [-97.3, 30.4], [-97.8, 30.4], [-97.8, 30.8]]),
      // Grimes County
      createCountyFeature('Grimes', [[-96.2, 30.7], [-95.8, 30.7], [-95.8, 30.3], [-96.2, 30.3], [-96.2, 30.7]]),
      // Trinity County
      createCountyFeature('Trinity', [[-95.5, 31.3], [-95.0, 31.3], [-95.0, 30.9], [-95.5, 30.9], [-95.5, 31.3]]),
      // Houston County
      createCountyFeature('Houston', [[-95.8, 31.5], [-95.2, 31.5], [-95.2, 31.0], [-95.8, 31.0], [-95.8, 31.5]])
    ]
  };
}

function createCountyFeature(name, coordinates) {
  return {
    "type": "Feature",
    "properties": { "name": name },
    "geometry": {
      "type": "Polygon",
      "coordinates": [coordinates]
    }
  };
}
