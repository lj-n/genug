<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { m } from '$lib/paraglide/messages';
	import PhFunnel from '~icons/ph/funnel';

	import { getTableContext } from './table-context.svelte';
	import TableFilterList from './table-filter-list.svelte';

	const tableContext = getTableContext();
</script>

<div class="flex flex-col gap-2">
	<DropdownMenu.Root>
		<DropdownMenu.Trigger>
			{#snippet child({ props })}
				<Button {...props} size="icon">
					<PhFunnel />
				</Button>
			{/snippet}
		</DropdownMenu.Trigger>

		<DropdownMenu.Content>
			<DropdownMenu.Group>
				<DropdownMenu.Label>Filter</DropdownMenu.Label>
				<DropdownMenu.Separator />
				<DropdownMenu.Item onSelect={() => tableContext.openFilterDialog('category')}>
					Kategorie
				</DropdownMenu.Item>
				<DropdownMenu.Item onSelect={() => tableContext.openFilterDialog('notes')}>
					Notizen
				</DropdownMenu.Item>
				<DropdownMenu.Item onSelect={() => null}>Datum</DropdownMenu.Item>
				<DropdownMenu.Item onSelect={() => null}>Betrag</DropdownMenu.Item>
			</DropdownMenu.Group>
		</DropdownMenu.Content>
	</DropdownMenu.Root>

	<TableFilterList />
</div>

<Dialog.Root bind:open={tableContext.filterDialogOpen}>
	<Dialog.Content class="max-w-120">
		<div class="contents">
			{#if tableContext.filterComponent}
				{@const { Component } = tableContext.filterComponent}

				<Component>
					{#snippet header({ description, title })}
						<Dialog.Header>
							<Dialog.Title>{title}</Dialog.Title>
							<Dialog.Description>{description}</Dialog.Description>
						</Dialog.Header>
					{/snippet}

					{#snippet footer({ setParams })}
						<Dialog.Footer>
							<Dialog.Close class={buttonVariants({ variant: 'ghost' })}>{m.cancel()}</Dialog.Close>
							<Button
								onclick={() => {
									setParams();
									tableContext.filterDialogOpen = false;
								}}
							>
								{m.use()}
							</Button>
						</Dialog.Footer>
					{/snippet}
				</Component>
			{/if}
		</div>
	</Dialog.Content>
</Dialog.Root>
