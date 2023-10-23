import { withAuth } from '$lib/server';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = withAuth(() => {});
