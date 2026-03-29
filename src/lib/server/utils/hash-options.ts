import type { Options } from '@node-rs/argon2';

export const hashOptions: Options = {
	memoryCost: 19456, // 19 MiB
	outputLen: 32,
	parallelism: 1,
	timeCost: 2
};
