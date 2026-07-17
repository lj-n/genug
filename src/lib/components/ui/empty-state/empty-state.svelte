<script lang="ts">
	import type { Component, Snippet } from 'svelte';
	import type { SvelteHTMLElements } from 'svelte/elements';

	import { cn } from 'tailwind-variants';

	let {
		action,
		class: className,
		description,
		icon: Icon,
		title
	}: {
		action?: Snippet;
		class?: string;
		description?: string;
		icon: Component<SvelteHTMLElements['svg']>;
		title: string;
	} = $props();
</script>

<div
	class={cn(
		'flex flex-col items-center gap-1 rounded-md border border-muted/20 bg-surface px-6 py-10 text-center',
		className
	)}
>
	<Icon class="size-8 text-muted" aria-hidden="true" />
	<p class="mt-2 font-semibold">{title}</p>
	{#if description}
		<p class="max-w-md text-sm text-muted">{description}</p>
	{/if}
	{#if action}
		<div class="mt-3 flex flex-wrap justify-center gap-2">
			{@render action()}
		</div>
	{/if}
</div>
