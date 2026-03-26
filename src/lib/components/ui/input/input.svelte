<script lang="ts">
	import { cn } from 'tailwind-variants';
	import type { HTMLInputAttributes, HTMLInputTypeAttribute } from 'svelte/elements';
	import type { WithElementRef } from 'bits-ui';

	type InputType = Exclude<HTMLInputTypeAttribute, 'file'>;

	type Props = WithElementRef<
		Omit<HTMLInputAttributes, 'type'> &
			({ type: 'file'; files?: FileList } | { type?: InputType; files?: undefined })
	>;

	let {
		ref = $bindable(null),
		value = $bindable(),
		type,
		files = $bindable(),
		class: className,
		'data-slot': dataSlot = 'input',
		...restProps
	}: Props = $props();
</script>

{#if type === 'file'}
	<input
		bind:this={ref}
		data-slot={dataSlot}
		class={cn(
			'w-full rounded-md border border-muted/30 bg-surface px-3 py-1 outline-none file:inline-flex file:border-0 file:bg-transparent file:text-foreground placeholder:text-muted/90 focus-visible:ring-2 focus-visible:ring-focus/80 aria-invalid:border-error',
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
		class={cn(
			'w-full rounded-md border border-muted/30 bg-surface px-3 py-1 outline-none placeholder:text-muted/90 focus-visible:ring-2 focus-visible:ring-focus/80 aria-invalid:border-error',
			className
		)}
		{type}
		bind:value
		{...restProps}
	/>
{/if}
