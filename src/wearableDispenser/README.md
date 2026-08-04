# Wearable Dispenser (drop-in module)

Animated base + spinning wearable on top; click the wearable to claim a free DCL
wearable via the Rewards API. Shows a status overlay: **"New item on the way" → "Received!"** + **GOT IT**.

Self-contained and **code-based** (no Creator Hub / composite setup needed).

## Contents
```
wearableDispenser/
  index.ts        # public API (import from here)
  dispenser.ts    # createDispenser() — base + spinning wearable + click-to-claim
  claim.ts        # claimWearable() — signed POST to the Rewards API
  claimUi.tsx     # status overlay + <DispenserClaimOverlay/> + setupDispenserUi()
  config.ts       # campaign config (edit this)
  models/
    dispenser_1.glb     # animated base
    wearable_male.glb   # spinning prize (sample)
    wearable_female.glb # spinning prize (sample)
```

## Install
1. **Copy the whole `wearableDispenser/` folder** into your scene (keeping it at the scene
   root makes the default model paths work as-is).
2. **Edit `config.ts`** → set your own `campaignId` and `campaignKey` (from DCL Rewards).
3. **Swap the wearable model** if you want (drop your `.glb` in `models/` and pass its path).

## Usage
```ts
import { createDispenser, DispenserClaimOverlay } from './wearableDispenser'

export function main() {
  // ...your scene setup...

  createDispenser({
    position: { x: 8, y: 0, z: 8 },
    rotation: { x: 0, y: 180, z: 0 },
    scale: 1,
    wearableModel: 'wearableDispenser/models/wearable_male.glb',
    wearableOffsetY: 1.5,               // height of the wearable above the base
    hoverText: 'Claim your free wearable'
  })
}
```

### The status overlay (required)
The claim needs the overlay to be rendered. Two options:

- **If your scene already renders React UI** — add the component to your root:
  ```tsx
  import { DispenserClaimOverlay } from './wearableDispenser'
  // inside your root UI component:
  <DispenserClaimOverlay />
  ```
- **If your scene has no other UI** — let the module own the renderer:
  ```ts
  import { setupDispenserUi } from './wearableDispenser'
  setupDispenserUi()   // call once in main()
  ```
  ⚠️ Don't call `setupDispenserUi()` if you already use `ReactEcsRenderer.setUiRenderer` —
  a scene has only one UI renderer; add `<DispenserClaimOverlay/>` to yours instead.

## Notes
- **Base animations**: `dispenser.ts` plays the clips baked into `dispenser_1.glb`
  (`BASE_CLIPS`). If you swap the base model, update those clip names.
- **Claim flow**: uses `signedFetch` (server-signs with the player's wallet) → POST to
  `rewards.decentraland.org`. One claim per session is guarded; re-clicking after success
  just re-shows "Received!".
- **Wallet**: needs the player to be connected with a wallet (`getPlayer().userId`);
  guests can't claim.
- **`campaign_key`** is fine to keep in client code for non-captcha campaigns.
- No external image/sfx dependencies — the GOT IT button is a styled label.
```
