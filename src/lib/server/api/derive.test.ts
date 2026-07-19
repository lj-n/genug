import { describe, expect, it } from 'vitest';

import { deriveRequestSchemas } from './derive';

describe('deriveRequestSchemas', () => {
	const derived = deriveRequestSchemas();

	it('derives one JSON Schema per request body the contract references', () => {
		expect(Object.keys(derived).sort()).toEqual([
			'AssignmentSet',
			'ReassignmentSet',
			'TransactionCreate',
			'TransactionEdit',
			'TransferCreate',
			'TransferEdit'
		]);
	});

	it('strips the draft-07 $schema stamp and never emits an empty required', () => {
		for (const schema of Object.values(derived)) {
			expect(schema).not.toHaveProperty('$schema');
			if ('required' in schema) {
				expect((schema.required as string[]).length).toBeGreaterThan(0);
			}
		}
	});

	it('reads the input side of MoneySchema — a plain integer, not the branded output', () => {
		const amount = (derived.AssignmentSet.properties as Record<string, { type: string }>).amount;
		expect(amount).toEqual({ type: 'integer' });
	});

	it('keeps TransactionCreate required to accountId/amount/budgetId, income optional', () => {
		expect((derived.TransactionCreate.required as string[]).sort()).toEqual([
			'accountId',
			'amount',
			'budgetId'
		]);
		const props = derived.TransactionCreate.properties as Record<string, unknown>;
		expect(props).toHaveProperty('categoryId');
		expect(derived.TransactionCreate.required as string[]).not.toContain('categoryId');
	});

	it('makes ReassignmentSet.targetCategoryId required but nullable (back to Unassigned)', () => {
		const props = derived.ReassignmentSet.properties as Record<
			string,
			{ anyOf?: { type?: string }[] }
		>;
		expect(derived.ReassignmentSet.required).toContain('targetCategoryId');
		expect(props.targetCategoryId.anyOf).toContainEqual({ type: 'null' });
	});
});
