import { db } from '../db';
import { auth } from '../auth';
import { UserAccount } from './user.account';
import { UserCategory } from './user.category';
import { UserTransaction } from './user.transactions';
import { UserBudget } from './user.budget';
import { UserTeam } from './user.team';
import type { Session, User as AuthUser } from 'lucia';

export class User {
	id: string;
	name: string;
	team: UserTeam;
	budget: UserBudget;
	account: UserAccount;
	category: UserCategory;
	transaction: UserTransaction;

	constructor(id: string) {
		const user = userQuery.get({ id });

		if (!user) {
			throw new Error('User does not exists in database');
		}

		this.id = user.id;
		this.name = user.name;
		this.team = new UserTeam(this.id);
		this.budget = new UserBudget(this.id);
		this.account = new UserAccount(this.id);
		this.category = new UserCategory(this.id);
		this.transaction = new UserTransaction(this.id, this.account);
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

export const userQuery = db.query.user
	.findFirst({
		where: (user, { eq, sql }) => eq(user.id, sql.placeholder('id'))
	})
	.prepare();
