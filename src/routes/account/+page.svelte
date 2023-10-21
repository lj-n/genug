<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<pre>
  {JSON.stringify(data, null, 2)}
</pre>

<ul>
	{#each data.accounts as account (account.id)}
		<li>
			<a href="/account/{account.id}">{account.name}</a>
		</li>
	{/each}
</ul>

<form use:enhance method="post" action="?/createUserAccount">
	<div class="form-control w-full max-w-xs">
		<label class="label" for="accountName">
			<span class="label-text">Create a new account</span>
		</label>
		<input
			type="text"
			id="accountName"
			name="accountName"
			placeholder="Type here"
			class="input input-bordered w-full"
		/>
	</div>
  
  <button type="submit" class="btn btn-primary btn-sm">create account</button>
</form>
