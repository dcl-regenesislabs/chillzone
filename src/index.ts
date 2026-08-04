import { Vector3, Quaternion } from '@dcl/sdk/math'
import { engine, pointerEventsSystem, InputAction, PointerEvents, GltfContainer, Transform } from '@dcl/sdk/ecs'
import { ReactEcsRenderer } from '@dcl/sdk/react-ecs'
import { openExternalUrl } from '~system/RestrictedActions'
import { EntityNames } from '../assets/scene/entity-names'
import { setupPortals } from './portals'
import { initEventBoard, createCinematicUI, EVENT_BOARD_TYPE } from './eventBoard'
import { initInteractionSystem } from './sitting/interactiveObject'
import { setupChairsAndSofasSitting } from './sitting/setupChairsAndSofas'


export function main() {
    setupPortals()

    initInteractionSystem()
    setupChairsAndSofasSitting()

    // Live events board (fetches events.decentraland.org). Needs ~12m clear in front.
    initEventBoard(
        {
            position: Vector3.create(19.571, 5.065, 38.921),
            rotation: Quaternion.fromEulerDegrees(0, 0, 0),
            scale: Vector3.create(0.7, 0.7, 0.7)
        },
        {
            type: EVENT_BOARD_TYPE.LIVE,
            hoverText: 'VIEW LIVE EVENTS',
            // Module title disabled: a hardcoded live_events sign is placed instead.
            showTitle: false
        }
    )

    // Required for the cinematic black bars when the board opens.
    ReactEcsRenderer.setUiRenderer(createCinematicUI)

    // Hardcoded "LIVE EVENTS" sign. Was an editor entity ('live_events_hc') on this
    // branch; recreated in code so it survives merges with main's scene edits.
    const liveEventsSign = engine.addEntity()
    Transform.create(liveEventsSign, {
        position: Vector3.create(18.668247643469826, 0.7421513349423279, 20.936584),
        rotation: Quaternion.create(0, -0.9246822, 0, 0.3807399),
        scale: Vector3.create(1, 1, 1)
    })
    GltfContainer.create(liveEventsSign, {
        src: 'models/live_events.glb',
        visibleMeshesCollisionMask: 3
    })

    const smartphone = engine.getEntityOrNullByName(EntityNames.SmartPhone)
    if (smartphone) {
        pointerEventsSystem.onPointerDown(
            {
                entity: smartphone,
                opts: { button: InputAction.IA_POINTER, hoverText: 'Follow Decentraland on X' },
            },
            () => {
                openExternalUrl({ url: 'https://x.com/decentraland' })
            }
        )
    }

    const laptop = engine.getEntityOrNullByName(EntityNames.Laptop)
    if (laptop) {
        // Clear the stale declarative PointerEvents ("Interact") left by the
        // scene editor so only the handler below is registered.
        PointerEvents.createOrReplace(laptop, { pointerEvents: [] })

        pointerEventsSystem.onPointerDown(
            {
                entity: laptop,
                opts: { button: InputAction.IA_POINTER, hoverText: 'Check out whats on' },
            },
            () => {
                openExternalUrl({ url: 'https://decentraland.org/whats-on' })
            }
        )
    }
}
