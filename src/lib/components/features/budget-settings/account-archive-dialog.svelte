<script lang="ts">
	import type { getArchivedAccounts } from '$lib/remote-functions/account.remote';

	import * as Dialog from '$lib/components/ui/dialog';
	import { m } from '$lib/paraglide/messages';
	import { flip } from 'svelte/animate';
	import ArchiveIcon from '~icons/ph/archive';

	import AccountRestoreRow from './account-restore-row.svelte';

	let {
		accounts,
		open = $bindable(false)
	}: {
		accounts: Awaited<ReturnType<typeof getArchivedAccounts>>;
		open?: boolean;
	} = $props();
</script>

<!-- The read half of the binding forces the dialog shut once the last account
     is restored — its trigger button disappears with the empty list, and the
     dialog must not linger as an empty shell. -->
<Dialog.Root bind:open={() => open && accounts.length > 0, (v) => (open = v)}>
	<!-- Lighter scrim so the settings dialog stays present behind (same stack
	     pattern as Add Account). -->
	<Dialog.Content class="sm:max-w-md" overlayClass="bg-background/30">
		<Dialog.Header>
			<!-- The count sits inline after the title — `ml-auto` would collide
			     with the dialog's close button. -->
			<Dialog.Title class="flex items-baseline gap-1.5">
				<ArchiveIcon class="size-4 shrink-0 self-center" />
				{m.account_archive_title()}
				<span class="text-xs font-normal text-muted">{accounts.length}</span>
			</Dialog.Title>
		</Dialog.Header>
		<Dialog.Body>
			<ul class="flex max-h-48 flex-col gap-0.5 overflow-y-auto">
				{#each accounts as account (account.id)}
					<li
						animate:flip={{ duration: 200 }}
						class="flex items-center justify-between gap-2 rounded-sm px-2 py-0.5 hover:bg-muted/5"
					>
						<AccountRestoreRow {account} />
					</li>
				{/each}
			</ul>
		</Dialog.Body>
	</Dialog.Content>
</Dialog.Root>
