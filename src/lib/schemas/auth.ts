import { m } from '$lib/paraglide/messages';
import * as v from 'valibot';

export const PasswordSchema = v.pipe(
	v.string(),
	v.minLength(8, m.password_error_min_length({ length: 8 })),
	v.maxLength(20, m.password_error_max_length({ length: 20 })),
	v.regex(/[0-9]/, m.password_error_number()),
	v.regex(/[!@#$%^&*?]/, m.password_error_special())
);

export const UsernameSchema = v.pipe(
	v.string(),
	v.minLength(3, m.name_error_minlength({ length: 3 })),
	v.maxLength(50, m.name_error_maxlength({ length: 50 }))
);

export const RegisterSchema = v.object({
	_password: PasswordSchema,
	username: UsernameSchema
});

export const LoginSchema = v.object({
	_password: v.pipe(v.string(), v.minLength(1, 'Passwort fehlt.')),
	username: v.pipe(v.string(), v.minLength(1, 'Benutzername fehlt.'))
});
