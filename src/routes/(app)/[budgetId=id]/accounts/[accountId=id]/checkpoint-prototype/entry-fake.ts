// PROTOTYPE — throwaway (branch prototype/checkpoint-page).
// Fake "last checkpoint" for the account-page entry point. `?cp=none` shows the
// state before the first checkpoint; `?age=<days>` sets how long ago the last
// one was; `?since=<n>` how many transactions were validated after it.

export type FakeCheckpoint = null | {
	ageDays: number;
	date: string;
};

export type FakeEntry = {
	/** Whether the hint shows. Placeholder rule, see DUE_*. */
	due: boolean;
	last: FakeCheckpoint;
	/** Validated transactions not covered by any checkpoint yet. */
	validatedSince: number;
};

// Placeholder thresholds; the real rule is for the spec.
export const DUE_DAYS = 30;
export const DUE_TRANSACTIONS = 25;

export function fakeEntry(url: URL): FakeEntry {
	const validatedSince = Number(url.searchParams.get('since') ?? 34);
	if (url.searchParams.get('cp') === 'none')
		return { due: validatedSince > 0, last: null, validatedSince };
	const ageDays = Number(url.searchParams.get('age') ?? 45);
	return {
		due: ageDays >= DUE_DAYS || validatedSince >= DUE_TRANSACTIONS,
		last: {
			ageDays,
			date: new Date(Date.now() - ageDays * 86_400_000).toISOString().slice(0, 10)
		},
		validatedSince
	};
}
