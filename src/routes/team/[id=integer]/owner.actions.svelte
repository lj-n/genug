<script lang="ts">
	import { enhance } from '$app/forms';
	import type { schema } from '$lib/server';

	export let userId: string;
	export let role: typeof schema.teamMember.$inferSelect.role;
</script>

<form method="post" use:enhance>
	<input type="hidden" name="userId" value={userId} />

  {#if role === 'MEMBER'}
    <button
      formaction="?/makeOwner"
      type="submit"
      class="btn btn-xs btn-outline btn-info"
    >
      make owner
    </button>
  {/if}
  
	{#if role === 'INVITED'}
		<button
			formaction="?/cancelInvitation"
			type="submit"
			class="btn btn-xs btn-outline btn-error"
		>
			cancel invitation
		</button>
	{:else}
		<button
			formaction="?/removeMember"
			type="submit"
			class="btn btn-xs btn-outline btn-error"
		>
			remove from team
		</button>
	{/if}

</form>
