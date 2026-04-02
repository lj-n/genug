import 'unplugin-icons/types/svelte';

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		type Actions = import('$db/actions').Actions;
		type Database = import('$db').Database;
		// interface Error {}
		interface Locals {
			session: import('$db/auth').Session | null;
		}
		interface PageData {
			title?: string;
		}
		type User = import('$db/auth').User;
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
