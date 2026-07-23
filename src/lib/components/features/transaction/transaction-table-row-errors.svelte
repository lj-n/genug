<script lang="ts">
	import type { RemoteFormIssue } from '@sveltejs/kit';

	let { issues }: { issues: RemoteFormIssue[] | undefined } = $props();
</script>

{#if issues?.length}
	<!-- No own background: the open edit/create row is tinted uniformly. -->
	<div role="cell" class="col-span-full px-2 py-1">
		<p role="alert" class="text-sm text-error">
			{issues.map((issue) => issue.message).join(' · ')}
		</p>
	</div>
{/if}
