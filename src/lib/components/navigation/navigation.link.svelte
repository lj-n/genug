<script lang="ts">
	import { page } from '$app/stores';
	import { cn } from '$lib/utils.js';

	export let href: string;
	export let open = false;

	let className: string | undefined | null = undefined;
	export { className as class };
</script>

<a
	{href}
	class={cn(
		$page.url.pathname.includes(href) ? 'text-primary' : 'text-foreground/60',
		'font-medium transition-colors hover:text-foreground/80',
		className
	)}
	on:click={() => (open = false)}
	{...$$restProps}
>
	<slot />
</a>
