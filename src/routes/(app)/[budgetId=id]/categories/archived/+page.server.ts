import { withPermissions } from '$db/actions';

import type { PageServerLoad, PageServerLoadEvent } from './$types';

export const load: PageServerLoad = withPermissions(
	async (_user, actions, event: PageServerLoadEvent) => {
		const categories = actions.category.archived({
			budgetId: event.params.budgetId
		});

		return { categories };
	}
);
