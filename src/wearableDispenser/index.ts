// Public API of the wearable-dispenser module.
export { createDispenser } from './dispenser'
export type { DispenserOptions } from './dispenser'
export { claimWearable } from './claim'
export { DispenserClaimOverlay, setupDispenserUi, showClaimPending, showClaimDone, hideClaim } from './claimUi'
export { WEARABLE_CONFIG } from './config'
