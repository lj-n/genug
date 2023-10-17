import { execSync } from 'child_process';
import { unlinkSync } from 'fs';

export async function setupDataBase() {
	execSync('sqlite3 database/test.db < database/0000_nasty_next_avengers.sql');
	execSync('sqlite3 database/test.db < database/1111_team_roles.sql');
}

export async function teardownDataBase() {
	unlinkSync('database/test.db');
}
