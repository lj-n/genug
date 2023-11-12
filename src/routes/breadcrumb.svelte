<script lang="ts">
	import Feather from '$lib/components/feather.svelte';
	export let links: NonNullable<App.PageData['breadcrumbs']>;
</script>

<nav aria-label="breadcrumb" class="text-sm my-2 flex gap-2 sticky top-12">
	{#each links as { href, icon, title }, index}
		{#if href}
			<a {href} class="inline-flex items-center gap-0.5">
				{#if icon}
					<Feather name={icon} />
				{/if}
				{title}
			</a>
		{:else}
			<span class="inline-flex items-center gap-0.5">
				{#if icon}
					<Feather name={icon} />
				{/if}
				{title}
			</span>
		{/if}

		{#if index < links.length - 1}
			<span>{'>'}</span>
		{/if}
	{/each}
</nav>
