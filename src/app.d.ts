import 'unplugin-icons/types/svelte';

declare global {
	namespace App {
		type Database = import('$db').Database;

		interface Error {
			logId?: string;
			message: string;
		}

		interface Locals {
			logger: import('pino').Logger;
			session: import('$db/auth.utils').Session | null;
			user: import('$db/auth.utils').User | null;
		}

		interface PageData {
			title?: string;
		}

		// interface Platform {}
	}
}

export {};
