<script lang="ts">
	import type { Snippet } from 'svelte';

	import * as Dialog from '$lib/components/ui/dialog';
	import * as Drawer from '$lib/components/ui/drawer';

	import { DESKTOP_QUERY, setResponsiveModalContext } from './context';
	import { MediaQuery } from './media-query.svelte';

	let {
		children,
		dismissible = true,
		onOpenChangeComplete,
		open = $bindable(false)
	}: {
		children?: Snippet;
		/**
		 * When `false`, interacting outside the modal does not close it — the Dialog
		 * variant ignores outside clicks, the Drawer variant is non-dismissible.
		 */
		dismissible?: boolean;
		/**
		 * Fires after the open/close transition finishes, with the resulting open
		 * state. Bridges bits-ui `onOpenChangeComplete` and vaul `onAnimationEnd`.
		 */
		onOpenChangeComplete?: (open: boolean) => void;
		open?: boolean;
	} = $props();

	const media = new MediaQuery(DESKTOP_QUERY, true);

	// The chrome variant is frozen for the lifetime of an open modal: while
	// `open`, we stop tracking the media query so crossing the 640px breakpoint
	// mid-edit doesn't flip the `{#if}` and remount the slotted content (which
	// would discard component-local form state — #363). While closed, we keep
	// syncing so the next open picks the correct variant for the viewport.
	let isDesktop = $state(media.matches);
	$effect(() => {
		if (!open) isDesktop = media.matches;
	});

	setResponsiveModalContext({
		close() {
			open = false;
		},
		get dismissible() {
			return dismissible;
		},
		get isDesktop() {
			return isDesktop;
		}
	});
</script>

{#if isDesktop}
	<Dialog.Root bind:open {onOpenChangeComplete}>
		{@render children?.()}
	</Dialog.Root>
{:else}
	<Drawer.Root bind:open {dismissible} direction="bottom" onAnimationEnd={onOpenChangeComplete}>
		{@render children?.()}
	</Drawer.Root>
{/if}
