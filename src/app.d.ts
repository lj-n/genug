import 'unplugin-icons/types/svelte';

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		type Account = ReturnType<Actions['account']['all']>[number];
		type Actions = import('$db/actions').Actions;
		type Budget = import('$db').tables.Budget;
		type Database = import('$db').Database;

		interface Locals {
			session: import('$db/auth').Session | null;
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
