<script lang="ts">
	import type { LayoutProps } from './$types';

	import Navigation from './navigation.svelte';

	let { children, data }: LayoutProps = $props();
</script>

<div class="mx-auto flex w-full max-w-9xl grow gap-8">
	<Navigation budgets={data.budgets} user={data.user} />

	<div class="flex grow flex-col">{@render children()}</div>
</div>
