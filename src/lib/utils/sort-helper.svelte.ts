import type { Attachment } from 'svelte/attachments';

import Sortable from 'sortablejs';

export const sortableList = (options: Sortable.Options): Attachment<HTMLElement> => {
	return (element) => {
		const sortable = Sortable.create(element, options);
		return () => {
			sortable.destroy();
		};
	};
};

type SortableOptions = Omit<Sortable.Options, 'dataIdAttr' | 'onStart' | 'store'> & {
	sortedCallback?: (sortedIds: string[]) => Promise<Response>;
};

export function createSortable<T extends { id: string }>(
	data: () => T[],
	options: SortableOptions
) {
	let sortable: null | Sortable = $state(null);
	let snapshot: T[] = $state([]);

	const reset = () => {
		if (sortable) {
			sortable.sort(
				snapshot.map((account) => account.id),
				true
			);
		}
	};

	const attach: Attachment<HTMLElement> = (element) => {
		sortable = Sortable.create(element, {
			animation: 200,
			dataIdAttr: 'data-sortable-id',
			dragClass: 'opacity-30',
			onStart() {
				snapshot = data();
			},
			store: {
				get() {
					return data().map(({ id }) => id);
				},
				async set(sortable) {
					const sortedIds = sortable.toArray();
					try {
						if (options.sortedCallback) {
							const res = await options.sortedCallback(sortedIds);
							if (!res.ok) {
								reset();
							}
						}
					} catch {
						reset();
					}
				}
			},
			...options
		});

		return () => {
			sortable?.destroy();
		};
	};

	return {
		attach,
		get instance() {
			return sortable;
		}
	};
}
