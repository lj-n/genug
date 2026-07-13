<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { m } from '$lib/paraglide/messages';
	import { resetUserPassword } from '$lib/remote-functions/admin.remote';
	import { createFormSubmit } from '$lib/utils/form-submit.svelte';
	import ArrowCounterClockwiseIcon from '~icons/ph/arrow-counter-clockwise';

	let { userId }: { userId: string } = $props();

	const form = $derived(resetUserPassword.for(userId));

	const submit = createFormSubmit(() => form, { toast: {} });
</script>

<form {...submit.attrs} class="contents">
	<input {...form.fields.userId.as('hidden', userId)} />
	<!-- Row-scoped micro-form: disabled during flight, deliberately no spinner. -->
	<Button size="icon-sm" type="submit" disabled={submit.pending} {@attach submit.anchor}>
		<ArrowCounterClockwiseIcon />
		<span class="sr-only">{m.admin_reset_password_sr()}</span>
	</Button>
</form>
