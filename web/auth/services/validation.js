class ValidationService {
	validateEmail(email) {
		if (!email || typeof email !== 'string') {
			return { isValid: false, error: 'validation.emailRequired' };
		}

		// Trim whitespace
		const trimmed = email.trim();
		if (trimmed.length === 0) {
			return { isValid: false, error: 'validation.emailRequired' };
		}

		// Check for HTML/dangerous characters
		const dangerousChars = /[<>"'&]/;
		if (dangerousChars.test(trimmed)) {
			return { isValid: false, error: 'validation.invalidCharsDetected' };
		}

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(trimmed)) {
			return { isValid: false, error: 'validation.invalidEmailFormat' };
		}
		const tempEmailDomains = [
			'tempmail.com', 'guerrillamail.com', 'mailinator.com',
			'10minutemail.com', 'yopmail.com', 'throwaway.com'
		];
		const domain = trimmed.split('@')[1].toLowerCase();
		if (tempEmailDomains.some(temp => domain.includes(temp))) {
			return { isValid: false, error: 'validation.temporaryEmailNotAllowed' };
		}
		return { isValid: true, value: trimmed };
	}

	validateUsername(username) {
		if (!username || typeof username !== 'string') {
			return { isValid: false, error: 'validation.usernameRequired' };
		}

		// Trim whitespace
		const trimmed = username.trim();
		if (trimmed.length === 0) {
			return { isValid: false, error: 'validation.usernameRequired' };
		}

		// Check for HTML/dangerous characters
		const dangerousChars = /[<>"'&]/;
		if (dangerousChars.test(trimmed)) {
			return { isValid: false, error: 'validation.invalidCharsDetected' };
		}

		if (trimmed.length < 3 || trimmed.length > 30) {
			return { isValid: false, error: 'validation.usernameLength' };
		}
		const usernameRegex = /^[a-zA-Z0-9_-]+$/;
		if (!usernameRegex.test(trimmed)) {
			return { isValid: false, error: 'validation.usernameInvalidChars' };
		}
		const reservedUsernames = [
			'admin', 'administrator', 'root', 'system', 'support',
			'help', 'contact', 'api', 'oauth', 'auth'
		];
		if (reservedUsernames.includes(trimmed.toLowerCase())) {
			return { isValid: false, error: 'validation.usernameReserved' };
		}
		return { isValid: true, value: trimmed };
	}

	validateDisplayName(displayName) {
		if (!displayName || typeof displayName !== 'string') {
			return { isValid: false, error: 'validation.displayNameRequired' };
		}
		// Trim the display name to check length
		const trimmed = displayName.trim();
		if (trimmed.length === 0) {
			return { isValid: false, error: 'validation.displayNameRequired' };
		}

		// Check for HTML/dangerous characters
		const dangerousChars = /[<>"'&]/;
		if (dangerousChars.test(trimmed)) {
			return { isValid: false, error: 'validation.invalidCharsDetected' };
		}

		if (trimmed.length < 3 || trimmed.length > 30) {
			return { isValid: false, error: 'validation.displayNameLength' };
		}
		// Only allow letters, numbers, and underscores
		const displayNameRegex = /^[a-zA-Z0-9_]+$/;
		if (!displayNameRegex.test(trimmed)) {
			return { isValid: false, error: 'validation.displayNameInvalidChars' };
		}
		return { isValid: true, value: trimmed };
	}

	validate2FAToken(token) {
		if (!token || typeof token !== 'string') {
			return { isValid: false, error: '2FA token is required' };
		}
		const tokenRegex = /^[0-9]{6}$/;
		if (!tokenRegex.test(token)) {
			return { isValid: false, error: '2FA token must be 6 digits' };
		}
		return { isValid: true };
	}

	// Commented out - we now reject instead of sanitize
	// sanitizeHtml(input) {
	// 	if (typeof input !== 'string') return input;
	// 	return input
	// 		.replace(/</g, '&lt;')
	// 		.replace(/>/g, '&gt;')
	// 		.replace(/"/g, '&quot;')
	// 		.replace(/'/g, '&#x27;')
	// 		.replace(/\//g, '&#x2F;');
	// }
}

export default new ValidationService();
