import { Vector3, Quaternion } from '@dcl/sdk/math'
import { engine, pointerEventsSystem, InputAction, PointerEvents, GltfContainer, Transform, MeshRenderer, Material } from '@dcl/sdk/ecs'
import { openExternalUrl } from '~system/RestrictedActions'
import { EntityNames } from '../assets/scene/entity-names'
import { setupPortals } from './portals'
import { initEventBoard, EVENT_BOARD_TYPE } from './eventBoard'
import { initInteractionSystem } from './sitting/interactiveObject'
import { setupChairsAndSofasSitting } from './sitting/setupChairsAndSofas'
import { createDispenser } from './wearableDispenser'
import { setupSceneUi } from './sceneUi'


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

    // Single UI renderer for the whole scene: event-board cinematic bars +
    // wearable-dispenser claim overlay (composed in sceneUi.tsx).
    setupSceneUi()

    // Dispenser base. Was an editor entity ('dispenser_1'); recreated in code so it
    // survives merges with main's scene edits. Static (no animation), matching the editor.
    const dispenserBase = engine.addEntity()
    Transform.create(dispenserBase, {
        position: Vector3.create(43.42067231508288, 0.9208523970248381, 4.538772986874858),
        rotation: Quaternion.fromEulerDegrees(0, 0, 0),
        scale: Vector3.create(0.8, 0.8, 0.8)
    })
    GltfContainer.create(dispenserBase, { src: 'wearableDispenser/models/dispenser_1.glb', visibleMeshesCollisionMask: 3 })

    // Spinning claimable emote on top (base above is placed separately).
    createDispenser({
        position: { x: 37.232, y: 0.532, z: 21.763 },
        rotation: { x: 0, y: 180, z: 0 },
        wearableModel: 'assets/scene/Models/BringYourVibeFix_(2)_emote/BringYourVibeFix_(2)_emote.glb',
        scale: 1.5,           // a bit bigger
        wearableOffsetY: 1.3, // higher
        hoverText: 'Claim your free emote',
        showBase: false
    })

    // "CLAIM" sign floating above and slightly behind the claimable laptop.
    const claimSign = engine.addEntity()
    Transform.create(claimSign, {
        position: Vector3.create(38.3232, 4.6, 21.7),
        rotation: Quaternion.fromEulerDegrees(0, 90, 0), // rotated 180° to face the other way
        scale: Vector3.create(3.56, 1, 1) // FREE_CLAIM.png is ~3.56:1
    })
    MeshRenderer.setPlane(claimSign)
    Material.setBasicMaterial(claimSign, {
        texture: Material.Texture.Common({ src: 'images/FREE_CLAIM.png' }),
        alphaTexture: Material.Texture.Common({ src: 'images/FREE_CLAIM.png' })
    })

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
