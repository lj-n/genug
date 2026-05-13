<script lang="ts">
	import { enhance } from '$app/forms';

	import type { PageProps } from './$types';

	import Component from './component.svelte';
	import { classs, sett } from './context.svelte';
	import Other from './other.svelte';

	let { data }: PageProps = $props();

	sett(
		new classs({
			posts() {
				return data.posts;
			},
			timestamp() {
				return data.timestamp;
			}
		})
	);
</script>

<Other />
<Component />

<div class="grid space-y-2">
	<span class="text-4xl font-bold">{data.timestamp}</span>

	<form use:enhance method="POST">
		<button type="submit">add post</button>
	</form>

	<ul class="grid">
		{#each data.posts as post (post)}
			<li>{post}</li>
		{/each}
	</ul>
</div>
