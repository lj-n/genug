<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	import { CurrencyInput } from '@canutin/svelte-currency-input';
	import { cn } from 'tailwind-variants';

	type Props = HTMLInputAttributes;

	let { class: className }: Props = $props();
</script>

<CurrencyInput
	class={cn(
		'h-9 w-full rounded-md border border-muted/30 bg-surface px-3 py-1 outline-none placeholder:text-muted/90 focus-visible:ring-2 focus-visible:ring-focus/80 aria-invalid:border-error',
		className
	)}
/>
