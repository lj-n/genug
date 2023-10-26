import { db } from './db';
import { auth } from './auth';
import { UserAccounts } from './accounts';
import { UserCategories } from './categories';
import { UserTransactions } from './transactions';
import type { Session, User as AuthUser } from 'lucia';
import { UserBudgets } from './budgets';

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

	static async create(
		username: string,
		password: string
	): Promise<{ user: AuthUser; session: Session }> {
		const user = await auth.createUser({
			key: {
				providerId: 'username',
				providerUserId: username.toLowerCase(),
				password
			},
			attributes: { name: username }
		});
		const session = await auth.createSession({
			userId: user.userId,
			attributes: {}
		});

		return { user, session };
	}

	static async login(username: string, password: string): Promise<Session> {
		const key = await auth.useKey('username', username.toLowerCase(), password);
		return await auth.createSession({ userId: key.userId, attributes: {} });
	}
}
