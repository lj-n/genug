<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet';
	import { buttonVariants } from '../ui/button';
	import Feather from '../feather.svelte';
	import { createShallowRoute } from '$lib/shallow.routing';
	import NavigationPage from '$routes/(fallback)/navigation/+page.svelte';

	const [action, data, isOpen, close] = createShallowRoute('/navigation');
</script>

<a
	href="/navigation"
	use:action
	class={buttonVariants({
		variant: 'ghost',
		size: 'icon',
		class: 'w-12 md:hidden'
	})}
>
	<Feather name="menu" class="h-6 w-6" />
	<span class="sr-only">Open navigation</span>
</a>

<Sheet.Root open={$isOpen} onOpenChange={close}>
	<Sheet.Content side="left" class="w-3/4">
		{#if $data}
			<NavigationPage data={$data} />
		{/if}
	</Sheet.Content>
</Sheet.Root>
