<script lang="ts">
	import Feather from '$lib/components/feather.svelte';
</script>

<nav aria-label="Desktop-Navigation" class="navigation-desktop">
	<a href="/" class="mr">
		<img src="/logo.svg" alt="genug logo" width={100} />
	</a>

	<a href="/budget"> Budget </a> |

	<a href="/transaction"> Transactions </a> |

	<a href="/category"> Categories </a> |

	<a href="/account"> Accounts </a>

	<div class="avatar ml">
		<img src="/avatar" alt="user-avatar" />
	</div>

	<div class="action-buttons">
		<a href="/settings" title="User Settings">
			<Feather name="settings" />
		</a>

		<a href="/signout" title="Sign out">
			<Feather name="log-out" />
		</a>
	</div>
</nav>

<nav aria-label="Mobile-Navigation" class="navigation-mobile">
	<input
		id="nav-toggle"
		type="checkbox"
		class="peer appearance-none opacity-0 fixed h-0 w-0"
	/>

	<a href="/" class="mr">
		<img src="/logo.svg" alt="genug logo" width={80} />
	</a>

	<label for="nav-toggle" aria-label="Open Mobile Navigation">
		<Feather name="menu" />
	</label>

	<label for="nav-toggle" aria-label="Close Mobile Navigation">
		<Feather name="x" />
	</label>

	<div class="navigation-mobile-content">
		<a href="/budget"> Budget </a>

		<a href="/transaction"> Transactions </a>

		<a href="/category"> Categories </a>

		<a href="/account"> Accounts </a>

		<a href="/settings"> Settings </a>

		<a href="/signout"> Sign Out </a>
	</div>
</nav>

<style>
	

	.navigation-desktop {
		display: none;
		gap: 1rem;
		align-items: center;
		background-color: var(--background-color);
		padding: 0.5rem 0;
	}
	.navigation-desktop .avatar {
		width: 3rem;
	}
	.navigation-desktop .action-buttons {
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: var(--spacing-xs);
	}
	.navigation-desktop .action-buttons a:hover {
		color: var(--cyan-color);
	}

	.navigation-mobile {
		position: sticky;
		top: 0;
		z-index: 30;
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem 1rem;
		border-bottom: 1px solid var(--ui-normal-color);
		background-color: var(--foreground-color);
		margin: 0 -0.5rem;
	}
	#nav-toggle {
		opacity: 0;
		position: fixed;
		height: 0;
		width: 0;
	}

	/* hide burger icon when mobile nav is open */
	#nav-toggle:checked ~ label[aria-label='Open Mobile Navigation'] {
		display: none;
	}

	label[aria-label='Close Mobile Navigation'] {
		display: none;
	}
	/* display x icon when mobile nav is open */
	#nav-toggle:checked ~ label[aria-label='Close Mobile Navigation'] {
		display: block;
	}

	.navigation-mobile-content {
		display: none;
		flex-direction: column;
		position: absolute;
		top: 100%;
		width: 100%;
		left: 0;
		right: 0;
		background: var(--foreground-color);
		border: 1px solid var(--ui-normal-color);
		border-bottom-left-radius: var(--radius-default);
		border-bottom-right-radius: var(--radius-default);
		padding: var(--spacing-base);
		gap: var(--spacing-sm);
		align-items: flex-end;
	}

	#nav-toggle:checked ~ .navigation-mobile-content {
		display: flex;
	}

  @media (min-width: 768px) {
		.navigation-desktop {
			display: flex;
		}
		.navigation-mobile {
			display: none;
		}
	}
</style>
