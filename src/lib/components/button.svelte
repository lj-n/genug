<script lang="ts">
	import type { FeatherIconNames } from 'feather-icons';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import Feather from './feather.svelte';

	interface $$Props extends HTMLButtonAttributes {
		icon?: FeatherIconNames;
		loading?: boolean;
	}

	export let icon: $$Props['icon'] = undefined;
	export let loading = false;
</script>

<button on:click {...$$restProps} data-loading={loading || null}>
	{#if loading}
		<Feather name="loader" class="animate-duration-3000 animate-spin" />
	{:else if icon}
		<Feather name={icon} />
	{/if}

	<slot />
</button>
