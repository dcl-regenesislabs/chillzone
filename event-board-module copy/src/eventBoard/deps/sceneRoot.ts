import { engine, Entity, Transform, TransformTypeWithOptionals } from "@dcl/sdk/ecs"
import { Vector3 } from "@dcl/sdk/math"

/**
 * Raíz de la escena para el módulo del event board.
 *
 * En Genesis Plaza esto vivía en `src/global.ts` y era la raíz global de toda la
 * escena. Acá es una raíz propia del módulo, creada de forma perezosa, para que el
 * board no dependa de nada del scene host.
 *
 * Si tu escena ya tiene una entidad raíz propia y querés colgar el board de ella,
 * llamá a `setSceneRoot(tuEntidad)` ANTES de `initEventBoard()`.
 */

let sceneRootEntity: Entity | undefined

/** Crea la raíz del módulo con el transform indicado (opcional). */
export function initSceneRoot(transform?: TransformTypeWithOptionals): Entity {
    if (sceneRootEntity !== undefined) return sceneRootEntity
    sceneRootEntity = engine.addEntity()
    Transform.create(sceneRootEntity, {
        position: Vector3.create(0, 0, 0),
        ...transform
    })
    return sceneRootEntity
}

/** Reutiliza una entidad ya existente de tu escena como raíz del board. */
export function setSceneRoot(entity: Entity) {
    sceneRootEntity = entity
}

/** Devuelve la raíz, creándola en (0,0,0) si todavía no existe. */
export function getSceneRoot(): Entity {
    if (sceneRootEntity === undefined) {
        return initSceneRoot()
    }
    return sceneRootEntity
}
