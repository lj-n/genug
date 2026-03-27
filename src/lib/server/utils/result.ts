export type Result<T, E> =
    | { ok: true; data: T }
    | { ok: false; error: E };

export const ok = <T>(data: T): Result<T, never> => ({
    ok: true,
    data,
});

export const err = <E>(error: E): Result<never, E> => ({
    ok: false,
    error,
});
