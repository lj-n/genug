import { goto, preloadData, pushState } from '$app/navigation';
import { page } from '$app/stores';
import type { Action } from 'svelte/action';
import { derived, type Readable } from 'svelte/store';

type ShallowRouteKey = keyof App.PageState['shallowRoute'];

export function createShallowRoute<T extends ShallowRouteKey>(
	path: T
): [
	Action<HTMLAnchorElement>,
	Readable<App.PageState['shallowRoute'][T]>,
	Readable<boolean>,
	(open: boolean) => void
] {
	const data = derived(page, ($page) => {
		return $page.state.shallowRoute?.[path];
	});

	const isOpen = derived(data, ($data) => $data !== undefined);

	const close = (open: boolean) => {
		if (!open) {
			history.back();
		}
	};

	const action: Action<HTMLAnchorElement> = (node) => {
		async function route(href: string) {
			const result = await preloadData(href);

			if (result.type === 'loaded' && result.status === 200) {
				pushState(href, {
					shallowRoute: {
						[path]: result.data as App.PageState['shallowRoute'][T]
					}
				});
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

	return [action, data, isOpen, close] as const;
}
