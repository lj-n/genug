import { m } from '$lib/paraglide/messages';
import * as v from 'valibot';

import { PasswordSchema, UsernameSchema } from './auth';

export const UsernameChangeSchema = v.object({ username: UsernameSchema });

export const PasswordChangeSchema = v.object({
	_oldPassword: v.pipe(v.string(), v.minLength(1, 'Aktuelles Passwort fehlt.')),
	_password: PasswordSchema
});

export const UserIdSchema = v.object({ userId: v.pipe(v.string(), v.minLength(1)) });

const CheckpointThresholdSchema = v.pipe(
	v.number(),
	v.integer(m.settings_checkpoint_threshold_error()),
	v.minValue(1, m.settings_checkpoint_threshold_error()),
	v.maxValue(999, m.settings_checkpoint_threshold_error())
);

/**
 * The reminder thresholds for Checkpoint suggested: each is a switch plus a
 * number, and comes out as the number, or null when switched off.
 */
export const CheckpointThresholdsSchema = v.pipe(
	v.object({
		count: v.optional(CheckpointThresholdSchema),
		countEnabled: v.optional(v.boolean(), false),
		days: v.optional(CheckpointThresholdSchema),
		daysEnabled: v.optional(v.boolean(), false)
	}),
	v.forward(
		v.partialCheck(
			[['count'], ['countEnabled']],
			({ count, countEnabled }) => !countEnabled || count !== undefined,
			m.settings_checkpoint_threshold_error()
		),
		['count']
	),
	v.forward(
		v.partialCheck(
			[['days'], ['daysEnabled']],
			({ days, daysEnabled }) => !daysEnabled || days !== undefined,
			m.settings_checkpoint_threshold_error()
		),
		['days']
	),
	v.transform(({ count, countEnabled, days, daysEnabled }) => ({
		count: (countEnabled && count) || null,
		days: (daysEnabled && days) || null
	}))
);
