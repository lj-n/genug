import { execSync } from 'child_process';
import { unlinkSync } from 'fs';

import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { schema } from '$lib/server/schema';

let teardownHappened = false;

export default function () {
	const db = drizzle(new Database('test.db'), { schema });

	migrate(db, { migrationsFolder: 'drizzle' });
	execSync('sqlite3 test.db < tests/mock_data.sql');

	return () => {
		if (teardownHappened) throw new Error('teardown called twice');
		teardownHappened = true;
		unlinkSync('test.db');
	};
}
