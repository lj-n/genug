<script lang="ts">
	import { buttonVariants } from '$lib/components/ui/button';
	import type { PageData } from './$types';
    import LucideEdit from '~icons/lucide/edit';

	export let transaction: PageData['transactions'][number];
</script>

<a
	href="/transactions/{transaction.id}/edit"
	class={buttonVariants({
		variant: 'ghost',
		size: 'icon'
	})}
>
	<LucideEdit class='text-muted-foreground hover:text-foreground' />
	<span class="sr-only"> Edit This Transaction </span>
</a>
