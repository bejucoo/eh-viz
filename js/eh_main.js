// Mapbox Token, please change to go live.
mapboxgl.accessToken = "pk.eyJ1IjoiYmVqdWNvIiwiYSI6ImNsZGFzMWozODA4M3MzcHBlazJuNmt0MHQifQ.iY3O20QiikO_kLcJZ2i9tg";

// Create map.
const ehMap = new mapboxgl.Map({
	container: "map",
	style: "mapbox://styles/bejuco/cm9bldki9001a01s34n1hbpig",
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
	major: [],
	national: [],
	clickable: []
};

// Aassociations layers.
const addAssociations = (data) => {
	data.forEach(({id, color, countries, ...metadata}) => {
		const isMajor = metadata.category === "major";
		const visibility = isMajor ? "visible" : "none";

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

		associationLayers[isMajor ? "major" : "national"].push(id);
		associationLayers.clickable.push(id);
	});
};

// Association titles layer.
const addAssociationsLabels = () => {
	ehMap.addLayer({
		id: "associations_labels",
		type: "symbol",
		source: "associationsLabels",
		layout: {
			visibility: "visible",
			"text-field": ['get', 'acronym'],
			"text-font": ['Fjalla One Regular'],
			"text-size": 32,
			"text-anchor": 'center'
		}
	});
	associationLayers.clickable.push("institutions");
};

// Institutions layer.
const addInstitutions = () => {
	ehMap.addLayer({
		id: "institutions",
		type: "circle",
		source: "institutionsPoints",
		layout: { visibility: "none" },
		paint: {
			"circle-radius": 6,
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

	ehMap.addSource("associationsLabels", {
		type: "geojson",
		data: "./data/eh_mapData_associationsLabels.geojson"
	});

	ehMap.addSource("institutionsPoints", {
		type: "geojson",
		data: "./data/eh_mapData_institutions.geojson"
	});

	const associations = await fetchAssociations();
	addAssociations(associations);
	addAssociationsLabels();
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
	const metadata = isInstitution ? feature.properties	: feature.layer.metadata;
	const isNational = metadata.category === "national";

	const popupInfo = `
		${isNational || isInstitution ? `<h2>${metadata.name}</h2>` : ""}
		${isNational ? `<h3>${metadata.acronym}</h3>` : ""}
		<p>${metadata.basicInfo}</p>
		${metadata.city ? `<h3>${metadata.city + ", " + metadata.countries}</h3>` : ""}
		<p>Website: <a href="http://${metadata.website}" target="_blank" rel="noopener noreferrer">${metadata.website}</a></p>
	`;

	new mapboxgl.Popup({
		className: "mapPopup",
		maxWidth: "none"
	})
	.setLngLat(e.lngLat)
	.setHTML(popupInfo)
	.addTo(ehMap);
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
			major_associations: {major: "visible", majorLabels: "visible", national: "none", institutions: "none"},
			national_associations: {major: "none", majorLabels: "none", national: "visible", institutions: "none"},
			institutions: {major: "none", majorLabels: "none", national: "none", institutions: "visible"},
		};

		const state = visibilitySettings[button.id];

		associationLayers.major.forEach(id => {
			ehMap.setLayoutProperty(id, "visibility", state.major);
		});

		ehMap.setLayoutProperty("associations_labels", "visibility", state.majorLabels);

		associationLayers.national.forEach(id => {
			ehMap.setLayoutProperty(id, "visibility", state.national);
		});

		ehMap.setLayoutProperty("institutions", "visibility", state.institutions);
	});
});