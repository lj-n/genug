<script>
	import Feather from '$lib/components/feather.svelte';
</script>

<nav
	aria-label="desktop-navigation"
	class="hidden md:flex gap-4 items-center sticky top-0 z-30 backdrop-blur bg-neutral-100/80 py-2 border-b border-neutral-400"
>
	<a href="/" class="mr-auto">
		<img src="/logo.svg" alt="genug logo" width={100} />
	</a>

	<a href="/budget" class="flex gap-1 items-center text-sm">
		<Feather name="pie-chart" />
		Budget
	</a>

	<a href="/transaction" class="flex gap-1 items-center text-sm">
		<Feather name="credit-card" />
		Transactions
	</a>

	<a href="/category" class="flex gap-1 items-center text-sm">
		<Feather name="folder" />
		Categories
	</a>

	<a href="/account" class="flex gap-1 items-center text-sm">
		<Feather name="book" />
		Accounts
	</a>

	<a href="/team" class="flex gap-1 items-center text-sm">
		<Feather name="users" />
		Teams
	</a>

	<a href="/signout" class="flex gap-1 items-center text-sm ml-auto">
		<Feather name="log-out" />
		Sign Out
	</a>
</nav>

<nav
	aria-label="mobile-navigation"
	class="md:hidden flex items-center justify-between sticky top-0 z-30 backdrop-blur bg-neutral-100/80 py-2 px-4 border-b border-neutral-400 -mx-2"
>
	<input
		id="mobile-navigation-toggle"
		type="checkbox"
		class="peer appearance-none opacity-0 fixed h-0 w-0"
	/>

	<a href="/" class="mr-auto">
		<img src="/logo.svg" alt="genug logo" width={80} />
	</a>

	<label
		for="mobile-navigation-toggle"
		aria-label="open mobile navigation"
		class="peer-checked:hidden"
	>
		<Feather name="menu" />
	</label>
	<label
		for="mobile-navigation-toggle"
		aria-label="close mobile navigation"
		class="hidden peer-checked:block"
	>
		<Feather name="x" />
	</label>

	<div
		class="absolute top-[calc(100%+1rem)] right-4 backdrop-blur bg-neutral-100/80 border border-neutral-400 shadow rounded hidden peer-checked:grid grid-cols-2 gap-4 p-4"
	>
		<a
			href="/budget"
			class="flex gap-1 items-center text-sm p-4 bg-neutral-200 border-neutral-300 border rounded"
		>
			<Feather name="pie-chart" />
			Budget
		</a>

		<a
			href="/transaction"
			class="flex gap-1 items-center text-sm p-4 bg-neutral-200 border-neutral-300 border rounded"
		>
			<Feather name="credit-card" />
			Transactions
		</a>

		<a
			href="/category"
			class="flex gap-1 items-center text-sm p-4 bg-neutral-200 border-neutral-300 border rounded"
		>
			<Feather name="folder" />
			Categories
		</a>

		<a
			href="/account"
			class="flex gap-1 items-center text-sm p-4 bg-neutral-200 border-neutral-300 border rounded"
		>
			<Feather name="book" />
			Accounts
		</a>

		<a
			href="/team"
			class="flex gap-1 items-center text-sm p-4 bg-neutral-200 border-neutral-300 border rounded"
		>
			<Feather name="users" />
			Teams
		</a>

		<a
			href="/signout"
			class="flex gap-1 items-center text-sm p-4 bg-neutral-200 border-neutral-300 border rounded"
		>
			<Feather name="log-out" />
			Sign Out
		</a>
	</div>
</nav>
