import { protectRoute } from '$lib/server/auth';
import { getCategories } from '$lib/server/categories';
import { db } from '$lib/server/db';
import { schema } from '$lib/server/schema';
import { eq } from 'drizzle-orm';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = protectRoute((_, user) => {
	console.log(
		user,
		db
			.select()
			.from(schema.category)
			.where(eq(schema.category.userId, user.id))
			.get()
	);

	const categories = getCategories(db, user.id);
	console.log(categories);
	return {
		categories
	};
});
