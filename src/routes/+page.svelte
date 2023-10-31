<script lang="ts">
	import Feather from '$lib/components/feather.svelte';
	import type { PageData } from './$types';
	export let data: PageData;
</script>

<main class="flex flex-col">
	<h1 class="text-6xl my-12 font-bold mx-auto">Welcome, {data.user?.name}!</h1>

	<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
		<a
			href="/budget"
			class="sm:col-span-2 group relative border border-neutral shadow-md focus:border-info hover:border-info px-8 py-12 rounded-md transition-all hover:translate-x-1 hover:-translate-y-1 hover:bg-neutral-focus"
		>
			<div class="flex gap-6 items-center">
				<div class="flex mask mask-squircle bg-info p-4">
					<Feather name="sliders" class="text-2xl text-info-content" />
				</div>
				<div>
					<h2 class="font-bold text-2xl">Budget</h2>
					<p>Set and manage your financial plans, track spending.</p>
				</div>
				<div
					class="opacity-0 group-focus:opacity-100 group-hover:opacity-100 transition-opacity absolute bottom-4 right-4"
				>
					<Feather name="corner-right-up" />
				</div>
			</div>
		</a>

		<a
			href="/transaction"
			class="group relative border border-neutral shadow-md focus:border-primary hover:border-primary px-8 py-12 rounded-md transition-all hover:translate-x-1 hover:-translate-y-1 hover:bg-neutral-focus"
		>
			<div class="flex gap-6 items-center">
				<div class="flex mask mask-squircle bg-primary p-4">
					<Feather name="credit-card" class="text-2xl text-primary-content" />
				</div>
				<div>
					<h2 class="font-bold text-2xl">Transactions</h2>
					<p class="text-neutral-content">
						Organize your transactions, for a clear overview of your financial
						history.
					</p>
				</div>
				<div
					class="opacity-0 group-focus:opacity-100 group-hover:opacity-100 transition-opacity absolute bottom-4 right-4"
				>
					<Feather name="corner-right-up" />
				</div>
			</div>
		</a>

		<a
			href="/category"
			class="group relative border border-neutral shadow-md focus:border-secondary hover:border-secondary px-8 py-12 rounded-md transition-all hover:translate-x-1 hover:-translate-y-1 hover:bg-neutral-focus"
		>
			<div class="flex gap-6 items-center">
				<div class="flex mask mask-squircle bg-secondary p-4">
					<Feather name="folder" class="text-2xl text-secondary-content" />
				</div>
				<div>
					<h2 class="font-bold text-2xl">Categories</h2>
					<p class="text-neutral-content">
						Categorize transactions and set goals.
					</p>
				</div>
				<div
					class="opacity-0 group-focus:opacity-100 group-hover:opacity-100 transition-opacity absolute bottom-4 right-4"
				>
					<Feather name="corner-right-up" />
				</div>
			</div>
		</a>

		<a
			href="/account"
			class="group relative border border-neutral shadow-md focus:border-secondary hover:border-secondary px-8 py-12 rounded-md transition-all hover:translate-x-1 hover:-translate-y-1 hover:bg-neutral-focus"
		>
			<div class="flex gap-6 items-center">
				<div class="flex mask mask-squircle bg-secondary p-4">
					<Feather name="layers" class="text-2xl text-secondary-content" />
				</div>
				<div>
					<h2 class="font-bold text-2xl">Accounts</h2>
					<p class="text-neutral-content">
						Manage your bank accounts and monitor balances.
					</p>
				</div>
				<div
					class="opacity-0 group-focus:opacity-100 group-hover:opacity-100 transition-opacity absolute bottom-4 right-4"
				>
					<Feather name="corner-right-up" />
				</div>
			</div>
		</a>

		<a
			href="/team"
			class="group relative border border-neutral shadow-md focus:border-accent hover:border-accent px-8 py-12 rounded-md transition-all hover:translate-x-1 hover:-translate-y-1 hover:bg-neutral-focus"
		>
			<div class="flex gap-6 items-center">
				<div class="flex mask mask-squircle bg-accent p-4">
					<Feather name="users" class="text-2xl text-accent-content" />
				</div>
				<div>
					<h2 class="font-bold text-2xl">Teams</h2>
					<p class="text-neutral-content">
						Collaborate seamlessly on financial management.
					</p>
				</div>
				<div
					class="opacity-0 group-focus:opacity-100 group-hover:opacity-100 transition-opacity absolute bottom-4 right-4"
				>
					<Feather name="corner-right-up" />
				</div>
			</div>
		</a>
	</div>
</main>
