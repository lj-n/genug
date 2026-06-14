import type { StandardSchemaV1 } from '@standard-schema/spec';

import { command, form, getRequestEvent, query } from '$app/server';
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

export function guardedCommand<Schema extends StandardSchemaV1, Output>(
	schema: Schema,
	fn: (
		output: StandardSchemaV1.InferOutput<Schema>,
		auth: { event: RequestEvent; user: NonNullable<App.Locals['user']> }
	) => Promise<Output>
): RemoteCommand<StandardSchemaV1.InferInput<Schema>, Promise<Output | { redirect: string }>>;
export function guardedCommand<Input, Output>(
	fn: (
		input: Input,
		auth: { event: RequestEvent; user: NonNullable<App.Locals['user']> }
	) => Promise<Output>
): RemoteCommand<Input, Promise<Output | { redirect: string }>>;
export function guardedCommand<Schema extends StandardSchemaV1, Input, Output>(
	schemaOrFn:
		| ((
				input: Input,
				auth: { event: RequestEvent; user: NonNullable<App.Locals['user']> }
		  ) => Promise<Output>)
		| Schema,
	maybeFn?: (
		output: StandardSchemaV1.InferOutput<Schema>,
		auth: { event: RequestEvent; user: NonNullable<App.Locals['user']> }
	) => Promise<Output>
) {
	// Handle the case with schema parameter (first overload)
	if (isStandardSchema(schemaOrFn) && typeof maybeFn === 'function') {
		return command(schemaOrFn, async (output) => {
			const event = getRequestEvent();
			if (!event.locals.user) return { redirect: LOGINPAGE };
			return await maybeFn(output, { event, user: event.locals.user });
		});
	}

	// Handle the case where there's no schema parameter (second overload)
	if (typeof schemaOrFn === 'function' && !maybeFn) {
		return command('unchecked', async (input: Input) => {
			const event = getRequestEvent();
			if (!event.locals.user) return { redirect: LOGINPAGE };
			return await schemaOrFn(input, { event, user: event.locals.user });
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
		auth: {
			event: RequestEvent;
			invalid: InvalidField<StandardSchemaV1.InferInput<Schema>>;
			user: NonNullable<App.Locals['user']>;
		}
	) => Promise<Output>
): RemoteForm<StandardSchemaV1.InferInput<Schema>, Output>;
export function guardedForm<Input extends RemoteFormInput, Output>(
	schema: 'unchecked',
	fn: (
		output: Input,
		auth: {
			event: RequestEvent;
			invalid: InvalidField<Input>;
			user: NonNullable<App.Locals['user']>;
		}
	) => Promise<Output>
): RemoteForm<Input, Output>;
export function guardedForm<Output>(
	fn: (auth: { event: RequestEvent; user: NonNullable<App.Locals['user']> }) => Promise<Output>
): RemoteForm<void, Output>;
export function guardedForm<
	Schema extends StandardSchemaV1<RemoteFormInput, Record<string, unknown>>,
	Input extends RemoteFormInput,
	Output
>(
	schemaOrFn:
		| 'unchecked'
		| ((auth: { event: RequestEvent; user: NonNullable<App.Locals['user']> }) => Promise<Output>)
		| Schema,
	maybeFn?:
		| ((
				input: Input,
				auth: {
					event: RequestEvent;
					invalid: InvalidField<Input>;
					user: NonNullable<App.Locals['user']>;
				}
		  ) => Promise<Output>)
		| ((
				output: StandardSchemaV1.InferOutput<Schema>,
				auth: {
					event: RequestEvent;
					invalid: InvalidField<StandardSchemaV1.InferInput<Schema>>;
					user: NonNullable<App.Locals['user']>;
				}
		  ) => Promise<Output>)
) {
	// Handle the case with schema parameter (first overload)
	if (isStandardSchema(schemaOrFn) && typeof maybeFn === 'function') {
		const fn = maybeFn as (
			output: StandardSchemaV1.InferOutput<Schema>,
			auth: {
				event: RequestEvent;
				invalid: InvalidField<StandardSchemaV1.InferInput<Schema>>;
				user: NonNullable<App.Locals['user']>;
			}
		) => Promise<Output>;
		return form(schemaOrFn, async (output, invalid) => {
			const event = getRequestEvent();
			if (!event.locals.user) redirect(302, LOGINPAGE);
			return await fn(output, { event, invalid, user: event.locals.user });
		});
	}

	// Handle the case with unchecked schema parameter (second overload)
	if (typeof schemaOrFn === 'string' && typeof maybeFn === 'function') {
		const fn = maybeFn as (
			input: Input,
			auth: {
				event: RequestEvent;
				invalid: InvalidField<Input>;
				user: NonNullable<App.Locals['user']>;
			}
		) => Promise<Output>;
		return form(schemaOrFn, async (input: Input, invalid) => {
			const event = getRequestEvent();
			if (!event.locals.user) redirect(302, LOGINPAGE);
			return await fn(input, { event, invalid, user: event.locals.user });
		});
	}

	// Handle the case where there's no schema parameter (third overload)
	if (typeof schemaOrFn === 'function' && !maybeFn) {
		return form(async () => {
			const event = getRequestEvent();
			if (!event.locals.user) redirect(302, LOGINPAGE);
			return await schemaOrFn({ event, user: event.locals.user });
		});
	}

	throw new Error('Invalid arguments');
}

export function guardedQuery<Schema extends StandardSchemaV1, Output>(
	schema: Schema,
	fn: (
		output: StandardSchemaV1.InferOutput<Schema>,
		auth: { event: RequestEvent; user: NonNullable<App.Locals['user']> }
	) => Promise<Output>
): RemoteQueryFunction<StandardSchemaV1.InferInput<Schema>, Promise<Output>>;
export function guardedQuery<Output>(
	fn: (auth: { event: RequestEvent; user: NonNullable<App.Locals['user']> }) => Promise<Output>
): RemoteQueryFunction<void, Promise<Output>>;
export function guardedQuery<Schema extends StandardSchemaV1, Output>(
	schemaOrFn:
		| ((auth: { event: RequestEvent; user: NonNullable<App.Locals['user']> }) => Promise<Output>)
		| Schema,
	maybeFn?: (
		output: StandardSchemaV1.InferOutput<Schema>,
		auth: { event: RequestEvent; user: NonNullable<App.Locals['user']> }
	) => Promise<Output>
) {
	// Handle the case with schema parameter (first overload)
	if (isStandardSchema(schemaOrFn) && typeof maybeFn === 'function') {
		return query(schemaOrFn, (output) => {
			const event = getRequestEvent();
			if (!event.locals.user) redirect(302, LOGINPAGE);
			return maybeFn(output, { event, user: event.locals.user });
		});
	}

	// Handle the case where there's no schema parameter (second overload)
	if (typeof schemaOrFn === 'function' && !maybeFn) {
		return query(() => {
			const event = getRequestEvent();
			if (!event.locals.user) redirect(302, LOGINPAGE);
			return schemaOrFn({ event, user: event.locals.user });
		});
	}

	throw new Error('Invalid arguments');
}

function isStandardSchema(schema: unknown): schema is StandardSchemaV1 {
	return typeof schema === 'object' && schema !== null && '~standard' in schema;
}
