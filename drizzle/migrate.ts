import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';

try {
	console.log('Running database migrations 📜');

	migrate(drizzle(new Database('genug.db')), {
		migrationsFolder: 'drizzle'
	});

	console.log('Migrated successfully ✔️');
	process.exit(0);
} catch (error) {
	console.error('Migration failed ❌');
	console.error(error);
	process.exit(1);
}
