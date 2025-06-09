// Fetch projects JSON.
const fetchProjects = async () => {
	try {
		const response = await fetch("./data/eh_projects.json");
		return await response.json();
	} catch (error) {
		console.error("Error fetching projects data:", error);
	}
};


// Fetch projects, create grid.
document.addEventListener("DOMContentLoaded", async () => {
	const projectsJson = await fetchProjects();
	console.log(projectsJson);
});