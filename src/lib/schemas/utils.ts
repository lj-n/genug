import * as v from 'valibot';

export const CoercedNumber = v.pipe(v.unknown(), v.transform(Number));
