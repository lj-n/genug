import {
	ApiReassignmentSchema,
	ApiTransferCreateSchema,
	ApiTransferEditSchema
} from '$lib/schemas/api';
import { AssignmentSchema } from '$lib/schemas/budget';
import { TransactionCreateSchema, TransactionEditSchema } from '$lib/schemas/transaction';
import { toJsonSchema } from '@valibot/to-json-schema';
import * as v from 'valibot';

/**
 * The request-body half of the OpenAPI contract (map #190 decision 6).
 *
 * Every mutating input is DERIVED from the valibot schema that already guards
 * the web app, so the published request shape can never drift from what the
 * server validates. The response half — the envelope-view schemas — is
 * hand-authored in `contract.ts` and guarded instead by the decode-contract
 * test in `openapi.test.ts`.
 *
 * `typeMode: 'input'` reads the pre-transform side of `MoneySchema` /
 * `MonthSchema` (a plain integer, not the branded output); `errorMode:
 * 'ignore'` drops the `check`/`transform` pipes those brands carry rather than
 * throwing on them. Keep the keys identical to the `$ref` names the paths in
 * `contract.ts` point at.
 */
const REQUEST_SCHEMAS = {
	AssignmentSet: AssignmentSchema,
	ReassignmentSet: ApiReassignmentSchema,
	TransactionCreate: TransactionCreateSchema,
	// The transaction id travels in the path, not the body.
	TransactionEdit: v.omit(TransactionEditSchema, ['transactionId']),
	TransferCreate: ApiTransferCreateSchema,
	TransferEdit: ApiTransferEditSchema
} as const;

export type JsonSchema = Record<string, unknown>;

export type RequestSchemaName = keyof typeof REQUEST_SCHEMAS;

const DERIVATION_OPTIONS = { errorMode: 'ignore', typeMode: 'input' } as const;

export function deriveRequestSchemas(): Record<RequestSchemaName, JsonSchema> {
	const derived = {} as Record<RequestSchemaName, JsonSchema>;
	for (const name of Object.keys(REQUEST_SCHEMAS) as RequestSchemaName[]) {
		const jsonSchema = toJsonSchema(REQUEST_SCHEMAS[name], DERIVATION_OPTIONS) as JsonSchema;
		derived[name] = normalize(jsonSchema);
	}
	return derived;
}

/**
 * `@valibot/to-json-schema` stamps a draft-07 `$schema` and can emit an empty
 * `required: []` — both are noise (or invalid) inside an OpenAPI 3.1 component.
 */
function normalize(schema: JsonSchema): JsonSchema {
	const { $schema: _schema, ...rest } = schema;
	if (Array.isArray(rest.required) && rest.required.length === 0) {
		delete rest.required;
	}
	return rest;
}
