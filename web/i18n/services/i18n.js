import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class I18nService {
	constructor() {
		this.locales = {};
		this.defaultLanguage = 'en';
		this.currentLanguage = this.defaultLanguage;
		this.loadLocales();
	}

	loadLocales() {
		const localesPath = path.join(__dirname, '../locales');
		try {
			const files = fs.readdirSync(localesPath);
			files.forEach(file => {
				if (file.endsWith('.json')) {
					const language = file.replace('.json', '');
					const filePath = path.join(localesPath, file);
					const content = fs.readFileSync(filePath, 'utf8');
					this.locales[language] = JSON.parse(content);
				}
			});

		} catch (error) {
		}
	}

	setLanguage(lang) {
		if (this.locales[lang]) {
			this.currentLanguage = lang;
			return true;
		}
		return false;
	}

	getLanguage() {
		return this.currentLanguage;
	}

	t(key, params = {}) {
		const keys = key.split('.');
		let value = this.locales[this.currentLanguage];
		for (const k of keys) {
			value = value?.[k];
			if (value === undefined) break;
		}

		if (value === undefined) {
			value = this.locales[this.defaultLanguage];
			for (const k of keys) {
				value = value?.[k];
				if (value === undefined) break;
			}
		}

		if (value === undefined) {
			return key;
		}

		if (typeof value === 'string' && params) {
			return value.replace(/\{\{(\w+)\}\}/g, (match, param) =>
				params[param] !== undefined ? params[param] : match
			);
		}

		return value;
	}

	getAvailableLanguages() {
		return Object.keys(this.locales);
	}
}

export default new I18nService();
