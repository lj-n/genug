<script lang="ts">
	import type { tables } from '$db';

	import * as Dialog from '$lib/components/ui/dialog';
	import * as InputGroup from '$lib/components/ui/input-group';
	import { debounce } from '$lib/utils/debounce';
	import { slide } from 'svelte/transition';
	import CheckFatIcon from '~icons/ph/check-fat';
	import CircleNotchIcon from '~icons/ph/circle-notch';
	import MagnifyingGlassIcon from '~icons/ph/magnifying-glass';
	import UserCircleIcon from '~icons/ph/user-circle';
	import UserCirclePlusIcon from '~icons/ph/user-circle-plus';
	import UsersThreeIcon from '~icons/ph/users-three';

	import { Button } from '../ui/button';

	type Role = typeof tables.usersToBudgets.$inferSelect.role;

	let { budgetId, users }: { budgetId: string; users: { id: string; name: string; role: Role }[] } =
		$props();

	let searchTerm = $state('');
	let searchValue = $state('');
	let loading = $state(false);
	let found: boolean | null = $state(null);

	const update = debounce((v: string) => {
		searchTerm = v;
	}, 600);

	$effect(() => {
		update(searchValue);
	});

	async function fetchUsers(search: string) {
		if (!search.trim()) {
			found = null;
			return;
		}

		loading = true;

		try {
			const res = await fetch(
				`/api/search-users?q=${encodeURIComponent(searchTerm)}&budgetId=${budgetId}`
			);
			found = res.ok;
		} catch (error) {
			console.error('Search failed:', error);
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		fetchUsers(searchTerm);
	});
</script>

<Button variant="ghost" size="icon-lg" class="bg-muted/10 hover:bg-muted/20">
	<UsersThreeIcon class="size-5" />
</Button>

<Dialog.Root open={true}>
	<Dialog.Trigger>
		{#snippet child({ props })}
			<Button {...props} variant="ghost" size="icon-lg" class="bg-muted/10 hover:bg-muted/20">
				<UserCirclePlusIcon class="size-5" />
			</Button>
		{/snippet}
	</Dialog.Trigger>

	<Dialog.Content class="max-w-2xl">
		<Dialog.Header>
			<Dialog.Title>Wer hat Zugriff auf diesen Budgetplan?</Dialog.Title>
			<Dialog.Description class="grid gap-4">
				<div>
					Als Ersteller kannst du andere Nutzer einladen, um beim Budgetplan mitzugestalten.
				</div>
				<div class="-mx-2 rounded-lg bg-error/5 px-2 py-1 text-error">
					Wenn du eine Einladung annimmst, kannst du auf den gesamten Budgetplan und dessen
					Accounts, Kategorien, Transaktionen usw. zugreifen.
				</div>
			</Dialog.Description>
		</Dialog.Header>

		<div class="grid gap-3">
			<div class="text-sm font-medium">Nutzer mit Zugriff</div>
			<ul>
				{#each users as user (user.id)}
					<li transition:slide={{ axis: 'y', duration: 300 }} class="pb-2 last:pb-0">
						<div
							class="flex items-center gap-1.5 rounded-lg border border-muted/20 bg-surface-high p-3 shadow-sm"
						>
							<UserCircleIcon class="size-5 text-muted" />
							<div>
								{user.name}
							</div>

							{#if user.role === 'OWNER'}
								<div class="ml-auto rounded-lg bg-info/10 px-3 py-0.5 text-info">Ersteller</div>
							{/if}
						</div>
					</li>
				{/each}
			</ul>
		</div>

		<div class="grid gap-3">
			<div class="text-sm font-medium">Lade andere Nutzer ein</div>
			<div class="flex w-full items-center gap-2">
				<InputGroup.Root>
					<InputGroup.Input
						name="inviteUser"
						bind:value={searchValue}
						placeholder="Nutzernamen"
						class="w-full"
					/>
					<InputGroup.Addon>
						<MagnifyingGlassIcon />
					</InputGroup.Addon>

					<InputGroup.Addon align="inline-end" class="text-muted">
						{#if loading}
							<CircleNotchIcon class="animate-spin" />
						{:else if found === true}
							<span class="flex items-center gap-1 rounded-full bg-info/5 p-1 text-xs text-info">
								<CheckFatIcon />
								Nutzer gefunden
							</span>
						{:else if found === false}
							<span
								class="flex items-center gap-1 rounded-full bg-error/5 px-2 py-0.5 text-xs text-error"
							>
								Nutzer nicht gefunden
							</span>
						{/if}
					</InputGroup.Addon>
				</InputGroup.Root>

				<Button aria-disabled={!found}>Einladung senden</Button>
			</div>
		</div>
	</Dialog.Content>
</Dialog.Root>
