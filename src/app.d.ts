import 'unplugin-icons/types/svelte';

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		type Account = ReturnType<typeof import('$db').actions.account.getAllAccounts>[number];
		type Budget = import('$db').tables.Budget;
		type Database = import('$db').Database;

		interface Error {
			logId?: string;
			message: string;
		}

		interface Locals {
			logger: import('pino').Logger;
			session: import('$db/auth.utils').Session | null;
		}

		interface PageData {
			title?: string;
		}

		type User = import('$db/auth').User;

		// interface Platform {}
		// interface Error {}

		namespace Superforms {
			type Message = {
				text?: string;
				type: 'error' | 'success';
			};
		}
	}
}

export {};
