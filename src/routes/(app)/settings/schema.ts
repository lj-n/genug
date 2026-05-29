import { m } from '$lib/paraglide/messages';
import { nameSchema } from '$lib/utils/zod-schema-name';
import z from 'zod';

const password = z
	.string()

	.min(8, { message: m.password_error_min_length({ length: 8 }) })
	.max(20, { message: m.password_error_max_length({ length: 20 }) })

	.refine((password) => /[0-9]/.test(password), {
		message: m.password_error_number()
	})

	.refine((password) => /[!@#$%^&*?]/.test(password), {
		message: m.password_error_special()
	});

export const schemaUser = z.object({
	password,
	username: nameSchema
});

export const schemaPassword = schemaUser.pick({ password: true });
export const schemaUsername = schemaUser.pick({ username: true });

export const schemaChangePassword = z.object({
	oldPassword: z.string(),
	password
});
