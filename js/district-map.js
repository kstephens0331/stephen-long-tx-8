/**
 * Texas Congressional District Viewer
 * Uses official 2025 redistricting data (PlanC2333) for accurate boundaries
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
let districtLabels = null;
let globalDistrictLayer = null;

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
      <p style="color: #1B365D;">Loading official 2025 district boundaries...</p>
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

  // Load official 2025 redistricting data
  loadDistrictData(map);

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

async function loadDistrictData(map) {
  try {
    const response = await fetch('data/texas-districts-2025.geojson');
    if (!response.ok) throw new Error('Failed to load district data');

    const geojson = await response.json();
    console.log('Loaded official 2025 redistricting data:', geojson.features.length, 'districts');

    displayDistricts(map, geojson);
  } catch (error) {
    console.error('Error loading district data:', error);
    showMapError('Failed to load district boundaries. Please refresh.');
  }
}

function displayDistricts(map, geojson) {
  const loadingDiv = document.getElementById('map-loading');
  if (loadingDiv) loadingDiv.style.display = 'none';

  // Create layer group for labels
  districtLabels = L.layerGroup();

  // Style function for districts
  const districtLayer = L.geoJSON(geojson, {
    style: function(feature) {
      const district = feature.properties.District;
      const isDistrict8 = district === 8;

      return {
        fillColor: isDistrict8 ? '#C41E3A' : '#e0e0e0',
        fillOpacity: isDistrict8 ? 0.6 : 0.3,
        color: isDistrict8 ? '#8a0621' : '#666',
        weight: isDistrict8 ? 3 : 1,
        opacity: 1
      };
    },
    onEachFeature: function(feature, layer) {
      const district = feature.properties.District;
      const isDistrict8 = district === 8;

      // Create label at centroid
      const centroid = layer.getBounds().getCenter();
      const label = L.marker(centroid, {
        icon: L.divIcon({
          className: 'district-label',
          html: `<div style="
            background: ${isDistrict8 ? '#C41E3A' : 'rgba(27,54,93,0.85)'};
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-weight: bold;
            font-size: 12px;
            white-space: nowrap;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            border: 2px solid ${isDistrict8 ? '#8a0621' : '#1B365D'};
          ">${district}</div>`,
          iconSize: [30, 20],
          iconAnchor: [15, 10]
        }),
        interactive: false
      });
      districtLabels.addLayer(label);

      // Popup
      layer.bindPopup(`
        <div style="text-align: center; padding: 10px; min-width: 180px;">
          <h3 style="margin: 0 0 8px 0; color: #1B365D; font-size: 1.1rem;">Texas District ${district}</h3>
          ${isDistrict8 ? '<p style="color: #C41E3A; font-weight: bold; margin: 8px 0;">Stephen Long is running for this seat!</p>' : ''}
          <p style="margin: 0; color: #666; font-size: 0.85rem;">2025 Redistricting Plan</p>
        </div>
      `);

      // Hover effects
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

  globalDistrictLayer = districtLayer;

  // Add labels layer (initially hidden at low zoom)
  districtLabels.addTo(map);

  // Control label visibility based on zoom
  function updateLabels() {
    const zoom = map.getZoom();
    if (zoom >= 7) {
      map.addLayer(districtLabels);
    } else {
      map.removeLayer(districtLabels);
    }
  }

  map.on('zoomend', updateLabels);
  updateLabels();

  // Add District 8 cities
  addDistrict8Cities(map);

  // Add legend
  addLegend(map);

  // Fit to Texas bounds
  map.fitBounds(districtLayer.getBounds());

  // Add address search
  addAddressSearch(map);
}

function addDistrict8Cities(map) {
  const district8Cities = [
    { name: 'The Woodlands', lat: 30.1658, lng: -95.4613, main: true },
    { name: 'Conroe', lat: 30.3119, lng: -95.4561 },
    { name: 'Huntsville', lat: 30.7235, lng: -95.5508 },
    { name: 'Livingston', lat: 30.7110, lng: -94.9330 },
    { name: 'Cleveland', lat: 30.3413, lng: -95.0855 }
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
        <div style="font-weight: bold; margin-bottom: 8px; color: #1B365D;">2025 Districts</div>
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

// Census Bureau API for accurate district lookup
async function getDistrictFromCensus(lat, lng) {
  try {
    const url = `https://geocoding.geo.census.gov/geocoder/geographies/coordinates?x=${lng}&y=${lat}&benchmark=Public_AR_Current&vintage=Current_Current&layers=54&format=json`;
    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();
    if (data.result && data.result.geographies) {
      const cds = data.result.geographies['118th Congressional Districts'] ||
                  data.result.geographies['Congressional Districts'] || [];
      if (cds.length > 0) {
        return parseInt(cds[0].CD || cds[0].CDFP || '0');
      }
    }
    return null;
  } catch (error) {
    console.log('Census API error:', error);
    return null;
  }
}

function addAddressSearch(map) {
  const searchControl = L.control({ position: 'topleft' });

  searchControl.onAdd = function() {
    const div = L.DomUtil.create('div', 'address-search');
    div.innerHTML = `
      <div style="background: white; padding: 10px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.2);">
        <input type="text" id="address-input" placeholder="Enter Texas address..." style="padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; width: 200px; font-size: 14px;">
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

      if (resultDiv) {
        resultDiv.style.display = 'block';
        resultDiv.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Searching...';
        resultDiv.style.background = '#f0f0f0';
        resultDiv.style.color = '#666';
      }

      let searchAddress = address;
      if (!address.toLowerCase().includes('texas') && !address.toLowerCase().includes(', tx')) {
        searchAddress = address + ', Texas';
      }

      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchAddress + ', USA')}&limit=1`;

      try {
        const response = await fetch(url, {
          headers: { 'User-Agent': 'StephenLongForCongress-DistrictMap' }
        });
        const results = await response.json();

        if (results && results.length > 0) {
          const result = results[0];
          const lat = parseFloat(result.lat);
          const lng = parseFloat(result.lon);

          // Get district from Census API
          let district = await getDistrictFromCensus(lat, lng);
          const isDistrict8 = district === 8;

          if (searchMarker) map.removeLayer(searchMarker);

          searchMarker = L.marker([lat, lng], {
            icon: L.divIcon({
              className: 'search-marker',
              html: `<i class="fa-solid fa-location-dot" style="font-size: 28px; color: ${isDistrict8 ? '#C41E3A' : '#1B365D'}; text-shadow: 0 2px 4px rgba(0,0,0,0.3);"></i>`,
              iconSize: [28, 28],
              iconAnchor: [14, 28]
            })
          }).addTo(map);

          let popupContent = `<div style="text-align: center; min-width: 180px;">`;
          popupContent += `<strong>${result.display_name.split(',').slice(0, 3).join(',')}</strong><br>`;

          if (district) {
            if (isDistrict8) {
              popupContent += `<div style="background: #C41E3A; color: white; padding: 8px; border-radius: 4px; margin-top: 8px;">`;
              popupContent += `<strong>District ${district}</strong><br>`;
              popupContent += `<span style="font-size: 12px;">Stephen Long's District!</span></div>`;
            } else {
              popupContent += `<div style="background: #1B365D; color: white; padding: 8px; border-radius: 4px; margin-top: 8px;">`;
              popupContent += `<strong>District ${district}</strong></div>`;
            }
          } else {
            popupContent += `<div style="background: #666; color: white; padding: 8px; border-radius: 4px; margin-top: 8px;">District not determined</div>`;
          }
          popupContent += `</div>`;

          searchMarker.bindPopup(popupContent).openPopup();
          map.setView([lat, lng], 10);

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
            resultDiv.style.background = '#fee';
            resultDiv.style.color = '#c00';
            resultDiv.innerHTML = '<i class="fa-solid fa-exclamation-circle"></i> Address not found';
          }
        }
      } catch (error) {
        console.error('Search error:', error);
        if (resultDiv) {
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
