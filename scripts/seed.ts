/**
 * Builds the deterministic demo fixture used by the README screenshots
 * (see issue #112 / #122). It authors the dataset as *data* through the same
 * `user-context` operations the app uses — no UI driving — matching the repo's
 * "business rules live in user-context" convention.
 *
 * Amounts are integer cents (see `$lib/utils/money`). All transactions land in
 * the current month so the budget month view always shows live activity,
 * whenever the screenshots are regenerated.
 *
 * Run standalone with `DATABASE_URL=<file> tsx --tsconfig scripts/tsconfig.json
 * scripts/seed.ts`, or import `seedFixture` (the screenshot script does this).
 * `DATABASE_URL` must be set before import: `$db` opens it at module load.
 */
import { createUser, hashPassword } from '$db';
import { createUserCtx } from '$db/user-context';
import { addMonths, currentMonth } from '$lib/utils/month';

export type SeedResult = {
	budgetId: string;
	/** Account whose detail page is captured for the transactions screenshot. */
	checkingAccountId: string;
	month: number;
	password: string;
	username: string;
};

const USERNAME = 'Ada';
const PASSWORD = 'demo-fixture-pw';

/** A category and its per-month budget, expressed relative to the current month. */
type CategorySeed = {
	assigned: number;
	name: string;
	target?: number;
};

const CATEGORIES: CategorySeed[] = [
	{ assigned: 120000, name: 'Rent', target: 120000 },
	{ assigned: 40000, name: 'Groceries', target: 40000 },
	{ assigned: 8000, name: 'Dining Out' },
	{ assigned: 12000, name: 'Transport', target: 12000 },
	{ assigned: 18000, name: 'Utilities', target: 18000 },
	{ assigned: 6000, name: 'Entertainment' },
	{ assigned: 10000, name: 'Health', target: 10000 }
];

/** A transaction keyed by category name; `day` is a day-of-current-month. */
type TransactionSeed = {
	amount: number;
	category: null | string;
	day: number;
	notes: string;
	validated: boolean;
};

// Chosen so Dining Out ends the month overspent (assigned 80.00, spent 142.50),
// showing the cover-overspending affordance, while the rest stay in the black.
const CHECKING_TRANSACTIONS: TransactionSeed[] = [
	{ amount: 250000, category: null, day: 1, notes: 'Monthly salary', validated: true },
	{ amount: -120000, category: 'Rent', day: 1, notes: 'Monthly rent', validated: true },
	{ amount: -8450, category: 'Groceries', day: 2, notes: 'Supermarket', validated: true },
	{ amount: -3200, category: 'Dining Out', day: 3, notes: 'Lunch with the team', validated: true },
	{ amount: -2500, category: 'Transport', day: 4, notes: 'Monthly transit pass', validated: true },
	{ amount: -6530, category: 'Utilities', day: 5, notes: 'Electricity bill', validated: true },
	{
		amount: -1599,
		category: 'Entertainment',
		day: 6,
		notes: 'Streaming subscription',
		validated: true
	},
	{ amount: -12300, category: 'Groceries', day: 7, notes: 'Weekly groceries', validated: true },
	{ amount: -2200, category: 'Health', day: 8, notes: 'Pharmacy', validated: true },
	{ amount: -4550, category: 'Dining Out', day: 9, notes: 'Dinner out', validated: true },
	{ amount: -1890, category: 'Transport', day: 10, notes: 'Taxi ride', validated: true },
	{ amount: -7750, category: 'Groceries', day: 11, notes: 'Farmers market', validated: false },
	{ amount: -9800, category: 'Utilities', day: 12, notes: 'Internet bill', validated: true },
	{ amount: -6500, category: 'Dining Out', day: 13, notes: 'Birthday dinner', validated: false },
	{ amount: -3300, category: 'Entertainment', day: 14, notes: 'Cinema tickets', validated: false }
];

const SAVINGS_TRANSACTIONS: TransactionSeed[] = [
	{ amount: 50000, category: null, day: 2, notes: 'Emergency fund', validated: true },
	{ amount: 30000, category: null, day: 9, notes: 'Round-up savings', validated: true }
];

// A single assignment one month ahead. It has no income of its own, so it pulls
// the future running position below the current month's — lighting up the
// Unassigned popover's reach-back terms (Position, Reserved, and a bottleneck
// month) for the unassigned.png screenshot. Sized well under the current-month
// income so the current month stays comfortably positive (calm, not a warning).
// Removing it silently flattens the popover — see docs/dev/screenshots.md.
const FUTURE_ASSIGNMENT = { amount: 120000, category: 'Rent' } as const;

export async function seedFixture(): Promise<SeedResult> {
	const month = currentMonth();
	const dateForDay = (day: number) =>
		`${Math.floor(month / 100)}-${String(month % 100).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

	const passwordHash = await hashPassword({ password: PASSWORD });
	const user = createUser({ isAdmin: true, passwordHash, username: USERNAME });
	const ctx = createUserCtx(user.id);

	const budgetId = ctx.budget.create({ name: 'Household' });

	const checking = ctx.account.create({ budgetId, name: 'Checking' }, 320000);
	const savings = ctx.account.create({ budgetId, name: 'Savings' }, 850000);
	ctx.account.reorder([checking.id, savings.id]);

	const categoryIds = new Map<string, string>();
	for (const seed of CATEGORIES) {
		const category = ctx.category.create(budgetId, seed.name);
		if (seed.target !== undefined) {
			ctx.category.edit(category.id, { targetBalance: seed.target });
		}
		ctx.budget.assignment({ amount: seed.assigned, budgetId, categoryId: category.id, month });
		categoryIds.set(seed.name, category.id);
	}
	ctx.category.reorder(CATEGORIES.map((seed) => categoryIds.get(seed.name)!));

	ctx.budget.assignment({
		amount: FUTURE_ASSIGNMENT.amount,
		budgetId,
		categoryId: categoryIds.get(FUTURE_ASSIGNMENT.category)!,
		month: addMonths(month, 1)
	});

	for (const tx of CHECKING_TRANSACTIONS) {
		ctx.transaction.create({
			accountId: checking.id,
			amount: tx.amount,
			budgetId,
			categoryId: tx.category ? categoryIds.get(tx.category)! : null,
			date: dateForDay(tx.day),
			notes: tx.notes,
			validated: tx.validated
		});
	}
	for (const tx of SAVINGS_TRANSACTIONS) {
		ctx.transaction.create({
			accountId: savings.id,
			amount: tx.amount,
			budgetId,
			categoryId: null,
			date: dateForDay(tx.day),
			notes: tx.notes,
			validated: tx.validated
		});
	}

	return {
		budgetId,
		checkingAccountId: checking.id,
		month,
		password: PASSWORD,
		username: USERNAME
	};
}

// Allow `tsx scripts/seed.ts` for manual inspection of the fixture.
if (import.meta.url === `file://${process.argv[1]}`) {
	const result = await seedFixture();
	console.log('Seeded fixture:', result);
}
