<script lang="ts" module>
	/* eslint-disable svelte/no-navigation-without-resolve */
	import type { WithElementRef } from 'bits-ui';
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';

	import { cn, tv, type VariantProps } from 'tailwind-variants';

	export const variants = tv({
		base: "focus-visible:border-focus hover:cursor-pointer focus-visible:ring-focus/50 aria-invalid:ring-error/20 aria-invalid:border-error rounded-md border border-transparent bg-clip-padding focus-visible:ring-2 active:not-aria-[haspopup]:translate-y-px aria-invalid:ring-2 [&_svg:not([class*='size-'])]:size-4 group/button inline-flex shrink-0 items-center justify-center whitespace-nowrap transition-all outline-none select-none aria-disabled:pointer-events-none aria-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
		defaultVariants: {
			size: 'default',
			variant: 'default'
		},
		variants: {
			size: {
				default:
					'h-9 gap-1.5 px-2.5 in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2',
				icon: 'size-9',
				'icon-lg': 'size-10',
				'icon-sm':
					'size-8 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-md',
				'icon-xs':
					"size-6 rounded-[min(var(--radius-md),8px)] in-data-[slot=button-group]:rounded-md [&_svg:not([class*='size-'])]:size-3",
				lg: 'h-10 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2',
				sm: 'h-8 gap-1 rounded-[min(var(--radius-md),10px)] px-2.5 in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5',
				xs: "h-6 gap-1 rounded-[min(var(--radius-md),8px)] px-2 text-xs in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3"
			},
			variant: {
				default: 'bg-interactive/10 text-interactive hover:bg-interactive/15',
				destructive: 'bg-error/10 text-error hover:bg-error/15',
				ghost: 'hover:bg-muted/10 hover:text-foreground',
				info: 'bg-info/10 text-info hover:bg-info/15',
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
