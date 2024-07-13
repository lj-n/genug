<script lang="ts">
	import type { PageData } from './$types';
	import * as Sheet from '$lib/components/ui/sheet';
	import { buttonVariants } from '$lib/components/ui/button';
	import Feather from '$lib/components/feather.svelte';

	export let row: PageData['budget'][number];
</script>

<Sheet.Root>
	<Sheet.Trigger
		class={buttonVariants({
			variant: 'ghost',
			size: 'icon',
			class: 'text-secondary-foreground hover:text-foreground'
		})}
	>
		<Feather name="arrow-up-right" />
	</Sheet.Trigger>
	<Sheet.Content class="sm:max-w-5xl">
		<Sheet.Header>
			<Sheet.Title>Are you sure absolutely sure?</Sheet.Title>
			<Sheet.Description>
				This action cannot be undone. This will permanently delete your account
				and remove your data from our servers.
			</Sheet.Description>
		</Sheet.Header>
	</Sheet.Content>
</Sheet.Root>
