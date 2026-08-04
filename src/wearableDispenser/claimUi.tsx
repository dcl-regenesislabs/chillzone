import ReactEcs, { ReactEcsRenderer, UiEntity, Label } from '@dcl/sdk/react-ecs'
import { Color4 } from '@dcl/sdk/math'

// ── Claim status overlay: "New item on the way" → "Received!" + GOT IT ──────────
// State is module-local; claim.ts drives it via the exported setters.
const state = { visible: false, done: false }
export function showClaimPending() { state.visible = true;  state.done = false }
export function showClaimDone()    { state.visible = true;  state.done = true }
export function hideClaim()        { state.visible = false }

const OVERLAY = Color4.create(0, 0, 0, 0.6)
const DARK    = Color4.fromHexString('#160f28ff')
const TEAL    = Color4.fromHexString('#18A187ff')
const VIOLET  = Color4.fromHexString('#9f78e7ff')

// Add this component to your scene's existing React UI tree.
export const DispenserClaimOverlay = () => {
  if (!state.visible) return <UiEntity uiTransform={{ display: 'none' }} />
  const done = state.done
  return (
    <UiEntity
      uiTransform={{
        width: '100%', height: '100%', positionType: 'absolute', position: { top: 0, left: 0 },
        flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        pointerFilter: 'block'
      }}
      uiBackground={{ color: OVERLAY }}
    >
      <UiEntity
        uiTransform={{
          width: 640, height: done ? 340 : 260, padding: 44,
          flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between',
          borderRadius: 28
        }}
        uiBackground={{ color: DARK }}
      >
        <Label
          value={done ? 'Received!' : 'New item on the way'}
          fontSize={36} color={done ? TEAL : VIOLET}
          uiTransform={{ width: '100%', height: 54 }}
        />
        <Label
          value={done
            ? 'The wearable is on its way to your wallet — check your backpack.'
            : 'Claiming your wearable...'}
          fontSize={18} color={Color4.create(0.75, 0.75, 0.75, 1)}
          uiTransform={{ width: '100%', height: 60 }}
        />
        {done && (
          <UiEntity
            uiTransform={{ width: 220, height: 66, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 14 }}
            uiBackground={{ color: VIOLET }}
            onMouseDown={() => hideClaim()}
          >
            <Label value="GOT IT" fontSize={24} color={Color4.White()} />
          </UiEntity>
        )}
      </UiEntity>
    </UiEntity>
  )
}

// Convenience: ONLY use this if your scene has no other React UI. It takes over the
// single UI renderer. If you already render UI, add <DispenserClaimOverlay/> to your
// own root instead of calling this.
export function setupDispenserUi() {
  ReactEcsRenderer.setUiRenderer(() => <DispenserClaimOverlay />)
}
