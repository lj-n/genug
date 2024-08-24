// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
/// <reference types="svelte" />

import 'unplugin-icons/types/svelte';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user: import('lucia').User | null;
			session: import('lucia').Session | null;
		}

		interface PageState {
			// @ts-expect-error -
			[key: string]: any;
		}

		namespace Superforms {
			type Message = {
				type: 'error' | 'success' | 'info';
				text: string;
				description?: string;
			};
		}
	}
}

export {};
