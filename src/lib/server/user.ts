import { db } from './db';
import { auth } from './auth';
import { UserAccounts } from './accounts';
import { UserCategories } from './categories';
import { UserTransactions } from './transactions';
import type { Session, User as AuthUser } from 'lucia';
import { UserBudgets } from './budgets';

/**
 * Creates a user and key in the database.
 */
export async function createUser(
	email: string,
	name: string,
	password: string,
	/** Set to `true` if the user should be verified at creation */
	verified = false
): Promise<AuthUser> {
	return await auth.createUser({
		key: {
			providerId: 'email',
			providerUserId: email.toLowerCase(),
			password
		},
		attributes: { name }
	});
}

/**
 * Uses a users key to create a session.
 */
export async function loginUser(
	email: string,
	password: string
): Promise<Session> {
	const key = await auth.useKey('email', email.toLowerCase(), password);

	return await auth.createSession({
		userId: key.userId,
		attributes: {}
	});
}

const userQuery = db.query.user
	.findFirst({
		where: (user, { eq, sql }) => eq(user.id, sql.placeholder('id'))
	})
	.prepare();

export class User {
	id: string;
	name: string;
	budgets: UserBudgets;
	accounts: UserAccounts;
	categories: UserCategories;
	transactions: UserTransactions;

	constructor(id: string) {
		const user = userQuery.get({ id });

		if (!user) {
			throw new Error('User does not exists in database');
		}

		this.id = user.id;
		this.name = user.name;
		this.budgets = new UserBudgets(this.id);
		this.categories = new UserCategories(this.id);
		this.accounts = new UserAccounts(this.id);
		this.transactions = new UserTransactions(this.id, this.accounts);
	}
}
