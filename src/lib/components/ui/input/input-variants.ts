import { tv, type VariantProps } from 'tailwind-variants';

import { focusRingWithin, hoverOutline, invalidRing, invalidRingWithin } from '../focus-ring';

export const inputVariants = tv({
	base: 'w-full outline-none placeholder:text-muted disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-error',
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
				'flex items-center rounded-lg border border-muted/20 bg-surface',
				hoverOutline,
				focusRingWithin,
				invalidRingWithin
			],
			default: [
				'rounded-lg border border-muted/20 bg-surface px-3 py-1',
				hoverOutline,
				invalidRing
			],
			ghost: ['px-3 py-1', invalidRing]
		}
	}
});

export type InputVariant = VariantProps<typeof inputVariants>['variant'];
