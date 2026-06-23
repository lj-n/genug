import { m } from '$lib/paraglide/messages';
import * as v from 'valibot';

export const CoercedNumber = v.pipe(
	v.unknown(),
	v.transform(Number),
	v.check((v) => !Number.isNaN(v), 'Expected a valid number')
);

export const NameSchema = v.pipe(
	v.string(),
	v.minLength(3, m.name_error_minlength({ length: 3 })),
	v.maxLength(50, m.name_error_maxlength({ length: 50 }))
);

export const OrderedIdsSchema = v.pipe(
	v.array(v.string()),
	v.minLength(1),
	v.check((arr) => new Set(arr).size === arr.length, 'IDs must be unique')
);
