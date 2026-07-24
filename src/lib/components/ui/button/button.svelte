<script lang="ts" module>
	/* eslint-disable svelte/no-navigation-without-resolve */
	import type { WithElementRef } from 'bits-ui';
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';

	import { cn, tv, type VariantProps } from 'tailwind-variants';

	import { hoverOutline, invalidRing } from '../focus-ring';

	export const variants = tv({
		base: [
			"hover:cursor-pointer aria-invalid:border-error rounded-md border border-transparent bg-clip-padding active:not-aria-[haspopup]:translate-y-px [&_svg:not([class*='size-'])]:size-4 group/button inline-flex shrink-0 items-center justify-center text-sm font-medium whitespace-nowrap transition-all outline-none select-none disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
			invalidRing
		],
		defaultVariants: {
			size: 'default',
			variant: 'default'
		},
		variants: {
			size: {
				default:
					'h-9 gap-1.5 px-2.5 in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 w-fit',
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
				default: ['bg-interactive/10 text-interactive', hoverOutline],
				destructive: ['bg-error/10 text-error', hoverOutline],
				ghost: ['hover:bg-muted/10 hover:text-foreground', hoverOutline],
				info: ['bg-info/10 text-info', hoverOutline],
				link: 'text-interactive underline-offset-3 hover:underline',
				success: ['bg-success/10 text-success', hoverOutline]
			}
		}
	});

	export type ButtonVariant = VariantProps<typeof variants>['variant'];
	export type ButtonSize = VariantProps<typeof variants>['size'];

	export type ButtonProps = WithElementRef<HTMLAnchorAttributes> &
		WithElementRef<HTMLButtonAttributes> & {
			/** In-flight submit state: disables the button and, for slow requests, overlays a spinner. */
			loading?: boolean;
			size?: ButtonSize;
			variant?: ButtonVariant;
		};

	/** Spinner appears only when the request is still in flight after this delay — fast submits render none. */
	const SPINNER_DELAY_MS = 200;
	/** Once shown, the spinner stays at least this long so it never flashes. */
	const SPINNER_MIN_VISIBLE_MS = 250;
</script>

<script lang="ts">
	import CircleNotchIcon from '~icons/ph/circle-notch';

	let {
		children,
		class: className,
		disabled,
		href = undefined,
		loading = false,
		ref = $bindable(null),
		size = 'default',
		type = 'button',
		variant = 'default',
		...restProps
	}: ButtonProps = $props();

	let spinnerVisible = $state(false);
	// Deliberately non-reactive: only the timer callbacks and the effect below
	// consult it, and making it reactive would re-run the effect on expiry.
	let minVisibleElapsed = true;

	// Timer-driven visibility cannot be derived; this is the imperative escape
	// hatch the delay gate needs (see docs/dev/code-style.md on $effect).
	$effect(() => {
		if (!loading) {
			if (minVisibleElapsed) spinnerVisible = false;
			// Otherwise the min-visible timer below hides it once it expires.
			return;
		}
		const delay = setTimeout(() => {
			spinnerVisible = true;
			minVisibleElapsed = false;
			setTimeout(() => {
				minVisibleElapsed = true;
				if (!loading) spinnerVisible = false;
			}, SPINNER_MIN_VISIBLE_MS);
		}, SPINNER_DELAY_MS);
		return () => clearTimeout(delay);
	});
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
		class={cn(variants({ size, variant }), spinnerVisible && 'relative', className)}
		{type}
		disabled={disabled || loading}
		aria-busy={loading ? true : undefined}
		{...restProps}
	>
		{#if spinnerVisible}
			<span
				data-slot="button-spinner"
				class="absolute inset-0 grid place-items-center"
				aria-hidden="true"
			>
				<CircleNotchIcon class="animate-spin" />
			</span>
		{/if}
		<!-- `contents` keeps children direct flex items; `invisible` inherits onto
		     them so the label holds the button's size under the spinner. -->
		<span class={cn('contents', spinnerVisible && 'invisible')}>
			{@render children?.()}
		</span>
	</button>
{/if}
