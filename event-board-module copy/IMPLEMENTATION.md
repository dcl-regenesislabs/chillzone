# Event Board — Guía de implementación

> Módulo autocontenido extraído de **Genesis Plaza** (escena `central-plaza`).
> Este documento está escrito para que un agente de IA lo lea de punta a punta y
> deje el board funcionando en una escena Decentraland SDK7 distinta.

---

## 1. Qué es esto

Un tablero 3D de eventos de Decentraland. En reposo es un panel flotante clickeable.
Al hacer click:

1. Bloquea el movimiento del jugador y entra en **modo cinemático** (cámara virtual + barras negras).
2. El board se acerca ~5 m hacia el jugador y se escala a la mitad, con una máscara negra de fondo.
3. Muestra tarjetas de eventos: thumbnail, título, organizador, fecha, descripción.
4. El jugador pagina con las flechas en pantalla o las teclas ←/→ (`IA_LEFT` / `IA_RIGHT`).
5. Botón **JUMP IN** que teletransporta al evento (coordenadas de Genesis City o World).
6. Sale con la X, click en el fondo, tecla E (`IA_PRIMARY`), o simplemente moviéndose.

Los datos salen de la API pública `https://events.decentraland.org/api/events/?limit=100`.
No requiere API key ni autenticación.

### Cuatro tipos de board

| `EVENT_BOARD_TYPE` | Qué muestra | Layout |
|---|---|---|
| `LIVE` | Eventos en vivo ahora (hasta 20). Si no hay ninguno, cae a los 4 próximos. | 1 tarjeta grande por página |
| `UPCOMING` | Próximos eventos (hasta 24) | 4 tarjetas por página, grilla 2×2 |
| `CALENDAR` | Próximos eventos (hasta 96) agrupados por día | 4 columnas × 8 tarjetas, 4 páginas |
| `BLOG` | Entradas de blog — **requiere datos propios**, ver §8 | 2 tarjetas por página |

**El board "Live Events" que pidió el usuario es el tipo `LIVE`.**

---

## 2. Requisitos de la escena destino

- Decentraland **SDK7**. Desarrollado y probado contra `@dcl/sdk@7.22.4`.
- `tsconfig.json` que extienda `@dcl/sdk/types/tsconfig.ecs7.json` con `"strict": true`
  (el módulo compila limpio en strict mode).
- Soporte de **`.tsx`** — el archivo `deps/cinematicUI.tsx` usa React-ECS.
  Asegurate de que el `include` del tsconfig cubra `src/**/*.tsx`, no solo `.ts`.
- En `scene.json`, el permiso para mover al jugador:

```json
"requiredPermissions": ["ALLOW_TO_MOVE_PLAYER_INSIDE_SCENE"]
```

`teleportTo` y `changeRealm` (el botón JUMP IN) no necesitan permiso declarado:
son acciones restringidas que el explorer permite porque nacen de un click del usuario.

---

## 3. Instalación

Copiá tres cosas a la escena destino, **conservando las rutas**:

```
event-board-module/src/eventBoard/   →  <escena>/src/eventBoard/
event-board-module/images/           →  <escena>/images/          (merge, no reemplaces)
event-board-module/assets/           →  <escena>/assets/          (merge, no reemplaces)
```

Después de copiar, la escena destino tiene que tener:

```
<escena>/
├── scene.json
├── src/
│   └── eventBoard/          ← el módulo entero, 22 archivos + deps/ + api/
├── images/
│   ├── atlas/
│   │   ├── atlas_1024.png        (412 KB — atlas de UI, obligatorio)
│   │   └── atlas_1024_alpha.png  (84 KB — canal alfa del atlas)
│   └── events-board/             (5 archivos, ~180 KB)
└── assets/
    ├── scene/events-board/       (11 .glb, ~120 KB)
    └── models/out/models/        (2 .glb de título, opcionales — ver §6)
```

**Peso total ≈ 1.1 MB.** Si las rutas de `images/` o `assets/` no te sirven, mirá §7.

> Si la escena destino ya tiene un `images/atlas/atlas_1024.png` distinto, **no lo pises**.
> Renombrá el del módulo y actualizá `atlas.src` / `atlas.srcAlpha` en
> `src/eventBoard/deps/atlas/uiAtlasData.ts`.

---

## 4. Integración mínima

En el `main()` de la escena destino:

```ts
import { Vector3, Quaternion } from '@dcl/sdk/math'
import { ReactEcsRenderer } from '@dcl/sdk/react-ecs'
import { initEventBoard, createCinematicUI } from './eventBoard'

export function main() {
  initEventBoard({
    position: Vector3.create(8, 3, 8),
    rotation: Quaternion.fromEulerDegrees(0, 180, 0),
    scale: Vector3.create(1, 1, 1)
  })

  // Obligatorio: sin esto no se dibujan las barras cinemáticas.
  ReactEcsRenderer.setUiRenderer(createCinematicUI)
}
```

Eso es todo para un board `LIVE`. `initEventBoard` se encarga de arrancar los sistemas
compartidos (`PlayerState`, `UiScaleSystem`) una sola vez, aunque lo llames varias veces.

### ⚠️ Si la escena destino YA tiene UI propia

`ReactEcsRenderer.setUiRenderer` acepta **un solo** renderer: la segunda llamada pisa
la primera. Si tu escena ya dibuja UI, componé los dos:

```ts
import ReactEcs, { ReactEcsRenderer, UiEntity } from '@dcl/sdk/react-ecs'
import { createCinematicUI } from './eventBoard'
import { miUiExistente } from './ui'

ReactEcsRenderer.setUiRenderer(() => (
  <UiEntity uiTransform={{ width: '100%', height: '100%', positionType: 'absolute' }}>
    {miUiExistente()}
    {createCinematicUI()}
  </UiEntity>
))
```

El archivo que haga esto tiene que ser `.tsx`.

### Varios boards a la vez

```ts
import { initEventBoard, EVENT_BOARD_TYPE } from './eventBoard'

initEventBoard(
  { position: Vector3.create(8, 3, 8), rotation: Quaternion.fromEulerDegrees(0, 180, 0) },
  { type: EVENT_BOARD_TYPE.LIVE, hoverText: 'VIEW LIVE EVENTS' }
)

initEventBoard(
  { position: Vector3.create(24, 4, 8), rotation: Quaternion.fromEulerDegrees(0, 180, 0),
    scale: Vector3.create(0.7, 0.7, 1) },
  { type: EVENT_BOARD_TYPE.CALENDAR, hoverText: 'VIEW CALENDAR EVENTS' }
)
```

Los boards se coordinan solos: abrir uno cierra cualquier otro que estuviera abierto.

---

## 5. Espacio físico que necesita

Esto es lo que más suele fallar al portar el board. Al abrirse:

- Se **mueve 5 m hacia adelante** (sobre su propio eje −Z local, según su rotación).
- Se **escala a 0.5**, y la cámara se ubica a `CAMERA_DISTANCE = 6` m enfrente.
- Despliega una máscara negra de `BOARD_WIDTH*2 × BOARD_HEIGHT*2` = 64×32 unidades a 5 m detrás.

Reglas prácticas:

- Dejá **al menos 12 m libres** delante del board, sin geometría ni colliders.
- El board mide ~10 unidades de ancho a escala 1. Ubicalo con `position.y` ≈ 3–5.
- La `rotation` define hacia dónde mira. `fromEulerDegrees(0, 180, 0)` mira hacia −Z.
- El jugador se acerca al board por delante: el punto de lectura queda donde estaba parado.

---

## 6. Opciones de `initEventBoard`

```ts
initEventBoard(transform, options)
```

`transform`: `TransformTypeWithOptionals` — `position`, `rotation`, `scale`.

`options`:

| Campo | Tipo | Default | Qué hace |
|---|---|---|---|
| `type` | `EVENT_BOARD_TYPE` | `LIVE` | Tipo de board (§1) |
| `hoverText` | `string` | `'VIEW LIVE EVENTS'` | Texto al apuntar el board |
| `parent` | `Entity` | raíz del módulo | Entidad de la que colgar el board |
| `showTitle` | `boolean` | `false` | Carteles 3D "LIVE EVENTS" / "NEXT LIVE EVENTS" |
| `titleTransform` | `TransformTypeWithOptionals` | — | Posición del cartel, si `showTitle` |

### Sobre `showTitle` — el cartel "LIVE EVENTS"

El board `LIVE` puede mostrar un cartel 3D que **alterna solo**: `live_events.glb`
("LIVE EVENTS") cuando hay eventos en vivo, `next_live_events.glb` ("NEXT LIVE EVENTS")
cuando no hay ninguno y el board cae a los próximos 4.

Viene **apagado por defecto**. Para encenderlo:

```ts
initEventBoard(transform, {
  showTitle: true,
  titleTransform: {
    position: Vector3.create(8, 6, 8),                    // donde querés el cartel
    rotation: Quaternion.fromEulerDegrees(0, 180, 0)      // hacia dónde mira
  }
})
```

La posición que pasás **es** donde aparece el texto. Eso no es gratis: los dos `.glb`
traen un transform enorme horneado en el nodo (herencia de la escena de Blender
original), y el texto visible no está en el origen del modelo sino a ~(-12, 6.7, -13)
de él. El módulo lo compensa con una entidad hija (`TITLE_MODEL_PIVOT_COMPENSATION`
en `config.ts`), así que desde afuera se comporta como cualquier modelo normal.

Dos detalles del asset, por si algún día lo tocás:

- `live_events.glb` tiene **escala negativa** (-1.0089 en X, Y y Z). Es una inversión
  de puntos que invierte las normales; puede verse con las caras al revés según el
  explorer. Si te pasa, reexportá desde Blender con *Object → Apply → All Transforms*
  y poné `TITLE_MODEL_PIVOT_COMPENSATION` en `(0, 0, 0)`.
- Si no usás el cartel, podés borrar `assets/models/out/models/` (–56 KB).

### Colgar el board de una entidad existente

```ts
import { setSceneRoot, initEventBoard } from './eventBoard'

const miRaiz = engine.addEntity()
Transform.create(miRaiz, { position: Vector3.create(16, 0, 16) })

setSceneRoot(miRaiz)          // afecta al módulo entero (incluidas las cámaras)
// …o, por board:
initEventBoard(transform, { parent: miRaiz })
```

**Importante:** las cámaras virtuales se posicionan relativas a `getSceneRoot()`.
Si vas a usar `setSceneRoot`, llamalo **antes** del primer `initEventBoard`.

---

## 7. Mover los assets de lugar

Las rutas viven en dos archivos:

`src/eventBoard/config.ts`
```ts
export const imgFolder = "images/events-board/"
export const modelFolder = "assets/scene/events-board/"
export const TITLE_MODEL_LIVE = "assets/models/out/models/live_events.glb"
export const TITLE_MODEL_UPCOMING = "assets/models/out/models/next_live_events.glb"
```

`src/eventBoard/deps/atlas/uiAtlasData.ts` (primeras líneas)
```ts
"atlas": {
  "src": "images/atlas/atlas_1024.png",
  "srcAlpha": "images/atlas/atlas_1024_alpha.png",
  …
}
```

Todas son **relativas a la raíz de la escena** (donde está `scene.json`), sin `./` inicial.

---

## 8. Board de tipo BLOG

En Genesis Plaza los datos venían de `modules/dclNews`, que leía una Google Sheet.
Ese módulo **no está incluido** (arrastraba media escena). Si querés usar `BLOG`,
inyectá tus propias entradas antes de crear el board:

```ts
import { setBlogEntries, initEventBoard, EVENT_BOARD_TYPE } from './eventBoard'

setBlogEntries([
  { title: 'Título', description: 'Texto', imageUrl: 'https://…/img.png',
    date: '2026-07-30T18:00:00Z', url: 'https://decentraland.org/blog/…' }
])

initEventBoard(transform, { type: EVENT_BOARD_TYPE.BLOG, hoverText: 'READ THE BLOG' })
```

Sin `setBlogEntries`, un board `BLOG` se monta vacío. Los tipos `LIVE`, `UPCOMING`
y `CALENDAR` no tocan esto para nada.

---

## 9. Arquitectura interna

```
index.ts                    API pública — initEventBoard(), re-exports
config.ts                   Constantes: offsets, tamaños de fuente, rutas de assets, EVENT_BOARD_TYPE
boardLiveEvents.ts          Núcleo (~930 líneas). Componente EventBoardInfo, montaje,
                            cámara, colliders, flechas, apertura/cierre, refresco periódico
boardComponents.ts          Componente TextLineAnimation (fade-in de texto línea por línea)
boardFunctions.ts           Fechas, teleport, tweens de escala, sistema de animación de texto
pageContainer.ts            Contenedor de página + ContainerInfo
scrollPage.ts               Paginado, auto-scroll, dots de página
blackMask.ts                Máscara negra de fondo + su sistema de fade

liveEventCard.ts            Tarjeta del board LIVE
upcomingEventCard.ts        Tarjeta del board UPCOMING
calendarCard.ts             Tarjeta del board CALENDAR
setupCalendarPage.ts        Layout de la grilla del calendario
calendarDetails.ts          Panel de detalle del calendario
blogCard.ts                 Tarjeta del board BLOG
detailCard.ts               Panel de detalle heredado (todo comentado — ver §11)

closeButton.ts              Botón X
jumpInButton.ts             Botón JUMP IN (teleport) + sprite de partículas
interestedButton.ts         Botón de "me interesa"
openExternalBtn.ts          Botón de link externo (blog)
infoButton.ts               Botón de info

api/apiService.ts           Singleton EventsService — fetch + filtros + ordenamientos
api/apiTypes.ts             Tipos de la respuesta de la API

deps/sceneRoot.ts           Raíz del módulo (reemplaza el global.ts de Genesis Plaza)
deps/cameras.ts             Cámaras virtuales, modo cinemático, lock del jugador
deps/cameraConfig.ts        Tipos y presets de cámara
deps/cinematicUI.tsx        Barras negras cinemáticas (React-ECS)
deps/uiScaleSystem.ts       Factor de escala de UI según resolución
deps/playerState.ts         Componente PlayerState (flag isPlayerInteractingWithMenus)
deps/spriteAnimator.ts      Animador de spritesheets (partículas del JUMP IN)
deps/cursorLock.ts          Lock/unlock del cursor
deps/animUtils.ts           Distancia, shuffle, timeout basado en sistemas
deps/uvUtils.ts             Cálculo de UVs del atlas
deps/atlas/                 Datos y helpers del texture atlas
deps/blogEntries.ts         Punto de inyección de datos del blog
```

### Flujo de una sesión

```
click en el collider
  └─ startEventInteraction(boardRoot)
       ├─ lockPlayer()                       InputModifier: sin caminar/correr/saltar
       ├─ enterCinematicMode(eventCam)        MainCamera → VirtualCamera + barras negras
       ├─ unlockCursor()                      PointerLock = false
       ├─ PlayerState.isPlayerInteractingWithMenus = true
       ├─ desactiva los colliders de TODOS los boards
       ├─ fade de la máscara negra
       └─ Tween: board 5 m adelante + escala 0.5

  ← / → ó flechas en pantalla
       └─ scrollLiveEvents(boardRoot, izquierda?)
            └─ populate*Page()  →  update*EventCard()  →  activatePagingDot()

X / click al fondo / tecla E / el jugador se mueve >0.1 m
  └─ endEventInteraction() + exitCinematicMode()
       └─ revierte todo lo anterior
```

### Refresco de datos

`initEventMenuSystems()` arranca un `timers.setInterval` cada
`LIVE_BOARD_AUTO_UPDATE_INTERVAL` = **100 s** que llama a `updateLiveEvents()` en
todo board `LIVE` **que no esté abierto en ese momento**. Eso re-hace el fetch,
repuebla las tarjetas y regenera los dots de página.

El auto-scroll (`LIVE_BOARD_SCROLL_INTERVAL` = 10 s) rota la tarjeta visible mientras
el board está en reposo. En `UPCOMING` y `CALENDAR` está en `0` (desactivado).

---

## 10. Ajustes frecuentes

Todo en `src/eventBoard/config.ts`:

| Constante | Default | Efecto |
|---|---|---|
| `LIVE_BOARD_SCROLL_INTERVAL` | `10` | Segundos entre auto-scroll. `0` lo desactiva. |
| `LIVE_BOARD_AUTO_UPDATE_INTERVAL` | `100` | Segundos entre refetch de la API. |
| `CAMERA_DISTANCE` | `6` | Distancia de la cámara al board abierto. |
| `CAMERA_TRANSITION_TIME` | `0.8` | Duración del blend de cámara, en segundos. |
| `LIVE_TITLE_CHARACTER_LIMIT` | `44` | Corte del título del evento. |
| `LIVE_CARD_WIDTH` | `5` | Media anchura de la tarjeta; mueve flechas y dots. |
| `PAGING_DOT_SPACING` | `0.3` | Separación de los dots de página. |
| `CALENDAR_DAYS_SHOWN` | `4` | Columnas (días) por página del calendario. |
| `CALENDAR_CARDS_PER_DAY` | `8` | Filas por columna en el calendario. |
| `CALENDAR_DATE_COLOR_TODAY` | `"#FF2D55FF"` | Color de la fecha de hoy. |

**Cuántos eventos trae cada board** está hardcodeado en `boardLiveEvents.ts`, dentro
del `switch (type)` de `initLiveEventBoard` (`getLiveEvents(20)`, `getUpcomingEvents(24)`,
`getCalendarEvents(96)`). Ojo: en `LIVE` hay un dot de página **por evento**, así que
subir ese 20 llena la fila de dots.

**Filtrar eventos** (p. ej. solo los de tu comunidad): `EventsService` ya expone
`getCommunityEvents(communityIds, limit)` y `getEventsByIds(ids, limit)`.
Cambiá la llamada dentro del `switch` por la que necesites.

---

## 11. Acoplamientos y cosas a tener en cuenta

**Conflicto de cámara.** El módulo hace `MainCamera.createOrReplace(engine.CameraEntity, …)`.
Si la escena destino ya tiene su propio sistema de cámaras virtuales, se van a pisar.
Coordinalos, o sacá `enterCinematicMode` / `exitCinematicMode` de
`startEventInteraction` / `endEventInteraction` en `boardLiveEvents.ts`.

**Nombres de componentes globales.** Los componentes se registran con nombres string
fijos (`'event-board-info-component'`, `'player-state-component'`, `'MultiCameraManagerComponent'`,
`'CamDataComponent'`, …). Si la escena destino ya define un componente con alguno de
esos nombres, el `engine.defineComponent` va a tirar error al arrancar. Si te pasa,
renombralos en el módulo (son únicos y buscables por grep).

**`PlayerState`.** `initEventBoard` lo crea solo si no existe todavía. Si tu escena
ya lo inicializa, el módulo lo reutiliza y solo escribe `isPlayerInteractingWithMenus`.
Podés leer ese flag desde tu propio código con `isPlayerInteractingWithMenus()`.

**Teclas ←/→ (`IA_LEFT`/`IA_RIGHT`).** Mientras un board está abierto, esas teclas
paginan. Como `lockPlayer()` ya deshabilitó el movimiento, no hay conflicto con
caminar — pero sí con cualquier otro sistema tuyo que escuche esas acciones.

**`endEventInteraction()` es global.** Recorre *todos* los `EventBoardInfo` y cierra
el que esté activo. Es intencional (garantiza un solo board abierto), pero significa
que llamarla desde fuera cierra cualquier board, no uno en particular.

**El fetch es asíncrono y sin reintento.** `initLiveEventBoard` es `async`, y
`initEventBoard` no espera el resultado. El board aparece al instante y se puebla
cuando llega la respuesta. Si el fetch falla, `EventsService` loguea el error y deja
la lista vacía: el board queda montado pero sin tarjetas hasta el próximo refresco.

**Código muerto que viene del original** (lo dejé tal cual para no romper nada):
- `detailCard.ts` está enteramente comentado. Se puede borrar.
- `setupCalendarPage.ts:21` `addCalendarHoverFrame()` **nunca se llama**, y apunta a
  `calendar_hover_frame.glb`, un archivo que **no existe** ni en el repo original.
  Sin impacto en runtime. Si algún día lo activás, el candidato es
  `calendar_card_hover.glb`, que sí está en `assets/scene/events-board/`.
- `.glb` incluidos pero sin referencia activa: `calendar_bg.glb`, `calendar_card_hover.glb`,
  `event_card_bottom_tall.glb`, `plane_GLTF.glb` (~24 KB entre los cuatro). Los dejé
  porque aparecen en código comentado que podrías querer reactivar.

---

## 12. Verificación

```bash
npx tsc --noEmit -p tsconfig.json    # debe dar 0 errores
npm run start                        # levanta el preview
```

Checklist en el preview:

- [ ] El board se ve, y al apuntarlo aparece el hover text.
- [ ] Al hacer click: barras negras arriba/abajo, el board se acerca, fondo oscurecido.
- [ ] Se ven thumbnail, título, organizador y fecha de un evento real.
- [ ] Las flechas ←/→ paginan y el dot activo (rojo) se mueve.
- [ ] **JUMP IN** teletransporta.
- [ ] La X, el click al fondo, la tecla E y caminar cierran el board y devuelven la cámara.
- [ ] En consola no hay `Image … not found in atlas` (si aparece → rutas del atlas mal, §7).

Si el board se ve pero **sin texturas de UI** (flechas, dots, botones invisibles),
el problema es casi siempre `images/atlas/atlas_1024.png` mal ubicado.
Si se ve pero **sin tarjetas**, mirá la consola: es el fetch a la API.

---

## 13. Referencia de la API de eventos

`GET https://events.decentraland.org/api/events/?limit=100` → `{ ok: boolean, data: EventData[] }`

Campos que usa el board: `id`, `name`, `image`, `description`, `user_name`,
`next_start_at`, `coordinates` (`[x, z]`), `world`, `server`, `live`, `highlighted`,
`total_attendees`, `recurrent`, `community_id`.

Tipo completo en `src/eventBoard/api/apiTypes.ts`.

Criterios de orden (`api/apiService.ts`):
- **LIVE**: destacados → más asistentes → no recurrentes.
- **UPCOMING / CALENDAR**: fecha de inicio más cercana → destacados.
