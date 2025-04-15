const addList = async (layer) => {
	const listElement = document.getElementById("dataList");
	let institutionsFeaturesInfo = [];
	let nationalFeaturesInfo = [];

	let institutionsFeatures;
	ehMap.on('sourcedata', (e) => {
		if (e.sourceId === "institutionsPoints" && e.isSourceLoaded === true && !e.sourceDataType) {
			institutionsFeatures = ehMap.queryRenderedFeatures({layers: ['institutions']});
		}
	});

	const nationalFeatures = await fetchAssociations();

	/*if (layer === "institutions" && !institutionsListLoaded) {
		features.forEach(feature => {
			const coordinates = feature.geometry.coordinates;
			const props = feature.properties;
			institutionsFeaturesInfo.push([props, coordinates]);
			institutionsFeaturesInfo.sort((a, b) => a[0].name.localeCompare(b[0].name));
		});
		institutionsFeaturesInfo = true;
	} else if (layer === "national" && !nationalListLoaded) {
		features.forEach(feature => {
			const coordinates = feature.properties.popupCoords;
			const props = feature.properties;
			nationalFeaturesInfo.push([props, coordinates]);
			nationalFeaturesInfo.sort((a, b) => a[0].name.localeCompare(b[0].name));
		});
		nationalListLoaded = true;
	}*/

	console.log(institutionsFeatures, nationalFeatures);

	/*featuresInfo.forEach(e => {
		const li = document.createElement('li');
		li.className = "institutionListElm"
		
		let a = document.createElement('a');
		a.innerHTML = e[0].name;
		a.href = "#";
		a.className = "institutionListLink"

		a.addEventListener("click", (link) => {
			link.preventDefault();
			document.querySelectorAll(".mapboxgl-popup").forEach((popup) => popup.remove());

			const popupInfo = `
				<h2>${e[0].name}</h2>
				<p>${e[0].basicInfo}</p>
				${e[0].city ? `<h3>${e[0].city + ", " + e[0].countries}</h3>` : ""}
				<p><b>Website: <a href="http://${e[0].website}" target="_blank" rel="noopener noreferrer">${e[0].website}</a></b></p>
			`;

			new mapboxgl.Popup({
				className: "mapPopup",
				maxWidth: "none"
			})
			.setLngLat(e[1])
			.setHTML(popupInfo)
			.addTo(ehMap);
		});

		li.appendChild(a);		
		listElement.appendChild(li);
	});*/
};