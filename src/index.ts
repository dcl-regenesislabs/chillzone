import { Vector3, Quaternion } from '@dcl/sdk/math'
import { ReactEcsRenderer } from '@dcl/sdk/react-ecs'
import { setupPortals } from './portals'
import { initEventBoard, createCinematicUI, EVENT_BOARD_TYPE } from './eventBoard'


export function main() {
    setupPortals()

    // Live events board (fetches events.decentraland.org). Needs ~12m clear in front.
    initEventBoard(
        {
            position: Vector3.create(19.571, 5.065, 38.921),
            rotation: Quaternion.fromEulerDegrees(0, 0, 0), // flipped 180° to face inward
            scale: Vector3.create(0.7, 0.7, 0.7)
        },
        {
            type: EVENT_BOARD_TYPE.LIVE,
            hoverText: 'VIEW LIVE EVENTS',
            // Module title disabled: the scene uses a hardcoded editor sign
            // (live_events_hc) placed above the board instead.
            showTitle: false
        }
    )

    // Required for the cinematic black bars when the board opens.
    ReactEcsRenderer.setUiRenderer(createCinematicUI)
}
