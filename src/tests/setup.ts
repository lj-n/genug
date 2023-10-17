import { execSync } from 'child_process';
import { unlinkSync } from 'fs';

let teardownHappened = false;

export async function setup() {
	/** create sqlite database and insert tables */
	execSync('sqlite3 database/test.db < database/0000_nasty_next_avengers.sql');
	execSync('sqlite3 database/test.db < database/1111_team_roles.sql');
}

export async function teardown() {
	if (teardownHappened) throw new Error('teardown called twice');
	teardownHappened = true;

	/** delete sqlite database */
	unlinkSync('database/test.db');
}
