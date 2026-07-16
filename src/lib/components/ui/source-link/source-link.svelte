<script lang="ts">
	/* eslint-disable svelte/no-navigation-without-resolve -- external URL, resolve() does not apply */
	import type { HTMLAnchorAttributes } from 'svelte/elements';

	import { SOURCE_REPOSITORY_URL } from '$lib/constants';
	import { m } from '$lib/paraglide/messages';
	import { cn } from 'tailwind-variants';

	const { class: className, ...rest }: HTMLAnchorAttributes = $props();
</script>

<!-- AGPL §13: every surface of a running instance offers the Corresponding Source. -->
<a
	{...rest}
	href={SOURCE_REPOSITORY_URL}
	target="_blank"
	rel="noopener noreferrer"
	class={cn('text-xs text-muted underline-offset-2 hover:underline', className)}
>
	{m.source_code_link()}
</a>
