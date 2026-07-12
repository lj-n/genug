<script lang="ts">
	import type { ComponentProps } from 'svelte';

	import { cn } from 'tailwind-variants';

	import { InputMoney } from '../input-money';

	let {
		class: className,
		ref = $bindable(null),
		value = $bindable(),
		...props
	}: ComponentProps<typeof InputMoney> = $props();
</script>

<InputMoney
	bind:ref
	data-slot="input-group-control"
	class={cn(
		'flex-1 rounded-none border-0 bg-transparent ring-0 focus-visible:bg-transparent focus-visible:ring-0 aria-invalid:border-0',
		className
	)}
	bind:value
	{...props}
/>
