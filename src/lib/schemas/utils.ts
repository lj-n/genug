import { m } from '$lib/paraglide/messages';
import * as v from 'valibot';

export const CoercedNumber = v.pipe(v.unknown(), v.transform(Number));

export const NameSchema = v.pipe(
	v.string(),
	v.minLength(3, m.name_error_minlength({ length: 3 })),
	v.maxLength(50, m.name_error_maxlength({ length: 50 }))
);
