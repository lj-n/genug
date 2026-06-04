import * as v from 'valibot';

import { PasswordSchema, UsernameSchema } from './auth';

export const UsernameChangeSchema = v.object({ username: UsernameSchema });

export const PasswordChangeSchema = v.object({
	_oldPassword: v.pipe(v.string(), v.minLength(1, 'Aktuelles Passwort fehlt.')),
	_password: PasswordSchema
});

export const UserIdSchema = v.object({ userId: v.pipe(v.string(), v.minLength(1)) });
