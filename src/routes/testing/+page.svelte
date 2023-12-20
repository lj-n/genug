<script lang="ts">
	import Button from '$lib/components/button.svelte';

	const toggleDarkMode = () => {
		document.documentElement.classList.toggle('dark');
	};
</script>

<div class="bg flex flex-wrap gap-2 h-screen p-8">
	<Button icon="key" class="btn" on:click={toggleDarkMode}>toggle dark</Button>
	<Button icon="key" class="btn btn-blue">Login</Button>
	<Button icon="key" class="btn btn-green">Login</Button>
	<Button icon="key" class="btn btn-yellow">Login</Button>
	<Button icon="key" class="btn btn-orange">Login</Button>
	<Button icon="key" class="btn btn-cyan">Login</Button>
	<Button icon="key" class="btn btn-red">Login</Button>
	<Button icon="key" class="btn btn-magenta">Login</Button>
	<Button icon="key" class="btn btn-magenta btn-sm">Login</Button>
	<Button icon="key" class="btn btn-magenta" loading={true}>Login</Button>
	<Button icon="key" class="btn btn-green" disabled>Login</Button>

	<div class="avatar">
		<img src="/avatar" alt="" />
	</div>

	<label class="input-label">
		Schönes Input
		<input type="text" class="input" />
	</label>

	<label class="input-label">
		Mit Placeholder
		<input type="text" class="input" placeholder="Hello Input" />
	</label>

	<label class="input-label">
		Select
		<select class="input">
			<option>Option 1</option>
			<option>Option 2</option>
			<option>Option 3</option>
		</select>
	</label>

	<a href="/testing" class="link">Simple Link</a>
	<a href="/testing" class="link">Simple Link</a>
	<a href="/testing" class="link">Simple Link</a>
	<a href="/testing" class="btn">As Button</a>

	<div class="info">Hier ist eine kleine Info.</div>
</div>
