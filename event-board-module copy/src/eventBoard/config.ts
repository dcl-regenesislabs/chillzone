import { TransformTypeWithOptionals } from "@dcl/sdk/ecs"
import { Quaternion, Vector3 } from "@dcl/sdk/math"
import { ui3dAtlasData } from "./deps/atlas/uiAtlasData"

/**
 * Transforms de EJEMPLO (los valores que usa Genesis Plaza).
 * NO se aplican solos: `initEventBoard()` recibe el transform como parámetro.
 * Copiá uno y ajustá `position` / `rotation` a tu escena.
 *
 * Ojo con la escala: el board mide ~10 unidades de ancho a escala 1, y al abrirse
 * se acerca 5 metros hacia el jugador. Dejá espacio libre delante.
 */
export const LIVE_EVENT_BOARD_TRANSFORM: TransformTypeWithOptionals = {
    position: Vector3.create(73.15, 4.48, 22.04),
    rotation: Quaternion.fromEulerDegrees(0, 135, 0),
    scale: Vector3.create(1.0, 1.0, 1)
}
export const UPCOMING_EVENT_BOARD_TRANSFORM: TransformTypeWithOptionals = {
    position: Vector3.create(88.1, 5.0, 28.1),
    rotation: Quaternion.fromEulerDegrees(0, 180, 0),
    scale: Vector3.create(1.1, 1.1, 1)
}
export const CALENDAR_EVENT_BOARD_TRANSFORM: TransformTypeWithOptionals = {
    position: Vector3.create(44.38, 6.7, 72.5),
    rotation: Quaternion.fromEulerDegrees(0, -90, 0),
    scale: Vector3.create(0.7, 0.7, 1)
}
export const BLOG_BOARD_TRANSFORM: TransformTypeWithOptionals = {
    position: Vector3.create(81.6, 5, 13.7),
    rotation: Quaternion.fromEulerDegrees(0, -90, 0),
    scale: Vector3.create(1.1, 1.1, 1)
}

export const UPCOMING_OFFSET: Vector3[] = [
    Vector3.create(-2.6, 1.5, 0),
    Vector3.create(2.6, 1.5, 0),
    Vector3.create(-2.6, -1.8, 0),
    Vector3.create(2.6, -1.8, 0),
]

export const BLOG_OFFSET: Vector3[] = [
    Vector3.create(-2.6, 0.4, 0),
    Vector3.create(2.6, 0.4, 0),
]

export const CHAR_SPACING_DEFAULT = -0.1
export const CHAR_SPACING_DETAILS = -0.05

export const CAMERA_TRANSITION_TIME = 0.8

export const BLOG_TITLE_FONTS_SIZE = 0.7
export const BLOG_TEXT_FONTS_SIZE = 0.65
export const BLOG_TITLE_Y_OFFSET = -0.75
export const BLOG_DATE_FONT_SIZE = 0.7
export const BLOG_DATE_Y_OFFSET = -0.54
export const BLOG_TITLE_X_OFFSET = -0.05
export const BLOG_TEXT_Y_OFFSET = -1.35

export const UPCOMING_FONTS_SIZE_DOCKED = 0.8
export const UPCOMING_FONTS_SIZE = 0.55
export const UPCOMING_TITLE_Y_OFFSET = -0.7
export const UPCOMING_TITLE_Y_OFFSET_DOCKED = -0.65
export const UPCOMING_TITLE_X_OFFSET = -0.9
export const UPCOMING_INTERESTED_BUTTON_X_OFFSET = 0.65
export const UPCOMING_INTERESTED_BUTTON_Y_OFFSET = -0.52
export const UPCOMING_DATE_FONT_SIZE = 0.5
export const UPCOMING_DATE_Y_OFFSET = -0.63
export const UPCOMING_DATE_Y_OFFSET_DOCKED = -0.57
//export const UPCOMING_BOARD_SCROLL_INTERVAL = 15
export const UPCOMING_BOARD_SCROLL_INTERVAL = 0

export const CALENDAR_PAGE_COUNT = 4

export const CALENDAR_TITLE_FONT_SIZE = 0.55
export const CALENDAR_TITLE_Y_OFFSET = -0.7
export const CALENDAR_TITLE_X_OFFSET = -0.9
export const CALENDAR_DATE_FONT_SIZE = 0.5
export const CALENDAR_DATE_Y_OFFSET = -0.63
export const CALENDAR_DATE_X_OFFSET = -0.9
export const CALENDAR_ORGANIZED_BY_FONT_SIZE = 0.4
export const CALENDAR_ORGANIZED_BY_Y_OFFSET = -0.77
export const CALENDAR_DETAIL_TEXT_Y_OFFSET = -1.35

export const CALENDAR_DAYS_SHOWN = 4
export const CALENDAR_CARDS_PER_DAY = 8
export const CALENDAR_CARD_WIDTH = 5
export const CALENDAR_CARD_HEIGHT = 5
export const CALENDAR_FIRST_ROW_Y_OFFSET = 1.0

export const CALENDAR_CARD_PADDING = 0.25
export const CALENDAR_CONTENT_WIDTH = (CALENDAR_CARD_WIDTH - CALENDAR_CARD_PADDING * 2)
export const CALENDAR_CARD_SPACING = CALENDAR_CONTENT_WIDTH / CALENDAR_DAYS_SHOWN * 2 * 1.055
export const CALENDAR_FIRST_COLUMN_X_OFFSET = -CALENDAR_CARD_WIDTH + CALENDAR_CARD_PADDING + CALENDAR_CARD_SPACING / 2
export const CALENDAR_ROW_SPACING = CALENDAR_CARD_SPACING / 2

export const CALENDAR_DATE_COLOR_DEFAULT = "#6E7E8EFF"
export const CALENDAR_DATE_COLOR_TODAY = "#FF2D55FF"
export const CALENDAR_MONTH_COLOR = "#95ABC1FF"

//export const CALENDAR_BOARD_SCROLL_INTERVAL = 30
export const CALENDAR_BOARD_SCROLL_INTERVAL = 0

export enum EVENT_BOARD_TYPE {
    LIVE,
    UPCOMING,
    CALENDAR,
    BLOG
}

export const UI_ATLAS_SRC = ui3dAtlasData.atlas.src
export const UI_ATLAS_SRC_ALPHA = ui3dAtlasData.atlas.srcAlpha

/**
 * Rutas de assets, relativas a la raíz de la escena (donde vive scene.json).
 * Si copiaste `images/` y `assets/` del paquete tal cual, no toques nada.
 * Si los ponés en otro lado, ajustá estas tres constantes y `atlas.src` /
 * `atlas.srcAlpha` en `deps/atlas/uiAtlasData.ts`.
 */
export const imgFolder = "images/events-board/"
export const modelFolder = "assets/scene/events-board/"

/**
 * Carteles 3D "LIVE EVENTS" / "NEXT LIVE EVENTS" que acompañan al board LIVE.
 * Son opcionales: pasá `showTitle: false` en las opciones de initEventBoard()
 * si no los querés, o cambiá estas rutas por tus propios modelos.
 */
export const TITLE_MODEL_LIVE = "assets/models/out/models/live_events.glb"
export const TITLE_MODEL_UPCOMING = "assets/models/out/models/next_live_events.glb"

/**
 * Los dos .glb de título traen un transform enorme horneado en el nodo, heredado
 * de la escena de Blender original: el texto visible NO está en el origen del
 * modelo, sino a ~(-12, 6.7, -13) de él.
 *
 * Medido sobre la geometría:
 *   live_events.glb       node T=(-18.33, 9.97, -18.73) R=(0,-45,0) S=-1.0089
 *                         → texto visible en (-11.98, 6.67, -13.24)
 *   next_live_events.glb  node T=(-12.04,  6.68, -12.93) R=(90,45,0) S=1
 *                         → texto visible en (-12.04,  6.68, -12.93)
 *
 * Esta constante es la compensación inversa. Se aplica a una entidad hija, de modo
 * que el texto quede centrado en el origen del anchor y `titleTransform` se comporte
 * como uno espera: la posición que le pases es donde aparece el cartel.
 *
 * Si algún día reexportás los .glb con los transforms aplicados y el pivote
 * centrado, poné esto en (0, 0, 0).
 */
export const TITLE_MODEL_PIVOT_COMPENSATION = Vector3.create(11.98, -6.67, 13.24)

export const BOARD_WIDTH = 32
export const BOARD_HEIGHT = 16
export const CAMERA_DISTANCE = 6
export const LIVE_CAMERA_Y = -0.4
export const LIVE_ACTIVE_POS_Y = 0.2

export const LIVE_CARD_WIDTH = 5

export const LIVE_TITLE_Y_OFFSET = -0.61
export const LIVE_TITLE_X_OFFSET = -0.9

export const LIVE_TITLE_CHARACTER_LIMIT = 44
export const LIVE_DATE_Y_OFFSET = -0.55
export const DETAIL_DATE_Y_OFFSET = -0.7
export const DETAIL_TEXT_Y_OFFSET = -1.25
export const DETAIL_TEXT_X_OFFSET = -0.0
export const LIVE_BOARD_SCROLL_INTERVAL = 10
export const LIVE_BOARD_AUTO_UPDATE_INTERVAL = 100

export const ORGANIZED_BY_Y_OFFSET = -0.675
export const JUMP_IN_BUTTON_Y_OFFSET = -0.63
export const JUMP_IN_BUTTON_X_OFFSET = 0.72

export const ROTATION_RADIUS = 5
export const PAGING_DOT_SPACING = 0.3
export const PAGING_DOT_SPACING_CALENDAR = 0.3

export type EventShortInfo = {
    id: string,
    eventName: string
    thumbnailSrc: string
    date: string
    user_name: string
    coordinateX: string
    coordinateZ: string
    world: boolean
    server: string,
    detailText: string
}