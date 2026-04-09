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
