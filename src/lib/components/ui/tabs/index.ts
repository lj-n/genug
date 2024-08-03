import { Tabs as TabsPrimitive } from 'bits-ui';
import Content from './tabs-content.svelte';
import List from './tabs-list.svelte';
import Trigger from './tabs-trigger.svelte';
import TriggerLink from './tabs-trigger-link.svelte';

const Root = TabsPrimitive.Root;

export {
	Root,
	Content,
	List,
	Trigger,
	TriggerLink,
	//
	Root as Tabs,
	Content as TabsContent,
	List as TabsList,
	Trigger as TabsTrigger,
	TriggerLink as TabsTriggerLink
};
