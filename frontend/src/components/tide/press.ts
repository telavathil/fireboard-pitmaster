/**
 * Press feedback for every button in the tide world: a quick, subtle scale on
 * the world's one curve. Under reduced motion the scale becomes a slight dim.
 */
export const PRESS =
  "transition-transform duration-150 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.98] motion-reduce:active:scale-100 motion-reduce:active:opacity-80";

/** Small targets (chips, icon and step buttons) need a little more scale to read. */
export const PRESS_SMALL =
  "transition-transform duration-150 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.97] motion-reduce:active:scale-100 motion-reduce:active:opacity-80";
