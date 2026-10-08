// PROTOTYPE — throwaway. Lives on branch prototype/checkpoint-page only.
// In-memory stand-in for the Checkpoint feature (ADR-0017): the page reads the
// account's real transactions once, then every toggle/edit/checkpoint happens
// here and is lost on reload. Nothing is written to the database.

import type { ListTransaction } from '$lib/server/db/user-context/transaction';

export type Hint = {
	/** The amount that would close the gap, when the fix is an amount edit. */
	fixAmount: null | number;
	kind: HintKind;
	label: string;
	txId: string;
};

export type HintKind = 'decimal' | 'equal-pending' | 'equal-validated' | 'sign' | 'swap';

export type ProtoCheckpoint = {
	/** Signed Adjustment booked with this checkpoint; 0 when the bank agreed. */
	adjustment: number;
	bankBalance: number;
	/** Fake older entries have no real rows, only a count. */
	coveredCount: number;
	coveredIds: string[];
	createdAt: string;
	id: string;
};

export type ProtoTx = {
	amount: number;
	categoryName: null | string;
	checkpointId: null | string;
	counterpartAccountName: null | string;
	date: string;
	id: string;
	isAdjustment: boolean;
	notes: null | string;
	transferId: null | string;
	validated: boolean;
};

const HINT_LABELS: Record<HintKind, string> = {
	decimal: 'Decimal point in the wrong place?',
	'equal-pending': 'Not validated yet — amount equals the difference',
	'equal-validated': 'Validated by mistake or a duplicate? Amount equals the difference',
	sign: 'Entered with the wrong sign?',
	swap: 'Two digits swapped?'
};

export class ProtoCheckpointState {
	/** Entered bank balance in cents; undefined until the user types one. */
	bankInput = $state<number | undefined>(undefined);
	checkpoints = $state<ProtoCheckpoint[]>([]);
	transactions = $state<ProtoTx[]>([]);
	validatedBalance = $derived(
		this.transactions.filter((t) => t.validated).reduce((s, t) => s + t.amount, 0)
	);

	/** bank − validated: what the account is missing to match the bank. */
	difference = $derived(
		this.bankInput === undefined ? undefined : this.bankInput - this.validatedBalance
	);

	uncovered = $derived(
		this.transactions
			.filter((t) => t.checkpointId === null)
			.sort((a, b) => b.date.localeCompare(a.date))
	);

	hints = $derived.by((): Hint[] => {
		const d = this.difference;
		if (d === undefined || d === 0) return [];
		const out: Hint[] = [];
		const push = (txId: string, kind: HintKind, fixAmount: null | number) =>
			out.push({ fixAmount, kind, label: HINT_LABELS[kind], txId });
		for (const t of this.uncovered) {
			const a = t.amount;
			if (!t.validated) {
				if (a === d) push(t.id, 'equal-pending', null);
				continue;
			}
			if (a === -d) push(t.id, 'equal-validated', null);
			const fixed = a + d;
			if (fixed === -a) push(t.id, 'sign', fixed);
			else if (isTwoDigitSwap(a, fixed)) push(t.id, 'swap', fixed);
			else if (fixed === a * 10 || fixed * 10 === a) push(t.id, 'decimal', fixed);
		}
		return out;
	});
	latestCheckpoint = $derived(this.checkpoints.at(-1));
	log = $state<string[]>([]);
	pendingBalance = $derived(
		this.transactions.filter((t) => !t.validated).reduce((s, t) => s + t.amount, 0)
	);
	uncoveredPending = $derived(this.uncovered.filter((t) => !t.validated));
	uncoveredValidated = $derived(this.uncovered.filter((t) => t.validated));
	// Scenario presets for the prototype panel: set the bank balance as if one
	// uncovered transaction had been entered with a specific mistake.
	presets = $derived.by(() => {
		const v = this.uncoveredValidated.filter((t) => !t.isAdjustment);
		const p = this.uncoveredPending;
		const base = this.validatedBalance;
		const out: { bank: number; label: string }[] = [{ bank: base, label: 'Bank agrees' }];
		const sign = v[0];
		if (sign) out.push({ bank: base - 2 * sign.amount, label: `Sign flip: ${sign.notes}` });
		const swap = v.find((t) => /(\d)(?!\1)\d/.test(String(Math.abs(t.amount))));
		if (swap) {
			const s = String(Math.abs(swap.amount)).split('');
			const i = s.findIndex((c, k) => k < s.length - 1 && c !== s[k + 1]);
			[s[i], s[i + 1]] = [s[i + 1], s[i]];
			const real = Math.sign(swap.amount) * Number(s.join(''));
			out.push({ bank: base + real - swap.amount, label: `Digit swap: ${swap.notes}` });
		}
		const dec = v[1];
		if (dec) out.push({ bank: base + dec.amount * 9, label: `Decimal ×10: ${dec.notes}` });
		if (p[0]) out.push({ bank: base + p[0].amount, label: `Forgot to validate: ${p[0].notes}` });
		out.push({ bank: base - 317, label: 'Unknown drift (−3.17 fee)' });
		return out;
	});

	constructor(rows: ListTransaction[]) {
		this.transactions = rows.map((r) => ({
			amount: r.amount,
			categoryName: r.categoryName,
			checkpointId: null,
			counterpartAccountName: r.counterpartAccountName,
			date: r.date,
			id: r.id,
			isAdjustment: false,
			notes: r.notes,
			transferId: r.transferId,
			validated: r.validated
		}));
		this.seedPriorCheckpoint();
	}

	applyHint(hint: Hint) {
		if (hint.fixAmount !== null) this.editAmount(hint.txId, hint.fixAmount);
		else this.toggleValidated(hint.txId);
	}

	editAmount(id: string, amount: number) {
		const t = this.transactions.find((x) => x.id === id);
		if (!t || t.checkpointId) return;
		this.note(`amount ${t.notes ?? t.id}: ${t.amount} → ${amount}`);
		t.amount = amount;
	}

	hintsFor(txId: string) {
		return this.hints.filter((h) => h.txId === txId);
	}

	/** Sets a checkpoint; books an Adjustment first when the difference is nonzero. */
	setCheckpoint() {
		const d = this.difference;
		if (d === undefined || this.bankInput === undefined) return;
		const id = `cp-${Date.now()}`;
		if (d !== 0) {
			this.transactions.push({
				amount: d,
				categoryName: null,
				checkpointId: null,
				counterpartAccountName: null,
				date: daysAgo(0).slice(0, 10),
				id: `adj-${Date.now()}`,
				isAdjustment: true,
				notes: 'Adjustment',
				transferId: null,
				validated: true
			});
		}
		const covered = this.transactions.filter((t) => t.validated && t.checkpointId === null);
		for (const t of covered) t.checkpointId = id;
		this.checkpoints.push({
			adjustment: d,
			bankBalance: this.bankInput,
			coveredCount: covered.length,
			coveredIds: covered.map((t) => t.id),
			createdAt: daysAgo(0),
			id
		});
		this.note(`checkpoint set (${covered.length} covered${d !== 0 ? ', with Adjustment' : ''})`);
		this.bankInput = undefined;
	}

	toggleValidated(id: string) {
		const t = this.transactions.find((x) => x.id === id);
		if (!t || t.checkpointId) return;
		t.validated = !t.validated;
		this.note(`toggle ${t.notes ?? t.id} → ${t.validated ? 'validated' : 'pending'}`);
	}

	undoLatest() {
		const cp = this.checkpoints.pop();
		if (!cp) return;
		for (const t of this.transactions) if (t.checkpointId === cp.id) t.checkpointId = null;
		this.note(`undo checkpoint (${cp.coveredIds.length} released)`);
	}

	private note(msg: string) {
		this.log = [`${timeLabel()} ${msg}`, ...this.log].slice(0, 30);
	}

	/** Fake history: a checkpoint 3 days ago covering validated rows of the first 5 days. */
	private seedPriorCheckpoint() {
		const sorted = [...this.transactions].sort((a, b) => a.date.localeCompare(b.date));
		const cutoff = sorted.find((t) => t.date.endsWith('-05'))?.date ?? sorted[0]?.date;
		const covered = this.transactions.filter(
			(t) => t.validated && cutoff && (t.date <= cutoff || t.notes === 'Starting Balance')
		);
		if (covered.length === 0) return;
		const id = 'cp-seed-1';
		for (const t of covered) t.checkpointId = id;
		const bank = covered.reduce((s, t) => s + t.amount, 0);
		// Display-only older history so the timeline has some length.
		const fake: [number, number, number, number][] = [
			[152, -41_250, 0, 38],
			[121, -18_900, -317, 44],
			[91, -6_420, 0, 41],
			[60, 9_870, 1_200, 47],
			[32, 3_115, 0, 39]
		];
		for (const [ago, offset, adjustment, coveredCount] of fake)
			this.checkpoints.push({
				adjustment,
				bankBalance: bank + offset,
				coveredCount,
				coveredIds: [],
				createdAt: daysAgo(ago),
				id: `cp-fake-${ago}`
			});
		this.checkpoints.push({
			adjustment: 0,
			bankBalance: bank,
			coveredCount: covered.length,
			coveredIds: covered.map((t) => t.id),
			createdAt: daysAgo(3),
			id
		});
	}
}

function daysAgo(n: number) {
	return new Date(Date.now() - n * 86_400_000).toISOString();
}

function isTwoDigitSwap(a: number, b: number) {
	if (Math.sign(a) !== Math.sign(b)) return false;
	const s1 = String(Math.abs(a));
	const s2 = String(Math.abs(b));
	if (s1.length !== s2.length) return false;
	const diffs: number[] = [];
	for (let i = 0; i < s1.length; i++) if (s1[i] !== s2[i]) diffs.push(i);
	return diffs.length === 2 && s1[diffs[0]] === s2[diffs[1]] && s1[diffs[1]] === s2[diffs[0]];
}

function timeLabel() {
	return new Date().toLocaleTimeString();
}
