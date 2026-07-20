/**
 * Hand-authored base of the genug-da OpenAPI contract (map #190, settled in
 * #191).
 *
 * This module owns everything a machine cannot derive: the paths, parameters,
 * shared responses, and — the important part — the **envelope-view response
 * schemas** (`UnassignedBreakdown`, `CategoryEnvelope`, `EnvelopeView`,
 * `CategoryBalance`, `EnvelopeDelta`). Those mirror
 * `src/lib/server/db/user-context/envelope.ts` by hand and are the contract's
 * single biggest drift risk (decision 6): nothing generates them, so the
 * decode-contract test in `openapi.test.ts` guards them against the real
 * domain output.
 *
 * The six request-body schemas the paths reference — `TransactionCreate`,
 * `TransactionEdit`, `AssignmentSet`, `ReassignmentSet`, `TransferCreate`,
 * `TransferEdit` — are deliberately ABSENT here. They are derived from the
 * valibot schemas in `derive.ts` and injected by `buildOpenApiDocument()`.
 * Do not hand-author them into `components.schemas`.
 *
 * The assembled, published document is `docs/api/openapi.yaml`, regenerated
 * with `npm run api:generate`. Edit this file, never that one.
 */

export type OpenApiDocument = {
	[key: string]: unknown;
	components: {
		[key: string]: unknown;
		schemas: Record<string, unknown>;
	};
};

export const contract: OpenApiDocument = {
	components: {
		parameters: {
			BudgetId: {
				in: 'path',
				name: 'budgetId',
				required: true,
				schema: { minLength: 1, type: 'string' }
			},
			ClientVersion: {
				description:
					'`<platform>/<version>`, e.g. `ios/2026.7.0`. Server-enforced: missing or below the per-platform minimum yields `426`. Declared optional here so generated clients can inject it via middleware instead of at every call site.',
				in: 'header',
				name: 'X-Genug-Client',
				required: false,
				schema: {
					examples: ['ios/2026.7.0'],
					pattern: '^[a-z-]+/[0-9][A-Za-z0-9.\\-]*$',
					type: 'string'
				}
			},
			MonthPath: {
				description: 'The viewed month, `YYYYMM`.',
				in: 'path',
				name: 'month',
				required: true,
				schema: { $ref: '#/components/schemas/Month' }
			},
			TransactionId: {
				in: 'path',
				name: 'transactionId',
				required: true,
				schema: { minLength: 1, type: 'string' }
			},
			ViewMonth: {
				description:
					"The month the client is currently viewing. The `EnvelopeDelta` in the response is recomputed for this month, which may differ from the month of the transaction's `date`.",
				in: 'query',
				name: 'month',
				required: true,
				schema: { $ref: '#/components/schemas/Month' }
			}
		},

		responses: {
			BadRequest: {
				content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
				description: 'Validation or domain-rule failure.'
			},
			NotFound: {
				content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
				description:
					'Unknown id — or one the token’s user has no access to; access failures are indistinguishable from missing rows by design.'
			},
			Unauthorized: {
				content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
				description: 'Missing, invalid, expired, or revoked token.'
			},
			UpgradeRequired: {
				content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
				description: 'Client version below the supported minimum (`client_upgrade_required`).'
			}
		},

		schemas: {
			AccountBalance: {
				description: 'Recomputed all-time balance of one affected account.',
				properties: {
					accountId: { type: 'string' },
					balance: { $ref: '#/components/schemas/Money' }
				},
				required: ['accountId', 'balance'],
				type: 'object'
			},

			AccountSummary: {
				properties: {
					balance: { $ref: '#/components/schemas/Money' },
					budgetId: { type: 'string' },
					id: { type: 'string' },
					name: { type: 'string' }
				},
				required: ['id', 'budgetId', 'name', 'balance'],
				type: 'object'
			},

			Budget: {
				properties: {
					createdAt: { format: 'date-time', type: 'string' },
					currency: {
						description: "ISO 4217 code from the instance's supported set (e.g. `EUR`, `USD`).",
						type: 'string'
					},
					id: { type: 'string' },
					name: { type: 'string' }
				},
				required: ['id', 'name', 'currency', 'createdAt'],
				type: 'object'
			},

			Category: {
				properties: {
					budgetId: { type: 'string' },
					createdAt: { format: 'date-time', type: 'string' },
					id: { type: 'string' },
					name: { type: 'string' },
					notes: { type: ['string', 'null'] },
					targetBalance: { oneOf: [{ $ref: '#/components/schemas/Money' }, { type: 'null' }] }
				},
				required: ['id', 'budgetId', 'name', 'notes', 'targetBalance', 'createdAt'],
				type: 'object'
			},

			CategoryBalance: {
				description: 'Month-scoped balances of one category, without the entity fields.',
				properties: {
					activity: { $ref: '#/components/schemas/Money' },
					assigned: { $ref: '#/components/schemas/Money' },
					categoryId: { type: 'string' },
					remaining: { $ref: '#/components/schemas/Money' }
				},
				required: ['categoryId', 'activity', 'assigned', 'remaining'],
				type: 'object'
			},

			CategoryEnvelope: {
				description:
					'A category with its month-scoped balances, as returned by `budget.queries.monthly` — the envelope-view row.',
				properties: {
					activity: {
						$ref: '#/components/schemas/Money',
						description: 'Signed transaction sum in the viewed month.'
					},
					assigned: {
						$ref: '#/components/schemas/Money',
						description: 'Amount assigned in the viewed month.'
					},
					budgetId: { type: 'string' },
					createdAt: { format: 'date-time', type: 'string' },
					id: { type: 'string' },
					name: { type: 'string' },
					notes: { type: ['string', 'null'] },
					remaining: {
						$ref: '#/components/schemas/Money',
						description:
							'Envelope balance through the viewed month (assignments + transactions ≤ month).'
					},
					targetBalance: { oneOf: [{ $ref: '#/components/schemas/Money' }, { type: 'null' }] }
				},
				required: [
					'id',
					'budgetId',
					'name',
					'notes',
					'targetBalance',
					'createdAt',
					'activity',
					'assigned',
					'remaining'
				],
				type: 'object'
			},

			// Hand-authored envelope response schemas (drift risk — see header)

			EnvelopeDelta: {
				description:
					'Server-recomputed envelope aggregates returned inside every write response (map decision 5). `categories` holds the affected categories only — up to two for an edit that moves a transaction between categories, empty for pure income writes.',
				properties: {
					categories: { items: { $ref: '#/components/schemas/CategoryBalance' }, type: 'array' },
					month: { $ref: '#/components/schemas/Month' },
					unassigned: { $ref: '#/components/schemas/UnassignedBreakdown' }
				},
				required: ['month', 'unassigned', 'categories'],
				type: 'object'
			},

			EnvelopeView: {
				properties: {
					categories: { items: { $ref: '#/components/schemas/CategoryEnvelope' }, type: 'array' },
					month: { $ref: '#/components/schemas/Month' },
					unassigned: { $ref: '#/components/schemas/UnassignedBreakdown' }
				},
				required: ['month', 'unassigned', 'categories'],
				type: 'object'
			},

			Error: {
				properties: {
					code: {
						description: 'Stable machine-readable identifier, e.g. `account_archived`.',
						type: 'string'
					},
					message: { description: 'Human-readable English description.', type: 'string' }
				},
				required: ['code', 'message'],
				type: 'object'
			},

			Money: {
				description: 'Integer count of minor currency units (cents for EUR/USD).',
				type: 'integer'
			},

			Month: {
				description:
					'Calendar month as a `YYYYMM` integer; the two trailing digits are 01–12 (not expressible as a JSON Schema bound — validated server-side).',
				maximum: 210012,
				minimum: 190001,
				type: 'integer'
			},

			SortDirection: { enum: ['asc', 'desc'], type: 'string' },

			Transaction: {
				description: 'A `transactions` row as stored (money in minor units, date `YYYY-MM-DD`).',
				properties: {
					accountId: { type: 'string' },
					amount: { $ref: '#/components/schemas/Money' },
					budgetId: { type: 'string' },
					categoryId: {
						description: '`null` = income (Unassigned) — or a transfer leg.',
						type: ['string', 'null']
					},
					createdAt: { format: 'date-time', type: 'string' },
					createdBy: { type: ['string', 'null'] },
					date: { format: 'date', type: 'string' },
					id: { type: 'string' },
					notes: { type: ['string', 'null'] },
					transferId: { type: ['string', 'null'] },
					validated: { type: 'boolean' }
				},
				required: [
					'id',
					'accountId',
					'budgetId',
					'categoryId',
					'amount',
					'date',
					'notes',
					'transferId',
					'validated',
					'createdAt',
					'createdBy'
				],
				type: 'object'
			},

			TransactionDeleteResult: {
				properties: {
					accounts: { items: { $ref: '#/components/schemas/AccountBalance' }, type: 'array' },
					deletedIds: {
						description: 'Both legs of a transfer when a leg was selected (ADR-0015).',
						items: { type: 'string' },
						type: 'array'
					},
					envelope: { $ref: '#/components/schemas/EnvelopeDelta' }
				},
				required: ['deletedIds', 'envelope', 'accounts'],
				type: 'object'
			},

			TransactionListItem: {
				description:
					'A register row: the transaction plus joined display fields. Keep the base fields in sync with `Transaction` (flat copy — no allOf, for generated-client ergonomics).',
				properties: {
					accountId: { type: 'string' },
					amount: { $ref: '#/components/schemas/Money' },
					budgetId: { type: 'string' },
					categoryId: { type: ['string', 'null'] },
					categoryName: { type: ['string', 'null'] },
					counterpartAccountId: {
						description: 'The account on the other side of a transfer leg (ADR-0015).',
						type: ['string', 'null']
					},
					counterpartAccountName: { type: ['string', 'null'] },
					createdAt: { format: 'date-time', type: 'string' },
					createdBy: { type: ['string', 'null'] },
					createdByName: { type: ['string', 'null'] },
					date: { format: 'date', type: 'string' },
					id: { type: 'string' },
					notes: { type: ['string', 'null'] },
					transferId: { type: ['string', 'null'] },
					validated: { type: 'boolean' }
				},
				required: [
					'id',
					'accountId',
					'budgetId',
					'categoryId',
					'amount',
					'date',
					'notes',
					'transferId',
					'validated',
					'createdAt',
					'createdBy',
					'categoryName',
					'createdByName',
					'counterpartAccountId',
					'counterpartAccountName'
				],
				type: 'object'
			},

			TransactionPage: {
				properties: {
					rows: { items: { $ref: '#/components/schemas/TransactionListItem' }, type: 'array' },
					total: { description: 'Unpaged row count for the active filter.', type: 'integer' }
				},
				required: ['rows', 'total'],
				type: 'object'
			},

			TransactionWriteResult: {
				properties: {
					accounts: {
						description: 'Affected account balances (two when an edit moves accounts).',
						items: { $ref: '#/components/schemas/AccountBalance' },
						type: 'array'
					},
					envelope: { $ref: '#/components/schemas/EnvelopeDelta' },
					transaction: { $ref: '#/components/schemas/Transaction' }
				},
				required: ['transaction', 'envelope', 'accounts'],
				type: 'object'
			},

			TransferResult: {
				description:
					'Both legs plus recomputed account balances. No `EnvelopeDelta` — transfers are budget-neutral and category-free (ADR-0015).',
				properties: {
					accounts: { items: { $ref: '#/components/schemas/AccountBalance' }, type: 'array' },
					from: { $ref: '#/components/schemas/Transaction' },
					to: { $ref: '#/components/schemas/Transaction' }
				},
				required: ['from', 'to', 'accounts'],
				type: 'object'
			},

			UnassignedBreakdown: {
				description:
					'Decomposition of Unassigned(M) per ADR-0007 / #73. Invariant: `unassigned = position - reserved`. Mirrors `UnassignedBreakdown` in src/lib/server/db/user-context/envelope.ts.',
				properties: {
					assignedUntilMonth: { $ref: '#/components/schemas/Money' },
					bottleneck: {
						description:
							'Earliest month at/after the viewed month pinning the reach-back minimum; `null` when the viewed month itself is the minimum (`reserved` = 0).',
						oneOf: [{ $ref: '#/components/schemas/Month' }, { type: 'null' }]
					},
					incomeUntilMonth: { $ref: '#/components/schemas/Money' },
					position: {
						$ref: '#/components/schemas/Money',
						description: 'Running income minus assignments through the viewed month.'
					},
					reserved: {
						$ref: '#/components/schemas/Money',
						description: 'Withheld because a later month runs lower.'
					},
					unassigned: { $ref: '#/components/schemas/Money' }
				},
				required: [
					'assignedUntilMonth',
					'bottleneck',
					'incomeUntilMonth',
					'position',
					'reserved',
					'unassigned'
				],
				type: 'object'
			}
		},

		securitySchemes: {
			pat: {
				description:
					'Personal access token from the web UI’s token page (hashed at rest, optional expiry). Added to `hooks.server.ts` as a parallel auth path beside session cookies.',
				scheme: 'bearer',
				type: 'http'
			}
		}
	},

	info: {
		description: [
			'Additive HTTP API for native clients (iOS MVP), served by the same',
			'SvelteKit process as the web app and backed by the same `user-context`',
			'domain layer. The web app keeps its remote functions; this surface is',
			'additive-only (map decision 14).'
		].join(' '),
		license: { identifier: 'AGPL-3.0-only', name: 'AGPL-3.0-only' },
		title: 'genug-da API',
		version: '0.0.0-draft.1'
	},

	openapi: '3.1.0',

	paths: {
		'/assignments': {
			post: {
				description:
					'Upsert semantics — `amount` is the absolute assigned value for `(categoryId, month)`, not a delta. The fat response (map decision 5) returns the recomputed `UnassignedBreakdown` and the affected category’s balances in the write’s own response.',
				operationId: 'setAssignment',
				parameters: [{ $ref: '#/components/parameters/ClientVersion' }],
				requestBody: {
					content: {
						'application/json': { schema: { $ref: '#/components/schemas/AssignmentSet' } }
					},
					required: true
				},
				responses: {
					'200': {
						content: {
							'application/json': { schema: { $ref: '#/components/schemas/EnvelopeDelta' } }
						},
						description: "Recomputed envelope aggregates for the assignment's month."
					},
					'400': { $ref: '#/components/responses/BadRequest' },
					'401': { $ref: '#/components/responses/Unauthorized' },
					'404': { $ref: '#/components/responses/NotFound' },
					'426': { $ref: '#/components/responses/UpgradeRequired' }
				},
				summary: 'Set the assigned amount of a category for a month.',
				tags: ['assignments']
			}
		},

		'/budgets': {
			get: {
				description:
					'The QR payload carries only `{serverUrl, token}`; this endpoint is how the app discovers budget ids after connecting.',
				operationId: 'listBudgets',
				parameters: [{ $ref: '#/components/parameters/ClientVersion' }],
				responses: {
					'200': {
						content: {
							'application/json': {
								schema: { items: { $ref: '#/components/schemas/Budget' }, type: 'array' }
							}
						},
						description: "Budgets in the user's preferred order."
					},
					'401': { $ref: '#/components/responses/Unauthorized' },
					'426': { $ref: '#/components/responses/UpgradeRequired' }
				},
				summary: "List the budgets the token's user can access.",
				tags: ['budgets']
			}
		},

		'/budgets/{budgetId}/accounts': {
			get: {
				operationId: 'listAccounts',
				parameters: [
					{ $ref: '#/components/parameters/ClientVersion' },
					{ $ref: '#/components/parameters/BudgetId' }
				],
				responses: {
					'200': {
						content: {
							'application/json': {
								schema: { items: { $ref: '#/components/schemas/AccountSummary' }, type: 'array' }
							}
						},
						description: "Active (non-archived) accounts in the user's order."
					},
					'401': { $ref: '#/components/responses/Unauthorized' },
					'404': { $ref: '#/components/responses/NotFound' },
					'426': { $ref: '#/components/responses/UpgradeRequired' }
				},
				summary: 'List active accounts of a budget, with balances.',
				tags: ['reference']
			}
		},

		'/budgets/{budgetId}/categories': {
			get: {
				description:
					'Plain category entities for the capture form. Month-scoped balances live on the envelope view, not here.',
				operationId: 'listCategories',
				parameters: [
					{ $ref: '#/components/parameters/ClientVersion' },
					{ $ref: '#/components/parameters/BudgetId' }
				],
				responses: {
					'200': {
						content: {
							'application/json': {
								schema: { items: { $ref: '#/components/schemas/Category' }, type: 'array' }
							}
						},
						description: "Active (non-archived) categories in the user's order."
					},
					'401': { $ref: '#/components/responses/Unauthorized' },
					'404': { $ref: '#/components/responses/NotFound' },
					'426': { $ref: '#/components/responses/UpgradeRequired' }
				},
				summary: 'List active categories of a budget.',
				tags: ['reference']
			}
		},

		'/budgets/{budgetId}/months/{month}/envelope': {
			get: {
				description:
					'Active categories with month-scoped `activity`/`assigned`/`remaining` plus the `UnassignedBreakdown` (reach-back min-scan, ADR-0007). This is the server-authoritative snapshot the app renders; it never recomputes these numbers locally.',
				operationId: 'getEnvelopeView',
				parameters: [
					{ $ref: '#/components/parameters/ClientVersion' },
					{ $ref: '#/components/parameters/BudgetId' },
					{ $ref: '#/components/parameters/MonthPath' }
				],
				responses: {
					'200': {
						content: {
							'application/json': { schema: { $ref: '#/components/schemas/EnvelopeView' } }
						},
						description: 'The envelope view.'
					},
					'401': { $ref: '#/components/responses/Unauthorized' },
					'404': { $ref: '#/components/responses/NotFound' },
					'426': { $ref: '#/components/responses/UpgradeRequired' }
				},
				summary: 'The envelope view of a budget for one month.',
				tags: ['envelope']
			}
		},

		'/reassignments': {
			post: {
				description:
					'The "cover overspending" gesture: moves `amount` from `sourceCategoryId` to `targetCategoryId` within the same budget and month; `targetCategoryId: null` returns the amount to Unassigned. A negative amount reverses direction. The fat response carries both affected category balances.',
				operationId: 'reassign',
				parameters: [{ $ref: '#/components/parameters/ClientVersion' }],
				requestBody: {
					content: {
						'application/json': { schema: { $ref: '#/components/schemas/ReassignmentSet' } }
					},
					required: true
				},
				responses: {
					'200': {
						content: {
							'application/json': { schema: { $ref: '#/components/schemas/EnvelopeDelta' } }
						},
						description: "Recomputed envelope aggregates for the reassignment's month."
					},
					'400': { $ref: '#/components/responses/BadRequest' },
					'401': { $ref: '#/components/responses/Unauthorized' },
					'404': { $ref: '#/components/responses/NotFound' },
					'426': { $ref: '#/components/responses/UpgradeRequired' }
				},
				summary: 'Move assigned money from one category to another.',
				tags: ['assignments']
			}
		},

		'/transactions': {
			get: {
				description:
					'Mirrors the web register: filter by category (`__none__` = income, `__transfer__` = transfer legs), search notes, sort by any column. Rows join the category name, creator name, and — for transfer legs — the counterpart account (ADR-0015).',
				operationId: 'listTransactions',
				parameters: [
					{ $ref: '#/components/parameters/ClientVersion' },
					{
						in: 'query',
						name: 'accountId',
						required: true,
						schema: { minLength: 1, type: 'string' }
					},
					{
						description:
							'Category ids to include; the sentinels `__none__` (income) and `__transfer__` (transfer legs) are allowed.',
						in: 'query',
						name: 'categoryId',
						required: false,
						schema: { items: { type: 'string' }, type: 'array' }
					},
					{
						description: 'Substring match on notes.',
						in: 'query',
						name: 'notes',
						required: false,
						schema: { type: 'string' }
					},
					{ in: 'query', name: 'page', required: false, schema: { default: 1, type: 'integer' } },
					{
						in: 'query',
						name: 'pageSize',
						required: false,
						schema: { default: 15, type: 'integer' }
					},
					{
						in: 'query',
						name: 'sortDate',
						required: false,
						schema: { $ref: '#/components/schemas/SortDirection' }
					},
					{
						in: 'query',
						name: 'sortAmount',
						required: false,
						schema: { $ref: '#/components/schemas/SortDirection' }
					},
					{
						in: 'query',
						name: 'sortAccount',
						required: false,
						schema: { $ref: '#/components/schemas/SortDirection' }
					},
					{
						in: 'query',
						name: 'sortCategory',
						required: false,
						schema: { $ref: '#/components/schemas/SortDirection' }
					},
					{
						in: 'query',
						name: 'sortValidated',
						required: false,
						schema: { $ref: '#/components/schemas/SortDirection' }
					}
				],
				responses: {
					'200': {
						content: {
							'application/json': { schema: { $ref: '#/components/schemas/TransactionPage' } }
						},
						description: 'One page of register rows plus the unpaged total.'
					},
					'401': { $ref: '#/components/responses/Unauthorized' },
					'404': { $ref: '#/components/responses/NotFound' },
					'426': { $ref: '#/components/responses/UpgradeRequired' }
				},
				summary: 'Paged transaction register of one account.',
				tags: ['register']
			},
			post: {
				description:
					'A transaction without `categoryId` is income (money to Unassigned). Writing to an archived account is rejected with `account_archived` (ADR-0011). Transfers are out of the MVP surface — web only.',
				operationId: 'createTransaction',
				parameters: [
					{ $ref: '#/components/parameters/ClientVersion' },
					{ $ref: '#/components/parameters/ViewMonth' }
				],
				requestBody: {
					content: {
						'application/json': { schema: { $ref: '#/components/schemas/TransactionCreate' } }
					},
					required: true
				},
				responses: {
					'201': {
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/TransactionWriteResult' }
							}
						},
						description: 'The created transaction plus recomputed envelope aggregates.'
					},
					'400': { $ref: '#/components/responses/BadRequest' },
					'401': { $ref: '#/components/responses/Unauthorized' },
					'404': { $ref: '#/components/responses/NotFound' },
					'426': { $ref: '#/components/responses/UpgradeRequired' }
				},
				summary: 'Capture a transaction.',
				tags: ['transactions']
			}
		},

		'/transactions/{transactionId}': {
			delete: {
				description:
					'Deleting a transfer leg deletes the whole transfer — both legs — so `deletedIds` may contain two ids (ADR-0015).',
				operationId: 'deleteTransaction',
				parameters: [
					{ $ref: '#/components/parameters/ClientVersion' },
					{ $ref: '#/components/parameters/TransactionId' },
					{ $ref: '#/components/parameters/ViewMonth' }
				],
				responses: {
					'200': {
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/TransactionDeleteResult' }
							}
						},
						description: 'The deleted ids plus recomputed envelope aggregates.'
					},
					'401': { $ref: '#/components/responses/Unauthorized' },
					'404': { $ref: '#/components/responses/NotFound' },
					'426': { $ref: '#/components/responses/UpgradeRequired' }
				},
				summary: 'Delete a transaction.',
				tags: ['transactions']
			},
			patch: {
				description:
					'Transfer legs cannot be edited here (`transaction_is_transfer_leg`, ADR-0015). Note the domain quirk mirrored from the web app: an edit that omits `validated` resets it to `false` — editing un-reconciles.',
				operationId: 'updateTransaction',
				parameters: [
					{ $ref: '#/components/parameters/ClientVersion' },
					{ $ref: '#/components/parameters/TransactionId' },
					{ $ref: '#/components/parameters/ViewMonth' }
				],
				requestBody: {
					content: {
						'application/json': { schema: { $ref: '#/components/schemas/TransactionEdit' } }
					},
					required: true
				},
				responses: {
					'200': {
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/TransactionWriteResult' }
							}
						},
						description: 'The updated transaction plus recomputed envelope aggregates.'
					},
					'400': { $ref: '#/components/responses/BadRequest' },
					'401': { $ref: '#/components/responses/Unauthorized' },
					'404': { $ref: '#/components/responses/NotFound' },
					'426': { $ref: '#/components/responses/UpgradeRequired' }
				},
				summary: 'Edit a transaction.',
				tags: ['transactions']
			}
		},

		'/transfers': {
			post: {
				description:
					'Creates both legs atomically (ADR-0015): a negative leg on `fromAccountId`, a positive one on `toAccountId`, sharing a `transferId`. Budget-neutral — no envelope impact. Deleting a transfer happens through `deleteTransaction` on either leg.',
				operationId: 'createTransfer',
				parameters: [{ $ref: '#/components/parameters/ClientVersion' }],
				requestBody: {
					content: {
						'application/json': { schema: { $ref: '#/components/schemas/TransferCreate' } }
					},
					required: true
				},
				responses: {
					'201': {
						content: {
							'application/json': { schema: { $ref: '#/components/schemas/TransferResult' } }
						},
						description: 'Both legs plus the two recomputed account balances.'
					},
					'400': { $ref: '#/components/responses/BadRequest' },
					'401': { $ref: '#/components/responses/Unauthorized' },
					'404': { $ref: '#/components/responses/NotFound' },
					'426': { $ref: '#/components/responses/UpgradeRequired' }
				},
				summary: 'Move money between two accounts.',
				tags: ['transfers']
			}
		},

		'/transfers/{transferId}': {
			patch: {
				description:
					'`validated` is deliberately untouched — each leg reconciles against its own account statement (ADR-0015).',
				operationId: 'updateTransfer',
				parameters: [
					{ $ref: '#/components/parameters/ClientVersion' },
					{
						in: 'path',
						name: 'transferId',
						required: true,
						schema: { minLength: 1, type: 'string' }
					}
				],
				requestBody: {
					content: {
						'application/json': { schema: { $ref: '#/components/schemas/TransferEdit' } }
					},
					required: true
				},
				responses: {
					'200': {
						content: {
							'application/json': { schema: { $ref: '#/components/schemas/TransferResult' } }
						},
						description: 'Both updated legs plus recomputed account balances.'
					},
					'400': { $ref: '#/components/responses/BadRequest' },
					'401': { $ref: '#/components/responses/Unauthorized' },
					'404': { $ref: '#/components/responses/NotFound' },
					'426': { $ref: '#/components/responses/UpgradeRequired' }
				},
				summary: 'Edit a transfer (both legs stay consistent).',
				tags: ['transfers']
			}
		}
	},

	security: [{ pat: [] }],

	servers: [
		{
			description:
				'Relative to the self-hosted instance root; iOS clients take the absolute base URL from the QR payload `serverUrl`.',
			url: '/api/v1'
		}
	],

	tags: [
		{ description: 'Budget discovery after QR connect.', name: 'budgets' },
		{ description: "The month-scoped envelope view — the app's main screen.", name: 'envelope' },
		{ description: 'Accounts and categories for the capture form.', name: 'reference' },
		{ description: 'The paged, filterable transaction register of an account.', name: 'register' },
		{ description: 'Capture, correct, and delete transactions.', name: 'transactions' },
		{ description: 'Two-leg transfers between accounts (ADR-0015).', name: 'transfers' },
		{
			description: 'Set or move the assigned amount of a category for a month.',
			name: 'assignments'
		}
	]
};
