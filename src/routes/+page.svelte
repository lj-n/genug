<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import PhAlien from '~icons/ph/alien';
	import { Input } from '$lib/components/ui/input';
	import { resolve } from '$app/paths';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as InputGroup from '$lib/components/ui/input-group';
</script>

<div class="flex h-400 max-w-xs flex-col gap-10 px-5 py-20">
	<div class="flex flex-col gap-2">
		<p>Normal text</p>

		<p class="text-muted">Muted text</p>

		<p>
			<a href={resolve('/')} class="link">Link</a>
		</p>
	</div>

	<div class="flex flex-wrap gap-2">
		<Button>Button</Button>

		<Button variant="hint">
			<PhAlien />
			Hint
		</Button>

		<Button variant="destructive">
			<PhAlien />
			Destructive
		</Button>

		<Button variant="ghost">Ghost</Button>

		<Button variant="link">Link Button</Button>
	</div>

	<Input placeholder="Text input" />

	<Textarea placeholder="Textarea" />

	<InputGroup.Root>
		<InputGroup.Input placeholder="Ask, Search or Chat..." />

		<InputGroup.Addon align="block-end">
			<InputGroup.Button size="icon">
				<PhAlien />
			</InputGroup.Button>

			<InputGroup.Text class="ms-auto">52% used</InputGroup.Text>

			<InputGroup.Button size="icon">
				<PhAlien />
				<span class="sr-only">Send</span>
			</InputGroup.Button>
		</InputGroup.Addon>
	</InputGroup.Root>
</div>
