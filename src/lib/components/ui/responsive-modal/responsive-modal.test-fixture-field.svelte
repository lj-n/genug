<script lang="ts">
	// Component-scoped state, standing in for unsaved form input. A breakpoint
	// flip that remounts the slotted content destroys this component and resets
	// the value — the regression #363 guards against.
	let value = $state('');
</script>

<label>
	Name
	<input bind:value />
</label>
