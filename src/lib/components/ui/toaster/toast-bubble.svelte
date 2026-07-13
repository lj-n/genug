<script lang="ts" module>
	import { tv } from 'tailwind-variants';

	const variants = tv({
		slots: {
			bubble:
				'flex cursor-pointer items-center gap-1.5 rounded-md bg-surface-high px-3 py-1.5 text-sm font-medium shadow-md ring-1 ring-foreground/10 outline-none select-none transition-colors duration-150',
			tail: 'absolute -z-10 size-2 rotate-45 bg-surface-high ring-1 ring-foreground/10'
		},
		variants: {
			variant: {
				error: { bubble: 'text-error' },
				success: { bubble: 'text-success' }
			}
		}
	});

	const TRANSFORM_ORIGIN = {
		bottom: 'top center',
		left: 'center right',
		right: 'center left',
		top: 'bottom center'
	} as const;

	const TAIL_SIDE = { bottom: 'top', left: 'right', right: 'left', top: 'bottom' } as const;
</script>

<script lang="ts">
	import type { AnchoredToastItem } from '$lib/utils/anchored-toast.svelte';
	import type { Attachment } from 'svelte/attachments';

	import { browser } from '$app/environment';
	import { arrow, autoUpdate, computePosition, flip, offset, shift } from '@floating-ui/dom';
	import { backOut } from 'svelte/easing';
	import CheckCircleDuotoneIcon from '~icons/ph/check-circle-duotone';
	import WarningCircleDuotoneIcon from '~icons/ph/warning-circle-duotone';

	let { toast }: { toast: AnchoredToastItem } = $props();

	let tailEl = $state<HTMLElement | null>(null);

	const classes = $derived(variants({ variant: toast.variant }));

	const reducedMotion = browser
		? window.matchMedia('(prefers-reduced-motion: reduce)').matches
		: false;

	function pop(_node: Element) {
		if (reducedMotion) {
			return { css: (t: number) => `opacity: ${t}`, duration: 150 };
		}
		// backOut eases t past 1, giving the scale a small overshoot on entry.
		return {
			css: (t: number) => `opacity: ${Math.min(t, 1)}; scale: ${0.9 + 0.1 * t}`,
			duration: 200,
			easing: backOut
		};
	}

	// Rebuilt whenever the origin changes (live element → frozen rect), so a
	// toast whose anchor unmounted finishes its life at the captured position.
	const position =
		(anchor: HTMLElement | null, frozenRect: DOMRect | null): Attachment<HTMLElement> =>
		(bubble) => {
			const reference = anchor ?? {
				getBoundingClientRect: () =>
					frozenRect ?? new DOMRect(window.innerWidth - 16, window.innerHeight - 16, 0, 0)
			};

			const update = async () => {
				const { middlewareData, placement, x, y } = await computePosition(reference, bubble, {
					middleware: [
						offset(8),
						flip(),
						shift({ padding: 8 }),
						...(tailEl ? [arrow({ element: tailEl, padding: 6 })] : [])
					],
					placement: toast.placement,
					strategy: 'fixed'
				});

				const side = placement.split('-')[0] as keyof typeof TRANSFORM_ORIGIN;
				bubble.style.left = `${x}px`;
				bubble.style.top = `${y}px`;
				bubble.style.transformOrigin = TRANSFORM_ORIGIN[side];
				// Positioning is async — reveal only once the first coordinates
				// are in, so the bubble never flashes at the viewport origin.
				bubble.style.visibility = 'visible';

				if (tailEl && middlewareData.arrow) {
					const { x: tailX, y: tailY } = middlewareData.arrow;
					Object.assign(tailEl.style, {
						bottom: '',
						left: tailX != null ? `${tailX}px` : '',
						right: '',
						[TAIL_SIDE[side]]: '-4px',
						top: tailY != null ? `${tailY}px` : ''
					});
				}
			};

			if (anchor) return autoUpdate(anchor, bubble, update);
			void update();
		};
</script>

<div
	{@attach position(toast.anchor, toast.frozenRect)}
	class="pointer-events-auto invisible fixed top-0 left-0 z-60 w-max"
	role={toast.variant === 'error' ? 'alert' : 'status'}
	aria-live={toast.variant === 'error' ? 'assertive' : 'polite'}
	aria-atomic="true"
	transition:pop
>
	<button
		type="button"
		class={classes.bubble()}
		onclick={toast.dismiss}
		onmouseenter={toast.pause}
		onmouseleave={toast.resume}
		onfocusin={toast.pause}
		onfocusout={toast.resume}
	>
		{#if toast.variant === 'success'}
			<CheckCircleDuotoneIcon />
		{:else}
			<WarningCircleDuotoneIcon />
		{/if}
		<span>{toast.message}</span>
	</button>

	{#if toast.anchor || toast.frozenRect}
		<div bind:this={tailEl} class={classes.tail()}></div>
	{/if}
</div>
