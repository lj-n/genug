import type { StandardSchemaV1 } from '@standard-schema/spec';

import { command, form, getRequestEvent, query } from '$app/server';
import { database } from '$db';
import { createUserCtx, type UserCtx } from '$db/user-context';
import {
	type InvalidField,
	redirect,
	type RemoteCommand,
	type RemoteForm,
	type RemoteFormInput,
	type RemoteQueryFunction,
	type RequestEvent
} from '@sveltejs/kit';

const LOGINPAGE = '/login';

type GuardedAuth = {
	ctx: UserCtx;
	event: RequestEvent;
	user: NonNullable<App.Locals['user']>;
};

export function guardedBatchQuery<Schema extends StandardSchemaV1, Output>(
	schema: Schema,
	fn: (
		args: StandardSchemaV1.InferOutput<Schema>[],
		auth: GuardedAuth
	) => Promise<(arg: StandardSchemaV1.InferOutput<Schema>, idx: number) => Output>
): RemoteQueryFunction<
	StandardSchemaV1.InferInput<Schema>,
	Output,
	StandardSchemaV1.InferOutput<Schema>
> {
	return query.batch(schema, async (args) => {
		const event = getRequestEvent();
		if (!event.locals.user) redirect(302, LOGINPAGE);
		const user = event.locals.user;
		const ctx = createUserCtx(user.id, database);
		return fn(args, { ctx, event, user });
	});
}
export function guardedCommand<Schema extends StandardSchemaV1, Output>(
	schema: Schema,
	fn: (output: StandardSchemaV1.InferOutput<Schema>, auth: GuardedAuth) => Promise<Output>
): RemoteCommand<StandardSchemaV1.InferInput<Schema>, Output | { redirect: string }>;
export function guardedCommand<Input, Output>(
	fn: (input: Input, auth: GuardedAuth) => Promise<Output>
): RemoteCommand<Input, Output | { redirect: string }>;
export function guardedCommand<Schema extends StandardSchemaV1, Input, Output>(
	schemaOrFn: ((input: Input, auth: GuardedAuth) => Promise<Output>) | Schema,
	maybeFn?: (output: StandardSchemaV1.InferOutput<Schema>, auth: GuardedAuth) => Promise<Output>
) {
	if (isStandardSchema(schemaOrFn) && typeof maybeFn === 'function') {
		return command(schemaOrFn, async (output) => {
			const event = getRequestEvent();
			if (!event.locals.user) return { redirect: LOGINPAGE };
			const user = event.locals.user;
			const ctx = createUserCtx(user.id, database);
			return await maybeFn(output, { ctx, event, user });
		});
	}

	if (typeof schemaOrFn === 'function' && !maybeFn) {
		return command('unchecked', async (input: Input) => {
			const event = getRequestEvent();
			if (!event.locals.user) return { redirect: LOGINPAGE };
			const user = event.locals.user;
			const ctx = createUserCtx(user.id, database);
			return await schemaOrFn(input, { ctx, event, user });
		});
	}

	throw new Error('Invalid arguments');
}
export function guardedForm<
	Schema extends StandardSchemaV1<RemoteFormInput, Record<string, unknown>>,
	Output
>(
	schema: Schema,
	fn: (
		output: StandardSchemaV1.InferOutput<Schema>,
		auth: GuardedAuth & {
			invalid: InvalidField<StandardSchemaV1.InferInput<Schema>>;
		}
	) => Promise<Output>
): RemoteForm<StandardSchemaV1.InferInput<Schema>, Output>;
export function guardedForm<Input extends RemoteFormInput, Output>(
	schema: 'unchecked',
	fn: (
		output: Input,
		auth: GuardedAuth & {
			invalid: InvalidField<Input>;
		}
	) => Promise<Output>
): RemoteForm<Input, Output>;
export function guardedForm<Output>(
	fn: (auth: GuardedAuth) => Promise<Output>
): RemoteForm<void, Output>;
export function guardedForm<
	Schema extends StandardSchemaV1<RemoteFormInput, Record<string, unknown>>,
	Input extends RemoteFormInput,
	Output
>(
	schemaOrFn: 'unchecked' | ((auth: GuardedAuth) => Promise<Output>) | Schema,
	maybeFn?:
		| ((
				input: Input,
				auth: GuardedAuth & {
					invalid: InvalidField<Input>;
				}
		  ) => Promise<Output>)
		| ((
				output: StandardSchemaV1.InferOutput<Schema>,
				auth: GuardedAuth & {
					invalid: InvalidField<StandardSchemaV1.InferInput<Schema>>;
				}
		  ) => Promise<Output>)
) {
	if (isStandardSchema(schemaOrFn) && typeof maybeFn === 'function') {
		const fn = maybeFn as (
			output: StandardSchemaV1.InferOutput<Schema>,
			auth: GuardedAuth & {
				invalid: InvalidField<StandardSchemaV1.InferInput<Schema>>;
			}
		) => Promise<Output>;
		// SvelteKit 2.69 added a DX guard that rejects form schemas with a
		// non-optional boolean, because unchecked *checkboxes* send no value. It
		// can't see through this generic wrapper, and genug submits booleans via
		// hidden inputs (which round-trip 'on'/'off'), so re-type `form` to its
		// pre-guard shape here rather than force every boolean field optional.
		const typedForm = form as unknown as (
			schema: Schema,
			handler: (
				output: StandardSchemaV1.InferOutput<Schema>,
				invalid: InvalidField<StandardSchemaV1.InferInput<Schema>>
			) => Promise<Output>
		) => RemoteForm<StandardSchemaV1.InferInput<Schema>, Output>;
		return typedForm(schemaOrFn, async (output, invalid) => {
			const event = getRequestEvent();
			if (!event.locals.user) redirect(302, LOGINPAGE);
			const user = event.locals.user;
			const ctx = createUserCtx(user.id, database);
			return await fn(output, { ctx, event, invalid, user });
		});
	}

	if (typeof schemaOrFn === 'string' && typeof maybeFn === 'function') {
		const fn = maybeFn as (
			input: Input,
			auth: GuardedAuth & {
				invalid: InvalidField<Input>;
			}
		) => Promise<Output>;
		return form(schemaOrFn, async (input: Input, invalid) => {
			const event = getRequestEvent();
			if (!event.locals.user) redirect(302, LOGINPAGE);
			const user = event.locals.user;
			const ctx = createUserCtx(user.id, database);
			return await fn(input, { ctx, event, invalid, user });
		});
	}

	if (typeof schemaOrFn === 'function' && !maybeFn) {
		return form(async () => {
			const event = getRequestEvent();
			if (!event.locals.user) redirect(302, LOGINPAGE);
			const user = event.locals.user;
			const ctx = createUserCtx(user.id, database);
			return await schemaOrFn({ ctx, event, user });
		});
	}

	throw new Error('Invalid arguments');
}

export function guardedQuery<Schema extends StandardSchemaV1, Output>(
	schema: Schema,
	fn: (output: StandardSchemaV1.InferOutput<Schema>, auth: GuardedAuth) => Promise<Output>
): RemoteQueryFunction<StandardSchemaV1.InferInput<Schema>, Output>;
export function guardedQuery<Output>(
	fn: (auth: GuardedAuth) => Promise<Output>
): RemoteQueryFunction<void, Output>;
export function guardedQuery<Schema extends StandardSchemaV1, Output>(
	schemaOrFn: ((auth: GuardedAuth) => Promise<Output>) | Schema,
	maybeFn?: (output: StandardSchemaV1.InferOutput<Schema>, auth: GuardedAuth) => Promise<Output>
) {
	if (isStandardSchema(schemaOrFn) && typeof maybeFn === 'function') {
		return query(schemaOrFn, (output) => {
			const event = getRequestEvent();
			if (!event.locals.user) redirect(302, LOGINPAGE);
			const user = event.locals.user;
			const ctx = createUserCtx(user.id, database);
			return maybeFn(output, { ctx, event, user });
		});
	}

	if (typeof schemaOrFn === 'function' && !maybeFn) {
		return query(() => {
			const event = getRequestEvent();
			if (!event.locals.user) redirect(302, LOGINPAGE);
			const user = event.locals.user;
			const ctx = createUserCtx(user.id, database);
			return schemaOrFn({ ctx, event, user });
		});
	}

	throw new Error('Invalid arguments');
}

function isStandardSchema(schema: unknown): schema is StandardSchemaV1 {
	return typeof schema === 'object' && schema !== null && '~standard' in schema;
}
