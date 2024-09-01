 // Initialize the map
 let myMap = L.map("map", {
    center: [25.276987, 55.296249],
    zoom: 3
});

// Define base layers
let street = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(myMap);

let topo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
});

// Leaflet doesn’t directly support Google's map tiles due to Google's licensing terms.
// If needed, use another tile provider or properly integrate Google Maps.

// Base map options
let baseMaps = {
    "Street Map": street,
    "Topographic Map": topo
};

// Create LayerGroups for overlays
let earthquakes = new L.LayerGroup();
let plates = new L.LayerGroup();

// Overlay options
let overlayMaps = {
    Earthquakes: earthquakes,
    TectonicPlates: plates
};

// Layer control
L.control.layers(baseMaps, overlayMaps, { collapsed: false }).addTo(myMap);

// Define a color function based on depth
function chooseColor(depth) {
    return depth > 90 ? "#e0c501" :
           depth > 70 ? "#60007b" :
           depth > 50 ? "#93007b" :
           depth > 30 ? "#c96f01" :
           depth > 10 ? "#d29101" :
                        "#e88901";
}

// Define a size function based on magnitude
function chooseSize(magnitude) {
    return magnitude ? magnitude * 5 : 1;
}

// Marker style setup function
function formatCircleMarker(feature, latlng) {
    return {
        radius: chooseSize(feature.properties.mag),
        fillColor: chooseColor(feature.geometry.coordinates[2]),
        color: "#000",
        weight: 0.5,
        opacity: 1,
        fillOpacity: 1.5
    };
}

// Function to bind popups for each feature
function onEachFeature(feature, layer) {
    layer.bindPopup(`<h3>${feature.properties.place}</h3><hr><p>${new Date(feature.properties.time)}</p><hr><p>Magnitude: ${feature.properties.mag}</p><hr><p>Depth: ${feature.geometry.coordinates[2]}</p>`);
}

// Fetch earthquakes data
fetch("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson")
    .then(response => response.json())
    .then(data => {
        L.geoJSON(data, {
            pointToLayer: (feature, latlng) => L.circleMarker(latlng, formatCircleMarker(feature)),
            onEachFeature: onEachFeature
        }).addTo(earthquakes);
        earthquakes.addTo(myMap);
    })
    .catch(error => console.error('Error fetching earthquake data:', error));

// Fetch tectonic plates data
fetch("https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_plates.json")
    .then(response => response.json())
    .then(data => {
        L.geoJSON(data, {
            style: {
                color: 'orange',
                weight: 2
            }
        }).addTo(plates);
    })
    .catch(error => console.error('Error fetching tectonic plates data:', error));

// Legend creation
let legend = L.control({ position: "bottomright" });

legend.onAdd = function () {
    let div = L.DomUtil.create("div", "info legend");

    // Set up the depth ranges and corresponding colors
    let depthRange = [-10, 10, 30, 50, 70, 90];
    let colors = ["#e0c501", "#d29101", "#c96f01", "#93007b", "#60007b", "#2f007b"];

    
    // Create the container for the legend content
    let legendHtml = `
      <div style="background: white; padding: 10px; border-radius: 5px; box-shadow: 0 0 15px rgba(0, 0, 0, 0.2);">
        <div style='display: flex; flex-direction: column; align-items: stretch;'>
    `;
    
    // Add color blocks and labels
    colors.forEach((color, index) => {
      legendHtml += `
        <div style="display: flex; align-items: center;">
          <div style="background-color: ${color}; width: 18px; height: 18px; margin-right: 5px;"></div>
          <div style="flex: 1;">${depthRange[index]}${depthRange[index + 1] ? `&ndash;${depthRange[index + 1]}` : "+"}</div>
        </div>
      `;
    });
    
    // Close the legend container
    legendHtml += '</div></div>';
    
    div.innerHTML = legendHtml;
    return div;
};

legend.addTo(myMap);