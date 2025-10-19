// --- Step 1: Initialize the map ---
const map = L.map('map').setView([51.16, 10.45], 6);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// --- Step 2: Load data and add styled map ---
let geojsonLayer; 

Promise.all([
    fetch('germany-states.geojson'),
    d3.csv('clean_air_quality.csv') // CHANGED: Using the new clean file
]).then(([geojsonResponse, pollutionData]) => {
    return Promise.all([geojsonResponse.json(), pollutionData]);
}).then(([geojson, pollutionData]) => {
    
    const pollutionMap = new Map();
    pollutionData.forEach(row => {
        // CHANGED: Using 'pm2_5' column
        pollutionMap.set(row.state, +row.pm2_5);
    });

    // CHANGED: Color scale adjusted for PM2.5 values
    function getColor(pm2_5) {
        return pm2_5 > 85 ? '#800026' :
               pm2_5 > 80 ? '#BD0026' :
               pm2_5 > 75 ? '#E31A1C' :
               pm2_5 > 70 ? '#FC4E2A' :
               pm2_5 > 65 ? '#FD8D3C' :
               pm2_5 > 60 ? '#FEB24C' :
                              '#FFEDA0';
    }

    function style(feature) {
        const stateName = feature.properties.name;
        // CHANGED: Getting data from the new pollutionMap
        const pm2_5 = pollutionMap.get(stateName);
        return {
            fillColor: getColor(pm2_5), // Use the new color function
            weight: 2,
            opacity: 1,
            color: 'white',
            dashArray: '3',
            fillOpacity: 0.7
        };
    }

    function highlightFeature(e) {
        const layer = e.target;
        layer.setStyle({ weight: 5, color: '#666', dashArray: '', fillOpacity: 0.7 });
        layer.bringToFront();
    }

    function resetHighlight(e) {
        geojsonLayer.resetStyle(e.target);
    }
    
    function onEachFeature(feature, layer) {
        layer.on({
            mouseover: highlightFeature,
            mouseout: resetHighlight,
        });

        // CHANGED: Popup text is now for air pollution
        const stateName = feature.properties.name;
        const pm2_5 = pollutionMap.get(stateName);
        if (stateName && pm2_5) {
            layer.bindPopup(`<strong>${stateName}</strong><br>Average PM2.5: ${pm2_5.toFixed(2)} µg/m³`);
        }
    }

    geojsonLayer = L.geoJSON(geojson, { 
        style: style,
        onEachFeature: onEachFeature
    }).addTo(map);

}).catch(error => console.error('Error loading data:', error));