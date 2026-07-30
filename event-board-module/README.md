# Event Board — módulo portable

Tablero 3D de eventos de Decentraland, extraído de **Genesis Plaza** (`central-plaza`)
como paquete autocontenido para montar en cualquier escena SDK7.

📖 **La guía completa está en [IMPLEMENTATION.md](IMPLEMENTATION.md)** — pasásela a tu
agente de IA, tiene todo: instalación, integración, opciones, arquitectura y gotchas.

## Quickstart

1. Copiá a la escena destino, conservando rutas:
   - `src/eventBoard/` → `<escena>/src/eventBoard/`
   - `images/` → `<escena>/images/` (merge)
   - `assets/` → `<escena>/assets/` (merge)

2. En tu `main()`:

```ts
import { Vector3, Quaternion } from '@dcl/sdk/math'
import { ReactEcsRenderer } from '@dcl/sdk/react-ecs'
import { initEventBoard, createCinematicUI } from './eventBoard'

export function main() {
  initEventBoard({
    position: Vector3.create(8, 3, 8),
    rotation: Quaternion.fromEulerDegrees(0, 180, 0)
  })
  ReactEcsRenderer.setUiRenderer(createCinematicUI)
}
```

3. `scene.json` necesita `"requiredPermissions": ["ALLOW_TO_MOVE_PLAYER_INSIDE_SCENE"]`.

## Contenido

```
IMPLEMENTATION.md              Guía completa
src/eventBoard/                Módulo (36 archivos, sin dependencias externas)
  index.ts                     API pública
  api/                         Cliente de events.decentraland.org
  deps/                        Cámaras, UI cinemática, atlas, player state
images/                        Atlas de UI + texturas (≈ 580 KB)
assets/                        Modelos .glb (≈ 180 KB)
```

Peso total ≈ 1.1 MB · Compila limpio en `strict` contra `@dcl/sdk@7.22.4`.

## Tres cosas que se olvidan siempre

1. **`ReactEcsRenderer.setUiRenderer` acepta un solo renderer.** Si tu escena ya tiene
   UI, componela con `createCinematicUI` en vez de pisarla (§4 de la guía).
2. **Dejá ~12 m libres delante del board.** Al abrirse se acerca 5 m al jugador y la
   cámara se para a 6 m enfrente (§5).
3. **Los carteles 3D de título están apagados por defecto** — tienen las coordenadas
   de Genesis Plaza horneadas en la geometría (§6).
