<script lang="ts">
	// Component-scoped state standing in for unsaved form input: a remount would
	// reset it, which is the regression #363 guards against.
	let value = $state('');
</script>

<label>
	Name
	<input bind:value />
</label>
