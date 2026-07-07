import { faker } from '@faker-js/faker';

/**
 * Category and account names are unique per budget (`*_name_budget_unique`).
 * faker's commerce/finance name pools are tiny (~20 values), so two draws in
 * the same budget collide often enough to make tests flaky — add a random
 * suffix to keep names readable but collision-free.
 */
export function uniqueName(base: string): string {
	return `${base} ${faker.string.alphanumeric(6)}`;
}
