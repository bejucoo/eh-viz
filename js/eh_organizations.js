const isMobile = window.innerWidth < 768;

// Mapbox Token
// Please refer to https://docs.mapbox.com/help/getting-started/access-tokens/#how-access-tokens-work for more info.
mapboxgl.accessToken = "pk.eyJ1IjoiaWNlaG8iLCJhIjoiY21jNHVlMXBsMGF5cTJpc2E2MmppMGU0ZSJ9.uq_ZW3D-ALjypCFuWE8VyA";


const ehMap = new mapboxgl.Map({
	container: "map",
	style: "mapbox://styles/iceho/cmc4tz4xa021q01s595ko8yuf",
	center: [0, 0],
	zoom: isMobile ? 0 : 1.24,
	projection: "equalEarth",
	interactive: false
});


const fetchAssociations = async () => {
	try {
		const response = await fetch("./data/eh_organizations_associations.json");
		return await response.json();
	} catch (error) {
		console.error("Error fetching associations data:", error);
	}
};


const layersId = {
	major: [],
	national: [],
	clickable: []
};


const addAssociations = (data) => {
	data.forEach(({id, color, countriesPolygons, ...metadata}) => {
		const isMajor = metadata.category === "major";
		const visibility = isMajor ? "visible" : "none";

		ehMap.addLayer({
			id,
			type: "fill",
			source: "worldMap",
			layout: {visibility},
			paint: {
				"fill-color": color,
				"fill-opacity": 0.5
			},
			filter: [
				"any",
				...countriesPolygons.map(country => ["==", "feature_id", country])
			],
			metadata
		});

		layersId[isMajor ? "major" : "national"].push(id);
		layersId.clickable.push(id);
	});
};


const addMajorAssociationsLabels = () => {
	ehMap.addLayer({
		id: "majorAssociationsLabels",
		type: "symbol",
		source: "associationsLabels",
		layout: {
			visibility: "visible",
			"text-field": ['get', 'acronym'],
			"text-font": ['Libre Franklin Bold'],
			"text-size": 20,
			"text-anchor": 'center'
		}
	});
};


const addInstitutions = () => {
	ehMap.addLayer({
		id: "institutionsPoints",
		type: "circle",
		source: "institutions",
		layout: {visibility: "none"},
		paint: {
			"circle-radius": 4,
			"circle-color": ["get", "color"],
			"circle-opacity": 0.5,
			"circle-stroke-width": 2,
			"circle-stroke-color": ["get", "color"],
			"circle-stroke-opacity": 1
		}
	});
	layersId.clickable.push("institutionsPoints");
};


ehMap.on("load", async () => {
	const layersButtons = document.querySelectorAll('.layerToggle');
	layersButtons.forEach(button => button.disabled = true);

	const onFirstIdle = () => {
		layersButtons.forEach(button => button.disabled = false);
		ehMap.off('idle', onFirstIdle);
	};

	ehMap.on('idle', onFirstIdle);

	ehMap.addSource("worldMap", {
		type: "geojson",
		data: "./resources/worldMap/worldMapLQ.geojson"
	});

	ehMap.addSource("associationsLabels", {
		type: "geojson",
		data: "./data/eh_organizations_associationsLabels.geojson"
	});

	ehMap.addSource("institutions", {
		type: "geojson",
		data: "./data/eh_organizations_institutions.geojson"
	});

	const associations = await fetchAssociations();

	addAssociations(associations);
	addMajorAssociationsLabels();
	addInstitutions();
});


let nationalInfoSaved = false;
let institutionsInfoSaved = false;
let layersInfo = {national: [],	institutions: []};

// Wait for layer source to load when visibility is toggled.
const waitSourceLoad = (sourceId) => {
	return new Promise(resolve => {
		const handler = (e) => {
			if (e.sourceId === sourceId && e.isSourceLoaded && !e.sourceDataType) {
				ehMap.off('sourcedata', handler);
				resolve();
			}
		};
		ehMap.on('sourcedata', handler);
	});
};

// Load data to layersInfo array.
const loadSidebarData = async (layer) => {
	if (layer === "national" && !nationalInfoSaved && layersInfo.national.length === 0) {
		await waitSourceLoad("associationsLabels");
		layersId.national.forEach(e => {
			layersInfo.national.push(ehMap.getLayer(e).metadata);
		});

		nationalInfoSaved = true;
	} else if (layer === "institutions" && !institutionsInfoSaved && layersInfo.institutions.length === 0) {
		await waitSourceLoad("institutions");

		const features = ehMap.querySourceFeatures('institutions', {sourceLayer: 'institutionsPoints'});
		const featuresNames = features.map(e => e.properties.name)
		const filteredFeatures = features.filter(({properties}, index) =>	!featuresNames.includes(properties?.name, index + 1));

		filteredFeatures.forEach((e, i) => {
			layersInfo.institutions.push(e.properties);
			layersInfo.institutions[i].coordinates = e.geometry.coordinates;
		});

		institutionsInfoSaved = true;
	}
}


// Add data as list of links in the sidebar and create popup on click.
const listElement = document.getElementById("dataList");
const addSidebarList = (layer) => {
	const addListElements = (e) => {
		const ul = document.createElement("ul");
		const li = document.createElement("li");
		li.className = "institutionListElm"

		let p = document.createElement("p");
		const listElementSpacer = document.createElement("br");

		p.innerHTML = layer === "institutions"
			?
				`<a href="#" class="listNameLink">
					<b>
						${e.category === "hub"
							? `${e.name} (Hub)`
							: `${e.name}`
						}
					</b> -
					${e.city
						? `${e.city},`
						: ""
					}
					${e.countries}
				</a>
				${e.website
					? `<br>
						<b>
							<a class="listWebsiteLink" href="https://${e.website}"
								${e.website.endsWith(".docx") ? 'target="_blank" rel="noreferrer" download' : 'target="_blank" rel="noreferrer"'}>
									${e.website.endsWith(".docx")
										? "Information"
										: "Website"
									}
							</a>
						</b>`
					: ""
				}
				`
			:
				`<a href="#" class="listNameLink">
					<b>${e.name}</b>
					${e.acronym
						? `<br>(${e.acronym})`
						: ""
					}
				</a>`;

		const link = p.querySelector(".listNameLink");

		link.addEventListener("click", elm => {
			elm.preventDefault();
			document.querySelectorAll(".mapboxgl-popup").forEach(popup => popup.remove());

			const popupInfo = `
				<h2>${e.name}</h2>
				<p>${e.basicInfo}</p>
				${e.basicInfo && `<br>`}
				${e.city
					? `<h3>${e.city + ", " + e.countries}</h3>`
					: ""
				}
				${e.website
					? `<p>
						<b>
							${e.website.endsWith(".docx")
								? "Information"
								: "Website"
							}: <a href="https://${e.website}" ${e.website.endsWith(".docx") ? 'target="_blank" rel="noreferrer" download' : 'target="_blank" rel="noreferrer"'}>
									${e.website.endsWith(".docx")
										? "Download document"
										: e.website
									}
								</a>
						</b>
					</p>`
					: ""
				}
			`;

			new mapboxgl.Popup({
				className: "mapPopup",
				maxWidth: "none"
			})
			.setLngLat(e.coordinates)
			.setHTML(popupInfo)
			.addTo(ehMap);
		});

		li.appendChild(p);	
		ul.appendChild(li);	
		listElement.appendChild(ul);
	}

	let areaGroups = {};
	const nationalAreasOrder = [
		"North America",
		"Latin America",
		"Europe",
		"Oceania",
		"Asia"
	];

	const institutionsAreasOrder = [
		"Asia",
		"Oceania",
		"Africa",
		"Latin America",
		"North America",
		"Europe"
	];

	layersInfo[layer].forEach(e => {
		const area = e.area || "Unknown area";
		if (!areaGroups[area]) areaGroups[area] = [];
		areaGroups[area].push(e);
	});

	// Order elements
	layer === "national"
		? areaGroups = Object.fromEntries(nationalAreasOrder.map(key => [key, areaGroups[key]]))
		: areaGroups = Object.fromEntries(institutionsAreasOrder.map(key => [key, areaGroups[key]]));

	for(let area in areaGroups) {
		const areaHeader = document.createElement("h3");
		areaHeader.innerHTML = area;
		listElement.appendChild(areaHeader);
		areaGroups[area].forEach(e => addListElements(e));
	}
}


const removeSidebarList = (layer) => {
	listElement.innerHTML = "";
}


let sidebarVisible = false;
const toggleSidebarOn = async (layer) => {
	const listTitle = layer === "national"
	? "National Associations and Networks of Environmental History:"
	: "Institutions and Hubs of Environmental History:";

	if (!sidebarVisible) {
		document.getElementById("mapContainer").classList.add("hasSidebar");
		document.getElementById("sidebar").classList.remove("isHidden");
		document.getElementById("dataList_title").innerHTML = listTitle;

		await loadSidebarData(layer);

		addSidebarList(layer);
		sidebarVisible = true;
	} else {
		document.getElementById("dataList_title").innerHTML = listTitle;

		removeSidebarList();
		await loadSidebarData(layer);
		addSidebarList(layer);
	}

	ehMap.resize();
}


const toggleSidebarOff = () => {
	if (sidebarVisible) {
		document.getElementById("dataList_title").innerHTML = "";
		document.getElementById("mapContainer").classList.remove("hasSidebar");
		document.getElementById("sidebar").classList.add("isHidden");

		removeSidebarList();
		sidebarVisible = false;
	}

	ehMap.resize();
}


// Open popup on layer click.
ehMap.on("click", layersId.clickable, (e) => {
	const feature = e.features[0];
	const isInstitution = feature.layer.id === "institutionsPoints";
	const metadata = isInstitution ? feature.properties	: feature.layer.metadata;
	const isNational = metadata.category === "national";

	const popupInfo = `
		${isNational || isInstitution
			? `<h2>
				${metadata.category === "hub"
					? `${metadata.name} (Hub)`
					: `${metadata.name}`}
				</h2>`
			: ""
		}
		${isNational
			? `<h3>
				${metadata.acronym}
				</h3>`
			: ""
		}
		<p>${metadata.basicInfo}</p>
		${metadata.basicInfo && `<br>`}
		${metadata.city
			? `<h3>
				${metadata.city}, ${metadata.countries}
				</h3>`
				: ""
		}
		${metadata.website
			? `<p>
				<b>
					${metadata.website.endsWith(".docx")
						? "Information"
						: "Website"
					}: <a href="https://${metadata.website}" ${metadata.website.endsWith(".docx") ? 'target="_blank" rel="noreferrer" download' : 'target="_blank" rel="noreferrer"'}>
							${metadata.website.endsWith(".docx")
								? "Download document"
								: metadata.website
							}
						</a>
				</b>
			</p>`
			: ""
		}
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
document.querySelectorAll(".layerToggle").forEach((button, index, buttonsArray) => {
	button.addEventListener("click", async () => {
		document.querySelectorAll(".mapboxgl-popup").forEach((popup) => popup.remove());

		const visibilitySettings = {
			majorAssociations: {
				major:			"visible",
				majorLabels:	"visible",
				national:		"none",
				institutions:	"none"
			},
			nationalAssociations: {
				major:			"none",
				majorLabels:	"none",
				national:		"visible",
				institutions:	"none"
			},
			institutions: {
				major:			"none",
				majorLabels:	"none",
				national:		"none",
				institutions:	"visible"
			},
		};

		const state = visibilitySettings[button.id];

		layersId.major.forEach(id => {ehMap.setLayoutProperty(id, "visibility", state.major);});
		layersId.national.forEach(id => {ehMap.setLayoutProperty(id, "visibility", state.national);});
		ehMap.setLayoutProperty("majorAssociationsLabels", "visibility", state.majorLabels);		
		ehMap.setLayoutProperty("institutionsPoints", "visibility", state.institutions);

		if (button.id === "institutions") {
			await toggleSidebarOn("institutions");
		} else if (button.id === "nationalAssociations") {
			await toggleSidebarOn("national");
		} else {
			toggleSidebarOff();	
		}

		buttonsArray.forEach((btn, i) => {
			if (i !== index) {
				btn.classList.remove("active");
			} else {
				if (btn.classList.contains("active")) {
					return;
				} else {
					btn.classList.add("active");
				}
			}
		});

		ehMap.flyTo({
			center: [0, 0],
			zoom: isMobile ? 0 : 1.24,
			speed: 1
		});
	});
});


// Change cursor on hover and out.
const togglePointer = (cursorType) => () => {
	ehMap.getCanvas().style.cursor = cursorType;
};

ehMap.on("mouseenter", layersId.clickable, togglePointer("pointer"));
ehMap.on("mouseleave", layersId.clickable, togglePointer(""));