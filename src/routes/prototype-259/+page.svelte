<script lang="ts">
	// PROTOTYPE #259 — throwaway gallery for the data-display/feedback
	// restyle session. Delete before merging into `restyle`.
	import { dev } from '$app/environment';
	import { Button } from '$lib/components/ui/button';
	import { buttonVariants } from '$lib/components/ui/button';
	import * as Collapsible from '$lib/components/ui/collapsible';
	import { EmptyState } from '$lib/components/ui/empty-state';
	import * as Pagination from '$lib/components/ui/pagination';
	import { Separator } from '$lib/components/ui/separator';
	import { SourceLink } from '$lib/components/ui/source-link';
	import * as Table from '$lib/components/ui/table';
	import { VersionLabel } from '$lib/components/ui/version-label';
	import { createAnchoredToast } from '$lib/utils/anchored-toast.svelte';
	import { cn } from 'tailwind-variants';
	import CaretUpDownIcon from '~icons/ph/caret-up-down';
	import FunnelIcon from '~icons/ph/funnel';
	import MoonIcon from '~icons/ph/moon';
	import ReceiptIcon from '~icons/ph/receipt';
	import SunIcon from '~icons/ph/sun';

	let theme = $state<'dark' | 'light'>('light');

	function toggleTheme() {
		theme = theme === 'light' ? 'dark' : 'light';
		document.documentElement.classList.toggle('dark', theme === 'dark');
		document.documentElement.classList.toggle('light', theme === 'light');
	}

	// Fabricated demo data — no real budget values.
	const rows = [
		{ amount: '−54.20 €', category: 'Groceries', date: 'Jul 21, 2026', notes: 'Weekly market run' },
		{ amount: '−1,150.00 €', category: 'Rent', date: 'Jul 1, 2026', notes: 'July' },
		{ amount: '2,840.00 €', category: 'Income', date: 'Jul 1, 2026', notes: 'Salary' },
		{ amount: '−12.99 €', category: 'Streaming', date: 'Jul 14, 2026', notes: '' },
		{ amount: '−230.45 €', category: 'Utilities', date: 'Jul 8, 2026', notes: 'Power + water' },
		{ amount: '−86.30 €', category: 'Dining out', date: 'Jul 18, 2026', notes: 'Birthday dinner' },
		{ amount: '−49.00 €', category: 'Transport', date: 'Jul 5, 2026', notes: 'Monthly pass' },
		{ amount: '−18.75 €', category: 'Books', date: 'Jul 11, 2026', notes: '' }
	];

	let page = $state(3);
	let collapsibleOpen = $state(false);

	const successToast = createAnchoredToast();
	const errorToast = createAnchoredToast();
</script>

{#if dev}
	<div class="mx-auto flex w-full max-w-3xl flex-col gap-12 px-6 py-10 pb-32">
		<header class="flex flex-col gap-1">
			<h1 class="font-slab text-2xl font-bold">Prototype #259 — data display &amp; feedback</h1>
			<p class="text-sm text-muted">
				Throwaway gallery. Review each primitive in both modes; decisions land in
				docs/dev/design-language.md, then this route is deleted.
			</p>
		</header>

		{#snippet sectionLabel(name: string, file: string)}
			<div class="flex items-baseline gap-3">
				<h2 class="text-xs font-medium tracking-wider text-muted uppercase">{name}</h2>
				<code class="text-xs text-muted/70">{file}</code>
			</div>
		{/snippet}

		<section class="flex flex-col gap-3">
			{@render sectionLabel('Table', 'ui/table')}
			<Table.Root>
				<Table.Caption>Fabricated July demo data — density check.</Table.Caption>
				<Table.Header>
					<Table.Row>
						<Table.Head>Category</Table.Head>
						<Table.Head>Notes</Table.Head>
						<Table.Head class="text-right">Date</Table.Head>
						<Table.Head class="text-right">Amount</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each rows as row (row.category + row.date)}
						<Table.Row>
							<Table.Cell>{row.category}</Table.Cell>
							<Table.Cell class="text-muted">{row.notes}</Table.Cell>
							<Table.Cell class="text-right">{row.date}</Table.Cell>
							<Table.Cell class="text-right font-currency">{row.amount}</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
				<Table.Footer>
					<Table.Row>
						<Table.Cell colspan={3}>Net</Table.Cell>
						<Table.Cell class="text-right font-currency">1,238.31 €</Table.Cell>
					</Table.Row>
				</Table.Footer>
			</Table.Root>
		</section>

		<section class="flex flex-col gap-3">
			{@render sectionLabel('Pagination', 'ui/pagination')}
			<Pagination.Root count={138} perPage={15} bind:page>
				{#snippet children({ currentPage, pages })}
					<Pagination.Content>
						<Pagination.Item>
							<Pagination.PrevButton disabled={page === 1} />
						</Pagination.Item>
						{#each pages as p (p.key)}
							{#if p.type === 'ellipsis'}
								<Pagination.Item><Pagination.Ellipsis /></Pagination.Item>
							{:else}
								<Pagination.Item>
									<Pagination.Link page={p} isActive={currentPage === p.value} />
								</Pagination.Item>
							{/if}
						{/each}
						<Pagination.Item>
							<Pagination.NextButton disabled={page === 10} />
						</Pagination.Item>
					</Pagination.Content>
				{/snippet}
			</Pagination.Root>
		</section>

		<section class="flex flex-col gap-3">
			{@render sectionLabel('Empty state', 'ui/empty-state')}
			<EmptyState
				icon={ReceiptIcon}
				title="No transactions yet"
				description="Everything you record for this account shows up here."
			>
				{#snippet action()}
					<Button>Record a transaction</Button>
				{/snippet}
			</EmptyState>
			<EmptyState icon={FunnelIcon} title="Nothing archived" />
		</section>

		<section class="flex flex-col gap-3">
			{@render sectionLabel('Separator', 'ui/separator')}
			<div class="flex flex-col gap-3 text-sm">
				<p>Above the horizontal separator.</p>
				<Separator />
				<p>Below it.</p>
				<div class="flex h-5 items-center gap-3">
					<span>Left</span>
					<Separator orientation="vertical" />
					<span>Right</span>
				</div>
			</div>
		</section>

		<section class="flex flex-col gap-3">
			{@render sectionLabel('Collapsible', 'ui/collapsible')}
			<Collapsible.Root bind:open={collapsibleOpen}>
				<Collapsible.Trigger
					class={cn(buttonVariants({ variant: 'ghost' }), 'w-full gap-4 px-0.5 font-medium')}
				>
					Invite someone
					<div class="h-px grow bg-muted/20"></div>
					<CaretUpDownIcon />
				</Collapsible.Trigger>
				<Collapsible.Content
					class="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down"
				>
					<p class="p-2 text-sm text-muted">Collapsible content — call sites own the styling.</p>
				</Collapsible.Content>
			</Collapsible.Root>
		</section>

		<section class="flex flex-col gap-3">
			{@render sectionLabel('Toaster', 'ui/toaster')}
			<div class="flex gap-2">
				<Button {@attach successToast.attach} onclick={() => successToast.success('Saved')}>
					Success toast
				</Button>
				<Button
					variant="destructive"
					{@attach errorToast.attach}
					onclick={() => errorToast.error('Something went wrong')}
				>
					Error toast
				</Button>
			</div>
		</section>

		<section class="flex flex-col gap-3">
			{@render sectionLabel('Version label + source link', 'ui/version-label, ui/source-link')}
			<div class="flex items-center gap-3">
				<VersionLabel />
				<SourceLink />
			</div>
		</section>
	</div>

	<!-- Floating review bar — not part of the design under evaluation. -->
	<div
		class="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-md bg-foreground px-3 py-1.5 text-sm text-background shadow-lg"
	>
		<span class="font-medium">#259 gallery</span>
		<button
			type="button"
			class="flex cursor-pointer items-center gap-1.5 rounded-sm px-2 py-0.5 hover:bg-background/20"
			onclick={toggleTheme}
		>
			{#if theme === 'light'}
				<MoonIcon class="size-4" /> dark
			{:else}
				<SunIcon class="size-4" /> light
			{/if}
		</button>
	</div>
{/if}
