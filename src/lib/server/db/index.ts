import { env } from '$env/dynamic/private';

import { createDatabase, type Database } from './create-database';

if (!env.DATABASE_URL) {
	throw new Error('DATABASE_URL environment variable is not set');
}

const database = createDatabase(env.DATABASE_URL);
export { createDatabase, type Database, database };

export * as tables from './tables';

import * as account from './account';
import * as auth from './auth';
import * as budget from './budget';
import * as user from './user';
export const actions = {
	account,
	auth,
	budget,
	user
};
