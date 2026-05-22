import passwordService from './password.js';

class User {
	constructor(data = {}) {
		this.id = data.id;
		this.username = data.username;
		this.email = data.email;
		this.display_name = data.display_name;
		this.password_hash = data.password_hash;
		this.oauth_provider = data.oauth_provider;
		this.oauth_id = data.oauth_id;
		this.avatar = data.avatar;
		this.two_factor_enabled = data.two_factor_enabled;
		this.two_factor_secret = data.two_factor_secret;
		this.is_active = data.is_active;
		this.is_anonymized = data.is_anonymized;
		this.login_attempts = data.login_attempts;
		this.locked_until = data.locked_until;
		this.created_at = data.created_at;
		this.updated_at = data.updated_at;
		this.consent_marketing = data.consent_marketing;
		this.consent_analytics = data.consent_analytics;
		this.consent_data_processing = data.consent_data_processing;
		this.consent_updated_at = data.consent_updated_at;
	}

	async verifyPassword(password) {
		return passwordService.verifyPassword(password, this.password_hash);
	}

	isAccountLocked() {
		if (this.locked_until) {
			return new Date(this.locked_until) > new Date();
		}
		return false;
	}

	toSafeJSON() {
		return {
			id: this.id,
			username: this.username,
			display_name: this.display_name,
			email: this.email,
			avatar: this.avatar,
			twoFactorEnabled: Boolean(this.two_factor_enabled),
			isActive: Boolean(this.is_active),
			isAnonymized: Boolean(this.is_anonymized),
			createdAt: this.created_at,
			updatedAt: this.updated_at
		};
	}
}

export async function findOrCreateOAuthUser(oauthProfile) {
	try {
		const existingUser = await findUserById(`oauth_${oauthProfile.provider}_${oauthProfile.id}`);

		if (existingUser) {
			return existingUser;
		}

		const newUser = {
			id: `oauth_${oauthProfile.provider}_${oauthProfile.id}`,
			username: oauthProfile.username,
			display_name: oauthProfile.username,
			email: oauthProfile.email,
			password_hash: null,
			oauth_provider: oauthProfile.provider,
			oauth_id: oauthProfile.id,
			avatar: oauthProfile.avatar || 'default-avatar.png'
		};

		const response = await fetch(
			`http://database:3003/database/users`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(newUser)
		});

		const data = await response.json();
		if (response.status === 404) {
			return null;
		}
		if (data.success) {
			return await findUserById(newUser.id);
		}
		return null;
	} catch (error) {
		console.error('Error in findOrCreateOAuthUser:', error);
		return null;
	}
}

export async function updateUser(userId, updateData) {
	try {
		const response = await fetch(
			`http://database:3003/database/users/${userId}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(updateData)
		});

		const data = await response.json();
		if (response.status === 404) {
			return null;
		}

		if (data.success) {
			return await findUserById(userId);
		}
		return null;
	} catch (error) {
		console.error('Error updating user:', error);
		return null;
	}
}


export async function deleteUser(userId) {
	try {
		const response = await fetch(
			`http://database:3003/database/users/${userId}`, {
			method: 'DELETE'
		});

		const data = await response.json();
		if (response.status === 404) {
			return null;
		}

		if (data.success) {
			return data.success;
		}
		return null;
	} catch (error) {
		console.error('Error removing user:', error);
		return null;
	}
}


export async function findUserById(id) {
	try {
		const response = await fetch(
			`http://database:3003/database/users/${id}`,
			{ method: 'GET' }
		);

		const data = await response.json();
		if (response.status === 404) {
			return null;
		}
		if (data.success && data.user) {
			return new User(data.user);
		}
		return null;
	} catch (error) {
		console.error('Error finding user by id:', error);
		return null;
	}
}

export async function findUserByEmail(email) {
	try {
		const response = await fetch(
			`http://database:3003/database/users/email/${encodeURIComponent(email)}`,
			{ method: 'GET' }
		);

		const data = await response.json();
		if (response.status === 404) {
			return null;
		}
		if (data.success && data.user) {
			return new User(data.user);
		}
		return null;
	} catch (error) {
		if (error.response && error.response.status === 404) {
			return null;
		}
		console.error('Error finding user by email:', error);
		return null;
	}
}

export async function saveUser(userData) {
	try {
		let passwordHash = userData.password_hash;
		if (userData.password && !passwordHash) {
			passwordHash = await passwordService.hashPassword(userData.password);
		}

		const userToSave = {
			id: userData.id,
			username: userData.username,
			display_name: userData.username,
			email: userData.email,
			password_hash: passwordHash,
			avatar: userData.avatar || 'default-avatar.png',
			oauth_provider: userData.oauth_provider || null,
			oauth_id: userData.oauth_id || null,
			two_factor_enabled: userData.two_factor_enabled ? 1 : 0,
			two_factor_secret: userData.two_factor_secret || null
		};

		const response = await fetch(
			`http://database:3003/database/users`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(userToSave)
		});

		const data = await response.json();
		if (response.status === 404) {
			return null;
		}

		if (data.success) {
			return await findUserById(userData.id);
		}
		return null;
	} catch (error) {
		console.error('Error saving user:', error);
		return null;
	}
}

export async function getAllUsers() {
	try {

		const response = await fetch(
			`http://database:3003/database/users/all`,
			{ method: 'GET' }
		);

		const data = await response.json();
		if (response.status === 404) {
			return null;
		}

		if (data.success) {
			return data.users.map(row => new User(row));
		}
		return [];
	} catch (error) {
		console.error('Error getting all users:', error);
		return [];
	}
}

export async function incrementLoginAttempts(userId, increment = true) {
	try {
		const response = await fetch(
			`http://database:3003/database/users/${userId}/login-attempts`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(increment)
		});

		const data = await response.json();
		if (response.status === 404) {
			return null;
		}

		return data.success;
	} catch (error) {
		console.error('Error incrementing login attempts:', error);
		return false;
	}
}

export async function resetLoginAttempts(userId, increment = false) {
	try {
			const response = await fetch(
			`http://database:3003/database/users/${userId}/login-attempts`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(increment)
		});

		const data = await response.json();
		if (response.status === 404) {
			return null;
		}
		return data.success;
	} catch (error) {
		console.error('Error resetting login attempts:', error);
		return false;
	}
}

export function isUserAdmin(user) {
	return user.email === 'admin@example.com' || user.id === 'admin';
}

export default User;
