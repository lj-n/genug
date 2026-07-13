<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Collapsible from '$lib/components/ui/collapsible';
	import { FormField } from '$lib/components/ui/form-field';
	import * as InputGroup from '$lib/components/ui/input-group';
	import { m } from '$lib/paraglide/messages';
	import { findEligibleUser, inviteUser } from '$lib/remote-functions/budget.remote';
	import { getBudgetId } from '$lib/utils/budget-id-context';
	import { createFormSubmit } from '$lib/utils/form-submit.svelte';
	import { ParaglideMessage } from '@inlang/paraglide-js-svelte';
	import { cn } from 'tailwind-variants';
	import CaretUpDownIcon from '~icons/ph/caret-up-down';

	const budgetId = getBudgetId();

	const submit = createFormSubmit(() => inviteUser, {
		onSuccess: (form) => form.element.reset(),
		toast: { success: () => m.budget_users_invite_sent() }
	});

	let debouncedUsername: string | undefined = $state();

	$effect(() => {
		const current = inviteUser.fields.inviteeName.value();
		const t = setTimeout(() => (debouncedUsername = current), 300);
		return () => clearTimeout(t);
	});

	const findUserResult = $derived(
		debouncedUsername
			? findEligibleUser({ budgetId: budgetId(), inviteeName: debouncedUsername })
			: null
	);
</script>

<Collapsible.Root class="mt-6 space-y-2">
	<Collapsible.Trigger
		class={cn(buttonVariants({ variant: 'ghost' }), 'w-full gap-4 px-0.5 font-medium')}
	>
		{m.budget_users_invite_trigger()}

		<div class="h-px grow bg-muted/20"></div>

		<CaretUpDownIcon />
	</Collapsible.Trigger>

	<Collapsible.Content
		class="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down"
	>
		<form {...submit.attrs} class="grid gap-2">
			<input {...inviteUser.fields.budgetId.as('hidden', budgetId())} />

			<div class="rounded-lg bg-info/5 p-3 text-sm text-info">
				<ParaglideMessage message={m.budget_users_invite_warning} inputs={{}}>
					{#snippet b({ children })}
						<b>{@render children?.()}</b>
					{/snippet}
				</ParaglideMessage>
			</div>

			<div class="flex w-full items-center gap-2 rounded-lg bg-muted/5 p-3">
				<FormField
					class="w-full"
					field={inviteUser.fields.inviteeName}
					label={m.admin_input_placeholder_username()}
					hideLabel
				>
					{#snippet input(field)}
						<InputGroup.Root>
							<InputGroup.Input
								{...field.as('text')}
								placeholder={m.admin_input_placeholder_username()}
								class="w-full bg-transparent text-base"
							/>

							<InputGroup.Addon align="block-end" class="text-xs font-normal">
								{#if findUserResult?.current?.userId}
									<div class="flex items-center gap-1 text-success">
										{m.budget_users_invite_success()}
									</div>
								{:else}
									<div class="flex items-center gap-1 text-muted">
										{m.budget_users_username_case_hint()}
									</div>
								{/if}

								<Button
									type="submit"
									class="ms-auto"
									aria-disabled={!findUserResult?.current?.userId}
									loading={submit.pending}
									{@attach submit.anchor}
								>
									{m.budget_users_invite_button()}
								</Button>
							</InputGroup.Addon>
						</InputGroup.Root>
					{/snippet}
				</FormField>
			</div>
		</form>
	</Collapsible.Content>
</Collapsible.Root>
