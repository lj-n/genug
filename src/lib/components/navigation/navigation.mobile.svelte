<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet';
	import { Button } from '../ui/button';
	import Feather from '../feather.svelte';
	import { ScrollArea } from '../ui/scroll-area';
	import { NavigationLink } from '.';
	import { Separator } from '../ui/separator';
	import { toggleMode } from 'mode-watcher';
	import * as Avatar from '../ui/avatar';
	import { page } from '$app/stores';

	let open = false;
</script>

<Sheet.Root bind:open>
	<Sheet.Trigger asChild let:builder>
		<Button
			builders={[builder]}
			variant="ghost"
			size="icon"
			class="w-12 md:hidden"
		>
			<Feather name="menu" class="h-6 w-6" />
			<span class="sr-only">Open navigation</span>
		</Button>
	</Sheet.Trigger>
	<Sheet.Content side="left" class='w-3/4'>
		<ScrollArea orientation="both" class="my-4 h-[calc(100vh-8rem)] pb-6 pl-2">
			<nav class="flex flex-col gap-8">
				<a href="/" class="flex items-center gap-2">
					<img src="/logo.svg" alt="genug logo" width={100} />
				</a>

				<Separator />

				<div class="flex flex-col gap-4">
					<NavigationLink href="/budget" bind:open>Budget</NavigationLink>
					<NavigationLink href="/transactions" bind:open
						>Transactions</NavigationLink
					>
					<NavigationLink href="/categories" bind:open
						>Categories</NavigationLink
					>
					<NavigationLink href="/accounts" bind:open>Accounts</NavigationLink>
					<NavigationLink href="/teams" bind:open>Teams</NavigationLink>
				</div>

				<Separator />

				<div class="flex gap-4">
					<Button
						on:click={toggleMode}
						variant="ghost"
						size="icon"
						class="w-12"
					>
						<Feather
							name="sun"
							class="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
						/>
						<Feather
							name="moon"
							class="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
						/>
						<span class="sr-only">Toggle theme</span>
					</Button>

					<Button href="/settings" on:click={() => (open = false)} variant="ghost" size="icon" class="w-9 order-3 rounded-full">
						<Avatar.Root class="h-8 w-8">
							<Avatar.Image src="/avatar?u={$page.data.user.id}" alt="Your Avatar" />
							<Avatar.Fallback>
								<Feather name="user" class="h-4 w-4" />
							</Avatar.Fallback>
						</Avatar.Root>
						<span class="sr-only">Profile Settings</span>
					</Button>

					<form action="/authenticate?/signout" method="post">
						<Button type="submit" variant="ghost" size="icon" class="w-12">
							<Feather name="log-out" class="h-4 w-4" />
							<span class="sr-only">Sign out</span>
						</Button>
					</form>
				</div>
			</nav>
		</ScrollArea>
	</Sheet.Content>
</Sheet.Root>
