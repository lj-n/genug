import Database from 'better-sqlite3';
import { LegacyScrypt, generateId } from 'lucia';

/**
 * This scripts can be used to create a user from the command line.
 */

try {
	const [username, password] = process.argv.slice(2);

	if (!username || !password) {
		console.log('No Username or Password provided');
		process.exit(0);
	}

	const hasedPassword = await new LegacyScrypt().hash(password);
	const userId = generateId(15);

	const db = Database('data/genug.db');

	const createUser = db.transaction(() => {
		db.prepare('INSERT INTO user VALUES (?, ?, ?)').run(
			userId,
			username,
			hasedPassword
		);

		db.prepare('INSERT INTO user_settings (user_id) VALUES (?)').run(userId);
	});

	createUser();

	console.log(`Created user ${username}`);
	process.exit(0);
} catch (e) {
	if (
		e instanceof Database.SqliteError &&
		e.code === 'SQLITE_CONSTRAINT_UNIQUE'
	) {
		console.log('Username already in use');
		process.exit(0);
	}

	console.log(e);
	process.exit(1);
}
