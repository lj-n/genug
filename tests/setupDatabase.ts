import { afterAll, beforeAll } from 'vitest';
import { execSync } from 'child_process';
import { unlinkSync } from 'fs';

beforeAll(() => {
	execSync('sqlite3 database/test.db < database/0000_light_orphan.sql');
	execSync('sqlite3 database/test.db < database/9999_testing_data.sql');
});

afterAll(() => {
	unlinkSync('database/test.db');
});
