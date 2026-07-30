/**
 * Event Board — API pública del módulo.
 *
 * Board de eventos de Decentraland extraído de Genesis Plaza (escena central-plaza).
 * Lee la API pública de events.decentraland.org y renderiza tarjetas 3D con
 * modo cinemático, paginado y botón de teleport al evento.
 *
 * Uso mínimo:
 *
 *   import { initEventBoard, EVENT_BOARD_TYPE, createCinematicUI } from './eventBoard'
 *   import { ReactEcsRenderer } from '@dcl/sdk/react-ecs'
 *   import { Vector3, Quaternion } from '@dcl/sdk/math'
 *
 *   export function main() {
 *     initEventBoard({
 *       position: Vector3.create(8, 3, 8),
 *       rotation: Quaternion.fromEulerDegrees(0, 180, 0)
 *     })
 *     ReactEcsRenderer.setUiRenderer(createCinematicUI)   // barras cinemáticas
 *   }
 *
 * Ver IMPLEMENTATION.md para la guía completa.
 */

import { Entity, TransformTypeWithOptionals, engine } from "@dcl/sdk/ecs"
import { EVENT_BOARD_TYPE } from "./config"
import { EventBoardOptions, initLiveEventBoard } from "./boardLiveEvents"
import { initPlayerState, PlayerState } from "./deps/playerState"
import { UiScaleSystem } from "./deps/uiScaleSystem"

// ---------------------------------------------------------------------------
// Re-exports
// ---------------------------------------------------------------------------

export { EVENT_BOARD_TYPE } from "./config"
export type { EventShortInfo } from "./config"
export {
    LIVE_EVENT_BOARD_TRANSFORM,
    UPCOMING_EVENT_BOARD_TRANSFORM,
    CALENDAR_EVENT_BOARD_TRANSFORM,
    BLOG_BOARD_TRANSFORM
} from "./config"

export { initLiveEventBoard, endEventInteraction, startEventInteraction, EventBoardInfo } from "./boardLiveEvents"
export type { EventBoardOptions } from "./boardLiveEvents"

export { EventsService } from "./api/apiService"
export type { EventData, EventApiResponse } from "./api/apiTypes"

export { initSceneRoot, setSceneRoot, getSceneRoot } from "./deps/sceneRoot"
export { setBlogEntries } from "./deps/blogEntries"
export type { BlogEntry } from "./deps/blogEntries"

export { createCinematicUI, showWideScreen, hideWideScreen } from "./deps/cinematicUI"
export { UiScaleSystem } from "./deps/uiScaleSystem"
export { PlayerState, initPlayerState, isPlayerInteractingWithMenus } from "./deps/playerState"

// ---------------------------------------------------------------------------
// Helper de alto nivel
// ---------------------------------------------------------------------------

export type InitEventBoardOptions = EventBoardOptions & {
    /** Tipo de board. Default: LIVE. */
    type?: EVENT_BOARD_TYPE
    /** Texto del hover al apuntar el board. Default: 'VIEW LIVE EVENTS'. */
    hoverText?: string
}

let sharedSystemsStarted = false

/**
 * Monta un event board en la posición indicada y arranca los sistemas compartidos
 * que necesita (PlayerState y el escalado de UI). Llamalo tantas veces como boards
 * quieras: los sistemas compartidos se inicializan una sola vez.
 *
 * IMPORTANTE: esto NO registra el renderer de UI. Las barras cinemáticas se dibujan
 * con `createCinematicUI`; tenés que pasarlo vos a `ReactEcsRenderer.setUiRenderer`,
 * componiéndolo con la UI que ya tenga tu escena.
 *
 * @param transform  Posición / rotación / escala del board en tu escena.
 * @param options    Tipo de board, texto de hover, entidad padre, cartel de título.
 */
export function initEventBoard(
    transform: TransformTypeWithOptionals,
    options: InitEventBoardOptions = {}
): void {
    if (!sharedSystemsStarted) {
        sharedSystemsStarted = true
        // El board escribe en PlayerState.isPlayerInteractingWithMenus. Si tu escena
        // ya llama a initPlayerState() por su cuenta, este guard evita duplicarlo.
        if (!PlayerState.has(engine.PlayerEntity)) {
            initPlayerState()
        }
        engine.addSystem(UiScaleSystem)
    }

    const { type = EVENT_BOARD_TYPE.LIVE, hoverText = 'VIEW LIVE EVENTS', ...boardOptions } = options

    // initLiveEventBoard es async (hace fetch a la API); no esperamos el resultado,
    // el board se va poblando cuando responde.
    void initLiveEventBoard(transform, hoverText, type, boardOptions)
}
