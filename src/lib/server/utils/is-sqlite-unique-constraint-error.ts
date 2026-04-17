import SQLiteDatabase from 'better-sqlite3';

type SqliteError = InstanceType<typeof SQLiteDatabase.SqliteError>;

type SqliteLikeError = Partial<Pick<SqliteError, 'code' | 'message'>>;

const SQLITE_UNIQUE_CONSTRAINT_CODES = new Set([
	'SQLITE_CONSTRAINT_PRIMARYKEY',
	'SQLITE_CONSTRAINT_UNIQUE'
]);

export function isSqliteUniqueConstraintError(error: unknown): error is SqliteError {
	if (error instanceof SQLiteDatabase.SqliteError) {
		if (SQLITE_UNIQUE_CONSTRAINT_CODES.has(error.code)) {
			return true;
		}

		return error.code === 'SQLITE_CONSTRAINT' && error.message.includes('UNIQUE constraint failed');
	}

	if (!error || typeof error !== 'object') return false;

	const { code, message } = error as SqliteLikeError;

	if (typeof code === 'string' && SQLITE_UNIQUE_CONSTRAINT_CODES.has(code)) {
		return true;
	}

	return code === 'SQLITE_CONSTRAINT' && typeof message === 'string'
		? message.includes('UNIQUE constraint failed')
		: false;
}
