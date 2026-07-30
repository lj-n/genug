<script lang="ts">
	import * as ResponsiveModal from './index';
	import Field from './responsive-modal.test-fixture-field.svelte';

	let {
		dismissible = true,
		open = $bindable(false)
	}: {
		dismissible?: boolean;
		open?: boolean;
	} = $props();
</script>

<ResponsiveModal.Root {dismissible} bind:open>
	<ResponsiveModal.Content>
		<ResponsiveModal.Header>
			<ResponsiveModal.Title>Manage users</ResponsiveModal.Title>
			<ResponsiveModal.Description>People with access.</ResponsiveModal.Description>
		</ResponsiveModal.Header>

		<Field />

		<ResponsiveModal.Footer>
			<ResponsiveModal.Close>Close</ResponsiveModal.Close>
		</ResponsiveModal.Footer>
	</ResponsiveModal.Content>
</ResponsiveModal.Root>
