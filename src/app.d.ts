// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
/// <reference types="svelte" />
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			auth: import('lucia').AuthRequest;
		}
		interface PageData {
			breadcrumbs?: Breadcrumb[];
		}
		// interface Platform {}
		type Breadcrumb = {
			icon?: import('feather-icons').FeatherIconNames;
			href?: string;
			title: string;
		};
	}
}

/// <reference types="lucia" />
declare global {
	namespace Lucia {
		type Auth = import('$lib/server/auth').Auth;
		type DatabaseUserAttributes = { name: string };
		type DatabaseSessionAttributes = Record<string, never>;
	}
}

export {};
