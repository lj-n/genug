<script lang="ts" generics="T extends RemoteFormFieldValue">
	import type { RemoteFormField, RemoteFormFieldValue } from '@sveltejs/kit';
	import type { Snippet } from 'svelte';

	import { cn } from 'tailwind-variants';

	let {
		class: className = '',
		field,
		input,
		label
	}: {
		class?: string;
		field: RemoteFormField<T>;
		input: Snippet<[RemoteFormField<T>]>;
		label: string;
	} = $props();
</script>

<label class={cn('grid gap-0.5', className)}>
	<span class="pl-1.5 text-sm font-medium tracking-tighter">{label}</span>

	{@render input(field)}

	{#each field.issues() as issue (issue)}
		<p class="text-sm text-error">{issue.message}</p>
	{/each}
</label>
