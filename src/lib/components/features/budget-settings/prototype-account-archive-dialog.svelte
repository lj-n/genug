<script lang="ts">
	// PROTOTYPE (#334) — throwaway. Archived-accounts dialog stacking over
	// budget settings (same sibling-root pattern as Add Account); C-style
	// text-link restore rows.
	import type { getArchivedAccounts } from '$lib/remote-functions/account.remote';

	import * as Dialog from '$lib/components/ui/dialog';
	import { m } from '$lib/paraglide/messages';
	import { flip } from 'svelte/animate';
	import ArchiveIcon from '~icons/ph/archive';

	import PrototypeAccountRestoreLink from './prototype-account-restore-link.svelte';

	let {
		accounts,
		open = $bindable(false)
	}: {
		accounts: Awaited<ReturnType<typeof getArchivedAccounts>>;
		open?: boolean;
	} = $props();

	// Restoring the last account removes the trigger button; the open dialog
	// must vanish with it instead of lingering as an empty "0" shell.
	$effect(() => {
		if (accounts.length === 0) open = false;
	});
</script>

<Dialog.Root bind:open>
	<!-- Lighter scrim so the settings dialog stays present behind (same as the
	     Add Account stack). -->
	<Dialog.Content class="sm:max-w-md" overlayClass="bg-background/30">
		<Dialog.Header>
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
						<PrototypeAccountRestoreLink {account} />
					</li>
				{/each}
			</ul>
		</Dialog.Body>
	</Dialog.Content>
</Dialog.Root>
