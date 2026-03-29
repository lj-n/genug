export type Result<T, E> = { data: T; ok: true } | { error: E; ok: false };

export const ok = <T>(data: T): Result<T, never> => ({
	data,
	ok: true
});

export const err = <E>(error: E): Result<never, E> => ({
	error,
	ok: false
});
