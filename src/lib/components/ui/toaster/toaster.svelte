<script lang="ts">
	import { toasts } from '$lib/utils/anchored-toast.svelte';

	import ToastBubble from './toast-bubble.svelte';
</script>

{#each toasts as toast (toast.id)}
	<ToastBubble {toast} />
{/each}
