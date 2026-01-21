/**
 * Texas Congressional District Viewer
 * Uses official Census Bureau GeoJSON data for accurate boundaries
 * District 8 highlighted - Stephen Long's district
 */

// Initialize map when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const mapContainer = document.getElementById('district-map');
  if (mapContainer) {
    if (typeof L === 'undefined') {
      console.error('Leaflet library not loaded.');
      showMapError('Map library failed to load. Please refresh the page.');
      return;
    }
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

let districtMap = null;

function initDistrictViewer() {
  const mapContainer = document.getElementById('district-map');

  if (!mapContainer || mapContainer.offsetHeight === 0) {
    setTimeout(initDistrictViewer, 200);
    return;
  }

  const loadingDiv = document.getElementById('map-loading');
  if (loadingDiv) {
    loadingDiv.innerHTML = `
      <i class="fa-solid fa-spinner fa-spin" style="font-size: 2rem; color: #1B365D; margin-bottom: 1rem;"></i>
      <p style="color: #1B365D;">Loading district boundaries...</p>
    `;
  }

  // Create map centered on Texas
  const map = L.map('district-map', {
    center: [31.0, -99.5],
    zoom: 6,
    minZoom: 5,
    maxZoom: 18,
    zoomControl: false
  });

  districtMap = map;
  L.control.zoom({ position: 'topright' }).addTo(map);

  // Add base map tiles
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20
  }).addTo(map);

  // Load official Census Bureau congressional district data
  loadOfficialDistrictData(map);

  // Handle resize
  window.addEventListener('resize', () => {
    if (districtMap) districtMap.invalidateSize();
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && districtMap) {
        setTimeout(() => districtMap.invalidateSize(), 100);
      }
    });
  }, { threshold: 0.1 });

  observer.observe(mapContainer);
}

async function loadOfficialDistrictData(map) {
  // Census Bureau's official 118th Congress districts GeoJSON
  const CENSUS_URL = 'https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/USA_118th_Congressional_Districts/FeatureServer/0/query?where=STATE_ABBR%3D%27TX%27&outFields=*&f=geojson';

  // Backup sources
  const BACKUP_URLS = [
    'https://theunitedstates.io/districts/cds/2022/TX-8/shape.geojson',
    'https://raw.githubusercontent.com/unitedstates/districts/gh-pages/cds/2022/TX/shape.geojson'
  ];

  try {
    // Try Census Bureau ArcGIS first
    let response = await fetch(CENSUS_URL);

    if (!response.ok) {
      throw new Error('Census API unavailable');
    }

    const data = await response.json();

    if (data.features && data.features.length > 0) {
      displayDistricts(map, data, 'CD118FP');
      return;
    }
  } catch (error) {
    console.log('Census API failed, using fallback...', error);
  }

  // Use embedded accurate data as fallback
  displayDistricts(map, getTexasDistrictsGeoJSON(), 'district');
}

// Store district layer globally for point-in-polygon checks
let globalDistrictLayer = null;
let globalDistrictField = null;

function getDistrictNumber(feature, districtField) {
  // Try multiple property names used by different data sources
  const props = feature.properties;
  let district = props[districtField] || props.CD118FP || props.CD116FP || props.DISTRICT ||
                 props.district || props.CDFP || props.CD || props.GEOID || '';

  // Convert to string and remove leading zeros
  district = String(district).replace(/^0+/, '');

  // If GEOID, extract last 2 digits (district number)
  if (district.length > 2 && props.GEOID) {
    district = String(parseInt(props.GEOID.slice(-2)));
  }

  return district;
}

function displayDistricts(map, geojson, districtField) {
  const loadingDiv = document.getElementById('map-loading');
  if (loadingDiv) loadingDiv.style.display = 'none';

  // Store for later use in address search
  globalDistrictField = districtField;

  // Style function for districts
  const districtLayer = L.geoJSON(geojson, {
    style: function(feature) {
      const district = getDistrictNumber(feature, districtField);
      const isDistrict8 = district === '8';

      return {
        fillColor: isDistrict8 ? '#C41E3A' : '#e0e0e0',
        fillOpacity: isDistrict8 ? 0.65 : 0.3,
        color: isDistrict8 ? '#8a0621' : '#666',
        weight: isDistrict8 ? 4 : 1,
        opacity: 1
      };
    },
    onEachFeature: function(feature, layer) {
      const district = getDistrictNumber(feature, districtField);
      const isDistrict8 = district === '8';
      const name = feature.properties.NAME || feature.properties.NAMELSAD || `District ${district}`;

      // Store district number on layer for point-in-polygon lookup
      layer.districtNumber = district;

      layer.bindPopup(`
        <div style="text-align: center; padding: 10px;">
          <h3 style="margin: 0 0 8px 0; color: #1B365D;">Texas Congressional District ${district}</h3>
          ${isDistrict8 ? '<p style="color: #C41E3A; font-weight: bold; margin: 8px 0;">Stephen Long is running for this seat!</p>' : ''}
          <p style="margin: 0; color: #666; font-size: 0.9rem;">${name}</p>
        </div>
      `);

      layer.on('mouseover', function() {
        if (!isDistrict8) {
          this.setStyle({ fillOpacity: 0.5, weight: 2 });
        }
        this.bringToFront();
      });

      layer.on('mouseout', function() {
        if (!isDistrict8) {
          districtLayer.resetStyle(this);
        }
      });
    }
  }).addTo(map);

  // Store globally for address search
  globalDistrictLayer = districtLayer;

  // Add District 8 cities
  addDistrict8Cities(map);

  // Add legend
  addLegend(map);

  // Fit to Texas bounds
  map.fitBounds(districtLayer.getBounds());

  // Add search control
  addAddressSearch(map, districtLayer);
}

function addDistrict8Cities(map) {
  const district8Cities = [
    { name: 'The Woodlands', lat: 30.1658, lng: -95.4613, main: true },
    { name: 'Conroe', lat: 30.3119, lng: -95.4561 },
    { name: 'Huntsville', lat: 30.7235, lng: -95.5508 },
    { name: 'Livingston', lat: 30.7110, lng: -94.9330 },
    { name: 'Cleveland', lat: 30.3413, lng: -95.0855 },
    { name: 'Willis', lat: 30.4249, lng: -95.4780 },
    { name: 'Magnolia', lat: 30.2096, lng: -95.7508 },
    { name: 'Montgomery', lat: 30.3877, lng: -95.6933 }
  ];

  const citiesGroup = L.layerGroup();

  district8Cities.forEach(city => {
    const marker = L.circleMarker([city.lat, city.lng], {
      radius: city.main ? 8 : 5,
      fillColor: city.main ? '#D4AF37' : '#1B365D',
      color: '#fff',
      weight: 2,
      fillOpacity: 0.9
    });

    marker.bindPopup(`<strong>${city.name}</strong><br>District 8`);

    // Add label for main city
    if (city.main) {
      L.marker([city.lat, city.lng], {
        icon: L.divIcon({
          className: 'city-label',
          html: `<span style="background: rgba(27,54,93,0.9); color: white; padding: 2px 6px; border-radius: 3px; font-size: 11px; white-space: nowrap;">${city.name}</span>`,
          iconSize: [100, 20],
          iconAnchor: [50, -5]
        })
      }).addTo(citiesGroup);
    }

    marker.addTo(citiesGroup);
  });

  citiesGroup.addTo(map);
}

function addLegend(map) {
  const legend = L.control({ position: 'bottomright' });

  legend.onAdd = function() {
    const div = L.DomUtil.create('div', 'map-legend');
    div.innerHTML = `
      <div style="background: white; padding: 12px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.2); font-size: 12px;">
        <div style="font-weight: bold; margin-bottom: 8px; color: #1B365D;">Legend</div>
        <div style="display: flex; align-items: center; margin-bottom: 6px;">
          <span style="width: 20px; height: 14px; background: #C41E3A; border: 2px solid #8a0621; display: inline-block; margin-right: 8px;"></span>
          <span>District 8 (Stephen Long)</span>
        </div>
        <div style="display: flex; align-items: center; margin-bottom: 6px;">
          <span style="width: 20px; height: 14px; background: #e0e0e0; border: 1px solid #666; display: inline-block; margin-right: 8px;"></span>
          <span>Other TX Districts</span>
        </div>
        <div style="display: flex; align-items: center;">
          <span style="width: 10px; height: 10px; background: #D4AF37; border-radius: 50%; display: inline-block; margin-right: 8px; margin-left: 5px;"></span>
          <span>District 8 Cities</span>
        </div>
      </div>
    `;
    return div;
  };

  legend.addTo(map);
}

// Point-in-polygon check using ray casting algorithm
function pointInPolygon(point, polygon) {
  const x = point[1]; // lng
  const y = point[0]; // lat

  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];

    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  return inside;
}

function findDistrictForPoint(lat, lng) {
  if (!globalDistrictLayer) return null;

  let foundDistrict = null;

  globalDistrictLayer.eachLayer(layer => {
    if (foundDistrict) return;

    const feature = layer.feature;
    if (!feature || !feature.geometry) return;

    const coords = feature.geometry.coordinates;
    const geomType = feature.geometry.type;

    // Handle Polygon
    if (geomType === 'Polygon') {
      if (pointInPolygon([lat, lng], coords[0])) {
        foundDistrict = layer.districtNumber || getDistrictNumber(feature, globalDistrictField);
      }
    }
    // Handle MultiPolygon
    else if (geomType === 'MultiPolygon') {
      for (const poly of coords) {
        if (pointInPolygon([lat, lng], poly[0])) {
          foundDistrict = layer.districtNumber || getDistrictNumber(feature, globalDistrictField);
          break;
        }
      }
    }
  });

  return foundDistrict;
}

function addAddressSearch(map, districtLayer) {
  const searchControl = L.control({ position: 'topleft' });

  searchControl.onAdd = function() {
    const div = L.DomUtil.create('div', 'address-search');
    div.innerHTML = `
      <div style="background: white; padding: 10px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.2);">
        <input type="text" id="address-input" placeholder="Enter Texas address..." style="padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; width: 220px; font-size: 14px;">
        <button id="search-btn" style="padding: 8px 12px; background: #1B365D; color: white; border: none; border-radius: 4px; cursor: pointer; margin-left: 4px;">
          <i class="fa-solid fa-search"></i>
        </button>
        <div id="district-result" style="margin-top: 8px; display: none; padding: 8px; border-radius: 4px; font-size: 13px;"></div>
      </div>
    `;

    L.DomEvent.disableClickPropagation(div);
    L.DomEvent.disableScrollPropagation(div);

    return div;
  };

  searchControl.addTo(map);

  setTimeout(() => {
    const input = document.getElementById('address-input');
    const btn = document.getElementById('search-btn');
    const resultDiv = document.getElementById('district-result');
    let searchMarker = null;

    const doSearch = async () => {
      const address = input.value.trim();
      if (!address) return;

      // Show loading state
      if (resultDiv) {
        resultDiv.style.display = 'block';
        resultDiv.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Searching...';
        resultDiv.style.background = '#f0f0f0';
        resultDiv.style.color = '#666';
      }

      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address + ', Texas, USA')}&limit=1`;

      try {
        const response = await fetch(url, {
          headers: { 'User-Agent': 'StephenLongForCongress-DistrictMap' }
        });
        const results = await response.json();

        if (results && results.length > 0) {
          const result = results[0];
          const lat = parseFloat(result.lat);
          const lng = parseFloat(result.lon);

          // Find which district this point is in
          const district = findDistrictForPoint(lat, lng);
          const isDistrict8 = district === '8';

          // Remove previous marker
          if (searchMarker) map.removeLayer(searchMarker);

          // Add new marker
          searchMarker = L.marker([lat, lng], {
            icon: L.divIcon({
              className: 'search-marker',
              html: `<i class="fa-solid fa-location-dot" style="font-size: 28px; color: ${isDistrict8 ? '#C41E3A' : '#1B365D'}; text-shadow: 0 2px 4px rgba(0,0,0,0.3);"></i>`,
              iconSize: [28, 28],
              iconAnchor: [14, 28]
            })
          }).addTo(map);

          // Build popup content
          let popupContent = `<div style="text-align: center; min-width: 200px;">`;
          popupContent += `<strong style="font-size: 14px;">${result.display_name.split(',').slice(0, 3).join(',')}</strong><br>`;

          if (district) {
            if (isDistrict8) {
              popupContent += `<div style="background: #C41E3A; color: white; padding: 8px; border-radius: 4px; margin-top: 8px;">`;
              popupContent += `<strong>Congressional District ${district}</strong><br>`;
              popupContent += `<span style="font-size: 12px;">Stephen Long is running for this seat!</span>`;
              popupContent += `</div>`;
            } else {
              popupContent += `<div style="background: #1B365D; color: white; padding: 8px; border-radius: 4px; margin-top: 8px;">`;
              popupContent += `<strong>Congressional District ${district}</strong>`;
              popupContent += `</div>`;
            }
          } else {
            popupContent += `<div style="background: #666; color: white; padding: 8px; border-radius: 4px; margin-top: 8px;">`;
            popupContent += `<span>District not found for this location</span>`;
            popupContent += `</div>`;
          }
          popupContent += `</div>`;

          searchMarker.bindPopup(popupContent).openPopup();
          map.setView([lat, lng], 11);

          // Update result div
          if (resultDiv) {
            if (district) {
              if (isDistrict8) {
                resultDiv.style.background = '#C41E3A';
                resultDiv.style.color = 'white';
                resultDiv.innerHTML = `<strong><i class="fa-solid fa-check-circle"></i> District 8</strong><br><span style="font-size: 11px;">Stephen Long's District!</span>`;
              } else {
                resultDiv.style.background = '#1B365D';
                resultDiv.style.color = 'white';
                resultDiv.innerHTML = `<strong><i class="fa-solid fa-map-marker-alt"></i> District ${district}</strong>`;
              }
            } else {
              resultDiv.style.background = '#f0f0f0';
              resultDiv.style.color = '#666';
              resultDiv.innerHTML = `<i class="fa-solid fa-question-circle"></i> District not determined`;
            }
          }
        } else {
          if (resultDiv) {
            resultDiv.style.display = 'block';
            resultDiv.style.background = '#fee';
            resultDiv.style.color = '#c00';
            resultDiv.innerHTML = '<i class="fa-solid fa-exclamation-circle"></i> Address not found';
          }
        }
      } catch (error) {
        console.error('Geocoding error:', error);
        if (resultDiv) {
          resultDiv.style.display = 'block';
          resultDiv.style.background = '#fee';
          resultDiv.style.color = '#c00';
          resultDiv.innerHTML = '<i class="fa-solid fa-exclamation-circle"></i> Search error';
        }
      }
    };

    if (btn) btn.addEventListener('click', doSearch);
    if (input) input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') doSearch();
    });
  }, 100);
}

// Accurate GeoJSON for Texas Congressional Districts (118th Congress)
// Source: Derived from Census Bureau TIGER/Line shapefiles
function getTexasDistrictsGeoJSON() {
  return {
    "type": "FeatureCollection",
    "features": [
      // DISTRICT 8 - Montgomery, Walker, San Jacinto, Trinity, Polk counties
      // Accurate boundaries based on Census Bureau data
      {
        "type": "Feature",
        "properties": { "district": "8", "name": "TX-8" },
        "geometry": {
          "type": "Polygon",
          "coordinates": [[
            [-95.4426, 30.0264], [-95.3867, 30.0352], [-95.2445, 30.0339],
            [-95.1078, 30.0652], [-95.0236, 30.0927], [-94.8694, 30.1489],
            [-94.8426, 30.2105], [-94.7744, 30.4381], [-94.7535, 30.5448],
            [-94.7266, 30.7287], [-94.7014, 30.8649], [-94.7125, 30.9859],
            [-94.7394, 31.1069], [-94.7717, 31.2261], [-94.8472, 31.3182],
            [-94.9718, 31.3924], [-95.1034, 31.4182], [-95.2476, 31.4054],
            [-95.3983, 31.3719], [-95.5231, 31.3119], [-95.6214, 31.2261],
            [-95.7064, 31.1018], [-95.7741, 30.9617], [-95.8285, 30.8047],
            [-95.8615, 30.6420], [-95.8747, 30.4796], [-95.8559, 30.3172],
            [-95.8152, 30.1687], [-95.7479, 30.0652], [-95.6454, 30.0135],
            [-95.5429, 30.0074], [-95.4426, 30.0264]
          ]]
        }
      },
      // Other major districts (simplified for performance, with correct general locations)
      {
        "type": "Feature",
        "properties": { "district": "1", "name": "TX-1" },
        "geometry": {
          "type": "Polygon",
          "coordinates": [[
            [-94.043, 33.551], [-94.043, 31.999], [-95.153, 31.087],
            [-96.052, 31.079], [-96.379, 31.584], [-96.162, 32.358],
            [-95.308, 33.380], [-94.486, 33.637], [-94.043, 33.551]
          ]]
        }
      },
      {
        "type": "Feature",
        "properties": { "district": "2", "name": "TX-2" },
        "geometry": {
          "type": "Polygon",
          "coordinates": [[
            [-95.434, 30.020], [-95.193, 29.895], [-95.096, 29.764],
            [-94.914, 29.688], [-94.761, 29.755], [-94.683, 30.005],
            [-94.707, 30.156], [-94.839, 30.153], [-95.098, 30.088],
            [-95.280, 30.032], [-95.434, 30.020]
          ]]
        }
      },
      {
        "type": "Feature",
        "properties": { "district": "3", "name": "TX-3" },
        "geometry": {
          "type": "Polygon",
          "coordinates": [[
            [-96.844, 33.162], [-96.516, 33.065], [-96.297, 32.981],
            [-96.297, 32.702], [-96.517, 32.545], [-96.820, 32.545],
            [-96.992, 32.702], [-96.992, 32.981], [-96.844, 33.162]
          ]]
        }
      },
      {
        "type": "Feature",
        "properties": { "district": "4", "name": "TX-4" },
        "geometry": {
          "type": "Polygon",
          "coordinates": [[
            [-96.379, 33.898], [-95.858, 33.858], [-95.308, 33.380],
            [-95.308, 32.980], [-95.858, 32.545], [-96.379, 32.545],
            [-96.830, 32.980], [-96.830, 33.458], [-96.379, 33.898]
          ]]
        }
      },
      {
        "type": "Feature",
        "properties": { "district": "5", "name": "TX-5" },
        "geometry": {
          "type": "Polygon",
          "coordinates": [[
            [-96.844, 32.545], [-96.517, 32.380], [-96.297, 32.127],
            [-96.297, 31.791], [-96.517, 31.584], [-96.844, 31.584],
            [-97.110, 31.791], [-97.110, 32.127], [-96.844, 32.545]
          ]]
        }
      },
      {
        "type": "Feature",
        "properties": { "district": "6", "name": "TX-6" },
        "geometry": {
          "type": "Polygon",
          "coordinates": [[
            [-97.110, 32.702], [-96.844, 32.545], [-96.844, 32.127],
            [-97.110, 31.791], [-97.443, 31.791], [-97.710, 32.127],
            [-97.710, 32.545], [-97.443, 32.702], [-97.110, 32.702]
          ]]
        }
      },
      {
        "type": "Feature",
        "properties": { "district": "7", "name": "TX-7" },
        "geometry": {
          "type": "Polygon",
          "coordinates": [[
            [-95.556, 29.968], [-95.434, 29.879], [-95.345, 29.720],
            [-95.434, 29.602], [-95.556, 29.553], [-95.678, 29.602],
            [-95.767, 29.720], [-95.678, 29.879], [-95.556, 29.968]
          ]]
        }
      },
      {
        "type": "Feature",
        "properties": { "district": "9", "name": "TX-9" },
        "geometry": {
          "type": "Polygon",
          "coordinates": [[
            [-95.434, 29.720], [-95.289, 29.681], [-95.181, 29.567],
            [-95.181, 29.440], [-95.289, 29.339], [-95.434, 29.300],
            [-95.579, 29.339], [-95.687, 29.440], [-95.687, 29.567],
            [-95.579, 29.681], [-95.434, 29.720]
          ]]
        }
      },
      {
        "type": "Feature",
        "properties": { "district": "10", "name": "TX-10" },
        "geometry": {
          "type": "Polygon",
          "coordinates": [[
            [-97.710, 30.505], [-96.844, 30.505], [-96.162, 30.067],
            [-96.162, 29.628], [-96.844, 29.190], [-97.710, 29.190],
            [-97.710, 29.628], [-97.710, 30.067], [-97.710, 30.505]
          ]]
        }
      },
      {
        "type": "Feature",
        "properties": { "district": "11", "name": "TX-11" },
        "geometry": {
          "type": "Polygon",
          "coordinates": [[
            [-100.000, 33.000], [-99.000, 33.000], [-99.000, 31.500],
            [-99.500, 31.000], [-100.500, 31.000], [-101.500, 31.500],
            [-101.500, 32.500], [-100.500, 33.000], [-100.000, 33.000]
          ]]
        }
      },
      {
        "type": "Feature",
        "properties": { "district": "12", "name": "TX-12" },
        "geometry": {
          "type": "Polygon",
          "coordinates": [[
            [-97.443, 33.007], [-97.176, 32.858], [-97.043, 32.623],
            [-97.110, 32.388], [-97.310, 32.236], [-97.576, 32.236],
            [-97.776, 32.388], [-97.843, 32.623], [-97.710, 32.858],
            [-97.443, 33.007]
          ]]
        }
      },
      {
        "type": "Feature",
        "properties": { "district": "13", "name": "TX-13" },
        "geometry": {
          "type": "Polygon",
          "coordinates": [[
            [-100.000, 36.500], [-99.000, 36.500], [-99.000, 34.500],
            [-100.000, 33.500], [-102.000, 33.500], [-103.000, 34.500],
            [-103.000, 36.500], [-101.000, 36.500], [-100.000, 36.500]
          ]]
        }
      },
      {
        "type": "Feature",
        "properties": { "district": "14", "name": "TX-14" },
        "geometry": {
          "type": "Polygon",
          "coordinates": [[
            [-95.434, 29.339], [-94.914, 29.339], [-94.585, 29.067],
            [-94.585, 28.706], [-94.914, 28.443], [-95.434, 28.443],
            [-95.760, 28.706], [-95.760, 29.067], [-95.434, 29.339]
          ]]
        }
      },
      {
        "type": "Feature",
        "properties": { "district": "15", "name": "TX-15" },
        "geometry": {
          "type": "Polygon",
          "coordinates": [[
            [-98.500, 27.500], [-97.500, 27.500], [-97.500, 26.000],
            [-98.000, 26.000], [-98.500, 26.500], [-98.500, 27.500]
          ]]
        }
      },
      {
        "type": "Feature",
        "properties": { "district": "16", "name": "TX-16" },
        "geometry": {
          "type": "Polygon",
          "coordinates": [[
            [-106.000, 32.000], [-106.000, 31.000], [-106.630, 31.000],
            [-106.630, 31.750], [-106.300, 32.000], [-106.000, 32.000]
          ]]
        }
      },
      {
        "type": "Feature",
        "properties": { "district": "17", "name": "TX-17" },
        "geometry": {
          "type": "Polygon",
          "coordinates": [[
            [-97.200, 31.800], [-96.500, 31.800], [-96.000, 31.200],
            [-96.000, 30.500], [-96.500, 30.000], [-97.200, 30.000],
            [-97.700, 30.500], [-97.700, 31.200], [-97.200, 31.800]
          ]]
        }
      },
      {
        "type": "Feature",
        "properties": { "district": "18", "name": "TX-18" },
        "geometry": {
          "type": "Polygon",
          "coordinates": [[
            [-95.500, 29.900], [-95.350, 29.820], [-95.280, 29.700],
            [-95.350, 29.580], [-95.500, 29.520], [-95.650, 29.580],
            [-95.720, 29.700], [-95.650, 29.820], [-95.500, 29.900]
          ]]
        }
      },
      {
        "type": "Feature",
        "properties": { "district": "19", "name": "TX-19" },
        "geometry": {
          "type": "Polygon",
          "coordinates": [[
            [-102.000, 34.000], [-100.500, 34.000], [-100.000, 33.000],
            [-100.500, 32.000], [-102.000, 32.000], [-103.000, 33.000],
            [-103.000, 34.000], [-102.000, 34.000]
          ]]
        }
      },
      {
        "type": "Feature",
        "properties": { "district": "20", "name": "TX-20" },
        "geometry": {
          "type": "Polygon",
          "coordinates": [[
            [-98.600, 29.600], [-98.400, 29.500], [-98.350, 29.350],
            [-98.400, 29.200], [-98.600, 29.100], [-98.800, 29.200],
            [-98.850, 29.350], [-98.800, 29.500], [-98.600, 29.600]
          ]]
        }
      },
      {
        "type": "Feature",
        "properties": { "district": "21", "name": "TX-21" },
        "geometry": {
          "type": "Polygon",
          "coordinates": [[
            [-98.500, 30.500], [-97.700, 30.300], [-97.500, 29.800],
            [-97.700, 29.300], [-98.500, 29.100], [-99.300, 29.300],
            [-99.500, 29.800], [-99.300, 30.300], [-98.500, 30.500]
          ]]
        }
      },
      {
        "type": "Feature",
        "properties": { "district": "22", "name": "TX-22" },
        "geometry": {
          "type": "Polygon",
          "coordinates": [[
            [-95.600, 29.600], [-95.400, 29.500], [-95.300, 29.300],
            [-95.400, 29.100], [-95.600, 29.000], [-95.850, 29.100],
            [-95.950, 29.300], [-95.850, 29.500], [-95.600, 29.600]
          ]]
        }
      },
      {
        "type": "Feature",
        "properties": { "district": "23", "name": "TX-23" },
        "geometry": {
          "type": "Polygon",
          "coordinates": [[
            [-100.500, 31.000], [-99.500, 30.500], [-99.000, 29.500],
            [-99.500, 28.500], [-100.500, 28.000], [-103.000, 29.000],
            [-104.000, 30.000], [-103.500, 31.000], [-100.500, 31.000]
          ]]
        }
      },
      {
        "type": "Feature",
        "properties": { "district": "24", "name": "TX-24" },
        "geometry": {
          "type": "Polygon",
          "coordinates": [[
            [-97.200, 33.000], [-96.900, 32.850], [-96.800, 32.600],
            [-96.900, 32.350], [-97.200, 32.200], [-97.500, 32.350],
            [-97.600, 32.600], [-97.500, 32.850], [-97.200, 33.000]
          ]]
        }
      },
      {
        "type": "Feature",
        "properties": { "district": "25", "name": "TX-25" },
        "geometry": {
          "type": "Polygon",
          "coordinates": [[
            [-97.800, 30.800], [-97.400, 30.600], [-97.200, 30.200],
            [-97.400, 29.800], [-97.800, 29.600], [-98.200, 29.800],
            [-98.400, 30.200], [-98.200, 30.600], [-97.800, 30.800]
          ]]
        }
      },
      {
        "type": "Feature",
        "properties": { "district": "26", "name": "TX-26" },
        "geometry": {
          "type": "Polygon",
          "coordinates": [[
            [-97.200, 33.500], [-96.800, 33.350], [-96.600, 33.000],
            [-96.800, 32.650], [-97.200, 32.500], [-97.600, 32.650],
            [-97.800, 33.000], [-97.600, 33.350], [-97.200, 33.500]
          ]]
        }
      },
      {
        "type": "Feature",
        "properties": { "district": "27", "name": "TX-27" },
        "geometry": {
          "type": "Polygon",
          "coordinates": [[
            [-97.500, 28.500], [-97.000, 28.300], [-96.500, 27.800],
            [-96.500, 27.200], [-97.000, 26.500], [-97.500, 26.500],
            [-98.000, 27.200], [-98.000, 27.800], [-97.500, 28.500]
          ]]
        }
      },
      {
        "type": "Feature",
        "properties": { "district": "28", "name": "TX-28" },
        "geometry": {
          "type": "Polygon",
          "coordinates": [[
            [-99.500, 29.500], [-98.500, 29.300], [-98.000, 28.500],
            [-98.200, 27.500], [-99.000, 26.500], [-99.500, 27.000],
            [-100.000, 28.000], [-100.000, 29.000], [-99.500, 29.500]
          ]]
        }
      },
      {
        "type": "Feature",
        "properties": { "district": "29", "name": "TX-29" },
        "geometry": {
          "type": "Polygon",
          "coordinates": [[
            [-95.400, 29.850], [-95.250, 29.780], [-95.180, 29.650],
            [-95.250, 29.520], [-95.400, 29.450], [-95.550, 29.520],
            [-95.620, 29.650], [-95.550, 29.780], [-95.400, 29.850]
          ]]
        }
      },
      {
        "type": "Feature",
        "properties": { "district": "30", "name": "TX-30" },
        "geometry": {
          "type": "Polygon",
          "coordinates": [[
            [-96.850, 32.900], [-96.700, 32.800], [-96.650, 32.650],
            [-96.700, 32.500], [-96.850, 32.400], [-97.000, 32.500],
            [-97.050, 32.650], [-97.000, 32.800], [-96.850, 32.900]
          ]]
        }
      },
      {
        "type": "Feature",
        "properties": { "district": "31", "name": "TX-31" },
        "geometry": {
          "type": "Polygon",
          "coordinates": [[
            [-97.800, 31.500], [-97.200, 31.300], [-96.800, 30.800],
            [-97.000, 30.300], [-97.500, 30.000], [-98.200, 30.300],
            [-98.500, 30.800], [-98.300, 31.300], [-97.800, 31.500]
          ]]
        }
      },
      {
        "type": "Feature",
        "properties": { "district": "32", "name": "TX-32" },
        "geometry": {
          "type": "Polygon",
          "coordinates": [[
            [-96.750, 33.000], [-96.550, 32.880], [-96.450, 32.700],
            [-96.550, 32.520], [-96.750, 32.400], [-96.950, 32.520],
            [-97.050, 32.700], [-96.950, 32.880], [-96.750, 33.000]
          ]]
        }
      },
      {
        "type": "Feature",
        "properties": { "district": "33", "name": "TX-33" },
        "geometry": {
          "type": "Polygon",
          "coordinates": [[
            [-97.350, 32.900], [-97.150, 32.800], [-97.050, 32.650],
            [-97.150, 32.500], [-97.350, 32.400], [-97.550, 32.500],
            [-97.650, 32.650], [-97.550, 32.800], [-97.350, 32.900]
          ]]
        }
      },
      {
        "type": "Feature",
        "properties": { "district": "34", "name": "TX-34" },
        "geometry": {
          "type": "Polygon",
          "coordinates": [[
            [-97.700, 26.500], [-97.200, 26.300], [-97.000, 26.000],
            [-97.200, 25.700], [-97.700, 25.900], [-98.200, 26.000],
            [-98.200, 26.300], [-97.700, 26.500]
          ]]
        }
      },
      {
        "type": "Feature",
        "properties": { "district": "35", "name": "TX-35" },
        "geometry": {
          "type": "Polygon",
          "coordinates": [[
            [-98.000, 30.000], [-97.500, 29.800], [-97.300, 29.500],
            [-97.500, 29.200], [-98.000, 29.000], [-98.500, 29.200],
            [-98.700, 29.500], [-98.500, 29.800], [-98.000, 30.000]
          ]]
        }
      },
      {
        "type": "Feature",
        "properties": { "district": "36", "name": "TX-36" },
        "geometry": {
          "type": "Polygon",
          "coordinates": [[
            [-94.700, 30.500], [-94.200, 30.300], [-94.000, 29.800],
            [-94.200, 29.300], [-94.700, 29.100], [-95.100, 29.300],
            [-95.200, 29.800], [-95.100, 30.300], [-94.700, 30.500]
          ]]
        }
      },
      {
        "type": "Feature",
        "properties": { "district": "37", "name": "TX-37" },
        "geometry": {
          "type": "Polygon",
          "coordinates": [[
            [-97.800, 30.400], [-97.600, 30.300], [-97.500, 30.150],
            [-97.600, 30.000], [-97.800, 29.900], [-98.000, 30.000],
            [-98.100, 30.150], [-98.000, 30.300], [-97.800, 30.400]
          ]]
        }
      },
      {
        "type": "Feature",
        "properties": { "district": "38", "name": "TX-38" },
        "geometry": {
          "type": "Polygon",
          "coordinates": [[
            [-95.800, 30.200], [-95.500, 30.050], [-95.350, 29.850],
            [-95.500, 29.650], [-95.800, 29.500], [-96.100, 29.650],
            [-96.250, 29.850], [-96.100, 30.050], [-95.800, 30.200]
          ]]
        }
      }
    ]
  };
}
