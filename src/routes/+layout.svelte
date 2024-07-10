<script lang="ts">
	import '../app.css';
	import type { LayoutData } from './$types';
	import { ModeWatcher, toggleMode } from 'mode-watcher';
	import '../fonts.css';
	import { page } from '$app/stores';
	import { cn } from '$lib/utils';
	import { Button } from '$lib/components/ui/button';
	import Feather from '$lib/components/feather.svelte';
	import { Separator } from '$lib/components/ui/separator';
	import { NavigationMain, NavigationMobile } from '$lib/components/navigation';
	export let data: LayoutData;
</script>

<ModeWatcher />

<header
	class="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
>
	<div class="mx-auto flex h-12 w-full max-w-screen-2xl items-center">
		<NavigationMain user={data.user} />
		{#if data.user}
			<NavigationMobile />
		{/if}

		<div class="ml-auto md:flex gap-2 hidden">
			<Button on:click={toggleMode} variant="ghost" size="icon">
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

			{#if data.user}
				<Button href="/settings" variant="ghost" size="icon" class="w-9">
					<Feather name="user" class="h-4 w-4" />
					<span class="sr-only">Settings</span>
				</Button>

				<Button href="/signout" variant="ghost" size="icon" class="w-9">
					<Feather name="log-out" class="h-4 w-4" />
					<span class="sr-only">Sign out</span>
				</Button>
			{/if}
		</div>
	</div>
</header>

<main class="mx-auto flex w-full max-w-screen-xl flex-col">
	<slot />
</main>
