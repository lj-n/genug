import type {
	SelectTeamAccount,
	SelectTeamCategory
} from '$lib/server/schema/tables';
import {
	createTeam,
	useTeamAccount,
	useTeamCategory,
	useTeamTransaction
} from '$lib/server/team';
import { beforeAll, describe, expect, test } from 'vitest';

const testUserId = 'qh1jpx6731v8w7v';

let testAccount1: SelectTeamAccount;
let testAccount2: SelectTeamAccount;
let testCategory1: SelectTeamCategory;
let testCategory2: SelectTeamCategory;

let teamId: number;

beforeAll(() => {
	const team = createTeam({ userId: testUserId, teamname: 'Testteam' });
	teamId = team.id;

	const teamAccount = useTeamAccount(teamId);
	const teamCategory = useTeamCategory(teamId);

	testAccount1 = teamAccount.create({
		name: 'Test Account1',
		createdBy: testUserId
	});
	testAccount2 = teamAccount.create({
		name: 'Test Account2',
		createdBy: testUserId
	});
	testCategory1 = teamCategory.create({
		name: 'Test Category1',
		createdBy: testUserId
	});
	testCategory2 = teamCategory.create({
		name: 'Test Category2',
		createdBy: testUserId
	});

	return () => {
		teamAccount.remove(testAccount1.id);
		teamAccount.remove(testAccount2.id);
		teamCategory.remove(testCategory1.id);
		teamCategory.remove(testCategory2.id);
	};
});

describe('user transactions', () => {
	let transactionId: number;

	test('create transactions', () => {
		const teamTransaction = useTeamTransaction(teamId);

		const flow = -1250;
		const description = 'Testtransaction description';
		const validated = false;

		const transaction = teamTransaction.create({
			flow,
			description,
			validated,
			accountId: testAccount1.id,
			categoryId: testCategory1.id,
			createdBy: testUserId
		});

		transactionId = transaction.id;

		expect(transaction.flow).toBe(flow);
		expect(transaction.description).toBe(description);
		expect(transaction.validated).toBe(validated);
		expect(transaction.accountId).toBe(testAccount1.id);
		expect(transaction.categoryId).toBe(testCategory1.id);
	});

	test('get transaction', () => {
		const teamTransaction = useTeamTransaction(teamId);

		const transaction = teamTransaction.get(transactionId);
		const transactions = teamTransaction.getAll();

		expect(transaction).toBeDefined();
		expect(transactions).toHaveLength(1);
	});

	test('update transaction', () => {
		const teamTransaction = useTeamTransaction(teamId);

		const transaction = teamTransaction.update(transactionId, {
			flow: 850,
			validated: false,
			accountId: testAccount2.id,
			categoryId: testCategory2.id
		});

		expect(transaction.flow).toBe(850);
		expect(transaction.validated).toBe(false);
		expect(transaction.accountId).toBe(testAccount2.id);
		expect(transaction.categoryId).toBe(testCategory2.id);

		expect(teamTransaction.get(transactionId)).toMatchObject(transaction);

		expect(() =>
			teamTransaction.update(transactionId, { categoryId: -1 })
		).toThrowError();
		expect(() =>
			teamTransaction.update(transactionId, { accountId: -1 })
		).toThrowError();
	});

	test('remove transaction', () => {
		const teamTransaction = useTeamTransaction(teamId);
		const removedTransaction = teamTransaction.remove(transactionId);

		expect(removedTransaction).toBeDefined();
		expect(teamTransaction.getAll()).toHaveLength(0);
		expect(() => teamTransaction.get(transactionId)).toThrowError(
			`Team(${teamId}) transaction(${transactionId}) not found`
		);
	});
});
