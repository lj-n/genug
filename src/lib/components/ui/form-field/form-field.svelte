<script lang="ts" generics="T extends RemoteFormFieldValue">
	import type { RemoteFormField, RemoteFormFieldValue } from '@sveltejs/kit';
	import type { Snippet } from 'svelte';

	import { cn } from 'tailwind-variants';

	let {
		class: className = '',
		field,
		hideLabel = false,
		input,
		label
	}: {
		class?: string;
		field: RemoteFormField<T>;
		/** Keeps the label for assistive technology but hides it visually — for placeholder-driven fields. */
		hideLabel?: boolean;
		input: Snippet<[RemoteFormField<T>]>;
		label: string;
	} = $props();
</script>

<label class={cn('grid gap-0.5', className)}>
	<span class={hideLabel ? 'sr-only' : 'pl-1.5 text-sm font-medium tracking-tighter'}>
		{label}
	</span>

	{@render input(field)}

	{#each field.issues() as issue (issue)}
		<p class="text-sm text-error">{issue.message}</p>
	{/each}
</label>
