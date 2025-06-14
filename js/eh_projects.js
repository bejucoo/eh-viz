// Fetch projects, create grid.
document.addEventListener("DOMContentLoaded", async () => {
	const projectsJson = await fetchProjects();
	//createProjectsGrid(projectsJson);
	const projectsList = new List('projectsContainer', listOptions, projectsJson);
});


// Fetch projects JSON.
const fetchProjects = async () => {
	try {
		const response = await fetch("./data/eh_projects.json");
		return await response.json();
	} catch (error) {
		console.error("Error fetching projects data:", error);
	}
};


const listOptions = {
	valueNames: ["name", "website", "id", "years", "countries"],
	//percentPosition: true,
	item: (values) => {
		return `
			<div class="projectElement" id="${values.id}">
				<img
					src="./resources/images/projects/${values.id}.webp"
					alt="${values.name} image"
					class="projectImg">

				<h2 class="projectName">
					${values.name}
				</h2>
				<br>

				${values.years !== ""
					? `<h3 class="projectCountries">${values.years}</h3><br>`
					: ``
				}

				<h3 class="projectCountries">
					${values.countries.join(", ")}
				</h3>

				<br>
				${values.website !== ""
					?
						`<h3 class="projectWebsite">
							<a class="projectWebsiteLink"
								href="https://${values.website}"
								${values.website.endsWith(".docx") ? 'target="_blank" rel="noreferrer" download' : 'target="_blank" rel="noreferrer"'}>
									${values.website.endsWith(".docx")
										? "Information"
										: "Website"
									}
							</a>
						</h3>`
					: ``
				}
			</div>
		`;
    }
};