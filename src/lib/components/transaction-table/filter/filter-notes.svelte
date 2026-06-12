<script lang="ts">
	import type { Snippet } from 'svelte';

	import { Input } from '$lib/components/ui/input';
	import { m } from '$lib/paraglide/messages';

	let {
		currentNotes,
		footer,
		header,
		onApply,
		onClose
	}: {
		currentNotes: string | undefined;
		footer: Snippet<[{ setParams: () => void }]>;
		header: Snippet<[{ description: string; title: string }]>;
		onApply: (notes: string) => void;
		onClose: () => void;
	} = $props();

	// svelte-ignore state_referenced_locally
	let value = $state<string>(currentNotes ?? '');
</script>

{@render header({
	description: m.transaction_filter_notes_description(),
	title: m.transaction_filter_notes_title()
})}

<form
	onsubmit={(e) => {
		e.preventDefault();
		onApply(value);
		onClose();
	}}
>
	<Input bind:value aria-label={m.transaction_filter_notes_title()} />
	<input type="submit" hidden />
</form>

{@render footer({
	setParams: () => {
		onApply(value);
	}
})}
