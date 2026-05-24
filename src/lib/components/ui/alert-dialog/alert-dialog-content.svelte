<script lang="ts">
	import type { ComponentProps } from 'svelte';

	import {
		AlertDialog as AlertDialogPrimitive,
		type WithoutChild,
		type WithoutChildrenOrChild
	} from 'bits-ui';
	import { cn } from 'tailwind-variants';

	import AlertDialogOverlay from './alert-dialog-overlay.svelte';
	import AlertDialogPortal from './alert-dialog-portal.svelte';

	let {
		class: className,
		portalProps,
		ref = $bindable(null),
		size = 'default',
		...restProps
	}: WithoutChild<AlertDialogPrimitive.ContentProps> & {
		portalProps?: WithoutChildrenOrChild<ComponentProps<typeof AlertDialogPortal>>;
		size?: 'default' | 'sm';
	} = $props();
</script>

<AlertDialogPortal {...portalProps}>
	<AlertDialogOverlay />
	<AlertDialogPrimitive.Content
		bind:ref
		data-slot="alert-dialog-content"
		data-size={size}
		class={cn(
			'group/alert-dialog-content fixed top-1/2 left-1/2 z-50 grid w-full -translate-x-1/2 -translate-y-1/2 gap-6 rounded-xl bg-surface p-6 text-foreground ring-1 ring-foreground/10 duration-100 outline-none data-[size=default]:max-w-xs data-[size=sm]:max-w-xs data-[size=default]:sm:max-w-lg data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95',
			className
		)}
		{...restProps}
	/>
</AlertDialogPortal>
