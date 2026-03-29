import { generateRandomString, type RandomReader } from '@oslojs/crypto/random';

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const random: RandomReader = {
	read(bytes) {
		crypto.getRandomValues(bytes);
	}
};

export function createId({ length }: { length?: number } = {}): string {
	return generateRandomString(random, alphabet, length ?? 12);
}
