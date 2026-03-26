<script lang="ts" module>
	/* eslint-disable svelte/no-navigation-without-resolve */
	import type { WithElementRef } from 'bits-ui';
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';
	import { type VariantProps, tv, cn } from 'tailwind-variants';

	export const variants = tv({
		base: 'outline-none focus-visible:ring-2 focus-visible:ring-focus/90 select-none inline-flex items-center active:translate-y-px justify-center rounded-md cursor-pointer w-fit',
		variants: {
			variant: {
				default: 'bg-neutral hover:bg-neutral-active',
				ghost: 'hover:bg-neutral',
				hint: 'text-info hover:bg-info/10',
				destructive: 'text-error hover:bg-error/10',
				link: 'text-interactive underline-offset-3 hover:underline'
			},
			size: {
				default: 'h-9 gap-1.5 px-3',
				icon: 'size-9'
			}
		},
		defaultVariants: {
			variant: 'default',
			size: 'default'
		}
	});

	export type ButtonVariant = VariantProps<typeof variants>['variant'];
	export type ButtonSize = VariantProps<typeof variants>['size'];

	export type ButtonProps = WithElementRef<HTMLButtonAttributes> &
		WithElementRef<HTMLAnchorAttributes> & {
			variant?: ButtonVariant;
			size?: ButtonSize;
		};
</script>

<script lang="ts">
	let {
		class: className,
		variant = 'default',
		size = 'default',
		ref = $bindable(null),
		type = 'button',
		href = undefined,
		disabled,
		children,
		...restProps
	}: ButtonProps = $props();
</script>

{#if href}
	<a
		bind:this={ref}
		data-slot="button"
		class={cn(variants({ variant, size }), className)}
		{href}
		aria-disabled={disabled}
		role={disabled ? 'link' : undefined}
		tabindex={disabled ? -1 : undefined}
		{...restProps}
	>
		{@render children?.()}
	</a>
{:else}
	<button
		bind:this={ref}
		data-slot="button"
		class={cn(variants({ variant, size }), className)}
		{type}
		{disabled}
		{...restProps}
	>
		{@render children?.()}
	</button>
{/if}
