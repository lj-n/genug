<script lang="ts">
	import { hoverOutline, invalidRing } from '$lib/components/ui/focus-ring';
	import { Checkbox as CheckboxPrimitive } from 'bits-ui';
	import { cn } from 'tailwind-variants';
	import PhCheck from '~icons/ph/check';
	import PhMinus from '~icons/ph/minus';

	let {
		checked = $bindable(false),
		class: className,
		indeterminate = $bindable(false),
		ref = $bindable(null),
		...restProps
	}: CheckboxPrimitive.RootProps = $props();
</script>

<CheckboxPrimitive.Root
	bind:ref
	data-slot="checkbox"
	class={cn(
		'peer relative flex size-4 shrink-0 items-center justify-center rounded-xs border bg-muted/5 outline-none group-has-disabled/field:opacity-50 after:absolute after:-inset-x-3 after:-inset-y-2 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-error data-[state=indeterminate]:border-foreground data-[state=indeterminate]:bg-foreground data-[state=indeterminate]:text-background data-checked:border-foreground data-checked:bg-foreground data-checked:text-background',
		hoverOutline,
		invalidRing,
		className
	)}
	bind:checked
	bind:indeterminate
	{...restProps}
>
	{#snippet children({ checked, indeterminate })}
		<div
			data-slot="checkbox-indicator"
			class="grid place-content-center text-current transition-none [&>svg]:size-3.5"
		>
			{#if checked}
				<PhCheck />
			{:else if indeterminate}
				<PhMinus />
			{/if}
		</div>
	{/snippet}
</CheckboxPrimitive.Root>
