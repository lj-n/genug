<script lang="ts">
	import { onMount } from 'svelte';
	// import Button from '$lib/components/button.svelte';
	// import Currency from '$lib/components/currency.svelte';

	import type { PageData } from './$types';

	import Chart from 'chart.js/auto';
	import colors from 'tailwindcss/colors';

	export let data: PageData;

	let container: HTMLCanvasElement;

	onMount(() => {
		const chart = new Chart(container, {
			type: 'bar',
			options: {
				events: [],
				plugins: {
					tooltip: {
						enabled: false
					}
				}
			},
			data: {
				labels: data.dingens.map(({ name }) => name),
				datasets: [
					{
						label: 'Transaction Sum',
						data: data.dingens.map(({ sum }) => sum),
						backgroundColor: colors.indigo['400'],
						borderRadius: 2
					}
				]
			}
		});

		return () => {
			chart.destroy();
		};
	});
</script>

<div class="h-60">
	<canvas bind:this={container} />
</div>

<!-- <pre>{JSON.stringify(data, null, 2)}</pre> -->

<!-- <div class="grid grid-cols-2 gap-4 p-4">
	<label class="input-label">
		text
		<input type="text" class="input" />
	</label>

	<label class="input-label">
		date
		<input type="date" class="input" />
	</label>

	<label class="input-label">
		number
		<input type="number" class="input" />
	</label>

	<Currency name="currency" class="input-label">currency</Currency>

	<label class="input-label">
		select
		<select class="input">
			<option value="1">First</option>
			<option value="2">Second</option>
			<option value="3">Third</option>
		</select>
	</label>

	<label class="checkbox-label">
		checkbox
		<input type="checkbox" />
	</label>

	<Button class="btn btn-primary">Primary</Button>
	<Button class="btn btn-primary" disabled>Disabled</Button>

	<Button class="btn btn-secondary">Secondary</Button>
	<Button class="btn btn-secondary" disabled>Disabled</Button>
	
  <Button class="btn btn-ghost">Ghost</Button>
  <Button class="btn btn-ghost" disabled>Disabled</Button>
	
  <Button class="btn btn-danger">Danger</Button>
  <Button class="btn btn-danger" disabled>Disabled</Button>

	<Button icon="feather" class="btn">With Icon</Button>

	<Button loading={true} class="btn">Loading</Button>

  <a href="/" class="btn">Link as Button</a>
</div> -->
