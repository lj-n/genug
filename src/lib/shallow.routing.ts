import { goto, preloadData, pushState, replaceState } from '$app/navigation';
import { page } from '$app/stores';
import type { Action } from 'svelte/action';
import { derived, type Readable } from 'svelte/store';

export function createShallowRoute<T>({
	replace = false,
	currentPageState = {}
}: { replace?: boolean; currentPageState?: App.PageState } = {}): [
	Action<HTMLAnchorElement, URL>,
	Readable<T>,
	Readable<boolean>
] {
	const routeId = crypto.randomUUID();

	const data = derived<typeof page, T>(page, ($page) => {
		return $page.state?.[routeId];
	});

	const isOpen = derived(data, ($data) => $data !== undefined);

	const action: Action<HTMLAnchorElement, URL> = (node, currentUrl) => {
		async function route(href: string) {
			const result = await preloadData(href);

			if (result.type === 'loaded' && result.status === 200) {
				// set shallow route cookie for navigating back
				document.cookie = `shallowRoute=${currentUrl.href}; path=/`;
				if (replace) {
					replaceState(href, { ...currentPageState, [routeId]: result.data });
				} else {
					pushState(href, { ...currentPageState, [routeId]: result.data });
				}
			} else {
				goto(href);
			}
		}

		async function handleClick(e: MouseEvent) {
			if (e.currentTarget instanceof HTMLAnchorElement) {
				if (
					e.shiftKey || // or the link is opened in a new window
					e.metaKey ||
					e.ctrlKey || // or a new tab (mac: metaKey, win/linux: ctrlKey)
					e.button !== 0 // or a non-primary mouse button
				) {
					return;
				}

				e.preventDefault();

				const { href } = e.currentTarget;
				route(href);
			}
		}

		async function handleKeydown(e: KeyboardEvent) {
			if (e.key === 'Enter' && e.currentTarget instanceof HTMLAnchorElement) {
				e.preventDefault();

				const { href } = e.currentTarget;
				route(href);
			}
		}

		node.addEventListener('click', handleClick);
		node.addEventListener('keydown', handleKeydown);

		return {
			destroy() {
				node.removeEventListener('click', handleClick);
				node.removeEventListener('keydown', handleKeydown);
			}
		};
	};

	return [action, data, isOpen] as const;
}
