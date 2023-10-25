<script lang="ts">
	let className: string;
	export { className as class };

	let input: HTMLInputElement;

	export let name: string;
	export let disabled = false;
	export let value = 0;

	$: displayValue = numberToFloatString(value);

	const numberToFloatString = (n: number) => (n / 100).toFixed(2);

	const handleKeyPress = (ev: KeyboardEvent) => {
		if (ev.key === '-') return;
		if (isNaN(Number(ev.key))) {
			ev.preventDefault();
		}
	};

	const format = (ev: Event) => {
		const element = ev.currentTarget;
		if (!(element instanceof HTMLInputElement) || !element.value) {
			return;
		}

		/** replace all non digits except hyphen in the beginning (for negative numbers)*/
		let tempValue = element.value.replace(/(?!^-)[^0-9]/g, '');
		if (tempValue.length === 0) {
			return;
		}

		const tempValueNumber = +tempValue;

		displayValue = numberToFloatString(tempValueNumber);
		value = tempValueNumber;
	};
</script>

<input type="hidden" {name} bind:value />
<input
	class={className}
	type="text"
	id={name}
	{disabled}
	bind:this={input}
	bind:value={displayValue}
	on:keypress={handleKeyPress}
	on:input={format}
	on:focus={input.select}
	on:blur
/>
