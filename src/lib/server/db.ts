// import { DATABASE_URL } from '$env/static/private';
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';

import * as schema from './schema';
import { dev } from '$app/environment';
import { DATABASE_AUTH_TOKEN, DATABASE_URL } from '$env/static/private';

const options = dev
? {
	url: 'file:database/local.db'
}
: {
	url: DATABASE_URL,
	authToken: DATABASE_AUTH_TOKEN
};

console.log("🛸 < file: db.ts:10 < options =", options);
export const libsqlClient = createClient(options);

export const db = drizzle(libsqlClient, { schema });
