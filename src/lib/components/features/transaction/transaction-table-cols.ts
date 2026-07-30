import { hoverOutline } from '$lib/components/ui/focus-ring';

// Read and edit modes share these tracks and the px-2 text inset so toggling
// edit moves nothing. minmax(0,…) instead of bare 1fr: the edit controls'
// min-content width would otherwise shift the columns between modes.
export const colsClass =
	'grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.5fr)_minmax(0,0.5fr)_5rem]';

// Every cell carries its own bottom + left hairline; first-of-type (not
// first-child — hidden form inputs may precede the cells) drops the
// frame-adjacent left one. The border sits inside the min-h border-box so text
// centers identically read ⇄ edit. In the nav-hidden band (@3xl→@max-7xl) rows
// grow to a 44px touch minimum; ≥7xl (pointer) snaps back to min-h-9.
export const cellClass =
	'grid min-h-9 border-b border-l border-muted/10 p-0 first-of-type:border-l-0 @3xl/main:min-h-11 @7xl/main:min-h-9';

// Read-mode click-to-edit trigger. Focus lifts above hover (z-20 vs z-10) so a
// hovered neighbour's surface fill never paints over the focused cell's
// outline where the ring overlaps the shared cell edge.
export const cellTriggerClass = `relative flex size-full cursor-pointer items-center justify-start px-2 text-left hover:z-10 hover:bg-surface ${hoverOutline} focus-visible:z-20`;

// Edit-mode control: keeps the trigger's px-2 (pixel-lock) and mirrors its
// hover/focus layering. text-base pins the read-mode (inherited) font size —
// Button-based controls like DatePicker would otherwise drop to the Button
// base's text-sm when the cell enters edit mode.
export const editInputClass = `h-full w-full justify-start rounded-none border-0 bg-transparent px-2 text-base shadow-none hover:z-10 hover:bg-surface ${hoverOutline} focus-visible:z-20`;

// Open-row footer actions rest at size="xs" (24px) — too small to tap. Grown
// to 44px in the nav-hidden band, back to xs geometry ≥7xl (pointer).
export const footerButtonTouchClass =
	'@3xl/main:h-11 @3xl/main:gap-1.5 @3xl/main:px-4 @3xl/main:text-sm @7xl/main:h-6 @7xl/main:gap-1 @7xl/main:px-2 @7xl/main:text-xs';

// The SelectCategory container already wraps a px-2 input, so it goes px-0
// itself; min-w-0 on container and input stops the trigger caret from
// overflowing the cell in narrow minmax(0,…) tracks.
export const editSelectClass = 'min-w-0 px-0 [&>input]:min-w-0';

// Open edit/create rows: form-input tint plus a light interactive ring (gold
// stays reserved for keyboard focus).
export const editRowClass = 'relative z-10 bg-interactive/5 ring-1 ring-interactive/40';
