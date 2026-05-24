<script lang="ts">
	import {
		type ButtonSize,
		type ButtonVariant,
		buttonVariants
	} from '$lib/components/ui/button/index.js';
	import { AlertDialog as AlertDialogPrimitive } from 'bits-ui';
	import { cn } from 'tailwind-variants';

	let {
		class: className,
		ref = $bindable(null),
		size = 'default',
		variant = 'default',
		...restProps
	}: AlertDialogPrimitive.ActionProps & {
		size?: ButtonSize;
		variant?: ButtonVariant;
	} = $props();
</script>

<AlertDialogPrimitive.Action
	bind:ref
	data-slot="alert-dialog-action"
	class={cn(buttonVariants({ size, variant }), 'cn-alert-dialog-action', className)}
	{...restProps}
/>
