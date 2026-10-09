import type { TransactionsURLParams } from '$lib/schemas/transaction';

import { type TableParams, TableState, toTableParams } from './transaction-table-state.svelte';

/**
 * One `TableState` for a register page visit, kept in step with the page URL.
 *
 * The state owns the URL it was built from and every URL it writes itself (the
 * register's URL bridge: in-page filter, sort and page changes), so those
 * navigations keep it. Any other navigation — another account, or a clean link
 * back to the same one — resets it in place from the URL it lands on. Keying on
 * the URL rather than the account id also covers a switch back that lands
 * before the other account ever did (A -> B -> A), so a previous visit's
 * filters never carry over (#371).
 */
export class UrlTableState {
	readonly state: TableState;

	/** The location the state was last built from or wrote and saw land. */
	#location = $state('');

	/** Locations the state navigated to that have not landed yet, oldest first. */
	#pendingWrites: string[] = [];

	constructor(url: URL, params: TransactionsURLParams) {
		this.state = new TableState(params);
		this.#location = locationOf(url);
	}

	/**
	 * Follows a navigation that landed on `url`: one of the state's own writes
	 * keeps it, any other URL resets it from `urlParams`.
	 */
	follow(url: URL, urlParams: () => TransactionsURLParams) {
		const location = locationOf(url);
		if (location === this.#location) return;
		const own = this.#pendingWrites.lastIndexOf(location);
		if (own === -1) {
			this.#pendingWrites = [];
			this.state.reset(urlParams());
		} else {
			// Earlier writes were superseded; if one lands later, it is not ours.
			this.#pendingWrites.splice(0, own + 1);
		}
		this.#location = location;
	}

	/** Records a navigation the state starts itself, so its landing keeps the state. */
	navigatingTo(url: URL) {
		this.#pendingWrites.push(locationOf(url));
	}

	/**
	 * The params to list `url` with: the state's while it owns `url`, otherwise
	 * the URL's own until `follow` catches up, so a switch never lists the new
	 * account with the old state.
	 */
	paramsAt(url: URL, urlParams: () => TransactionsURLParams): TableParams {
		// Read on both branches: while navigations settle, Svelte may re-run the
		// caller's derived with a pending navigation's view of `#location`, and a
		// last run on the URL branch must not leave it deaf to later state edits.
		const stateParams = this.state.params;
		const location = locationOf(url);
		return location === this.#location || this.#pendingWrites.includes(location)
			? stateParams
			: toTableParams(urlParams());
	}
}

function locationOf(url: URL) {
	return url.pathname + url.search;
}
