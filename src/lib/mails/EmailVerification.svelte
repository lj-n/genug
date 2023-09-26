<script lang="ts">
	import { dev } from '$app/environment';
	import { Html, Body, Button, Hr, Text } from 'svelte-email';

	export let name: string;
	export let token: string;

	const href = dev ? `http://localhost:5173/email-verification/${token}` : `livesite//${token}`;
</script>

<Html lang="en">
	<Body>
		<Text>
			Hello, {name}!
		</Text>
		<Hr />
		<Text>Please verify your email address by clicking the button below.</Text>
		<Hr />
		<Button {href}>Verify Email Address</Button>
	</Body>
</Html>
