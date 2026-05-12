import fs from 'fs';

function loadQueries(queriesJsonPath) {
	try {
		if (!fs.existsSync(queriesJsonPath)) {
			console.error(`Queries file not found: ${queriesJsonPath}`);
			return {};
		}
		const content = fs.readFileSync(queriesJsonPath, 'utf8');
		return JSON.parse(content);
	} catch (error) {
		console.error('Error loading queries:', error.message);
		return {};
	}
}

export { loadQueries };
