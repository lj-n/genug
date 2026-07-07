import { tv, type VariantProps } from 'tailwind-variants';

import { focusRingWithin } from '../focus-ring';

export const inputVariants = tv({
	base: 'w-full outline-none placeholder:text-muted aria-invalid:border-error',
	defaultVariants: {
		multiline: false,
		variant: 'default'
	},
	variants: {
		multiline: {
			false: 'h-9',
			true: 'field-sizing-content min-h-16'
		},
		variant: {
			container: [
				'flex items-center rounded-lg border border-muted/30 bg-surface/70 focus-within:bg-surface/80',
				focusRingWithin
			],
			default:
				'rounded-lg border border-muted/30 bg-surface/70 px-3 py-1 focus-visible:bg-surface/80',
			ghost: 'px-3 py-1'
		}
	}
});

export type InputVariant = VariantProps<typeof inputVariants>['variant'];
