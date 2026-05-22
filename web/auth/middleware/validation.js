import validationService from '../services/validation.js';
import passwordService from '../services/password.js';

export function validateRegistration(request, reply, next) {
	const { username, email, password } = request.body;

	if (!request.body) {
		return reply.status(422).send({
			error: 'validation.invalidRequest',
			code: 'INVALID_REQUEST'
		});
	}

	const usernameValidation = validationService.validateUsername(username);
	if (!usernameValidation.isValid) {
		return reply.status(422).send({
			error: usernameValidation.error,
			code: 'INVALID_USERNAME'
		});
	}

	const emailValidation = validationService.validateEmail(email);
	if (!emailValidation.isValid) {
		return reply.status(422).send({
			error: emailValidation.error,
			code: 'INVALID_EMAIL'
		});
	}

	const passwordValidation = passwordService.validatePasswordStrength(password);
	if (!passwordValidation.isValid) {
		return reply.status(422).send({
			error: 'validation.weakPassword',
			issues: passwordValidation.issues,
			code: 'WEAK_PASSWORD'
		});
	}

	// Update request.body with trimmed values
	request.body.username = usernameValidation.value;
	request.body.email = emailValidation.value;

	next();
}

export function validateLogin(request, reply, next) {
	const { email, password } = request.body;

	if (!request.body) {
		return reply.status(422).send({
			error: 'validation.invalidRequest',
			code: 'INVALID_REQUEST'
		});
	}

	const emailValidation = validationService.validateEmail(email);
	if (!emailValidation.isValid) {
		return reply.status(422).send({
			error: 'messages.invalidCredentials',
			code: 'INVALID_CREDENTIALS'
		});
	}

	if (!password || password.length < 1) {
		return reply.status(422).send({
			error: 'messages.invalidCredentials',
			code: 'INVALID_CREDENTIALS'
		});
	}

	// Update request.body with trimmed email
	request.body.email = emailValidation.value;

	next();
}

export function validateProfileUpdate(request, reply, next) {
	const { display_name, avatar, email } = request.body;

	if (!request.body) {
		return reply.status(422).send({
			error: 'validation.invalidRequest',
			code: 'INVALID_REQUEST'
		});
	}

	// Validate no unexpected fields
	const allowedFields = ['display_name', 'avatar', 'email'];
	const receivedFields = Object.keys(request.body);
	const unexpectedFields = receivedFields.filter(f => !allowedFields.includes(f));
	if (unexpectedFields.length > 0) {
		return reply.status(422).send({
			success: false,
			error: 'validation.unexpectedFields',
			code: 'UNEXPECTED_FIELDS'
		});
	}

	// Validate at least one field is provided
	if (display_name === undefined && avatar === undefined && email === undefined) {
		return reply.status(422).send({
			success: false,
			error: 'validation.noFieldsToUpdate',
			code: 'NO_FIELDS'
		});
	}

	// If display_name is being updated, validate it
	if (display_name !== undefined) {
		const displayNameValidation = validationService.validateDisplayName(display_name);
		if (!displayNameValidation.isValid) {
			return reply.status(422).send({
				success: false,
				error: displayNameValidation.error,
				code: 'INVALID_DISPLAY_NAME'
			});
		}
		// Update request.body with trimmed value
		request.body.display_name = displayNameValidation.value;
	}

	// If avatar is being updated, validate it
	if (avatar !== undefined) {
		if (typeof avatar !== 'string') {
			return reply.status(422).send({
				success: false,
				error: 'validation.invalidInput',
				code: 'INVALID_AVATAR_TYPE'
			});
		}
		// Trim avatar and validate length
		const trimmedAvatar = avatar.trim();
		if (trimmedAvatar.length > 500) {
			return reply.status(422).send({
				success: false,
				error: 'validation.avatarTooLong',
				code: 'AVATAR_TOO_LONG'
			});
		}
		// Update request.body with trimmed value
		request.body.avatar = trimmedAvatar;
	}

	// If email is being updated, validate it
	if (email !== undefined) {
		const emailValidation = validationService.validateEmail(email);
		if (!emailValidation.isValid) {
			return reply.status(422).send({
				success: false,
				error: emailValidation.error,
				code: 'INVALID_EMAIL'
			});
		}
		// Update request.body with trimmed value
		request.body.email = emailValidation.value;
	}

	next();
}

export function handleValidationError(error, request, reply) {
	if (error.validation) {
		return reply.status(422).send({
			error: 'validation.invalidInput',
			code: 'VALIDATION_ERROR',
			details: error.validation
		});
	}
	reply.send(error);
}
