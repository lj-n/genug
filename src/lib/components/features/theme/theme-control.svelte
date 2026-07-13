<script lang="ts">
	import { ToggleGroup, ToggleGroupItem } from '$lib/components/ui/toggle-group';
	import { m } from '$lib/paraglide/messages';
	import { resolveThemeClass, type Theme, THEME_COOKIE_NAME, themes } from '$lib/utils/theme';

	// Persist ~400 days so the choice survives sessions (mirrors PARAGLIDE_LOCALE).
	const COOKIE_MAX_AGE = 34_560_000;

	// Seeded from the server (which read the cookie) to avoid a hydration mismatch.
	let { theme }: { theme: Theme } = $props();

	// Reflects the server value until the user picks something this session.
	let override = $state<Theme | undefined>(undefined);
	const value = $derived(override ?? theme);

	const labels: Record<Theme, string> = {
		dark: m.settings_theme_dark(),
		light: m.settings_theme_light(),
		system: m.settings_theme_system()
	};

	function apply(next: Theme) {
		// Persist for the next server-rendered load — hooks.server.ts reads this cookie.
		// No Secure flag: self-hosters serve over plain http (ADR-0010).
		document.cookie = `${THEME_COOKIE_NAME}=${next}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax`;

		// Apply instantly via the shared resolver: null (system) removes the override.
		const themeClass = resolveThemeClass(next);
		const root = document.documentElement;
		root.classList.remove('dark', 'light');
		if (themeClass) root.classList.add(themeClass);
	}

	function onValueChange(next: string) {
		// A segmented control always keeps one selection — ignore deselection.
		if (next !== 'system' && next !== 'light' && next !== 'dark') return;
		override = next;
		apply(next);
	}
</script>

<ToggleGroup type="single" {value} {onValueChange} aria-label={m.settings_theme()}>
	{#each themes as option (option)}
		<ToggleGroupItem value={option}>{labels[option]}</ToggleGroupItem>
	{/each}
</ToggleGroup>
