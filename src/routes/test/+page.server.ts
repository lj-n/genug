import { createId } from '$server/utils/create-id';

const posts: string[] = [];

export const load = () => ({ posts, timestamp: new Date().toISOString() });

export const actions = {
	default: () => {
		posts.push(createId());
		return { success: true };
	}
};
