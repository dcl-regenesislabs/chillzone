# Portals Kit (from Tower of Madness)

Drop-in portal system for Decentraland SDK7. Copy the folders keeping the same
paths (or update the `*_SRC` constants at the top of `src/portal.ts`).

## Files

- `src/portal.ts` — self-contained Portal class (only depends on `@dcl/sdk`)
- `assets/scene/Models/portals/*.glb` — frame, arrows, doors, vortex layer, info card panel + thumbnail plane
- `assets/images/*.png` — per-destination thumbnails (replace with your own)

## Usage

```typescript
import { changeRealm } from '~system/RestrictedActions'
import { Portal } from './portal'

const portal = new Portal({
  position: { x: 40, y: 5, z: 40 },
  size: 1.4,
  name: 'Cozy Farm',                       // info card title
  thumbnail: 'assets/images/CozyFarm.png', // info card image
  hoverText: 'Go to Cozy Farm',
  onActivate: () => {
    void changeRealm({ realm: 'cozyfarm.dcl.eth', message: 'Jump to cozyfarm.dcl.eth?' })
  }
})

portal.update(position, rotation?, size?) // reposition (cheap, per-frame OK)
portal.updateInfo(name?, thumbnail?)      // change title/image (NOT per-frame)
portal.setVisible(true | false)
```

## Gotchas

1. **Scene bounds**: if the portal sits outside your parcels the engine culls it
   entirely (invisible, no error). Check position ± ~1.5m is inside bounds.
2. **Rotation**: the front (vortex/cards) faces `rotation.y`; add 180 if it
   renders backwards.
3. **Client-only**: decorative, not synced. If your scene uses the `isServer()`
   pattern, create portals only on the client branch.
4. **`changeRealm` needs no scene.json permission** — it shows the player a
   confirmation dialog with your `message`.
5. **Physics colliders**: frame and doors block walking through. Activation is
   a click on the door (hover text), not walk-through.
6. **Recent SDK7 required**: uses `GltfNodeModifiers`, `LightSource`, `Tween`,
   `TextShape`.
7. Doors auto-open at 5m and close at 6.5m (`DOOR_OPEN_DIST` / `DOOR_CLOSE_DIST`).
