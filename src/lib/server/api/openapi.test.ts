import { createDatabase, tables } from '$db';
import { parseMonth } from '$lib/utils/month';
import addFormats from 'ajv-formats';
import Ajv2020, { type ValidateFunction } from 'ajv/dist/2020';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { createBudgetWithUser } from '../../../test/fixtures';
import { queries } from '../db/user-context/budget';
import { buildOpenApiDocument, type OpenApiDocument, renderOpenApiYaml } from './openapi';

const doc = buildOpenApiDocument();
const month = parseMonth(202501)!;

/** What the HTTP layer will put on the wire: JSON (Date → ISO string, etc.). */
function onTheWire<T>(value: T): unknown {
	return JSON.parse(JSON.stringify(value));
}

function seedGroceries() {
	const db = createDatabase(':memory:');
	const { budget, user } = createBudgetWithUser(db);
	const category = db
		.insert(tables.categories)
		.values({ budgetId: budget.id, name: 'Groceries', notes: 'weekly', targetBalance: 40000 })
		.returning()
		.get();
	// A bare category (null notes, null targetBalance) so the envelope view
	// exercises the nullable branches of CategoryEnvelope against real output.
	db.insert(tables.categories).values({ budgetId: budget.id, name: 'Fun' }).run();
	const account = db
		.insert(tables.accounts)
		.values({ budgetId: budget.id, name: 'Checking' })
		.returning()
		.get();
	db.insert(tables.transactions)
		.values({
			accountId: account.id,
			amount: 100000,
			budgetId: budget.id,
			categoryId: null,
			date: '2025-01-02'
		})
		.run();
	db.insert(tables.budgetAssignments)
		.values({ amount: 20000, budgetId: budget.id, categoryId: category.id, month: 202501 })
		.run();
	db.insert(tables.transactions)
		.values({
			accountId: account.id,
			amount: -5000,
			budgetId: budget.id,
			categoryId: category.id,
			date: '2025-01-15'
		})
		.run();
	return { budget, category, db, user };
}

/**
 * Compile a validator for one published component schema. Handing Ajv the whole
 * `components` object as the compilation root lets internal `$ref`s
 * (`#/components/schemas/Money`, …) resolve exactly as they do in the document.
 */
function validatorFor(schemaName: string): ValidateFunction {
	const ajv = new Ajv2020({ allErrors: true, strict: false });
	addFormats(ajv);
	return ajv.compile({
		$ref: `#/components/schemas/${schemaName}`,
		components: (doc as OpenApiDocument).components
	});
}

describe('decode-contract: envelope response schemas vs real user-context output', () => {
	it('the envelope view the domain returns decodes against EnvelopeView', () => {
		const { budget, db, user } = seedGroceries();
		const { monthly, unassigned } = queries(user.id, db);

		const envelopeView = onTheWire({
			categories: monthly(budget.id, month),
			month,
			unassigned: unassigned(budget.id, month)
		});

		const validate = validatorFor('EnvelopeView');
		expect(validate(envelopeView), JSON.stringify(validate.errors, null, 2)).toBe(true);
	});

	it('a monthly category row decodes against both CategoryEnvelope and Category', () => {
		const { budget, db, user } = seedGroceries();
		const [row] = queries(user.id, db).monthly(budget.id, month);
		const wire = onTheWire(row);

		const asEnvelope = validatorFor('CategoryEnvelope');
		expect(asEnvelope(wire), JSON.stringify(asEnvelope.errors, null, 2)).toBe(true);

		const asCategory = validatorFor('Category');
		expect(asCategory(wire), JSON.stringify(asCategory.errors, null, 2)).toBe(true);
	});

	it('the write-response EnvelopeDelta decodes against EnvelopeDelta', () => {
		const { budget, db, user } = seedGroceries();
		const { monthly, unassigned } = queries(user.id, db);

		const delta = onTheWire({
			categories: monthly(budget.id, month).map((c) => ({
				activity: c.activity,
				assigned: c.assigned,
				categoryId: c.id,
				remaining: c.remaining
			})),
			month,
			unassigned: unassigned(budget.id, month)
		});

		const validate = validatorFor('EnvelopeDelta');
		expect(validate(delta), JSON.stringify(validate.errors, null, 2)).toBe(true);
	});

	it('exercises the non-null `bottleneck` branch of UnassignedBreakdown', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const category = db
			.insert(tables.categories)
			.values({ budgetId: budget.id, name: 'Rent' })
			.returning()
			.get();
		const account = db
			.insert(tables.accounts)
			.values({ budgetId: budget.id, name: 'Checking' })
			.returning()
			.get();
		// Income only in Jan, but a larger assignment in Feb: the reach-back
		// minimum is pinned in a later month, so `bottleneck` is non-null.
		db.insert(tables.transactions)
			.values({
				accountId: account.id,
				amount: 100000,
				budgetId: budget.id,
				categoryId: null,
				date: '2025-01-02'
			})
			.run();
		db.insert(tables.budgetAssignments)
			.values({ amount: 130000, budgetId: budget.id, categoryId: category.id, month: 202502 })
			.run();

		const breakdown = queries(user.id, db).unassigned(budget.id, month);
		expect(breakdown.bottleneck).not.toBeNull();

		const validate = validatorFor('UnassignedBreakdown');
		expect(validate(onTheWire(breakdown)), JSON.stringify(validate.errors, null, 2)).toBe(true);
	});
});

describe('assembled OpenAPI document', () => {
	it('has no dangling internal $ref', () => {
		const targets = new Set<string>();
		const refs: string[] = [];
		(function walk(node: unknown, ...ancestry: string[]) {
			if (Array.isArray(node)) {
				node.forEach((child) => walk(child, ...ancestry));
				return;
			}
			if (node && typeof node === 'object') {
				for (const [key, value] of Object.entries(node)) {
					if (key === '$ref' && typeof value === 'string') refs.push(value);
					walk(value, ...ancestry, key);
				}
			}
		})(doc);

		for (const section of ['schemas', 'parameters', 'responses', 'securitySchemes'] as const) {
			const group = (doc as OpenApiDocument).components[section];
			if (group && typeof group === 'object') {
				for (const name of Object.keys(group)) targets.add(`#/components/${section}/${name}`);
			}
		}

		const dangling = refs.filter((ref) => ref.startsWith('#/') && !targets.has(ref));
		expect(dangling).toEqual([]);
	});

	it('injects the six derived request schemas the paths reference', () => {
		const schemas = (doc as OpenApiDocument).components.schemas;
		for (const name of [
			'TransactionCreate',
			'TransactionEdit',
			'AssignmentSet',
			'ReassignmentSet',
			'TransferCreate',
			'TransferEdit'
		]) {
			expect(schemas).toHaveProperty(name);
		}
	});

	it('matches the checked-in docs/api/openapi.yaml (run `npm run api:generate`)', () => {
		const committed = readFileSync(resolve(process.cwd(), 'docs/api/openapi.yaml'), 'utf8');
		expect(renderOpenApiYaml()).toBe(committed);
	});
});
