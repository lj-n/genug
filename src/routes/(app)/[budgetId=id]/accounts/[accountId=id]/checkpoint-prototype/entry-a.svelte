<!-- PROTOTYPE Entry A — "Header": a ghost icon button (stamp) in the page header
     next to the settings gear opens the Checkpoint page; under the account name
     a line says how long ago the last checkpoint was and links to the history. -->
<script lang="ts">
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button';
	import { formatRelativeDate } from '$lib/utils/format-relative-date';
	import { formatTransactionDate } from '$lib/utils/format-transaction-date';
	import { parseDate } from '@internationalized/date';
	import StampIcon from '~icons/ph/stamp';

	import type { FakeCheckpoint } from './entry-fake';

	let {
		accountId,
		budgetId,
		last,
		part
	}: {
		accountId: string;
		budgetId: string;
		last: FakeCheckpoint;
		part: 'button' | 'subtitle';
	} = $props();

	const href = $derived(
		resolve('/(app)/[budgetId=id]/accounts/[accountId=id]/checkpoint-prototype', {
			accountId,
			budgetId
		})
	);
</script>

{#if part === 'button'}
	<Button {href} variant="ghost" size="icon" title="Checkpoint">
		<StampIcon />
		<span class="sr-only">Checkpoint</span>
	</Button>
{:else if last}
	<!-- eslint-disable svelte/no-navigation-without-resolve -->
	<a
		href="{href}#history"
		title={formatTransactionDate(parseDate(last.date))}
		class="flex w-fit items-center gap-1.5 text-sm text-muted hover:text-foreground"
	>
		<StampIcon class="text-success" />
		Last checkpoint {formatRelativeDate({ date: parseDate(last.date) })}
	</a>
	<!-- eslint-enable svelte/no-navigation-without-resolve -->
{:else}
	<p class="flex items-center gap-1.5 text-sm text-muted">
		<StampIcon /> No checkpoint yet
	</p>
{/if}
