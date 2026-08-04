import { engine, Entity, Transform } from "@dcl/sdk/ecs"
import { Quaternion, Vector3 } from "@dcl/sdk/math"

export function realDistance(pos1: Vector3, pos2: Vector3): number {
    const a = pos1.x - pos2.x
    const b = pos1.y - pos2.y
    const c = pos1.z - pos2.z
    return Math.sqrt(a * a + b * b + c * c)
}

export function compareDistance(a: Entity, b: Entity): number {
    const playerPos = Transform.get(engine.PlayerEntity).position
    const distA = realDistance(Transform.get(a).position, playerPos)
    const distB = realDistance(Transform.get(b).position, playerPos)
    return distA < distB ? 1 : -1
}

export function delay_ms_cb(ms: number, callback: () => void) {
    const delaySystemId = `sitting-delay-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    let timer = 0
    engine.addSystem((dt: number) => {
        timer += dt * 1000
        if (timer >= ms) {
            engine.removeSystem(delaySystemId)
            callback()
        }
    }, undefined, delaySystemId)
}

// Resolves an entity's world position/rotation by walking up its parent chain.
// Needed because our seat anchors are parented under the ChairsAndSofas.glb
// root entity rather than being top-level scene entities.
export function getWorldTransform(entity: Entity): { position: Vector3; rotation: Quaternion } {
    const transform = Transform.get(entity)
    if (!transform.parent) {
        return { position: transform.position, rotation: transform.rotation }
    }
    const parentWorld = getWorldTransform(transform.parent)
    return {
        position: Vector3.add(parentWorld.position, Vector3.rotate(transform.position, parentWorld.rotation)),
        rotation: Quaternion.multiply(parentWorld.rotation, transform.rotation),
    }
}
