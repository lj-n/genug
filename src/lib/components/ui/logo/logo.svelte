<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';

	import logo from '$lib/assets/favicon.svg';
	import { SourceLink } from '$lib/components/ui/source-link';
	import { VersionLabel } from '$lib/components/ui/version-label';
	import { cn } from 'tailwind-variants';

	type Props = HTMLAttributes<HTMLSpanElement> & {
		href?: string;
	};

	const { class: className, href, ...rest }: Props = $props();
</script>

<span {...rest} class={cn('inline-flex items-center gap-[0.5em] text-4xl', className)}>
	<img src={logo} alt="Logo" class="size-[1.5em] [image-rendering:pixelated]" />

	{#if href}
		<span class="flex flex-col items-start gap-1.5">
			<!-- eslint-disable svelte/no-navigation-without-resolve -- href is passed pre-resolved by callers -->
			<a
				{href}
				class="font-slab leading-none font-bold text-success underline-offset-4 hover:underline"
			>
				genug
			</a>
			<!-- eslint-enable svelte/no-navigation-without-resolve -->
			<span class="flex items-center gap-1">
				<VersionLabel class="font-serif font-semibold" />
				<span class="text-xs text-muted" aria-hidden="true">·</span>
				<SourceLink class="font-serif font-semibold" />
			</span>
		</span>
	{:else}
		<span class="font-slab leading-none font-bold text-success">genug</span>
	{/if}
</span>
