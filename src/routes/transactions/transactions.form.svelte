<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import type { PageData } from './create/$types';
	import { transactionFormSchema } from './schema';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { Input } from '$lib/components/ui/input';
	import * as Select from '$lib/components/ui/select';
	import { createToastFromFormMessage } from '$lib/utils';
	import { Calendar } from '$lib/components/ui/calendar';
	import * as Popover from '$lib/components/ui/popover';
	import * as Form from '$lib/components/ui/form';
	import { cn } from '$lib/utils';
	import {
		today,
		getLocalTimeZone,
		DateFormatter,
		parseDate,
		type DateValue
	} from '@internationalized/date';
	import LucideCalendarDays from '~icons/lucide/calendar-days';
	import { buttonVariants } from '$lib/components/ui/button';
	import { currencyInputProps } from '$lib/components/utils';
	import { Checkbox } from '$lib/components/ui/checkbox';

	export let data: PageData;

	const form = superForm(data.form, {
		validators: zodClient(transactionFormSchema),
		onUpdated(event) {
			if (event.form.message) {
				createToastFromFormMessage(event.form.message);
			}
		},
		onResult(event) {
			if (event.result.type === 'redirect') {
				createToastFromFormMessage({
					type: 'success',
					text: 'Transaction created successfully'
				});
			}
		}
	});

	const { form: formData, enhance } = form;

	const df = new DateFormatter('en-US', {
		dateStyle: 'long'
	});
	let value: DateValue | undefined;
	$: value = $formData.date
		? parseDate($formData.date)
		: today(getLocalTimeZone());
	let placeholder: DateValue = today(getLocalTimeZone());

	$: selectedAccount = $formData.accountId
		? {
				label: data.accounts.find((a) => a.id === $formData.accountId)?.name,
				value: $formData.accountId
			}
		: undefined;

	$: selectedCategory = $formData.categoryId
		? {
				label: data.categories.find((c) => c.id === $formData.categoryId)?.name,
				value: $formData.categoryId
			}
		: {
				label: 'No Category',
				value: null
			};

	/**
	 * Make only categories selectable
	 * that match the selected account's team/user
	 */
	$: availableCategories = data.categories.filter((category) => {
		const team = data.accounts.find(
			(account) => account.id === $formData.accountId
		)?.team;
		if (team) {
			return category.team?.id === team.id;
		} else {
			return category.team === null;
		}
	});
</script>

<div class="mx-auto mb-6"></div>

<form class="grid max-w-md items-start gap-2" method="POST" use:enhance>
	<slot name="header" />

	<Form.Field {form} name="date" class="flex flex-col">
		<Form.Control let:attrs>
			<Form.Label>Date</Form.Label>
			<Popover.Root>
				<Popover.Trigger
					{...attrs}
					class={cn(
						buttonVariants({ variant: 'outline' }),
						'my-0.5 justify-start pl-4 text-left font-normal',
						!value && 'text-muted-foreground'
					)}
				>
					{value ? df.format(value.toDate(getLocalTimeZone())) : 'Pick a date'}
					<LucideCalendarDays class="ml-auto opacity-50" />
				</Popover.Trigger>
				<Popover.Content class="w-auto p-0" side="top">
					<Calendar
						{value}
						bind:placeholder
						calendarLabel="Date"
						initialFocus
						onValueChange={(v) => {
							if (v) {
								$formData.date = v.toString();
							} else {
								$formData.date = '';
							}
						}}
					/>
				</Popover.Content>
			</Popover.Root>
			<Form.FieldErrors />
			<input hidden value={$formData.date} name={attrs.name} />
		</Form.Control>
	</Form.Field>

	<Form.Field {form} name="accountId">
		<Form.Control let:attrs>
			<Form.Label>Account</Form.Label>
			<Select.Root
				selected={selectedAccount}
				onSelectedChange={(v) => {
					v && ($formData.accountId = v.value);
					$formData.categoryId = null;
				}}
			>
				<Select.Trigger {...attrs}>
					<Select.Value placeholder="Select Account" />
				</Select.Trigger>
				<Select.Content>
					{#each data.accounts as account (account.id)}
						<Select.Item value={account.id} label={account.name} />
					{/each}
				</Select.Content>
			</Select.Root>
			<input hidden bind:value={$formData.accountId} name={attrs.name} />
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>

	<Form.Field {form} name="categoryId">
		<Form.Control let:attrs>
			<Form.Label>Category</Form.Label>
			<Select.Root
				selected={selectedCategory}
				onSelectedChange={(v) => {
					v && ($formData.categoryId = v.value);
				}}
			>
				<Select.Trigger {...attrs}>
					<Select.Value placeholder="Select Category" />
				</Select.Trigger>
				<Select.Content>
					<Select.Item value={null} label="No Category" />
					{#each availableCategories as category (category.id)}
						<Select.Item value={category.id} label={category.name} />
					{/each}
				</Select.Content>
			</Select.Root>
			<input hidden bind:value={$formData.categoryId} name={attrs.name} />
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>

	<Form.Field {form} name="description">
		<Form.Control let:attrs>
			<Form.Label>
				Description
				<span class="text-xs text-muted-foreground"> (optional) </span>
			</Form.Label>
			<Input {...attrs} bind:value={$formData.description} />
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>

	<Form.Field {form} name="flow">
		<Form.Control let:attrs>
			<Form.Label>Amount</Form.Label>
			<Input {...attrs} type="number" bind:value={$formData.flow} />
		</Form.Control>
		<Form.Description>{currencyInputProps.information}</Form.Description>
		<Form.FieldErrors />
	</Form.Field>

	<Form.Field
		{form}
		name="validated"
		class="flex items-center justify-start gap-2"
	>
		<Form.Control let:attrs>
			<Checkbox {...attrs} bind:checked={$formData.validated} />

			<Form.Label>Validated</Form.Label>

			<input name={attrs.name} value={$formData.validated} hidden />
		</Form.Control>
	</Form.Field>

	<Form.Button class="mt-4 flex items-center">
		<slot name="submit_icon" />
		<slot name="submit_text" />
	</Form.Button>
</form>
