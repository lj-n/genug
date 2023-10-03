import { DATABASE_AUTH_TOKEN, DATABASE_URL } from '$env/static/private';
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';

import * as schema from './schema';
import { dev } from '$app/environment';

const options = dev
	? {
			url: 'file:database/local.db'
	  }
	: {
			url: DATABASE_URL,
			authToken: DATABASE_AUTH_TOKEN
	  };

export const libsqlClient = createClient(options);

export const db = drizzle(libsqlClient, { schema });
