<script lang="ts">
	import Feather from '$lib/components/feather.svelte';
	import { onMount } from 'svelte';

	let mobileNavigation: HTMLElement;

	onMount(() => {
		const links = mobileNavigation.querySelectorAll('a');
		const toggle = mobileNavigation.querySelector<HTMLInputElement>('input');

		const closeMobileNavigation = () => {
			if (!toggle) return;
			toggle.checked = false;
		};

		links.forEach((link) => {
			link.addEventListener('click', closeMobileNavigation);
		});

		return () => {
			links.forEach((link) => {
				link.removeEventListener('click', closeMobileNavigation);
			});
		};
	});
</script>

<nav
	aria-label="Desktop-Navigation"
	class="hidden md:flex gap-2 items-center backdrop-blur-md bg-base-white/80 py-2 sticky top-0 z-30 border-b border-ui-normal dark:(bg-base-black/80 border-ui-normal-dark)"
>
	<a href="/" class="mr-auto">
		<img src="/logo.svg" alt="genug logo" width={100} />
	</a>

	<a href="/budget" class="link"> Budget </a> |

	<a href="/transaction" class="link"> Transactions </a> |

	<a href="/category" class="link"> Categories </a> |

	<a href="/account" class="link"> Accounts </a>

	<div class="avatar ml-auto w-12">
		<img src="/avatar" alt="user-avatar" />
	</div>

	<a href="/settings" title="User Settings" class="btn btn-sm">
		<Feather name="settings" />
	</a>

	<a href="/signout" title="Sign out" class="btn btn-sm">
		<Feather name="log-out" />
	</a>
</nav>

<nav
	aria-label="Mobile-Navigation"
	class="flex md:hidden sticky top-0 z-30 justify-between items-center border-b border-ui-normal fg px-2 py-4 -mx-2"
	bind:this={mobileNavigation}
>
	<input id="nav-toggle" type="checkbox" class="peer opacity-0 fixed h-0 w-0" />

	<a href="/" class="mr-auto">
		<img src="/logo.svg" alt="genug logo" width={80} />
	</a>

	<label
		for="nav-toggle"
		aria-label="Open Mobile Navigation"
		class="peer-checked:hidden"
	>
		<Feather name="menu" />
	</label>

	<label
		for="nav-toggle"
		aria-label="Close Mobile Navigation"
		class="hidden peer-checked:block"
	>
		<Feather name="x" />
	</label>

	<div
		class="hidden peer-checked:flex flex-col absolute top-full w-full left-0 right-0 fg border border-ui-normal rounded-b p-4 gap-8 items-end"
	>
		<a href="/budget"> Budget </a>

		<a href="/transaction"> Transactions </a>

		<a href="/category"> Categories </a>

		<a href="/account"> Accounts </a>

		<a href="/settings"> Settings </a>

		<a href="/signout"> Sign Out </a>
	</div>
</nav>
