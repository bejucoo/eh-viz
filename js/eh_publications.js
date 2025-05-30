// Fetch publications JSON.
const fetchPublications = async () => {
	try {
		const response = await fetch("./data/eh_publications.json");
		return await response.json();
	} catch (error) {
		console.error("Error fetching publications data:", error);
	}
};


// List.js options and publication HTML element to render.
const options = {
	valueNames: ['name', 'type', 'imageLink'],
	percentPosition: true,
	item: (values) => {
		return `
			<div class="publicationElement">
				<h4 class="publicationType">${values.type}</h4>
				<a href="${values.website}" target="_blank" rel="noreferrer">
					<img src="./resources/images/publications/${values.name}.webp" alt="${values.name} image" class="publicationImg">
				</a>
				<h2 class="publicationName">
					<a href="${values.website}" target="_blank" rel="noreferrer">${values.name}</a>
				</h2>
				${values.years !== '' ? `<h4 class="publicationYear">${values.years}</h4>` : ''}
			</div>
		`;
    }
};


// Object for publications data to create filters.
let filters = {
	types: [],
	categories: [],
	areas: []
};


// Create filter controls.
const createFilters = (publications) => {
	publications.forEach(e => {
		!filters.types.includes(e.type) && filters.types.push(e.type);

		e.categories.forEach(cat => {
			!filters.categories.includes(cat) && filters.categories.push(cat);
		});

		e.areas.forEach(area => {
			!filters.areas.includes(area) && filters.areas.push(area);
		});
	});

	const filterContainers = {
		typesFilters: document.getElementById("typesFilters"),
		categoriesFilters: document.getElementById("categoriesFilters"),
		areasFilters: document.getElementById("areasFilters")
	}

	for (const key in filters) {
		if (filters.hasOwnProperty(key)) {
			filters[key].forEach(e => {
				const filterButton = document.createElement('button');
				filterButton.id = e.toLowerCase().replaceAll(' ', '-');;
				filterButton.classList.add("filterToggle");
				filterButton.classList.add(key);
				filterButton.innerText = e;

				key !== "types" && filterButton.classList.add("isHidden");

				filterControls.appendChild(filterButton);

				for (const container of Object.values(filterContainers)) {
					key === container.id.replaceAll("Filters", "") && container.appendChild(filterButton);
				}
			});
		}
	}
}


// Change state of buttons. Click on All Publications resets filters.
const toggleButtons = (filterButton, buttonsArray, list) => {
	// Kinds of buttons
	const isAll = filterButton.id === "all-publications";
	const isType = filterButton.classList.contains("types");
	const isCategory = filterButton.classList.contains("categories");
	const isArea = filterButton.classList.contains("areas");

	// Functions to toggle or detect class in element
	const toggleClass = (el, cls) => el.classList.toggle(cls);
	const hasClass = (el, cls) => el.classList.contains(cls);

	// Handle 'All Publications' button click
	if (isAll) {
		buttonsArray.forEach(e => {
			e.classList.remove("active");
			if (e.classList.contains("categories") || e.classList.contains("areas")) {
				e.classList.add("isHidden");
			}
		});
		filterButton.classList.add("active");

		// Show all items (clear filter)
		list.filter(); // no callback = show all
		return;
	}

	// Deselect "all-publications" when any other button is clicked
	buttonsArray.forEach(e => {
		if (e.id === "all-publications") {
			e.classList.remove("active");
		}
	});

	// Handle Type buttons
	if (isType) {
		buttonsArray.forEach(e => {
			if (e.classList.contains("types")) {
				e.id === filterButton.id ? e.classList.add("active") : e.classList.remove("active");
			}

			if (e.classList.contains("categories")) {
				e.classList.remove("isHidden");
				e.classList.remove("active");
			}
			if (e.classList.contains("areas")) {
				e.classList.add("isHidden");
				e.classList.remove("active");
			}
		});
	}

	// Handle Category buttons (toggle active)
	if (isCategory) {
		toggleClass(filterButton, "active");

		const anyCategoryActive = buttonsArray.some(e =>
			e.classList.contains("categories") && e.classList.contains("active")
		);

		buttonsArray.forEach(e => {
			if (e.classList.contains("areas")) {
				e.classList.toggle("isHidden", !anyCategoryActive);
			}
		});
	}

	// Handle Area buttons (toggle active)
	if (isArea) {
		toggleClass(filterButton, "active");
	}
};


// Filter list based on active buttons
const filterList = (buttonsArray, list) => {
	// Get active buttons
	const activeType = buttonsArray.find(e => e.classList.contains("types") && e.classList.contains("active"));
	const activeTypeText = activeType ? activeType.innerHTML.trim() : null;

	const activeCategories =
		buttonsArray
			.filter(e => e.classList.contains("categories") && e.classList.contains("active"))
			.map(e => e.innerHTML.trim());

	const activeAreas =
		buttonsArray
			.filter(e => e.classList.contains("areas") && e.classList.contains("active"))
			.map(e => e.innerHTML.trim());

	// Filter items that match active buttons type, category or area
	list.filter(item => {
		const values = item.values();

		const matchesType = activeTypeText ? values.type === activeTypeText : true;

		const matchesCategory = activeCategories.length > 0
			? activeCategories.some(cat => values.categories && values.categories.includes(cat))
			: true;

		const matchesArea = activeAreas.length > 0
			? activeAreas.some(area => values.areas && values.areas	.includes(area))
			: true;

		return matchesType && matchesCategory && matchesArea;
	});
}



// Fetch publications, create list and masonry.
document.addEventListener("DOMContentLoaded", async () => {
	// Fetch publications JSON
	const publicationsJson = await fetchPublications();

	createFilters(publicationsJson);

	// Create List.js with JSON data.
	const publicationsList = new List('publicationsContainer', options, publicationsJson);

	// Create Masonry.js instance.
	const masonry = new Masonry( '.publicationsContainer', {
		itemSelector: '.publicationElement',
		percentPosition: true
	});

	// Re-order masonry when images are loaded.
	imagesLoaded(document.querySelector('.publicationsContainer'), function() {
		masonry.layout();
	});

	const buttonsNodeList = document.querySelectorAll(".filterToggle");
	const buttonsArray = Array.from(buttonsNodeList);

	buttonsArray.forEach((button) => {
		button.addEventListener("click", () => {
			toggleButtons(button, buttonsArray, publicationsList);
			filterList(buttonsArray, publicationsList);
			masonry.reloadItems();
			masonry.layout();
		});
	});
});