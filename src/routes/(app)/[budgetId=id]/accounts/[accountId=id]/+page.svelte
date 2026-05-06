<script lang="ts">
	import * as Page from '$lib/components/ui/page';

	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<Page.Root>
	<Page.Header>
		<Page.Title>
			{data.account.name}
		</Page.Title>
	</Page.Header>

	<Page.Content>hello</Page.Content>
</Page.Root>
