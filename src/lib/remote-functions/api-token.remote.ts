import { requested } from '$app/server';
import { createApiToken, deleteApiToken, listApiTokens } from '$db';
import { ApiTokenCreateSchema, ApiTokenIdSchema } from '$lib/schemas/api-token';
import { guardedForm, guardedQuery } from '$server/utils/remote-guard';

import { REFRESH_LIMIT } from './remote.utils';

export const getApiTokens = guardedQuery(async ({ user }) => listApiTokens({ userId: user.id }));

export const issueApiToken = guardedForm(
	ApiTokenCreateSchema,
	async ({ expiresAt, name }, { user }) => {
		// The form submits a date-only expiry; the token stays valid through
		// the whole chosen day (UTC).
		const { token } = createApiToken({
			expiresAt: expiresAt ? new Date(`${expiresAt}T23:59:59.999Z`) : undefined,
			name,
			userId: user.id
		});
		await requested(getApiTokens, REFRESH_LIMIT).refreshAll();
		// The plaintext token exists only in this response — it is hashed at rest.
		return { token };
	}
);

export const revokeApiToken = guardedForm(ApiTokenIdSchema, async ({ tokenId }, { user }) => {
	deleteApiToken({ tokenId, userId: user.id });
	await requested(getApiTokens, REFRESH_LIMIT).refreshAll();
});
