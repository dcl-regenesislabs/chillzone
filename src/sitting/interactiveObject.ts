import { ColliderLayer, engine, Entity, GltfContainer, InputAction, inputSystem, PointerEvents, pointerEventsSystem, PointerEventType, Schemas, Transform, VisibilityComponent } from "@dcl/sdk/ecs"
import { Vector3 } from "@dcl/sdk/math"
import { isMobile } from "@dcl/sdk/platform"
import { movePlayerTo, triggerEmote, triggerSceneEmote } from "~system/RestrictedActions"
import { InteractionData, preLoadAnimations } from "./interactionTypes"
import { compareDistance, delay_ms_cb, realDistance } from "./sittingUtils"
import { addInteractionHighlights, getHighlightFromPool, hideActiveHover, hideInteractionHighlights, setActiveHover, setInteractionHighlight, showInteractionHighlight } from "./interactionHighlight"
import { movementAll, movementEmoteOnly } from "./playerMovement"

let objectInteractionActive = false

export function isPlayerInteractingWithObjects(): boolean {
    return objectInteractionActive
}

export function initInteractionSystem() {
    engine.addSystem(InteractionSystem)
    addInteractionHighlights(10)
    preLoadAnimations()
}

export const InteractiveObjectColliderSwitch = engine.defineComponent('interactive-object-collider-switch', {
    parent: Schemas.Entity,
})
export const InteractiveObjectVisibilitySwitch = engine.defineComponent('interactive-object-visibility-switch', {
    parent: Schemas.Entity,
})

export const InteractiveObject = engine.defineComponent('interactive-object', {
    animationClips: Schemas.Array(Schemas.String),
    animationType: Schemas.String,
    isTeleporting: Schemas.Boolean,
    isPredefinedEmote: Schemas.Boolean,
    teleportPosition: Schemas.Vector3,
    facingDirection: Schemas.Vector3,
    mobileHeightOffset: Schemas.Number,
    mobileForwardOffset: Schemas.Number,
    taken: Schemas.Boolean,
    hoverText: Schemas.String,
    clickBox: Schemas.Entity,
    loop: Schemas.Boolean,
})

function switchColliderOff(entity: Entity) {
    if (InteractiveObjectColliderSwitch.has(entity)) {
        const colliderInfo = InteractiveObjectColliderSwitch.get(entity)
        GltfContainer.getMutable(colliderInfo.parent).invisibleMeshesCollisionMask = ColliderLayer.CL_NONE
    }
}

function switchColliderOn(entity: Entity) {
    if (InteractiveObjectColliderSwitch.has(entity)) {
        const colliderInfo = InteractiveObjectColliderSwitch.get(entity)
        GltfContainer.getMutable(colliderInfo.parent).invisibleMeshesCollisionMask = ColliderLayer.CL_PHYSICS
    }
}

function switchVisibilityOn(entity: Entity) {
    if (InteractiveObjectVisibilitySwitch.has(entity)) {
        const visibilityInfo = InteractiveObjectVisibilitySwitch.get(entity)
        VisibilityComponent.getMutable(visibilityInfo.parent).visible = true
    }
}

let lastObjectInteractionEntity: Entity | null = null

function startInteraction(entity: Entity) {
    movementEmoteOnly()

    const objInfo = InteractiveObject.get(entity)
    switchColliderOff(entity)

    InteractiveObject.getMutable(entity).taken = true
    hideInteractionHighlights()
    hideActiveHover()

    let randomIndex = Math.floor(Math.random() * objInfo.animationClips.length)
    if (randomIndex >= objInfo.animationClips.length) randomIndex = 0
    const randomEmote = objInfo.animationClips[randomIndex]

    if (objInfo.isPredefinedEmote) {
        triggerEmote({ predefinedEmote: randomEmote })
    } else {
        delay_ms_cb(200, () => {
            triggerSceneEmote({ src: randomEmote, loop: objInfo.loop })
        })
    }

    // Mobile-only nudge (amount varies per anim type — chairs vs sofas need
    // different corrections). Checked here (not baked at setup) since
    // isMobile() only resolves after the scene has been running a moment.
    // Forward push uses facingDirection (already rotated per-seat), not a
    // raw Z add, since each seat faces a different way.
    let teleportPosition = objInfo.teleportPosition
    if (isMobile()) {
        teleportPosition = Vector3.create(teleportPosition.x, teleportPosition.y + objInfo.mobileHeightOffset, teleportPosition.z)
        teleportPosition = Vector3.add(teleportPosition, Vector3.scale(objInfo.facingDirection, objInfo.mobileForwardOffset))
    }

    if (objInfo.isTeleporting) {
        movePlayerTo({
            newRelativePosition: teleportPosition,
            avatarTarget: Vector3.add(teleportPosition, objInfo.facingDirection)
        })
    } else {
        movePlayerTo({
            avatarTarget: teleportPosition,
            newRelativePosition: Transform.get(engine.PlayerEntity).position,
        })
    }

    objectInteractionActive = true
    lastObjectInteractionEntity = entity

    delay_ms_cb(1000, () => {
        movementAll()
    })
}

export function stopInteraction() {
    objectInteractionActive = false
    showInteractionHighlight()

    if (lastObjectInteractionEntity !== null) {
        switchColliderOn(lastObjectInteractionEntity)
        switchVisibilityOn(lastObjectInteractionEntity)
    }
}

export function InteractionSystem() {
    const interactiveObjects = engine.getEntitiesWith(InteractiveObject, Transform)

    let closestSpots: Entity[] = []
    const maxDistance = 10

    for (const [entity, objInfo, transform] of interactiveObjects) {
        if (inputSystem.isTriggered(InputAction.IA_POINTER, PointerEventType.PET_DOWN, objInfo.clickBox)) {
            if (!isPlayerInteractingWithObjects()) {
                startInteraction(entity)
            } else {
                stopInteraction()
                startInteraction(entity)
            }
        }
        if (inputSystem.isTriggered(InputAction.IA_POINTER, PointerEventType.PET_HOVER_ENTER, objInfo.clickBox) && !isPlayerInteractingWithObjects()) {
            setActiveHover(Transform.get(objInfo.clickBox).position)
        }
        if (inputSystem.isTriggered(InputAction.IA_POINTER, PointerEventType.PET_HOVER_LEAVE, objInfo.clickBox)) {
            hideActiveHover()
        }

        const distance = realDistance(Transform.get(engine.PlayerEntity).position, transform.position)
        if (distance < maxDistance) {
            closestSpots.push(entity)
        }
    }

    if (closestSpots.length > 0 && !isPlayerInteractingWithObjects()) {
        closestSpots.sort(compareDistance)
        for (const spotEntity of closestSpots) {
            const highlight = getHighlightFromPool()
            if (highlight != null) {
                const spotInfo = InteractiveObject.get(spotEntity)
                const dist = realDistance(Transform.get(engine.PlayerEntity).position, Transform.get(spotEntity).position)
                const size = Math.min(0.1 / dist, 0.1)
                setInteractionHighlight(highlight, Transform.get(spotInfo.clickBox).position, size, spotEntity)
            }
        }
    }

    if (isPlayerInteractingWithObjects()) {
        const exitActions = [InputAction.IA_FORWARD, InputAction.IA_BACKWARD, InputAction.IA_LEFT, InputAction.IA_RIGHT, InputAction.IA_JUMP]
        for (const action of exitActions) {
            if (inputSystem.isTriggered(action, PointerEventType.PET_DOWN)) {
                stopInteraction()
            }
        }
    }
}

export function addInteractionSpot(interactionData: InteractionData, callback: () => void): Entity {
    const spot = engine.addEntity()
    const transform = interactionData.transform
    Transform.createOrReplace(spot, transform)

    PointerEvents.create(interactionData.clickBox, {
        pointerEvents: [
            {
                eventType: PointerEventType.PET_DOWN,
                eventInfo: {
                    button: InputAction.IA_POINTER,
                    showFeedback: true,
                    maxDistance: interactionData.clickDistance,
                    hoverText: interactionData.animData.hoverText
                },
            },
            {
                eventType: PointerEventType.PET_HOVER_ENTER,
                eventInfo: {
                    button: InputAction.IA_POINTER,
                    showFeedback: true,
                    maxDistance: interactionData.clickDistance,
                    hoverText: interactionData.animData.hoverText
                },
            },
            {
                eventType: PointerEventType.PET_HOVER_LEAVE,
                eventInfo: {
                    button: InputAction.IA_POINTER,
                    showFeedback: true,
                    maxDistance: interactionData.clickDistance,
                },
            },
        ],
    })

    pointerEventsSystem.onPointerDown(
        {
            entity: interactionData.clickBox,
            opts: {
                button: InputAction.IA_POINTER,
                showFeedback: false,
                maxDistance: interactionData.clickDistance,
                showHighlight: false,
            }
        },
        () => {
            callback()
        }
    )

    const facingDirection = Vector3.rotate(Vector3.Forward(), transform.rotation)

    InteractiveObject.createOrReplace(spot, {
        loop: interactionData.loop,
        teleportPosition: transform.position,
        isTeleporting: interactionData.animData.teleportsPlayer,
        facingDirection: facingDirection,
        mobileHeightOffset: interactionData.animData.mobileHeightOffset ?? 0,
        mobileForwardOffset: interactionData.animData.mobileForwardOffset ?? 0,
        taken: false,
        hoverText: interactionData.animData.hoverText,
        clickBox: interactionData.clickBox,
        isPredefinedEmote: interactionData.animData.isPredefinedEmote,
        animationType: interactionData.animData.name,
        animationClips: interactionData.animData.animations
    })

    return spot
}
