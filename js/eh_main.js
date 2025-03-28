// Create map
const ehMap = new maplibregl.Map({
	container: "map",
	style: "./resources/mapStyles/eh_baseMap.json",
	center: [0, 0],
	zoom: 2
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
				filter: ["==", "adm0_a3", e.countries[0]],
				metadata: {
					"name": e.name,
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
			"circle-radius": 6,
			"circle-color": "#800"
		}
	});
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



// Get infobox elements
const infoTitle = document.getElementById("infoTitle");
const infoWebsite = document.getElementById("infoWebsite");
const infoBasic = document.getElementById("infoBasic");

// Click on polygons to change info and zoom
ehMap.on("click", clickableAssociations, e => {
	infoTitle.innerHTML = e.features[0].layer.metadata.name;
	infoWebsite.innerHTML = e.features[0].layer.metadata.website;
	infoBasic.innerHTML = e.features[0].layer.metadata.basic;
	
	ehMap.flyTo({
		center: e.features[0].layer.metadata.zoomCoords,
		zoom: e.features[0].layer.metadata.zoomLevel,
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

// Clicking buttons change visibility of layers
toggleButtons.forEach(elm => {
	elm.addEventListener("click", e => {
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