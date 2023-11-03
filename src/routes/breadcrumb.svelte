<script lang="ts">
	import Feather from '$lib/components/feather.svelte';
	export let links: NonNullable<App.PageData['breadcrumbs']>;
</script>

<div class="text-sm breadcrumbs mb-4">
	<ul>
		{#each links as { href, icon, title }}
			<li>
				{#if href}
					<a {href}>
						{#if icon}
							<Feather name={icon} class="mr-2"/>
						{/if}
						{title}
					</a>
				{:else}
					{#if icon}
						<Feather name={icon} class="mr-2"/>
					{/if}
					{title}
				{/if}
			</li>
		{/each}
	</ul>
</div>
