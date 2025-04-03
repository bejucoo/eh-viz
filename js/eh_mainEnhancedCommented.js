// Set the Mapbox access token (replace for production use)
mapboxgl.accessToken = 'pk.eyJ1IjoiYmVqdWNvIiwiYSI6ImNsZGFzMWozODA4M3MzcHBlazJuNmt0MHQifQ.iY3O20QiikO_kLcJZ2i9tg';

// Initialize the map
const ehMap = new mapboxgl.Map({
	container: "map",  // The ID of the HTML element where the map will be displayed
	style: "./resources/mapStyles/eh_baseMap.json", // Custom style file
	center: [0, 0],  // Initial center coordinates
	zoom: 1.5,  // Initial zoom level
	projection: 'equalEarth' // Using the Equal Earth projection
});

// Fetch associations data asynchronously
const fetchAssociations = async () => {
	try {
		const response = await fetch('./data/eh_mapData_associations.json'); // Fetch JSON data
		return await response.json(); // Parse JSON response and return data
	} catch (error) {
		console.error('Error fetching associations:', error);
		return []; // Return an empty array to prevent errors in subsequent functions
	}
};

// Object to store layer IDs for different types of associations
const associationLayers = {
	regional: [],  // List of regional association layers
	national: [],  // List of national association layers
	clickable: [], // List of all clickable layers
};

// Function to add association layers efficiently
const addAssociations = (data) => {
	data.forEach(({ id, type, color, countries, ...metadata }) => {
		// Use destructuring to extract properties dynamically
		const isRegional = type === "regAssociations"; // Check if it's a regional association
		const visibility = isRegional ? "visible" : "none"; // Set initial visibility

		ehMap.addLayer({
			id,
			type: "fill", // Define the layer as a filled polygon
			source: "countriesPolygons", // The data source to be used
			layout: { visibility }, // Set initial visibility
			paint: { "fill-color": color, "fill-opacity": 0.5 }, // Set color and transparency
			filter: ["any", ...countries.map(d => ["==", "adm0_a3", d])], // Filter polygons by country code
			metadata, // Store additional metadata for popups
		});

		// Store the layer IDs in the correct category
		associationLayers[isRegional ? "regional" : "national"].push(id);
		associationLayers.clickable.push(id); // Mark the layer as clickable
	});
};

// Function to add institutions layer to the map
const addInstitutions = () => {
	ehMap.addLayer({
		id: "institutions",
		type: "circle", // Display institutions as circles
		source: "institutionsPoints", // Data source
		layout: { visibility: "none" }, // Initially hidden
		paint: { "circle-radius": 8, "circle-color": "#685ea0" }, // Define circle style
	});
	associationLayers.clickable.push("institutions"); // Add to clickable layers
};

// Load map sources and layers
ehMap.on("load", async () => {
	// Add country polygons data source
	ehMap.addSource("countriesPolygons", {
		type: "geojson",
		data: "./resources/countriesPolygons/countriesMQ.geojson",
	});

	// Add institutions data source
	ehMap.addSource("institutionsPoints", {
		type: "geojson",
		data: "./data/eh_mapData_institutions.geojson",
	});

	// Fetch associations data and add the layers
	const associations = await fetchAssociations();
	addAssociations(associations);
	addInstitutions();
});

// Function to update cursor style on hover
const updateCursor = (cursorType) => () => ehMap.getCanvas().style.cursor = cursorType;

// Attach hover events for clickable layers
ehMap.on('mouseenter', associationLayers.clickable, updateCursor('pointer'));
ehMap.on('mouseleave', associationLayers.clickable, updateCursor(''));

// Handle clicks on association or institution layers
ehMap.on("click", associationLayers.clickable, (e) => {
	const feature = e.features[0]; // Get the clicked feature
	const isInstitution = feature.layer.id === "institutions"; // Check if it's an institution
	const metadata = isInstitution ? feature.properties : feature.layer.metadata; // Get metadata based on type

	// Generate popup content dynamically
	const popupInfo = `
		<h2>${metadata.name}</h2>
		<h3>${metadata.acronym || `${metadata.city}, ${metadata.countries}`}</h3>
		<a href="http://${metadata.website}">${metadata.website}</a>
		${metadata.basic ? `<p>${metadata.basic}</p>` : ""}
	`;

	// Display the popup
	new mapboxgl.Popup({ className: "mapPopup", maxWidth: "none" })
		.setLngLat(e.lngLat)
		.setHTML(popupInfo)
		.addTo(ehMap);

	// Fly to the feature's location with a smooth animation
	ehMap.flyTo({
		center: metadata.zoomCoords || e.lngLat,
		zoom: metadata.zoomLevel || 3,
		speed: 0.5,
	});
});

// Handle visibility toggles with buttons
document.querySelectorAll(".layerToggle").forEach(button => {
	button.addEventListener("click", () => {
		// Remove all existing popups when toggling layers
		document.querySelectorAll('.mapboxgl-popup').forEach(popup => popup.remove());

		// Reset the map view
		ehMap.flyTo({ center: [0, 0], zoom: 1.5, speed: 1 });

		// Define visibility settings for each button type
		const visibilitySettings = {
			regAssociations: { regional: "visible", national: "none", institutions: "none" },
			natAssociations: { regional: "none", national: "visible", institutions: "none" },
			institutions: { regional: "none", national: "none", institutions: "visible" },
		};

		// Get the visibility settings for the clicked button
		const state = visibilitySettings[button.id] || {};

		// Apply the visibility settings to each layer type
		associationLayers.regional.forEach(id => ehMap.setLayoutProperty(id, "visibility", state.regional));
		associationLayers.national.forEach(id => ehMap.setLayoutProperty(id, "visibility", state.national));
		ehMap.setLayoutProperty("institutions", "visibility", state.institutions);
	});
});
