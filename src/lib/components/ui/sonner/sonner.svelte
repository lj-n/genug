<script lang="ts">
	import {
		Toaster as Sonner,
		type ToasterProps as SonnerProps
	} from 'svelte-sonner';
	import { mode } from 'mode-watcher';

	import LucideCheckCheck from '~icons/lucide/check-check';
	import LucideOctagonAlert from '~icons/lucide/octagon-alert';
	import LucideMessageCircle from '~icons/lucide/message-circle';

	type $$Props = SonnerProps;
</script>

<Sonner
	theme={$mode}
	class="toaster group"
	expand
	toastOptions={{
		classes: {
			title: 'font-normal',
			toast:
				'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
			description: 'group-[.toast]:text-muted-foreground',
			actionButton:
				'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
			cancelButton:
				'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground'
		}
	}}
	{...$$restProps}
>
	<LucideCheckCheck slot="success-icon" />
	<LucideOctagonAlert slot="error-icon" />
	<LucideMessageCircle slot="info-icon" />
</Sonner>
