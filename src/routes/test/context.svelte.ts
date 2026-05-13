import { createContext } from 'svelte';

export class classs {
	ding = $state('super');
	posts: () => string[];
	timestamp: () => string;

	constructor({ posts, timestamp }: { posts: () => string[]; timestamp: () => string }) {
		this.timestamp = timestamp;
		this.posts = posts;
	}
}

export const [gett, sett] = createContext<classs>();
