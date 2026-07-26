<script lang="ts">
	// DEV prototype (#279): reset-password action rendered as a dropdown menu item.
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { m } from '$lib/paraglide/messages';
	import { resetUserPassword } from '$lib/remote-functions/admin.remote';
	import { createFormSubmit } from '$lib/utils/form-submit.svelte';
	import ArrowCounterClockwiseIcon from '~icons/ph/arrow-counter-clockwise';

	let { userId }: { userId: string } = $props();

	const form = $derived(resetUserPassword.for(userId));
	const submit = createFormSubmit(() => form, { toast: {} });

	let formEl: HTMLFormElement;
</script>

<form bind:this={formEl} {...submit.attrs} class="hidden">
	<input {...form.fields.userId.as('hidden', userId)} />
	<button type="submit" {@attach submit.anchor} aria-hidden="true" tabindex="-1"></button>
</form>

<DropdownMenu.Item onSelect={() => formEl.requestSubmit()}>
	<ArrowCounterClockwiseIcon />
	{m.admin_reset_password_sr()}
</DropdownMenu.Item>
