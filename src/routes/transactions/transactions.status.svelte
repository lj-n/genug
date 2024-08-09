<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import type { PageData } from './$types';

	export let transaction: PageData['transactions'][number];
</script>

{#if transaction.validated}
	<Badge>Validated</Badge>
{:else}
	<Badge variant="secondary">Pending</Badge>
{/if}
