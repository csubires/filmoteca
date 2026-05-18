import fs from 'fs';
import path from 'path';

function loadQueries(queriesDirPath) {
	try {
		if (!fs.existsSync(queriesDirPath)) {
			console.error(`Queries directory not found: ${queriesDirPath}`);
			return {};
		}

		const mergedQueries = {};
		const files = fs.readdirSync(queriesDirPath).filter(file => file.endsWith('.json'));

		if (files.length === 0) {
			console.warn(`No JSON files found in: ${queriesDirPath}`);
			return {};
		}

		for (const file of files) {
			const filePath = path.join(queriesDirPath, file);
			try {
				const content = fs.readFileSync(filePath, 'utf8');
				const queries = JSON.parse(content);
				Object.assign(mergedQueries, queries);
				console.log(`✓ Loaded queries from ${file} (${Object.keys(queries).length} queries)`);
			} catch (error) {
				console.error(`Error loading queries from ${file}:`, error.message);
			}
		}

		console.log(`✓ Total queries loaded: ${Object.keys(mergedQueries).length}`);
		return mergedQueries;
	} catch (error) {
		console.error('Error loading queries:', error.message);
		return {};
	}
}

export { loadQueries };
