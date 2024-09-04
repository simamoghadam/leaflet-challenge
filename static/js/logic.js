// Initialise the map
let myMap = L.map("map", {
    center: [25.276987, 55.296249], // Dubai (Middle East) coordinates
    zoom: 3
});

// Define base layers ( Using OpenStreetMap for street view )
let street = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(myMap);

let topo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
});


// Create LayerGroup for earthquakes
let earthquakes = new L.LayerGroup().addTo(myMap);

// Define a color function based on depth
function chooseColor(depth) {
    return depth > 90 ? "#4c0080" : // Dark Purple
           depth > 70 ? "#800080" : // Purple
           depth > 50 ? "#b30059" : // Dark Pink
           depth > 30 ? "#cc2900" : // Dark Red-Orange
           depth > 10 ? "#ff6600" : // Bright Orange
                        "#ffcc00";  // Yellow-Orange
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
        fillOpacity: 1
    };
}

// Function to bind popups for each feature
function onEachFeature(feature, layer) {
    const [longitude, latitude, depth] = feature.geometry.coordinates;
    layer.bindPopup(`
        <h3>${feature.properties.place}</h3>
        <hr>
        <p>${new Date(feature.properties.time)}</p>
        <hr>
        <p>Magnitude: ${feature.properties.mag}</p>
        <p>Depth: ${depth} km</p>
        <hr>
        <p>Latitude: ${latitude.toFixed(2)}°, Longitude: ${longitude.toFixed(2)}°</p>
    `);
}

// Fetch earthquakes data using D3
d3.json("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson")
    .then(data => {
        L.geoJSON(data, {
            pointToLayer: (feature, latlng) => L.circleMarker(latlng, formatCircleMarker(feature)),
            onEachFeature: onEachFeature
        }).addTo(earthquakes);
    })
    .catch(error => console.error('Error fetching earthquake data:', error));

// Legend creation
let legend = L.control({ position: "bottomright" });

legend.onAdd = function () {
    let div = L.DomUtil.create("div", "info legend");

// Set up the depth ranges and corresponding colors
let depthRange = [-10, 10, 30, 50, 70, 90];
let colors = ["#ffcc00", "#ff6600", "#cc2900", "#b30059", "#800080", "#4c0080"];

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
// Add the legend to the map
legend.addTo(myMap);