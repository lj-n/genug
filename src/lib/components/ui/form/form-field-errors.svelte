<script lang="ts">
	import type { WithoutChild } from 'bits-ui';

	import * as FormPrimitive from 'formsnap';
	import { cn } from 'tailwind-variants';

	let {
		children: childrenProp,
		class: className,
		errorClasses,
		ref = $bindable(null),
		...restProps
	}: WithoutChild<FormPrimitive.FieldErrorsProps> & {
		errorClasses?: null | string | undefined;
	} = $props();
</script>

<FormPrimitive.FieldErrors
	bind:ref
	class={cn('text-sm font-medium text-error', className)}
	{...restProps}
>
	{#snippet children({ errorProps, errors })}
		{#if childrenProp}
			{@render childrenProp({ errorProps, errors })}
		{:else}
			{#each errors as error (error)}
				<div {...errorProps} class={cn(errorClasses)}>{error}</div>
			{/each}
		{/if}
	{/snippet}
</FormPrimitive.FieldErrors>
