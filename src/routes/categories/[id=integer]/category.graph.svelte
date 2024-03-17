<script lang="ts">
	import { formatFractionToLocaleCurrency } from '$lib/components/utils';
	import type { getCategoryLastMonthStats } from '$lib/server/categories';
	import { Chart } from 'chart.js/auto';
	import { onMount } from 'svelte';

	export let stats: ReturnType<typeof getCategoryLastMonthStats>;

	let canvas: HTMLCanvasElement;

	onMount(() => {
		const chart = new Chart(canvas, {
			type: 'bar',
			options: {
				scales: {
					yAxis: {
						reverse: true,
						ticks: {
							callback(tickValue) {
								return formatFractionToLocaleCurrency(Number(tickValue));
							}
						}
					}
				},
				maintainAspectRatio: false,
				events: [],
				plugins: {
					tooltip: {
						enabled: false
					}
				}
			},
			data: {
				labels: stats.reverse().map(({ date }) => date),
				datasets: [
					{
						label: 'Transaction Sum',
						data: stats.reverse().map(({ total }) => total),
						backgroundColor: '#4385be',
						borderRadius: 2,
						yAxisID: 'yAxis'
					}
				]
			}
		});

		return () => {
			chart.destroy();
		};
	});
</script>

<div class="relative h-60 w-200 max-w-full">
	<canvas
		aria-label="Sum of transactions in the last 12 months"
		bind:this={canvas}
	/>
</div>
