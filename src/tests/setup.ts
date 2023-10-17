import { execSync } from 'child_process';
import { unlinkSync } from 'fs';

export async function setupDataBase() {
  execSync('sqlite3 database/test.db < database/0000_certain_mattie_franklin.sql');
}

export async function teardownDataBase() {
	unlinkSync('database/test.db');
}
