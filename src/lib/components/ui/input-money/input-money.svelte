<script lang="ts">
	import type { CURRENCIES } from '$lib/utils/currencies';
	import type { HTMLInputAttributes } from 'svelte/elements';

	import { inputVariants } from '$lib/components/ui/input';
	import { getLocale } from '$lib/paraglide/runtime';
	import { asMoney, formatMoney } from '$lib/utils/money';
	import { tick } from 'svelte';
	import { cn } from 'tailwind-variants';

	import {
		centsToEditText,
		decimalSeparatorFor,
		editTextToCents,
		isValidEditText,
		parsePastedAmount
	} from './money-text';

	type Props = Omit<
		HTMLInputAttributes,
		'onbeforeinput' | 'oninput' | 'onpaste' | 'type' | 'value'
	> & {
		currency: (typeof CURRENCIES)[number];
		ref?: HTMLInputElement | null;
		selectOnFocus?: boolean;
		value?: number;
	};

	let {
		class: className,
		currency,
		'data-slot': dataSlot = 'input',
		name,
		onblur,
		onfocus,
		ref = $bindable(null),
		selectOnFocus = false,
		value = $bindable(),
		...restProps
	}: Props = $props();

	// No $bindable fallback: remote-function form fields read as undefined
	// before their first write, and Svelte forbids binding undefined to a
	// prop with a fallback. Unset simply means 0 cents.
	const cents = $derived(value ?? 0);

	// While focused the text is owned by the user's editing; while unfocused it
	// derives from the bound cents, so external writes reset it automatically.
	let focused = $state(false);
	let editText = $state('');

	const displayText = $derived(
		focused ? editText : formatMoney({ currency, money: asMoney(cents) })
	);

	function proposedText(input: HTMLInputElement, inserted: string): string {
		const start = input.selectionStart ?? input.value.length;
		const end = input.selectionEnd ?? input.value.length;
		return input.value.slice(0, start) + inserted + input.value.slice(end);
	}

	function handleBeforeInput(event: InputEvent & { currentTarget: HTMLInputElement }) {
		// Deletions (data is null) can never make valid edit text invalid.
		if (event.data === null) {
			return;
		}
		if (!isValidEditText(proposedText(event.currentTarget, event.data))) {
			event.preventDefault();
		}
	}

	function handleInput(event: Event & { currentTarget: HTMLInputElement }) {
		editText = event.currentTarget.value;
		value = editTextToCents(editText);
	}

	function handlePaste(event: ClipboardEvent & { currentTarget: HTMLInputElement }) {
		event.preventDefault();
		const pasted = event.clipboardData?.getData('text') ?? '';

		const inserted = proposedText(event.currentTarget, pasted);
		if (isValidEditText(inserted)) {
			editText = inserted;
			value = editTextToCents(inserted);
			return;
		}

		const cents = parsePastedAmount(pasted);
		if (cents === null) {
			return;
		}
		editText = centsToEditText(cents, decimalSeparatorFor(getLocale()));
		value = cents;
	}

	function handleFocus(event: FocusEvent & { currentTarget: HTMLInputElement }) {
		const input = event.currentTarget;
		// A selection made before focusing (tab focus, Playwright's fill) is
		// applied by the browser only after the focus dispatch finishes — in
		// this handler it still reads as collapsed, and any value write before
		// then (ours or Svelte's flush) would destroy it. So the swap to edit
		// text, including the state writes driving it, is deferred to a
		// microtask: late enough to see and carry over a full selection, early
		// enough to land before the next keystroke.
		queueMicrotask(() => {
			const hadFullSelection =
				input.selectionStart === 0 && input.selectionEnd === input.value.length;
			editText = cents === 0 ? '' : centsToEditText(cents, decimalSeparatorFor(getLocale()));
			focused = true;
			input.value = editText;
			if (hadFullSelection) {
				input.select();
			}
		});
		if (selectOnFocus) {
			// Deferred past the swap microtask; a synchronous select would also
			// be collapsed by the caret the focusing click places afterwards.
			tick().then(() => ref?.select());
		}
		onfocus?.(event);
	}

	function handleBlur(event: FocusEvent & { currentTarget: HTMLInputElement }) {
		focused = false;
		onblur?.(event);
	}
</script>

<input
	bind:this={ref}
	data-slot={dataSlot}
	class={cn(inputVariants(), className)}
	type="text"
	inputmode="decimal"
	value={displayText}
	onbeforeinput={handleBeforeInput}
	oninput={handleInput}
	onpaste={handlePaste}
	onfocus={handleFocus}
	onblur={handleBlur}
	{...restProps}
/>

{#if name}
	<input
		type="hidden"
		{name}
		value={String(cents)}
		disabled={restProps.disabled}
		form={restProps.form}
	/>
{/if}
