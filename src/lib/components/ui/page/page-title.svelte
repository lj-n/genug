<script lang="ts">
	import type { WithElementRef } from 'bits-ui';
	import type { HTMLAttributes } from 'svelte/elements';

	import { page } from '$app/state';
	import { cn } from 'tailwind-variants';

	let {
		children,
		class: className,
		ref = $bindable(null),
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLHeadingElement>> = $props();
</script>

<h1
	bind:this={ref}
	class={cn(
		// `overflow-wrap: anywhere` keeps a long single-word title (budget or
		// account name) from flooring the page's min-content width on phones —
		// it breaks mid-word only when a word cannot fit the line.
		'flex items-center gap-2 text-3xl font-bold tracking-tighter [overflow-wrap:anywhere]',
		className
	)}
	{...restProps}
>
	{#if children}
		{@render children()}
	{:else if page.data.title}
		{page.data.title}
	{/if}
</h1>
