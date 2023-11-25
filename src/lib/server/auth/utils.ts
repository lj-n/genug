import { LuciaError } from 'lucia';
import { SqliteError } from 'better-sqlite3';

/**
 * Checks if the given error indicates that a name is already in use.
 * @param e The error object to check.
 * @returns True if the error indicates a name already in use, false otherwise.
 */
export function isNameAlreadyInUse(e: unknown) {
	return (
		(e instanceof SqliteError && e.code === 'SQLITE_CONSTRAINT_UNIQUE') ||
		(e instanceof LuciaError && e.message === 'AUTH_DUPLICATE_KEY_ID')
	);
}
