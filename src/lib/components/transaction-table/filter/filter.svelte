<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as ButtonGroup from '$lib/components/ui/button-group';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { m } from '$lib/paraglide/messages';
	import { cn } from 'tailwind-variants';
	import FunnelIcon from '~icons/ph/funnel';
	import FunnelDuotoneIcon from '~icons/ph/funnel-duotone';
	import FunnelXDuotoneIcon from '~icons/ph/funnel-x-duotone';

	import { getTableContext } from '../context.svelte';
	import FilterList from './filter-list.svelte';
	import { getFilterLength } from './filter-util';

	const tableContext = getTableContext();

	let filterLength = $derived(getFilterLength(tableContext.filter()));
	let showAsButtonGroup = $derived(filterLength > 0);
</script>

<div class="flex flex-col gap-2">
	<ButtonGroup.Root>
		<DropdownMenu.Root>
			<DropdownMenu.Trigger>
				{#snippet child({ props })}
					<Button {...props} size="icon" class={cn(showAsButtonGroup && 'border-r-0')}>
						{#if filterLength > 0}
							<FunnelDuotoneIcon />
						{:else}
							<FunnelIcon />
						{/if}
					</Button>
				{/snippet}
			</DropdownMenu.Trigger>

			<DropdownMenu.Content class="w-fit">
				<DropdownMenu.Group>
					<DropdownMenu.Label class="py-0">
						{m.transaction_filter_title()}
					</DropdownMenu.Label>
					<DropdownMenu.Separator />
					<DropdownMenu.Item onSelect={() => tableContext.openFilterDialog('category')}>
						{m.transaction_filter_category_title()}
					</DropdownMenu.Item>
					<DropdownMenu.Item onSelect={() => tableContext.openFilterDialog('notes')}>
						{m.transaction_filter_notes_title()}
					</DropdownMenu.Item>
				</DropdownMenu.Group>
			</DropdownMenu.Content>
		</DropdownMenu.Root>

		{#if showAsButtonGroup}
			<ButtonGroup.Text class="bg-info/5 text-info">
				{m.transaction_filter_active({ value: filterLength })}
			</ButtonGroup.Text>

			<Button
				variant="destructive"
				size="icon"
				onclick={() => {
					tableContext.clearAllFilters();
				}}
			>
				<FunnelXDuotoneIcon />
			</Button>
		{/if}
	</ButtonGroup.Root>

	<FilterList />
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
