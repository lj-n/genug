<!-- PROTOTYPE Entry A — "Header": a ghost icon button (stamp) in the page header
     next to the settings gear opens the Checkpoint page; under the account name
     a line says how long ago the last checkpoint was and links to the history.
     When a checkpoint is due, an amber dot sits on the button (picked H2 over an
     amber subtitle, an inline link and a dismissible banner). -->
<script lang="ts">
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button';
	import { formatRelativeDate } from '$lib/utils/format-relative-date';
	import { formatTransactionDate } from '$lib/utils/format-transaction-date';
	import { parseDate } from '@internationalized/date';
	import StampIcon from '~icons/ph/stamp';

	import type { FakeEntry } from './entry-fake';

	let {
		accountId,
		budgetId,
		entry,
		part
	}: {
		accountId: string;
		budgetId: string;
		entry: FakeEntry;
		part: 'button' | 'subtitle';
	} = $props();

	const href = $derived(
		resolve('/(app)/[budgetId=id]/accounts/[accountId=id]/checkpoint-prototype', {
			accountId,
			budgetId
		})
	);
	const last = $derived(entry.last);
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -->
{#if part === 'button'}
	<Button
		{href}
		variant="ghost"
		size="icon"
		class="relative"
		title={entry.due ? 'Checkpoint suggested' : 'Checkpoint'}
	>
		<StampIcon />
		<span class="sr-only">Checkpoint</span>
		{#if entry.due}
			<span class="absolute top-1.5 right-1.5 size-2 rounded-full bg-focus"></span>
		{/if}
	</Button>
{:else if last}
	<a
		href="{href}#history"
		title={formatTransactionDate(parseDate(last.date))}
		class="flex w-fit items-center gap-1.5 text-sm text-muted hover:text-foreground"
	>
		<StampIcon class="text-success" />
		Last checkpoint {formatRelativeDate({ date: parseDate(last.date) })}
	</a>
{:else}
	<p class="flex items-center gap-1.5 text-sm text-muted">
		<StampIcon /> No checkpoint yet
	</p>
{/if}
<!-- eslint-enable svelte/no-navigation-without-resolve -->
