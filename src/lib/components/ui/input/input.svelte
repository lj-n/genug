<script lang="ts">
	import type { WithElementRef } from 'bits-ui';
	import type { HTMLInputAttributes, HTMLInputTypeAttribute } from 'svelte/elements';

	import { cn } from 'tailwind-variants';

	import { type InputVariant, inputVariants } from './input-variants';

	type InputType = Exclude<HTMLInputTypeAttribute, 'file'>;

	type Props = WithElementRef<
		Omit<HTMLInputAttributes, 'type'> &
			({ files?: FileList; type: 'file' } | { files?: undefined; type?: InputType })
	> & { variant?: InputVariant };

	let {
		class: className,
		'data-slot': dataSlot = 'input',
		files = $bindable(),
		ref = $bindable(null),
		type,
		value = $bindable(),
		variant = 'default',
		...restProps
	}: Props = $props();
</script>

{#if type === 'file'}
	<input
		bind:this={ref}
		data-slot={dataSlot}
		class={cn(
			inputVariants({ variant }),
			'file:inline-flex file:border-0 file:bg-transparent file:text-foreground',
			className
		)}
		type="file"
		bind:files
		bind:value
		{...restProps}
	/>
{:else}
	<input
		bind:this={ref}
		data-slot={dataSlot}
		class={cn(inputVariants({ variant }), className)}
		{type}
		bind:value
		{...restProps}
	/>
{/if}
