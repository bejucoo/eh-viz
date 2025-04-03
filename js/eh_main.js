// Mapbox Toke, please change to go Live.
mapboxgl.accessToken = 'pk.eyJ1IjoiYmVqdWNvIiwiYSI6ImNsZGFzMWozODA4M3MzcHBlazJuNmt0MHQifQ.iY3O20QiikO_kLcJZ2i9tg';

// Create map
const ehMap = new mapboxgl.Map({
	container: "map",
	style: "./resources/mapStyles/eh_baseMap.json",
	center: [0, 0],
	zoom: 1.5,
	projection: 'equalEarth'
});



// Get associations info
const fetchAssociations = async () => {
	try {
		const response = await fetch('./data/eh_mapData_associations.json')
		const data = await response.json();
		return data;
	} catch(error) {
		console.error(error);
	}
}

// Create arrays to store associations IDs
let regAssociationsList = [];
let natAssociationsList = [];
let clickableAssociations = [];

// Function to add associations layers to the map
const addAssociations = (data) => {
	data.forEach(e => {
		switch(e.type) {
		// Regional
		case "regAssociations":
			ehMap.addLayer({
				id: e.id,
				type: "fill",
				source: "countriesPolygons",
				layout: {
					"visibility": "visible"
				},
				paint: {
					"fill-color": e.color,
					"fill-opacity": 0.5
				},
				filter: ["any", ...e.countries.map(d => ["==", "adm0_a3", d])],
				metadata: {
					"name": e.name,
					"acronym": e.acronym,
					"website": e.website,
					"basic": e.basicInfo,
					"zoomCoords": e.zoomCoords,
					"zoomLevel": e.zoomLevel,
					"ehType": e.type
				}
			});
			regAssociationsList.push(e.id);
			clickableAssociations.push(e.id);
			break;

			// Regional Labels
			// TO DO: Add geojson file with associations Name Info and Coords
			/*ehMap.addLayer({
				id: "regNames",
				type: "symbol",
				source: "countriesPolygons",
				layout: {
					"symbol-placement": "point",
					"text-field": e.acronym,
					"text-size": 40,
					"text-justify": "center",
					"text-allow-overlap": false
				},
				filter: ["any", ...e.countries.map(d => ["==", "adm0_a3", d])]
			});*/

		// National
		case "natAssociations":
			ehMap.addLayer({
				id: e.id,
				type: "fill",
				source: "countriesPolygons",
				layout: {
					"visibility": "none"
				},
				paint: {
					"fill-color": e.color,
					"fill-opacity": 0.5
				},
				filter: ["any", ...e.countries.map(d => ["==", "adm0_a3", d])],
				metadata: {
					"name": e.name,
					"acronym": e.acronym,
					"website": e.website,
					"basic": e.basicInfo,
					"zoomCoords": e.zoomCoords,
					"zoomLevel": e.zoomLevel,
					"ehType": e.type
				}
			});
			natAssociationsList.push(e.id);
			clickableAssociations.push(e.id);
			break;
		}
	});
}

// Function to add institutions layer to the map
const addInstitutions = () => {
	ehMap.addLayer({
		id: "institutions",
		type: "circle",
		source: "institutionsPoints",
		layout: {
			"visibility": "none"
		},
		paint: {
			"circle-radius": 8,
			"circle-color": "#685ea0"
		}
	});
	clickableAssociations.push("institutions");
}



// Add file sources and layers to the map
ehMap.on("load", () => {
	ehMap.addSource("countriesPolygons", {
		type: "geojson",
		data: "./resources/countriesPolygons/countriesMQ.geojson"
	});

	ehMap.addSource("institutionsPoints", {
		type: "geojson",
		data: "./data/eh_mapData_institutions.geojson"
	});

	fetchAssociations().then(data => addAssociations(data));
	addInstitutions();
});



// On hover change cursor to pointer
ehMap.on('mouseenter', clickableAssociations, () => {
	ehMap.getCanvas().style.cursor = 'pointer'
})
ehMap.on('mouseleave', clickableAssociations, () => {
	ehMap.getCanvas().style.cursor = ''
})



// Click on polygons to change popup info and zoom
ehMap.on("click", clickableAssociations, e => {
	let popupInfo = "";
	let popupCoords = [];
	let popupZoom = 0;

	if(e.features[0].layer.id == "institutions"){
		popupInfo = `<h2>${e.features[0].properties.name}</h2><h3>${e.features[0].properties.city}, ${e.features[0].properties.countries}</h3><a href="http://${e.features[0].properties.website}">${e.features[0].properties.website}</a>`;
		popupCoords = e.features[0].geometry.coordinates;
		popupZoom = 3;
	} else {
		popupInfo = `<h2>${e.features[0].layer.metadata.name}</h2><h3>${e.features[0].layer.metadata.acronym}</h3><a href="http://${e.features[0].layer.metadata.website}">${e.features[0].layer.metadata.website}</a><p>${e.features[0].layer.metadata.basic}</p>`;
		popupCoords = e.features[0].layer.metadata.zoomCoords;
		popupZoom = e.features[0].layer.metadata.zoomLevel;
	}

	new mapboxgl.Popup({
		className: "mapPopup",
		maxWidth: "none"
	})
	.setLngLat(e.lngLat)
	.setHTML(popupInfo)
	.addTo(ehMap);
	
	ehMap.flyTo({
		center: popupCoords,
		zoom: popupZoom,
		speed: 0.5
	});
});



// Get toggle buttons
const toggleButtons = document.querySelectorAll(".layerToggle");

// Function to change the visibility of multiple layers
const toggleArrayVisibility = (layersArray, state) => {
	layersArray.forEach(layer => {
		ehMap.setLayoutProperty(layer, "visibility", state);
	});
}

// Clicking buttons change visibility of layers and zoom
toggleButtons.forEach(elm => {
	elm.addEventListener("click", e => {
		document.querySelectorAll('.mapboxgl-popup').forEach(popup => popup.remove());

		ehMap.flyTo({
			center: [0, 0],
			zoom: 1.5,
			speed: 1
		});

		switch(e.srcElement.id) {
		case "regAssociations":
			toggleArrayVisibility(regAssociationsList, "visible");
			toggleArrayVisibility(natAssociationsList, "none");
			ehMap.setLayoutProperty("institutions", "visibility", "none");
			break;
		case "natAssociations":
			toggleArrayVisibility(regAssociationsList, "none");
			toggleArrayVisibility(natAssociationsList, "visible");
			ehMap.setLayoutProperty("institutions", "visibility", "none");
			break;
		case "institutions":
			toggleArrayVisibility(natAssociationsList, "none");
			toggleArrayVisibility(regAssociationsList, "none");
			ehMap.setLayoutProperty("institutions", "visibility", "visible");
			break;
		}
	});
});