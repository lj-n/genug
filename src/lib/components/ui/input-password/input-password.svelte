<script lang="ts">
	import type { ComponentProps } from 'svelte';

	import { m } from '$lib/paraglide/messages';
	import EyeIcon from '~icons/ph/eye';
	import EyeClosedIcon from '~icons/ph/eye-closed';
	import KeyDuotoneIcon from '~icons/ph/key-duotone';

	import type { Input } from '../input';

	import * as InputGroup from '../input-group';

	let {
		hideKeyIcon = false,
		value = $bindable(''),
		...props
	}: Omit<ComponentProps<typeof Input>, 'files'> & { hideKeyIcon?: boolean } = $props();

	let type: 'password' | 'text' = $state('password');
</script>

<InputGroup.Root>
	<InputGroup.Input {...props} bind:value {type} />

	{#if !hideKeyIcon}
		<InputGroup.Addon>
			<KeyDuotoneIcon />
		</InputGroup.Addon>
	{/if}

	<InputGroup.Addon align="inline-end">
		<InputGroup.Button
			onclick={() => (type = type === 'password' ? 'text' : 'password')}
			class="size-6 p-0 text-foreground [&_svg:not([class*='size-'])]:size-4"
		>
			{#if type === 'password'}
				<EyeClosedIcon />
				<span class="sr-only">{m.login_hide_password()}</span>
			{:else}
				<EyeIcon />
				<span class="sr-only">{m.login_show_password()}</span>
			{/if}
		</InputGroup.Button>
	</InputGroup.Addon>
</InputGroup.Root>
