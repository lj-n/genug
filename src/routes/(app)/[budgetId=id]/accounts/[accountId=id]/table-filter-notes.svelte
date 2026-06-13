<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { m } from '$lib/paraglide/messages';

	let {
		elementRef = $bindable(null),
		onchange,
		value = $bindable('')
	}: {
		elementRef?: HTMLInputElement | null;
		onchange: (value: string) => void;
		value: string;
	} = $props();

	let timer: ReturnType<typeof setTimeout>;
	function handleInput() {
		clearTimeout(timer);
		timer = setTimeout(() => onchange(value), 300);
	}
</script>

<Input
	bind:ref={elementRef}
	bind:value
	oninput={handleInput}
	placeholder={m.transaction_filter_notes_title()}
	class="w-fit min-w-xs"
/>
