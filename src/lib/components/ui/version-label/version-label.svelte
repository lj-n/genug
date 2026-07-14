<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';

	import { version } from '$app/environment';
	import { cn } from 'tailwind-variants';

	const { class: className, ...rest }: HTMLAttributes<HTMLSpanElement> = $props();
</script>

<span {...rest} class={cn('text-xs text-muted', className)}>{version}</span>
