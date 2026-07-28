<script lang="ts">
	// Hidden form, one per user row, triggered by the row's kebab menu via
	// requestSubmit; it lives in the row rather than the menu's portalled
	// content (which unmounts on select) so the submit survives the menu closing.
	import { resetUserPassword } from '$lib/remote-functions/admin.remote';
	import { createFormSubmit } from '$lib/utils/form-submit.svelte';

	let { onReset, userId }: { onReset: (newPassword: string) => void; userId: string } = $props();

	const form = $derived(resetUserPassword.for(userId));
	const submit = createFormSubmit(() => form, {
		onSuccess: () => {
			if (form.result?.newPassword) onReset(form.result.newPassword);
		},
		toast: {}
	});
</script>

<form id="reset-password-{userId}" {...submit.attrs} class="hidden">
	<input {...form.fields.userId.as('hidden', userId)} />
	<button type="submit" {@attach submit.anchor} aria-hidden="true" tabindex="-1"></button>
</form>
