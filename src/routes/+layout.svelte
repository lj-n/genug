<script lang="ts">
	import '../app.css';
	import type { LayoutData } from './$types';
	import { ModeWatcher, toggleMode } from 'mode-watcher';
	import '../fonts.css';
	import { Button } from '$lib/components/ui/button';
	import { NavigationMain, NavigationMobile } from '$lib/components/navigation';
	import * as Avatar from '$lib/components/ui/avatar';
	import { Toaster } from '$lib/components/ui/sonner';
	import LucideUserRoundCog from '~icons/lucide/user-round-cog';
	import LucideLogOut from '~icons/lucide/log-out';
	import LucideSun from '~icons/lucide/sun';
	import LucideMoon from '~icons/lucide/moon';
	import { toast } from 'svelte-sonner';

	export let data: LayoutData;
</script>

<ModeWatcher />
<Toaster />

<header
	class="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
>
	<div class="mx-auto flex h-12 w-full max-w-screen-2xl items-center">
		<NavigationMain user={data.user} />

		{#if data.user}
			<NavigationMobile />
		{/if}

		<div class="ml-auto hidden gap-4 md:flex">
			{#if data.user}
				<Button
					href="/settings"
					variant="ghost"
					size="icon"
					class="order-3 w-9"
				>
					<Avatar.Root class="h-8 w-8">
						<Avatar.Image src="/avatar?u={data.user.id}" alt="Your Avatar" />
						<Avatar.Fallback>
							<LucideUserRoundCog />
						</Avatar.Fallback>
					</Avatar.Root>
					<span class="sr-only">Profile Settings</span>
				</Button>

				<form action="/authenticate?/signout" method="post" class="order-2">
					<Button type="submit" variant="ghost" size="icon" class="w-9">
						<LucideLogOut />
						<span class="sr-only">Sign out</span>
					</Button>
				</form>
			{/if}

			<Button
				on:click={toggleMode}
				variant="ghost"
				size="icon"
				class="group order-1"
			>
				<LucideSun class="dark:hidden" />
				<LucideMoon class="hidden dark:block" />
				<span class="sr-only">Toggle theme</span>
			</Button>
		</div>
	</div>
</header>

<main class="mx-auto flex w-full max-w-screen-xl flex-col py-6 md:py-10">
	<slot />
</main>
