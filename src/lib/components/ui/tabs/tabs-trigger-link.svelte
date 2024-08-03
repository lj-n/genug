<script lang="ts">
	import { cn } from '$lib/utils.js';

	export let href: string;
	export let active = false;
	let className: string | undefined = undefined;
	export { className as class };
</script>

<a
	{href}
	data-state={active ? 'active' : ''}
	class={cn(
		'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow',
		className
	)}
	{...$$restProps}
	on:click
	on:keydown
	on:focus
>
	<slot />
</a>
