<script lang="ts">
	import { page } from '$app/stores';
	import Feather from '$lib/components/feather.svelte';
	import { NavigationLink } from '$lib/components/navigation';
	import * as Avatar from '$lib/components/ui/avatar';
	import { Button } from '$lib/components/ui/button';

	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import { Separator } from '$lib/components/ui/separator';
	import { toggleMode } from 'mode-watcher';
	import type { PageData } from './$types';

	export const data: PageData = { user: $page.data.user };
</script>

<ScrollArea orientation="both" class="my-4 h-[calc(100vh-8rem)] pb-6 pl-2">
	<nav class="flex flex-col gap-8">
		<a href="/" class="flex items-center gap-2">
			<img src="/logo.svg" alt="genug logo" width={100} />
		</a>

		<Separator />

		<div class="flex flex-col gap-4">
			<NavigationLink href="/budget">Budget</NavigationLink>
			<NavigationLink href="/transactions">Transactions</NavigationLink>
			<NavigationLink href="/categories">Categories</NavigationLink>
			<NavigationLink href="/accounts">Accounts</NavigationLink>
			<NavigationLink href="/teams">Teams</NavigationLink>
		</div>

		<Separator />

		<div class="flex gap-4">
			<Button on:click={toggleMode} variant="ghost" size="icon" class="w-12">
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

			<Button
				href="/settings"
				variant="ghost"
				size="icon"
				class="order-3 w-9 rounded-full"
			>
				<Avatar.Root class="h-8 w-8">
					<Avatar.Image
						src="/avatar?u={$page.data.user.id}"
						alt="Your Avatar"
					/>
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
