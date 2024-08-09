import { type VariantProps, tv } from 'tailwind-variants';

export { default as Badge } from './badge.svelte';
export const badgeVariants = tv({
	base: 'inline-flex select-none items-center rounded-md px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
	variants: {
		variant: {
			default: 'text-green bg-green/10',
			secondary: 'text-blue bg-blue/10',
			ghost: 'bg-muted',
			destructive:
				'border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80',
			outline: 'text-foreground'
		}
	},
	defaultVariants: {
		variant: 'default'
	}
});

export type Variant = VariantProps<typeof badgeVariants>['variant'];
