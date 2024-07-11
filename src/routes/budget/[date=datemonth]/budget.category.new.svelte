<script lang="ts">
	import Feather from '$lib/components/feather.svelte';
import { Button } from '$lib/components/ui/button';

	import * as Drawer from '$lib/components/ui/drawer';
</script>

<Drawer.Root>
	<Drawer.Trigger asChild let:builder>
		<Button builders={[builder]} variant="outline" class="mt-6 ml-auto">
            <Feather name="plus" class="mr-2" />
            Create New Category
        </Button>
	</Drawer.Trigger>
	<Drawer.Content>
		<div class="mx-auto w-full max-w-sm">
			<Drawer.Header>
				<Drawer.Title></Drawer.Title>
				<Drawer.Description>Set your daily activity goal.</Drawer.Description>
			</Drawer.Header>
			<div class="p-4 pb-0">
				<div class="flex items-center justify-center space-x-2">hello</div>
				<Drawer.Footer>
					<Button>Submit</Button>
					<Drawer.Close asChild let:builder>
						<Button builders={[builder]} variant="outline">Cancel</Button>
					</Drawer.Close>
				</Drawer.Footer>
			</div>
		</div></Drawer.Content
	>
</Drawer.Root>
