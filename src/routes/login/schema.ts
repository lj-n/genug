import { m } from '$lib/paraglide/messages';
import z from 'zod';

export const schema = z.object({
	password: z
		.string()
		.min(8, m.login_error_password_minlength({ length: 8 }))
		.max(120, m.login_error_password_maxlength({ length: 120 })),
	username: z
		.string()
		.min(3, m.login_error_username_minlength({ length: 3 }))
		.max(25, m.login_error_username_maxlength({ length: 25 }))
});
