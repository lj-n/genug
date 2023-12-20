import Database from 'better-sqlite3';
import { LuciaError, createKeyId } from 'lucia';
import { generateRandomString, generateLuciaPasswordHash } from 'lucia/utils';

/**
 * This scripts can be used to create a user from the command line.
 */

try {
	const [username, password] = process.argv.slice(2);

	if (!username || !password) {
		console.log('No Username or Password provided');
		process.exit(0);
	}

	const hashedPassword = await generateLuciaPasswordHash(password);
	const userId = generateRandomString(15);

	const db = Database('data/genug.db');

	const createUser = db.transaction(() => {
		db.prepare('INSERT INTO user VALUES (?, ?)').run(userId, username);

		db.prepare('INSERT INTO user_key VALUES (?, ?, ?)').run(
			createKeyId('username', username),
			userId,
			hashedPassword
		);

		db.prepare('INSERT INTO user_settings (user_id) VALUES (?)').run(userId);
	});

	createUser();

	console.log(`Created user ${username}`);
	process.exit(0);
} catch (e) {
	if (
		(e instanceof Database.SqliteError &&
			e.code === 'SQLITE_CONSTRAINT_UNIQUE') ||
		(e instanceof LuciaError && e.message === 'AUTH_DUPLICATE_KEY_ID')
	) {
		console.log('Username already in use');
		process.exit(0);
	}

	console.log(e);
	process.exit(1);
}
