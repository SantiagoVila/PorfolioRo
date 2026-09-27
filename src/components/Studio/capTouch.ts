/** Whether a touch at this point starts on the cap resting on the desk (its footprint, see StudioScene). */
export function onCap(x: number, y: number) {
  const r = document.querySelector('[data-slot="cap"]')?.getBoundingClientRect();
  return !!r && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
}
