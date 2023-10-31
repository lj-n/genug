<script lang="ts">
	import feather, {
		type FeatherIconNames,
		type FeatherAttributes
	} from 'feather-icons';

	export let name: FeatherIconNames;

	export let width = '1.25em';
	export let height = '1.25em';

	let className = '';
	export { className as class };

	export let options: Partial<FeatherAttributes> | undefined = undefined;
</script>

{@html feather.icons[name].toSvg({
	width,
	height,
	class: className,
	'aria-hidden': 'true',
	focusable: 'false',
	...options
})}
