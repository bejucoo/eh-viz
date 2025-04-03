// Mapbox Token, please change to go live.
mapboxgl.accessToken = "pk.eyJ1IjoiYmVqdWNvIiwiYSI6ImNsZGFzMWozODA4M3MzcHBlazJuNmt0MHQifQ.iY3O20QiikO_kLcJZ2i9tg";

// Create map.
const ehMap = new mapboxgl.Map({
	container: "map",
	style: "./resources/mapStyles/eh_baseMap.json",
	center: [0, 0],
	zoom: 1.5,
	projection: "equalEarth"
});

// Get associations data.
const fetchAssociations = async () => {
	try {
		const response = await fetch("./data/eh_mapData_associations.json");
		return await response.json();
	} catch (error) {
		console.error("Error fetching associations data:", error);
	}
};

// Arrays for associations IDs.
const associationLayers = {
	regional: [],
	national: [],
	clickable: []
};

// Aassociations layers.
const addAssociations = (data) => {
	data.forEach(({ id, type, color, countries, ...metadata }) => {
		const isRegional = type === "regional";
		const visibility = isRegional ? "visible" : "none";

		ehMap.addLayer({
			id,
			type: "fill",
			source: "countriesPolygons",
			layout: { visibility },
			paint: {
				"fill-color": color,
				"fill-opacity": 0.5
			},
			filter: [
				"any",
				...countries.map((country) => ["==", "adm0_a3", country])
			],
			metadata
		});

		associationLayers[isRegional ? "regional" : "national"].push(id);
		associationLayers.clickable.push(id);
	});
};

// Institutions layer.
const addInstitutions = () => {
	ehMap.addLayer({
		id: "institutions",
		type: "circle",
		source: "institutionsPoints",
		layout: { visibility: "none" },
		paint: {
			"circle-radius": 8,
			"circle-color": "#685ea0"
		}
	});
	associationLayers.clickable.push("institutions");
};

// Load sources and add layers.
ehMap.on("load", async () => {
	ehMap.addSource("countriesPolygons", {
		type: "geojson",
		data: "./resources/countriesPolygons/countriesMQ.geojson"
	});

	ehMap.addSource("institutionsPoints", {
		type: "geojson",
		data: "./data/eh_mapData_institutions.geojson"
	});

	const associations = await fetchAssociations();
	addAssociations(associations);
	addInstitutions();
});

// Change cursor on hover.
const togglePointer = (cursorType) => () => {
	ehMap.getCanvas().style.cursor = cursorType;
};

ehMap.on("mouseenter", associationLayers.clickable, togglePointer("pointer"));
ehMap.on("mouseleave", associationLayers.clickable, togglePointer(""));

// Open popup and change position on click.
ehMap.on("click", associationLayers.clickable, (e) => {
	const feature = e.features[0];
	const isInstitution = feature.layer.id === "institutions";
	const metadata = isInstitution
	? feature.properties
	: feature.layer.metadata;

	const popupInfo = `
		<h2>${metadata.name}</h2>
		${metadata.acronym === "" ? "" : `<h3>${metadata.acronym}</h3>`}
		${metadata.city ? `<h3>${metadata.city + ", " + metadata.countries}</h3>` : ""}
		<a href="http://${metadata.website}" target="_blank" rel="noopener noreferrer">${metadata.website}</a>
		<p>${metadata.basicInfo}</p>
	`;

	new mapboxgl.Popup({
		className: "mapPopup",
		maxWidth: "none"
	})
	.setLngLat(e.lngLat)
	.setHTML(popupInfo)
	.addTo(ehMap);

	ehMap.flyTo({
		center: metadata.zoomCoords || e.lngLat,
		zoom: metadata.zoomLevel || 3,
		speed: 0.5
	});
});

// Change visibility on button click.
document.querySelectorAll(".layerToggle").forEach((button) => {
	button.addEventListener("click", () => {
		document
		.querySelectorAll(".mapboxgl-popup")
		.forEach((popup) => popup.remove());

		ehMap.flyTo({
			center: [0, 0],
			zoom: 1.5,
			speed: 1
		});

		const visibilitySettings = {
			regional_associations: {regional: "visible", national: "none", institutions: "none"},
			national_associations: {regional: "none", national: "visible", institutions: "none"},
			institutions: {regional: "none", national: "none", institutions: "visible"},
		};

		const state = visibilitySettings[button.id];

		associationLayers.regional.forEach(id => {
			ehMap.setLayoutProperty(id, "visibility", state.regional);
		});

		associationLayers.national.forEach(id => {
			ehMap.setLayoutProperty(id, "visibility", state.national);
		});

		ehMap.setLayoutProperty("institutions", "visibility", state.institutions);
	});
});