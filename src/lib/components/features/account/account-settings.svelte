<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { m } from '$lib/paraglide/messages';
	import PencilIcon from '~icons/ph/pencil';

	import AccountSettingsContent from './account-settings-content.svelte';

	let {
		accountId,
		onArchived,
		onDeleted
	}: { accountId: string; onArchived: () => void; onDeleted: () => void } = $props();

	let open = $state(false);

	// Archiving and deleting both take the account off the active detail page, so
	// the dialog must close itself before the page navigates away.
	function handleArchived() {
		open = false;
		onArchived();
	}

	function handleDeleted() {
		open = false;
		onDeleted();
	}
</script>

<Button
	variant="ghost"
	size="icon-lg"
	class="bg-muted/10 hover:bg-muted/20"
	onclick={() => (open = true)}
>
	<PencilIcon class="size-5" />
	<span class="sr-only">{m.account_settings_title()}</span>
</Button>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-4xl">
		<Dialog.Header>
			<Dialog.Title>{m.account_settings_title()}</Dialog.Title>
			<Dialog.Description>{m.account_set_name_description()}</Dialog.Description>
		</Dialog.Header>

		<!--
			The awaited data lives in a nested component so a query refresh after a
			submit re-suspends only the content, never this component's `open` state.
		-->
		{#if open}
			<Dialog.Body>
				<AccountSettingsContent {accountId} onArchived={handleArchived} onDeleted={handleDeleted} />
			</Dialog.Body>
		{/if}
	</Dialog.Content>
</Dialog.Root>
