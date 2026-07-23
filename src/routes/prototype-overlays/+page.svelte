<!--
	PROTOTYPE (#258) — overlay & menu gallery. Throwaway review surface for
	restyling the overlay family to the locked design language; delete before
	merging into `restyle`. Toggle themes with the floating bar at the bottom.
-->
<script lang="ts">
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { Button } from '$lib/components/ui/button';
	import * as Command from '$lib/components/ui/command';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Drawer from '$lib/components/ui/drawer';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Popover from '$lib/components/ui/popover';
	import * as ResponsiveModal from '$lib/components/ui/responsive-modal';
	import * as Select from '$lib/components/ui/select';
	import { Separator } from '$lib/components/ui/separator';
	import ArrowsLeftRightIcon from '~icons/ph/arrows-left-right';
	import CalendarBlankIcon from '~icons/ph/calendar-blank';
	import GearSixIcon from '~icons/ph/gear-six';
	import MagnifyingGlassIcon from '~icons/ph/magnifying-glass';
	import PencilSimpleIcon from '~icons/ph/pencil-simple';
	import PlusIcon from '~icons/ph/plus';
	import TrashIcon from '~icons/ph/trash';
	import WarningIcon from '~icons/ph/warning';

	type Theme = 'dark' | 'light' | 'system';
	let theme = $state<Theme>('system');

	$effect(() => {
		document.documentElement.classList.remove('light', 'dark');
		if (theme !== 'system') document.documentElement.classList.add(theme);
	});

	let commandDialogOpen = $state(false);
	let selectValue = $state('');
	let showCleared = $state(true);
	let showPending = $state(false);
	let sortBy = $state('date');

	const drawerDirections = ['bottom', 'right', 'left'] as const;
</script>

<svelte:window
	onkeydown={(e) => {
		if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
			e.preventDefault();
			commandDialogOpen = !commandDialogOpen;
		}
	}}
/>

<div class="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-10 p-6 pb-32">
	<header class="flex flex-col gap-1">
		<h1 class="text-lg font-medium">Overlay gallery <span class="text-muted">(#258)</span></h1>
		<p class="text-sm text-muted">
			Throwaway review surface for the overlay family. Review each family in both themes via the bar
			below.
		</p>
	</header>

	<!-- Dialog -->
	<section class="flex flex-col gap-3">
		<h2 class="text-xs tracking-wider text-muted uppercase">Dialog / dialog-form</h2>
		<div class="flex flex-wrap gap-2">
			<Dialog.Root>
				<Dialog.Trigger>
					{#snippet child({ props })}
						<Button {...props}>Plain dialog</Button>
					{/snippet}
				</Dialog.Trigger>
				<Dialog.Content>
					<Dialog.Header>
						<Dialog.Title>About this budget</Dialog.Title>
						<Dialog.Description>A plain dialog with header, body and footer.</Dialog.Description>
					</Dialog.Header>
					<Dialog.Body>
						<p class="text-muted">
							Groceries has been overspent three months in a row. Consider raising the target or
							moving money from Dining Out.
						</p>
					</Dialog.Body>
					<Dialog.Footer showCloseButton />
				</Dialog.Content>
			</Dialog.Root>

			<Dialog.Root>
				<Dialog.Trigger>
					{#snippet child({ props })}
						<Button {...props}><PencilSimpleIcon />Form layout</Button>
					{/snippet}
				</Dialog.Trigger>
				<Dialog.Content>
					<Dialog.Header>
						<Dialog.Title>Edit category</Dialog.Title>
						<Dialog.Description>The dialog-form layout: fields plus footer.</Dialog.Description>
					</Dialog.Header>
					<Dialog.Body class="flex flex-col gap-6">
						<div class="flex flex-col gap-2">
							<Label for="proto-cat-name">Name</Label>
							<Input id="proto-cat-name" value="Groceries" />
						</div>
						<div class="flex flex-col gap-2">
							<Label for="proto-cat-target">Monthly target</Label>
							<Input id="proto-cat-target" value="450,00 €" />
						</div>
					</Dialog.Body>
					<Dialog.Footer>
						<Dialog.Close>
							{#snippet child({ props })}
								<Button variant="ghost" {...props}>Cancel</Button>
							{/snippet}
						</Dialog.Close>
						<Button>Save</Button>
					</Dialog.Footer>
				</Dialog.Content>
			</Dialog.Root>

			<Dialog.Root>
				<Dialog.Trigger>
					{#snippet child({ props })}
						<Button variant="ghost" {...props}>Long content (scroll)</Button>
					{/snippet}
				</Dialog.Trigger>
				<Dialog.Content>
					<Dialog.Header>
						<Dialog.Title>Scrolling body</Dialog.Title>
						<Dialog.Description>Header and footer pin; only the body scrolls.</Dialog.Description>
					</Dialog.Header>
					<Dialog.Body class="flex flex-col gap-4">
						{#each Array.from({ length: 30 }, (_, i) => i + 1) as n (n)}
							<p class="text-muted">Transaction row {n} — placeholder content to force scroll.</p>
						{/each}
					</Dialog.Body>
					<Dialog.Footer showCloseButton />
				</Dialog.Content>
			</Dialog.Root>
		</div>
	</section>

	<!-- Alert dialog -->
	<section class="flex flex-col gap-3">
		<h2 class="text-xs tracking-wider text-muted uppercase">Alert dialog / alert-dialog-form</h2>
		<div class="flex flex-wrap gap-2">
			<AlertDialog.Root>
				<AlertDialog.Trigger>
					{#snippet child({ props })}
						<Button variant="destructive" {...props}><TrashIcon />Delete (default)</Button>
					{/snippet}
				</AlertDialog.Trigger>
				<AlertDialog.Content>
					<AlertDialog.Header>
						<AlertDialog.Media>
							<WarningIcon class="text-error" />
						</AlertDialog.Media>
						<AlertDialog.Title>Delete category?</AlertDialog.Title>
						<AlertDialog.Description>
							“Groceries” still has 12 transactions this month. This cannot be undone.
						</AlertDialog.Description>
					</AlertDialog.Header>
					<AlertDialog.Footer>
						<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
						<AlertDialog.Action variant="destructive">Delete</AlertDialog.Action>
					</AlertDialog.Footer>
				</AlertDialog.Content>
			</AlertDialog.Root>

			<AlertDialog.Root>
				<AlertDialog.Trigger>
					{#snippet child({ props })}
						<Button variant="ghost" {...props}>Confirm (sm)</Button>
					{/snippet}
				</AlertDialog.Trigger>
				<AlertDialog.Content size="sm">
					<AlertDialog.Header>
						<AlertDialog.Title>Discard changes?</AlertDialog.Title>
						<AlertDialog.Description>Unsaved edits will be lost.</AlertDialog.Description>
					</AlertDialog.Header>
					<AlertDialog.Footer>
						<AlertDialog.Cancel>Keep editing</AlertDialog.Cancel>
						<AlertDialog.Action>Discard</AlertDialog.Action>
					</AlertDialog.Footer>
				</AlertDialog.Content>
			</AlertDialog.Root>
		</div>
	</section>

	<!-- Drawer -->
	<section class="flex flex-col gap-3">
		<h2 class="text-xs tracking-wider text-muted uppercase">Drawer</h2>
		<div class="flex flex-wrap gap-2">
			{#each drawerDirections as direction (direction)}
				<Drawer.Root {direction}>
					<Drawer.Trigger>
						{#snippet child({ props })}
							<Button variant="ghost" {...props}>Drawer ({direction})</Button>
						{/snippet}
					</Drawer.Trigger>
					<Drawer.Content class="px-6 pb-6">
						<Drawer.Header>
							<Drawer.Title>New transaction</Drawer.Title>
							<Drawer.Description>Drawer from the {direction}.</Drawer.Description>
						</Drawer.Header>
						<div class="flex flex-col gap-4 py-4">
							<div class="flex flex-col gap-2">
								<Label for="proto-drawer-payee-{direction}">Payee</Label>
								<Input id="proto-drawer-payee-{direction}" placeholder="e.g. Supermarket" />
							</div>
							<div class="flex flex-col gap-2">
								<Label for="proto-drawer-amount-{direction}">Amount</Label>
								<Input id="proto-drawer-amount-{direction}" placeholder="0,00 €" />
							</div>
						</div>
						<Drawer.Footer>
							<Drawer.Close>
								{#snippet child({ props })}
									<Button variant="ghost" {...props}>Cancel</Button>
								{/snippet}
							</Drawer.Close>
							<Button>Save</Button>
						</Drawer.Footer>
					</Drawer.Content>
				</Drawer.Root>
			{/each}
		</div>
	</section>

	<!-- Responsive modal -->
	<section class="flex flex-col gap-3">
		<h2 class="text-xs tracking-wider text-muted uppercase">Responsive modal</h2>
		<div class="flex flex-wrap gap-2">
			<ResponsiveModal.Root>
				<ResponsiveModal.Trigger>
					{#snippet child({ props })}
						<Button variant="ghost" {...props}>Responsive modal</Button>
					{/snippet}
				</ResponsiveModal.Trigger>
				<ResponsiveModal.Content>
					<ResponsiveModal.Header>
						<ResponsiveModal.Title>Move money</ResponsiveModal.Title>
						<ResponsiveModal.Description>
							Dialog on desktop, bottom drawer on mobile — resize to compare.
						</ResponsiveModal.Description>
					</ResponsiveModal.Header>
					<ResponsiveModal.Body>
						<p class="text-muted">Move 25,00 € from Dining Out to Groceries.</p>
					</ResponsiveModal.Body>
					<ResponsiveModal.Footer>
						<Button>Move</Button>
					</ResponsiveModal.Footer>
				</ResponsiveModal.Content>
			</ResponsiveModal.Root>
		</div>
	</section>

	<!-- Popover -->
	<section class="flex flex-col gap-3">
		<h2 class="text-xs tracking-wider text-muted uppercase">Popover / popover-form</h2>
		<div class="flex flex-wrap gap-2">
			<Popover.Root>
				<Popover.Trigger>
					{#snippet child({ props })}
						<Button variant="ghost" {...props}>Plain popover</Button>
					{/snippet}
				</Popover.Trigger>
				<Popover.Content>
					<Popover.Header>
						<Popover.Title>Groceries</Popover.Title>
						<Popover.Description>Target 450,00 € · funded 300,00 €</Popover.Description>
					</Popover.Header>
					<p class="text-muted">Assigned every month on the 1st. Last edited 3 days ago.</p>
				</Popover.Content>
			</Popover.Root>

			<Popover.Root>
				<Popover.Trigger>
					{#snippet child({ props })}
						<Button variant="ghost" {...props}><PlusIcon />Form layout</Button>
					{/snippet}
				</Popover.Trigger>
				<Popover.Content>
					<form class="flex flex-col gap-4" onsubmit={(e) => e.preventDefault()}>
						<div class="flex flex-col gap-2">
							<Label for="proto-pop-amount">Assign amount</Label>
							<Input id="proto-pop-amount" placeholder="0,00 €" />
						</div>
						<Button type="submit" class="self-end">Assign</Button>
					</form>
				</Popover.Content>
			</Popover.Root>
		</div>
	</section>

	<!-- Dropdown menu -->
	<section class="flex flex-col gap-3">
		<h2 class="text-xs tracking-wider text-muted uppercase">Dropdown menu</h2>
		<div class="flex flex-wrap gap-2">
			<DropdownMenu.Root>
				<DropdownMenu.Trigger>
					{#snippet child({ props })}
						<Button variant="ghost" {...props}><GearSixIcon />Full menu</Button>
					{/snippet}
				</DropdownMenu.Trigger>
				<DropdownMenu.Content class="w-56">
					<DropdownMenu.Label>Groceries</DropdownMenu.Label>
					<DropdownMenu.Group>
						<DropdownMenu.Item>
							<PencilSimpleIcon />Edit
							<DropdownMenu.Shortcut>⌘E</DropdownMenu.Shortcut>
						</DropdownMenu.Item>
						<DropdownMenu.Item variant="interactive">
							<ArrowsLeftRightIcon />Move money
						</DropdownMenu.Item>
						<DropdownMenu.Item disabled><CalendarBlankIcon />Set target</DropdownMenu.Item>
					</DropdownMenu.Group>
					<DropdownMenu.Separator />
					<DropdownMenu.Group>
						<DropdownMenu.GroupHeading>Show</DropdownMenu.GroupHeading>
						<DropdownMenu.CheckboxItem bind:checked={showCleared}>
							Cleared transactions
						</DropdownMenu.CheckboxItem>
						<DropdownMenu.CheckboxItem bind:checked={showPending}>
							Pending transactions
						</DropdownMenu.CheckboxItem>
					</DropdownMenu.Group>
					<DropdownMenu.Separator />
					<DropdownMenu.RadioGroup bind:value={sortBy}>
						<DropdownMenu.GroupHeading>Sort by</DropdownMenu.GroupHeading>
						<DropdownMenu.RadioItem value="date">Date</DropdownMenu.RadioItem>
						<DropdownMenu.RadioItem value="amount">Amount</DropdownMenu.RadioItem>
					</DropdownMenu.RadioGroup>
					<DropdownMenu.Separator />
					<DropdownMenu.Sub>
						<DropdownMenu.SubTrigger>More</DropdownMenu.SubTrigger>
						<DropdownMenu.SubContent>
							<DropdownMenu.Item>Export as CSV</DropdownMenu.Item>
							<DropdownMenu.Item>Duplicate</DropdownMenu.Item>
						</DropdownMenu.SubContent>
					</DropdownMenu.Sub>
					<DropdownMenu.Separator />
					<DropdownMenu.Item variant="destructive"><TrashIcon />Delete</DropdownMenu.Item>
				</DropdownMenu.Content>
			</DropdownMenu.Root>
		</div>
	</section>

	<!-- Select (motion consistency — converted to the shared overlay motion) -->
	<section class="flex flex-col gap-3">
		<h2 class="text-xs tracking-wider text-muted uppercase">Select</h2>
		<div class="flex flex-wrap gap-2">
			<Select.Root type="single" bind:value={selectValue}>
				<Select.Trigger class="w-48" aria-label="Category">
					{selectValue || 'Pick a category'}
				</Select.Trigger>
				<Select.Content>
					{#each ['Groceries', 'Dining Out', 'Rent', 'Utilities'] as option (option)}
						<Select.Item value={option} label={option}>{option}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
		</div>
	</section>

	<!-- Command -->
	<section class="flex flex-col gap-3">
		<h2 class="text-xs tracking-wider text-muted uppercase">Command</h2>
		<div class="flex flex-wrap items-start gap-6">
			<div class="w-full max-w-sm">
				<Command.Root class="h-64">
					<Command.Input placeholder="Search categories…" />
					<Command.List>
						<Command.Empty>No results.</Command.Empty>
						<Command.Group heading="Categories">
							<Command.Item>Groceries</Command.Item>
							<Command.Item>Dining Out</Command.Item>
							<Command.Item>Rent</Command.Item>
							<Command.Item>Utilities</Command.Item>
						</Command.Group>
						<Command.Separator />
						<Command.Group heading="Actions">
							<Command.Item><PlusIcon />New category</Command.Item>
							<Command.Item><ArrowsLeftRightIcon />New transfer</Command.Item>
						</Command.Group>
					</Command.List>
				</Command.Root>
			</div>
			<Button variant="ghost" onclick={() => (commandDialogOpen = true)}>
				<MagnifyingGlassIcon />Command dialog
				<span class="text-xs text-muted">⌘K</span>
			</Button>
		</div>
	</section>

	<Separator />
	<p class="text-xs text-muted">
		Overlay layering: open the dropdown or popover on top of an open dialog to check stacking, and
		the responsive modal at a narrow viewport for the drawer variant.
	</p>
</div>

<Command.Dialog bind:open={commandDialogOpen}>
	<Command.Input placeholder="Type a command or search…" />
	<Command.List>
		<Command.Empty>No results.</Command.Empty>
		<Command.Group heading="Suggestions">
			<Command.Item>Go to Groceries</Command.Item>
			<Command.Item>Go to July 2026</Command.Item>
			<Command.Item><PlusIcon />New transaction</Command.Item>
		</Command.Group>
	</Command.List>
</Command.Dialog>

<!-- Prototype chrome — not part of the design under review. -->
<div
	class="fixed bottom-4 left-1/2 z-[100] flex -translate-x-1/2 items-center gap-1 rounded-full bg-foreground px-3 py-1.5 text-xs text-background shadow-lg"
>
	<span class="mr-2 font-mono">#258</span>
	{#each ['system', 'light', 'dark'] as const as t (t)}
		<button
			class="rounded-full px-2 py-0.5 hover:cursor-pointer {theme === t
				? 'bg-background text-foreground'
				: 'opacity-60'}"
			onclick={() => (theme = t)}
		>
			{t}
		</button>
	{/each}
</div>
