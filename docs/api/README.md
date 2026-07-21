# API contract (`openapi.yaml`)

`openapi.yaml` is the published OpenAPI 3.1 contract for the additive HTTP API
(map [#190](https://github.com/lj-n/genug/issues/190)). It is **generated** —
do not edit it by hand. It feeds `swift-openapi-generator` in the iOS repo and is
verified against the live server by a decode-contract test.

## Two owners, one document (map decision 6)

- **Request bodies are derived.** The six mutating inputs (`TransactionCreate`,
  `TransactionEdit`, `AssignmentSet`, `ReassignmentSet`, `TransferCreate`,
  `TransferEdit`) are converted from the valibot schemas in `src/lib/schemas/`
  via `@valibot/to-json-schema`, so the published request shape can never drift
  from what the server validates. See `src/lib/server/api/derive.ts`.
- **Responses are hand-authored.** Everything else — paths, parameters, and the
  envelope-view response schemas — lives in `src/lib/server/api/contract.ts`.
  The envelope schemas mirror `src/lib/server/db/user-context/envelope.ts` by
  hand and are the contract's biggest drift risk.

## Regenerate

```bash
npm run api:generate
```

The assembler (`src/lib/server/api/openapi.ts`) merges the derived request
schemas into the hand-authored contract and writes `openapi.yaml`. The generator
runs through Vite's module loader so it can import the aliased, Paraglide-backed
valibot schemas.

## Guarding against drift

`src/lib/server/api/openapi.test.ts` (part of `npm run test:unit`):

- **Decode-contract test** — seeds a real database, runs the actual
  `user-context` envelope queries, serializes the result as JSON (as the HTTP
  layer will), and asserts it decodes against the published envelope response
  schemas. This is the only thing that catches a hand-authored response schema
  drifting from the domain output.
- **Sync test** — fails if `openapi.yaml` is stale; run `npm run api:generate`
  and commit the result.
