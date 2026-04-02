<script lang="ts">
	import type { WithElementRef } from 'bits-ui';
	import type { HTMLInputAttributes, HTMLInputTypeAttribute } from 'svelte/elements';

	import { cn } from 'tailwind-variants';

	type InputType = Exclude<HTMLInputTypeAttribute, 'file'>;

	type Props = WithElementRef<
		Omit<HTMLInputAttributes, 'type'> &
			({ files?: FileList; type: 'file' } | { files?: undefined; type?: InputType })
	>;

	let {
		class: className,
		'data-slot': dataSlot = 'input',
		files = $bindable(),
		ref = $bindable(null),
		type,
		value = $bindable(),
		...restProps
	}: Props = $props();
</script>

{#if type === 'file'}
	<input
		bind:this={ref}
		data-slot={dataSlot}
		class={cn(
			'h-9 w-full rounded-md border border-muted/30 bg-surface px-3 py-1 outline-none file:inline-flex file:border-0 file:bg-transparent file:text-foreground placeholder:text-muted/90 focus-visible:ring-2 focus-visible:ring-focus/80 aria-invalid:border-error',
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
			'h-9 w-full rounded-md border border-muted/30 bg-focus/3 px-3 py-1 outline-none placeholder:text-muted/90 focus-visible:bg-focus/5 focus-visible:ring-2 focus-visible:ring-focus/80 aria-invalid:border-error',
			className
		)}
		{type}
		bind:value
		{...restProps}
	/>
{/if}
