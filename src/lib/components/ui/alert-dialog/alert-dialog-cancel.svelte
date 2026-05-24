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
		variant = 'ghost',
		...restProps
	}: AlertDialogPrimitive.CancelProps & {
		size?: ButtonSize;
		variant?: ButtonVariant;
	} = $props();
</script>

<AlertDialogPrimitive.Cancel
	bind:ref
	data-slot="alert-dialog-cancel"
	class={cn(buttonVariants({ size, variant }), 'cn-alert-dialog-cancel', className)}
	{...restProps}
/>
