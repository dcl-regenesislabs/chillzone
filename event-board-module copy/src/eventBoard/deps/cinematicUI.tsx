import ReactEcs, { PositionUnit, UiEntity } from "@dcl/sdk/react-ecs"
import { Color4, Vector3 } from "@dcl/sdk/math"
import { EasingFunction, Entity, Transform, Tween, engine } from "@dcl/sdk/ecs"
import { scaleFactor } from "./uiScaleSystem"
import { UI_ATLAS_SRC } from "../config"
import { getAtlasUiUVs } from "./atlas/atlasTextures"
import { ui3dAtlasData } from "./atlas/uiAtlasData"

let unlockCursorToastVisible: boolean = false
const unlockCursorUVs = getAtlasUiUVs(ui3dAtlasData, "unlockCursor.png")

const topBarEntity = engine.addEntity()
Transform.create(topBarEntity, {
    position: Vector3.create(0, -8, 0),
    scale: Vector3.create(100, 8, 0),
})

const bottomBarEntity = engine.addEntity()
Transform.create(bottomBarEntity, {
    position: Vector3.create(0, 100, 0),
    scale: Vector3.create(100, 8, 0),
})

const cameraControlEntity = engine.addEntity()
Transform.create(cameraControlEntity, {
    position: Vector3.create(44, 100, 0),
    scale: Vector3.create(16, 4, 0),
})

function tweenTo(entity: Entity, x: number, y: number, durationMs: number) {
    Tween.createOrReplace(entity, {
        duration: durationMs,
        easingFunction: EasingFunction.EF_EASEOUTQUAD,
        currentTime: 0,
        playing: true,
        mode: Tween.Mode.Move({
            start: Transform.get(entity).position,
            end: Vector3.create(x, y, 0),
        }),
    })
}

export function showWideScreen() {
    tweenTo(topBarEntity, 0, 0, 600)
    tweenTo(bottomBarEntity, 0, 92, 600)
    showSwitchButton()
}

export function hideWideScreen() {
    tweenTo(topBarEntity, 0, -8, 600)
    tweenTo(bottomBarEntity, 0, 100, 600)
    hideSwitchButton()
}

export function showCinematicButton() {}

export async function hideCinematicButton() {}

export function showUnlockCursorToast() {
    unlockCursorToastVisible = true
}

export async function hideUnlockCursorToast() {
    unlockCursorToastVisible = false
}

export function showSwitchButton() {
    tweenTo(cameraControlEntity, 44, 88, 300)
}

export function hideSwitchButton() {
    tweenTo(cameraControlEntity, 44, 100, 300)
    hideUnlockCursorToast()
}

export function createCinematicUI() {
    const topPos = Transform.get(topBarEntity).position
    const topScale = Transform.get(topBarEntity).scale
    const bottomPos = Transform.get(bottomBarEntity).position
    const bottomScale = Transform.get(bottomBarEntity).scale
    const panelPos = Transform.get(cameraControlEntity).position
    const panelScale = Transform.get(cameraControlEntity).scale

    return (
        <UiEntity uiTransform={{ width: '100%', height: '100%', positionType: 'absolute' }}>
            <UiEntity
                uiTransform={{
                    width: (topScale.x + '%') as PositionUnit,
                    height: (topScale.y + '%') as PositionUnit,
                    positionType: 'absolute',
                    position: { top: (topPos.y + '%') as PositionUnit, left: (topPos.x + '%') as PositionUnit },
                }}
                uiBackground={{ color: Color4.Black() }}
            />
            <UiEntity
                uiTransform={{
                    width: (bottomScale.x + '%') as PositionUnit,
                    height: (bottomScale.y + '%') as PositionUnit,
                    positionType: 'absolute',
                    position: { top: (bottomPos.y + '%') as PositionUnit, left: (bottomPos.x + '%') as PositionUnit },
                }}
                uiBackground={{ color: Color4.Black() }}
            >
                {createUnlockCursorToast()}
            </UiEntity>
            <UiEntity
                uiTransform={{
                    width: (panelScale.x + '%') as PositionUnit,
                    height: (panelScale.y + '%') as PositionUnit,
                    positionType: 'absolute',
                    position: { top: (panelPos.y + '%') as PositionUnit, left: (panelPos.x + '%') as PositionUnit },
                }}
            />
        </UiEntity>
    )
}

function createUnlockCursorToast() {
    return (
        <UiEntity
            uiTransform={{
                display: unlockCursorToastVisible ? 'flex' : 'none',
                flexDirection: 'column',
                alignSelf: 'center',
                width: "100%",
                height: 176 * scaleFactor * 0.35,
            }}
        >
            <UiEntity
                uiTransform={{
                    width: 702 * scaleFactor * 0.35,
                    height: 176 * scaleFactor * 0.35,
                    alignSelf: 'center',
                }}
                uiBackground={{
                    textureMode: 'stretch',
                    texture: {
                        src: UI_ATLAS_SRC,
                        wrapMode: 'clamp',
                        filterMode: 'tri-linear',
                    },
                    uvs: unlockCursorUVs
                }}
            />
        </UiEntity>
    )
}
