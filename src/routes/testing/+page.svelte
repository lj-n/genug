<script lang="ts">
	import Button from '$lib/components/button.svelte';
	import { currencyInputProps } from '$lib/components/utils';

	import type { PageData } from './$types';

	export let data: PageData;

	let value = 455;
</script>

<span>Value: {value}</span>

<form action="/testing">
	<label class="input-label">
		<input type="text" name="flow" class="input" {...currencyInputProps} />
	</label>

	<button type="submit">subm</button>
</form>

<!-- <pre>{JSON.stringify(data, null, 2)}</pre> -->

<!-- <div class="grid grid-cols-2 gap-4 p-4 max-w-xl rounded-lg bg-bg-2">
	<label class="input-label">
		text
		<input type="text" class="input" placeholder="Blabla blub"/>
	</label>

	<label class="input-label">
		date
		<input type="date" class="input" placeholder="Blabla blub"/>
	</label>

	<label class="input-label">
		number
		<input type="number" class="input" placeholder="Blabla blub"/>
	</label>

	<label class="input-label">
		select
		<select class="input">
			<option value="1">First</option>
			<option value="2">Second</option>
			<option value="3">Third</option>
		</select>
	</label>

  <label class="input-label">
		disabled
		<input type="text" class="input" disabled placeholder="Blabla blub"/>
	</label>

	<Button class="btn btn-blue">Blue</Button>
  
	<Button class="btn btn-green">Green</Button>
  
	<Button class="btn btn-red">Red</Button>
  
	<Button class="btn btn-ghost">Ghost</Button>

	<Button class="btn btn-blue" disabled>Disabled</Button>

	<Button icon="feather" class="btn btn-ghost">With Icon</Button>

	<Button loading={true} class="btn">Loading</Button>

	<Button class="btn btn-ghost btn-sm m-auto">Small</Button>
	<Button class="btn btn-ghost btn-xs m-auto">smaller</Button>

	<a href="/" class="btn btn-ghost">Link as Button</a>
</div> -->
