import { EasingFunction, engine, Entity, Material, MeshRenderer, Schemas, Transform, Tween, VisibilityComponent } from "@dcl/sdk/ecs"
import { Color4, Vector3 } from "@dcl/sdk/math"

export const InteractionHighlight = engine.defineComponent('interactive-highlight', {
    interactiveEntityRef: Schemas.Entity,
})

export const HighlightPool = engine.defineComponent('interactive-highlight-pool', {
    pool: Schemas.Array(Schemas.Entity),
    MAX_POOL_SIZE: Schemas.Number,
    activeHover: Schemas.Entity
})

export function addInteractionHighlights(maxPoolSize: number) {
    const highlightPool = engine.addEntity()
    HighlightPool.createOrReplace(highlightPool, {
        pool: [],
        MAX_POOL_SIZE: maxPoolSize
    })

    for (let i = 0; i < maxPoolSize; i++) {
        const highlight = engine.addEntity()
        Transform.create(highlight, {
            position: Vector3.create(0, 0, 0),
            scale: Vector3.create(0.4, 0.4, 0.4)
        })
        MeshRenderer.setSphere(highlight)
        Material.setBasicMaterial(highlight, {
            diffuseColor: Color4.White()
        })
        VisibilityComponent.create(highlight, { visible: false })
        InteractionHighlight.createOrReplace(highlight)
        HighlightPool.getMutable(highlightPool).pool.push(highlight)
    }

    const activeHover = engine.addEntity()
    Transform.create(activeHover, {
        position: Vector3.create(0, 0, 0),
        scale: Vector3.create(0.25, 0.25, 0.25)
    })
    MeshRenderer.setSphere(activeHover)
    Material.setPbrMaterial(activeHover, {
        albedoColor: Color4.White(),
        emissiveColor: Color4.White(),
        emissiveIntensity: 1,
        roughness: 1,
        metallic: 0,
        specularIntensity: 0,
        castShadows: false,
    })
    VisibilityComponent.create(activeHover, { visible: false })
    HighlightPool.getMutable(highlightPool).activeHover = activeHover
}

export function getHighlightFromPool(): Entity | null {
    for (const [entity] of engine.getEntitiesWith(HighlightPool)) {
        const highlightInfo = HighlightPool.getMutable(entity)
        if (highlightInfo.pool.length > 0) {
            const highlight = highlightInfo.pool.shift()
            if (highlight != null) {
                highlightInfo.pool.push(highlight)
                return highlight
            }
            return null
        }
    }
    return null
}

export function setActiveHover(position: Vector3) {
    for (const [poolEntity] of engine.getEntitiesWith(HighlightPool)) {
        const highlightInfo = HighlightPool.get(poolEntity)

        VisibilityComponent.getMutable(highlightInfo.activeHover).visible = true
        Transform.getMutable(highlightInfo.activeHover).position = position
        Tween.createOrReplace(highlightInfo.activeHover, {
            duration: 500,
            easingFunction: EasingFunction.EF_EASEOUTQUART,
            currentTime: 0,
            playing: true,
            mode: Tween.Mode.Scale({
                start: Vector3.create(0.01, 0.01, 0.01),
                end: Vector3.create(0.25, 0.25, 0.25),
            }),
        })
    }
}

export function hideActiveHover() {
    for (const [poolEntity] of engine.getEntitiesWith(HighlightPool)) {
        const highlightInfo = HighlightPool.get(poolEntity)
        VisibilityComponent.getMutable(highlightInfo.activeHover).visible = false
    }
}

export function setInteractionHighlight(entity: Entity, pos: Vector3, scale: number, refEntity: Entity) {
    const transform = Transform.getMutable(entity)
    transform.position = pos
    transform.scale = Vector3.create(scale, scale, scale)
    VisibilityComponent.getMutable(entity).visible = true

    InteractionHighlight.getMutable(entity).interactiveEntityRef = refEntity
}

export function hideInteractionHighlights() {
    for (const [entity] of engine.getEntitiesWith(InteractionHighlight, Transform)) {
        VisibilityComponent.getMutable(entity).visible = false
    }
}

export function showInteractionHighlight() {
    for (const [entity] of engine.getEntitiesWith(InteractionHighlight, Transform)) {
        VisibilityComponent.getMutable(entity).visible = true
    }
}
