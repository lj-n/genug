// PROTOTYPE — throwaway (branch prototype/checkpoint-page).
// Fake "last checkpoint" for the account-page entry-point variants. `?cp=none`
// shows the state before the first checkpoint; `?age=<days>` sets how long ago
// the last one was (default 3).

export type FakeCheckpoint = null | {
	date: string;
};

export function fakeLastCheckpoint(url: URL): FakeCheckpoint {
	if (url.searchParams.get('cp') === 'none') return null;
	const age = Number(url.searchParams.get('age') ?? 3);
	return { date: new Date(Date.now() - age * 86_400_000).toISOString().slice(0, 10) };
}
