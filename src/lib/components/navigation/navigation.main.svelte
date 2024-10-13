<script lang="ts">
	import type { User } from 'lucia';
	import { NavigationLink } from '.';
	import * as Command from '$lib/components/ui/command';
	import { hotKeyAction } from 'svelte-legos';
	import { goto } from '$app/navigation';

	export let user: User | null;

	let open = false;
</script>

<svelte:document
	use:hotKeyAction={{
		ctrl: true,
		code: 'KeyJ',
		cb() {
			open = !open;
		}
	}}
/>

<nav class="hidden items-center gap-6 text-sm md:flex">
	<a href="/" class="">
		<img src="/logo.svg" alt="genug logo" width={86} />
	</a>

	{#if user}
		<NavigationLink href="/budget">Budget</NavigationLink>
		<NavigationLink href="/transactions">Transactions</NavigationLink>
		<NavigationLink href="/accounts">Accounts</NavigationLink>
		<NavigationLink href="/teams">Teams</NavigationLink>

		<Command.Dialog bind:open>
			<Command.Input placeholder="Type a command or search..." />
			<Command.List>
				<Command.Empty>No results found.</Command.Empty>
				<Command.Group>
					<Command.Item
						onSelect={() => {
							open = false;
							goto('/budget');
						}}
					>
						Budget
					</Command.Item>
					<Command.Item
						onSelect={() => {
							open = false;
							goto('/transactions');
						}}
					>
						Transactions
					</Command.Item>
					<Command.Item
						onSelect={() => {
							open = false;
							goto('/accounts');
						}}
					>
						Accounts
					</Command.Item>
					<Command.Item
						onSelect={() => {
							open = false;
							goto('/teams');
						}}
					>
						Teams
					</Command.Item>
				</Command.Group>
			</Command.List>
		</Command.Dialog>
	{/if}
</nav>
