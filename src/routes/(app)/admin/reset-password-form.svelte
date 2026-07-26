<script lang="ts">
	// Persistent hidden reset-password form, one per user row. It lives in the
	// row (not inside the dropdown's portalled content, which unmounts on
	// select), so its submit lifecycle survives the menu closing. The kebab
	// menu item triggers it by id via requestSubmit; the keyed form instance
	// (`.for(userId)`) owns its own `result`, surfaced up through `onReset`.
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
