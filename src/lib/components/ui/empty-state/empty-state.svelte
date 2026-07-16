<script lang="ts">
	import type { Component, Snippet } from 'svelte';
	import type { SVGAttributes } from 'svelte/elements';

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
		icon?: Component<SVGAttributes<SVGSVGElement>>;
		title: string;
	} = $props();
</script>

<div
	class={cn(
		'flex flex-col items-center gap-3 rounded-xs border border-muted/20 bg-surface px-6 py-12 text-center',
		className
	)}
>
	{#if Icon}
		<Icon class="size-8 text-muted" />
	{/if}

	<div class="flex flex-col gap-1">
		<p class="font-medium text-foreground">{title}</p>
		{#if description}
			<p class="mx-auto max-w-md text-sm text-balance text-muted">{description}</p>
		{/if}
	</div>

	{#if action}
		<div class="mt-2 flex w-full flex-col items-center gap-4">
			{@render action()}
		</div>
	{/if}
</div>
