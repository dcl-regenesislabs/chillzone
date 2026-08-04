import ReactEcs, { ReactEcsRenderer, UiEntity } from '@dcl/sdk/react-ecs'
import { createCinematicUI } from './eventBoard'
import { DispenserClaimOverlay } from './wearableDispenser'

// A scene has a single UI renderer, so both the event board's cinematic bars and
// the wearable dispenser's claim overlay are composed here into one root.
export function setupSceneUi() {
    ReactEcsRenderer.setUiRenderer(() => (
        <UiEntity uiTransform={{ width: '100%', height: '100%', positionType: 'absolute' }}>
            {createCinematicUI()}
            <DispenserClaimOverlay />
        </UiEntity>
    ))
}
