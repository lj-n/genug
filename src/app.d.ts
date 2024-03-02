// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
/// <reference types="svelte" />
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user: import('lucia').User | null;
			session: import('lucia').Session | null;
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

export {};
