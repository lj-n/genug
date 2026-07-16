/**
 * Server-shell password recovery (see ADR-0015): resets a user's password to a
 * fresh random one and prints it once. Bundled by esbuild into
 * `build/reset-password.js` as part of `npm run build`, so it works inside the
 * deployed container:
 *
 *   docker exec <container> node build/reset-password.js <username>
 *
 * From a source checkout: `DATABASE_URL=<file> tsx --tsconfig
 * scripts/tsconfig.json scripts/reset-password.ts <username>`. `DATABASE_URL`
 * must be set before import: `$db` opens it at module load.
 */
import { getAllUsers, resetPassword } from '$db';

const username = process.argv[2];
if (!username) {
	console.error('Usage: node build/reset-password.js <username>');
	process.exit(1);
}

const users = getAllUsers();
if (!users.some((user) => user.username === username)) {
	console.error(`No user with username "${username}" exists.`);
	console.error(
		users.length
			? `Existing usernames: ${users.map((user) => user.username).join(', ')}`
			: 'No users exist yet.'
	);
	process.exit(1);
}

const password = await resetPassword({ username });
console.log(`New password for "${username}": ${password}`);
console.log('All sessions of this user were signed out.');
console.log('Log in with the new password and change it in Settings.');
