<script lang="ts">
	import type { Snippet } from 'svelte';

	import { Label } from '$lib/components/ui/label';

	/** A sheet field a Checkpoint has locked: a read-only box instead of an input. */
	let {
		children,
		class: className,
		label,
		title
	}: { children: Snippet; class?: string; label: string; title: string } = $props();
</script>

<div class="grid gap-1.5">
	<Label>{label}</Label>
	<div
		class="flex h-11 cursor-not-allowed items-center gap-2 rounded-sm border border-muted/10 bg-muted/5 px-3 text-muted"
		{title}
	>
		<span class={className}>{@render children()}</span>
	</div>
</div>
