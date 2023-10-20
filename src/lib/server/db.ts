import { DATABASE_AUTH_TOKEN, DATABASE_URL } from '$env/static/private';
import { dev } from '$app/environment';
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';

import * as schema from './schema';

const options = dev
	? {
			url:
				import.meta.env.MODE === 'test'
					? 'file:database/test.db'
					: 'file:database/local.db'
	  }
	: {
			url: DATABASE_URL,
			authToken: DATABASE_AUTH_TOKEN
	  };

export const libsqlClient = createClient(options);

export const db = drizzle(libsqlClient, { schema, logger: false });
