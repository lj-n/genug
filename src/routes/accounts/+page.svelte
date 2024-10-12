<script lang="ts">
	import { createShallowRoute } from '$lib/shallow.routing';
	import type { PageData } from './$types';
	import AccountList from './accounts.list.svelte';

	import LucideFileSpreadsheet from '~icons/lucide/file-spreadsheet';
	import ShallowRouteModal from '$lib/components/navigation/shallow.route.modal.svelte';
	import CreateAccountPage from './create/+page.svelte';
	import type { PageData as CreateAccountPageData } from './create/$types';
	import { buttonVariants } from '$lib/components/ui/button';
	import { page } from '$app/stores';

	export let data: PageData;

	const [action, createPageData, isOpen] =
		createShallowRoute<CreateAccountPageData>();
</script>

<svelte:head>
	<title>Accounts</title>
</svelte:head>

<h1
	class="mx-auto mb-6 scroll-m-20 text-2xl font-bold tracking-tight lg:text-3xl"
>
	Accounts
</h1>

<a
	href="/accounts/create"
	class={buttonVariants({ class: 'mx-auto mb-4' })}
	use:action={$page.url}
>
	<LucideFileSpreadsheet class="mr-2" />
	Create New Account
</a>

<ShallowRouteModal close={() => history.back()} open={$isOpen}>
	{#if $createPageData}
		<CreateAccountPage data={$createPageData} />
	{/if}
</ShallowRouteModal>

<AccountList accounts={data.accounts} onDrop={(items) => console.log(items)} />
