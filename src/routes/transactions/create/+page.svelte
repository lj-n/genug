<script lang="ts">
    import type { PageData } from './$types';
    import * as Form from '$lib/components/ui/form';
    import { Input } from '$lib/components/ui/input';
    import * as Select from '$lib/components/ui/select';
    import { superForm } from 'sveltekit-superforms';

    import CreateTransactionForm from '../transactions.form.svelte';

    export let data: PageData;
</script>

<CreateTransactionForm {data}/>