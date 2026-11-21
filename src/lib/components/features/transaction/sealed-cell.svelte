<script lang="ts">
	import type { Snippet } from 'svelte';

	import { cn } from 'tailwind-variants';

	/** A register cell a Checkpoint has locked: plain text, never click-to-edit. */
	let {
		children,
		class: className,
		isEditing,
		title
	}: { children: Snippet; class?: string; isEditing: boolean; title: string } = $props();
</script>

<div
	class={cn(
		'flex size-full min-w-0 items-center justify-end gap-1.5 px-2',
		isEditing ? 'text-muted' : 'cursor-not-allowed',
		className
	)}
	{title}
>
	<span class="truncate">{@render children()}</span>
</div>
