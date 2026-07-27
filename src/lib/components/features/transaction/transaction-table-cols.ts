// Shared register-table geometry (#259). Read and edit modes render the SAME
// cells with the same tracks and the same px-2 text inset, so toggling edit
// moves nothing (pixel-lock). fr tracks use minmax(0,…) because a bare 1fr
// track flexes with the edit controls' min-content width and would shift the
// columns between modes.
export const colsClass =
	'grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.5fr)_minmax(0,0.5fr)_5rem]';

// Excel-style grid cell: every cell carries its own bottom + left hairline
// (first-of-type drops the frame-adjacent left one — hidden form inputs may
// precede the cells, hence -of-type). The border sits inside the min-h-9
// border-box in both modes, so text centers identically read ⇄ edit.
// Touch band (#297): in the nav-hidden band (@3xl→@max-7xl) rows grow to a
// 44px min so cells are comfortably tappable; ≥7xl (sidebar back = pointer)
// snaps to the resting min-h-9. Both read + edit cells share this const, so
// the pixel-lock holds at every width.
export const cellClass =
	'grid min-h-9 border-b border-l border-muted/10 p-0 first-of-type:border-l-0 @3xl/main:min-h-11 @7xl/main:min-h-9';

// Read-mode click-to-edit trigger: fills the cell so hover/focus feedback
// sits at the cell edge (design-language interaction-layer rules). Focus
// lifts one level above hover (z-20 vs z-10) so a hovered neighbour's surface
// fill never paints over the focused cell's gold outline where the ring
// overlaps the shared cell edge (#275).
export const cellTriggerClass =
	'relative flex size-full cursor-pointer items-center justify-start px-2 text-left hover:z-10 hover:bg-surface hover:outline-1 hover:-outline-offset-1 hover:outline-foreground/50 focus-visible:z-20';

// Edit-mode control: borderless, fills the whole cell, keeps the trigger's
// px-2 so the text does not move when the row switches read ⇄ edit. Hover
// mirrors the read triggers (surface fill + neutral outline) so every edit
// cell reacts the same way the date trigger does. Focus lifts above hover
// (z-20 vs z-10) so a hovered neighbour never clips the focus outline (#275).
export const editInputClass =
	'h-full w-full justify-start rounded-none border-0 bg-transparent px-2 shadow-none hover:z-10 hover:bg-surface hover:outline-1 hover:-outline-offset-1 hover:outline-foreground/50 focus-visible:z-20';

// Touch band (#297): the open-row footer actions (Cancel / Save / Save &
// continue, on both the transaction and transfer create + edit rows) rest at
// `size="xs"` (24px) — too small to tap. In the nav-hidden band (@3xl→@max-7xl)
// they grow to a 44px touch target; ≥7xl (pointer) they snap back to the xs
// resting geometry. Applied via `class` alongside `size="xs"`.
export const footerButtonTouchClass =
	'@3xl/main:h-11 @3xl/main:gap-1.5 @3xl/main:px-4 @3xl/main:text-sm @7xl/main:h-6 @7xl/main:gap-1 @7xl/main:px-2 @7xl/main:text-xs';

// SelectCategory extras: the container already wraps a px-2 input, so it goes
// px-0 itself; min-w-0 on container and input stops the trigger caret from
// overflowing the cell in narrow minmax(0,…) tracks.
export const editSelectClass = 'min-w-0 px-0 [&>input]:min-w-0';

// Uniform open-form treatment for edit and create rows: the form-input tint
// across the whole row plus a light interactive ring marking the active row
// (gold stays reserved for keyboard focus).
export const editRowClass = 'relative z-10 bg-interactive/5 ring-1 ring-interactive/40';
