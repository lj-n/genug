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
			shallowRoute: {
				'/testing/more'?: import('./routes/testing/more/$types').PageData;
				'/navigation'?: import('./routes/(fallback)/navigation/$types').PageData;
				'/categories/create'?: import('./routes/categories/create/$types').PageData;
				'/categories/details'?: import('./routes/categories/[id=integer]/$types').PageData;
			};
		}

		namespace Superforms {
			type Message = {
				type: 'error' | 'success';
				text: string;
			};
		}
	}
}

export {};
