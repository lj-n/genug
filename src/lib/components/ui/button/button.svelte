<script lang="ts" module>
	/* eslint-disable svelte/no-navigation-without-resolve */
	import type { WithElementRef } from 'bits-ui';
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';

	import { cn, tv, type VariantProps } from 'tailwind-variants';

	export const variants = tv({
		base: 'outline-none focus-visible:ring-2 focus-visible:ring-focus/90 select-none inline-flex items-center active:translate-y-px justify-center rounded-md cursor-pointer w-fit',
		defaultVariants: {
			size: 'default',
			variant: 'default'
		},
		variants: {
			size: {
				default: 'h-9 gap-1.5 px-3',
				icon: 'size-9'
			},
			variant: {
				default: 'bg-neutral hover:bg-neutral-active',
				destructive: 'text-error hover:bg-error/10',
				ghost: 'hover:bg-neutral',
				hint: 'text-info hover:bg-info/10',
				link: 'text-interactive underline-offset-3 hover:underline'
			}
		}
	});

	export type ButtonVariant = VariantProps<typeof variants>['variant'];
	export type ButtonSize = VariantProps<typeof variants>['size'];

	export type ButtonProps = WithElementRef<HTMLAnchorAttributes> &
		WithElementRef<HTMLButtonAttributes> & {
			size?: ButtonSize;
			variant?: ButtonVariant;
		};
</script>

<script lang="ts">
	let {
		children,
		class: className,
		disabled,
		href = undefined,
		ref = $bindable(null),
		size = 'default',
		type = 'button',
		variant = 'default',
		...restProps
	}: ButtonProps = $props();
</script>

{#if href}
	<a
		bind:this={ref}
		data-slot="button"
		class={cn(variants({ size, variant }), className)}
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
		class={cn(variants({ size, variant }), className)}
		{type}
		{disabled}
		{...restProps}
	>
		{@render children?.()}
	</button>
{/if}
