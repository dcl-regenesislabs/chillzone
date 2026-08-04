import { ColliderLayer, engine, Entity, MeshCollider, Transform } from "@dcl/sdk/ecs"
import { Quaternion, Vector3 } from "@dcl/sdk/math"
import { AnimationDataType, InteractionData } from "./interactionTypes"
import { addInteractionSpot, InteractiveObjectColliderSwitch, InteractiveObjectVisibilitySwitch } from "./interactiveObject"
import { getWorldTransform } from "./sittingUtils"

export function addCustomInteraction(
    parent: Entity,
    animType: AnimationDataType,
    turnsOffCollider: boolean,
    turnsOffVisibility: boolean,
    callback: () => void,
    // Entity that actually holds the GltfContainer to toggle collision on
    // while seated (switchColliderOff/On need a GltfContainer to exist on
    // this entity). Defaults to `parent`, but when `parent` is a bare seat
    // anchor (no GltfContainer of its own — the mesh lives on some other,
    // shared furniture entity), pass that furniture entity here instead.
    colliderTarget: Entity = parent
): { clickBox: Entity; spot: Entity } {
    const { position: worldPosition, rotation: worldRotation } = getWorldTransform(parent)
    const seatRotation = Quaternion.multiply(worldRotation, animType.rotationOffset)

    const clickBox = engine.addEntity()
    Transform.createOrReplace(clickBox, {
        position: Vector3.add(worldPosition, Vector3.rotate(animType.highlightOffset, seatRotation)),
        scale: Vector3.create(1.2, 1.2, 1.2),
    })
    MeshCollider.setBox(clickBox, ColliderLayer.CL_POINTER)

    const teleportPosition = Vector3.add(worldPosition, Vector3.rotate(animType.teleportOffset, seatRotation))
    if (animType.absoluteHeight !== undefined) {
        teleportPosition.y = animType.absoluteHeight
    }

    const interactionData: InteractionData = {
        transform: {
            position: teleportPosition,
            rotation: seatRotation,
        },
        animData: animType,
        clickBox: clickBox,
        clickDistance: animType.distance,
        loop: animType.loop,
    }

    const spot = addInteractionSpot(interactionData, callback)
    if (turnsOffCollider) {
        InteractiveObjectColliderSwitch.createOrReplace(spot, { parent: colliderTarget })
    }
    if (turnsOffVisibility) {
        InteractiveObjectVisibilitySwitch.createOrReplace(spot, { parent: colliderTarget })
    }

    return { clickBox, spot }
}
