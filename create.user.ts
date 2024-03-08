import Database from 'better-sqlite3';
import { LegacyScrypt, generateId } from 'lucia';

/**
 * This scripts can be used to create an admin user from the command line.
 */

try {
	const [username, password] = process.argv.slice(2);

	if (!username || !password) {
		console.log('No Username or Password provided');
		process.exit(0);
	}

	const hasedPassword = await new LegacyScrypt().hash(password);
	const db = Database('data/genug.db');

	const user = db.prepare('SELECT * FROM user WHERE name = ?').get(username);
	if (user) {
		db.prepare(
			'UPDATE user SET hashed_password = ?, is_admin = ? WHERE name = ?'
		).run(hasedPassword, 1, username);

		console.log(`Updated user ${username}`);
		process.exit(0);
	}

	const userId = generateId(15);
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
	console.log(e);
	process.exit(1);
}
