import { ColliderLayer, engine, Entity, GltfContainer, GltfNodeModifiers, Material, MeshRenderer, Schemas, TextAlignMode, TextShape, Transform } from "@dcl/sdk/ecs"
import { CALENDAR_CARD_PADDING, CALENDAR_CARD_SPACING, CALENDAR_CARD_WIDTH, CALENDAR_CARDS_PER_DAY, CALENDAR_DATE_COLOR_DEFAULT, CALENDAR_DATE_COLOR_TODAY, CALENDAR_DAYS_SHOWN, CALENDAR_FIRST_COLUMN_X_OFFSET, CALENDAR_FIRST_ROW_Y_OFFSET, CALENDAR_MONTH_COLOR, CALENDAR_PAGE_COUNT, CALENDAR_ROW_SPACING, imgFolder, LIVE_CARD_WIDTH, modelFolder, PAGING_DOT_SPACING, PAGING_DOT_SPACING_CALENDAR, UI_ATLAS_SRC, UI_ATLAS_SRC_ALPHA } from "./config"
import { Color4, Quaternion, Vector3 } from "@dcl/sdk/math"
import { addPageContainer, ContainerInfo } from "./pageContainer"
import { getDateOffset, getDayOfMonth, getDayOfWeek, getMonthOfYearString } from "./boardFunctions"
import { addCalendarEventCard, CalendarColumnInfo, CalendarHoverInfo, updateCalendarEventCard } from "./calendarCard"
import { activatePagingDot } from "./scrollPage"
import { EventBoardInfo } from "./boardLiveEvents"
import { getAtlasPlaneUVs, getAtlasTexture } from "./deps/atlas/atlasTextures"
import { ui3dAtlasData } from "./deps/atlas/uiAtlasData"

export const CalendarPageShellInfo = engine.defineComponent('calendar-page-shell-info-component', {
    monthTextEntity: Schemas.Entity,
    dayTextEntities: Schemas.Array(Schemas.Entity),
    dayNumberEntities: Schemas.Array(Schemas.Entity),
    columnEntities: Schemas.Array(Schemas.Entity),
    cardSlots: Schemas.Array(Schemas.Entity),
})


export function addCalendarHoverFrame() {
    let hoverFrame = engine.addEntity()
    Transform.create(hoverFrame, {
        position: Vector3.create(0, 0, 0),
        rotation: Quaternion.fromEulerDegrees(0, 0, 0),
        scale: Vector3.create(1, 1, 1),
    })
    GltfContainer.create(hoverFrame, { src: modelFolder + "calendar_hover_frame.glb" })
    CalendarHoverInfo.create(hoverFrame, {
    })
}
export function setupCalendarPages(eventBoard: Entity) {

    let eventBoardInfo = EventBoardInfo.getMutable(eventBoard)
    let eventBoardRoot = eventBoardInfo.root
    let boardScalePivot = eventBoardInfo.boardScalePivot

    const slot0 = createCalendarPageShell(eventBoard, true)
    const slot1 = createCalendarPageShell(eventBoard, false)
    populateCalendarPage(slot0, eventBoard, 0)
    eventBoardInfo.pages = [slot0, slot1]

    for (let pageCount = 0; pageCount < CALENDAR_PAGE_COUNT; pageCount++) {
        let pageDot = engine.addEntity()
        Transform.create(pageDot, {
            position: Vector3.create(-((CALENDAR_PAGE_COUNT - 1) * PAGING_DOT_SPACING_CALENDAR) / 2 + pageCount * PAGING_DOT_SPACING_CALENDAR, -CALENDAR_CARD_WIDTH * 1.7, 0),
            rotation: Quaternion.fromEulerDegrees(0, 0, 0),
            scale: Vector3.create(0.25, 0.25, 1),
            parent: boardScalePivot
        })
        MeshRenderer.setPlane(pageDot, getAtlasPlaneUVs(ui3dAtlasData, "paging_dot_gray.png"))
        Material.setBasicMaterial(pageDot, {
            texture: getAtlasTexture(UI_ATLAS_SRC),
            alphaTexture: getAtlasTexture(UI_ATLAS_SRC_ALPHA),
        })
        eventBoardInfo.pageDots.push(pageDot)

        activatePagingDot(eventBoardRoot, 0)
    }

}

export function createCalendarPageShell(eventBoardEntity: Entity, visible: boolean): Entity {
    const eventBoardMutable = EventBoardInfo.get(eventBoardEntity)
    const placeholderEvent = eventBoardMutable.savedEvents.length > 0
        ? eventBoardMutable.savedEvents[0]
        : { id: '', eventName: '', thumbnailSrc: '', date: new Date().toISOString(), user_name: '', coordinateX: '0', coordinateZ: '0', world: false, server: '', detailText: '' }

    const container = addPageContainer(eventBoardMutable.boardScalePivot, visible)

    let calendarBG = engine.addEntity()
    Transform.create(calendarBG, {
        position: Vector3.create(0, 0, 0.05),
        rotation: Quaternion.fromEulerDegrees(0, 0, 0),
        scale: Vector3.create(5, 5, 1),
        parent: container
    })
    GltfContainer.create(calendarBG, { src: modelFolder + "calendar_bg_tall.glb", visibleMeshesCollisionMask: ColliderLayer.CL_POINTER })
    GltfNodeModifiers.create(calendarBG, {
        modifiers: [{ path: '', material: { material: { $case: 'unlit', unlit: { diffuseColor: Color4.White(), texture: Material.Texture.Common({ src: imgFolder + "calendar_bg.png" }), castShadows: false } } } }]
    })

    const monthText = engine.addEntity()
    Transform.create(monthText, {
        position: Vector3.create(-CALENDAR_CARD_WIDTH + CALENDAR_CARD_PADDING + 0.07, CALENDAR_FIRST_ROW_Y_OFFSET + 1.6, 0.03),
        rotation: Quaternion.fromEulerDegrees(0, 0, 0),
        scale: Vector3.create(1, 1, 1),
        parent: container
    })
    TextShape.create(monthText, { text: '', textColor: Color4.fromHexString(CALENDAR_MONTH_COLOR), textAlign: TextAlignMode.TAM_MIDDLE_LEFT, fontSize: 3 })

    const dayTextEntities: Entity[] = []
    const dayNumberEntities: Entity[] = []
    const columnEntities: Entity[] = []
    const cardSlots: Entity[] = []

    for (let i = 0; i < CALENDAR_DAYS_SHOWN; i++) {
        const column = engine.addEntity()
        Transform.create(column, {
            position: Vector3.create(CALENDAR_FIRST_COLUMN_X_OFFSET + i * CALENDAR_CARD_SPACING, CALENDAR_FIRST_ROW_Y_OFFSET, 0),
            rotation: Quaternion.fromEulerDegrees(0, 0, 0),
            scale: Vector3.create(1, 1, 1),
            parent: container
        })
        columnEntities.push(column)
        CalendarColumnInfo.create(column, { cardEntities: [], container: container, xOffset: CALENDAR_FIRST_COLUMN_X_OFFSET + i * CALENDAR_CARD_SPACING })

        const dayText = engine.addEntity()
        Transform.create(dayText, {
            position: Vector3.create(CALENDAR_FIRST_COLUMN_X_OFFSET + i * CALENDAR_CARD_SPACING, CALENDAR_FIRST_ROW_Y_OFFSET + 0.9, 0.03),
            rotation: Quaternion.fromEulerDegrees(0, 0, 0),
            scale: Vector3.create(1, 1, 1),
            parent: container
        })
        TextShape.create(dayText, { text: '', textColor: Color4.fromHexString(CALENDAR_DATE_COLOR_DEFAULT), fontSize: 1.5, outlineColor: Color4.fromHexString(CALENDAR_DATE_COLOR_DEFAULT), outlineWidth: 0.1 })
        dayTextEntities.push(dayText)

        const dayNumber = engine.addEntity()
        Transform.create(dayNumber, {
            position: Vector3.create(CALENDAR_FIRST_COLUMN_X_OFFSET + i * CALENDAR_CARD_SPACING, CALENDAR_FIRST_ROW_Y_OFFSET + 1.2, 0.03),
            rotation: Quaternion.fromEulerDegrees(0, 0, 0),
            scale: Vector3.create(1, 1, 1),
            parent: container
        })
        TextShape.create(dayNumber, { text: '', textColor: Color4.fromHexString(CALENDAR_DATE_COLOR_DEFAULT), fontSize: 3 })
        dayNumberEntities.push(dayNumber)

        for (let row = 0; row < CALENDAR_CARDS_PER_DAY; row++) {
            const cardYOffset = row * -CALENDAR_ROW_SPACING
            const pos = Vector3.create(CALENDAR_FIRST_COLUMN_X_OFFSET + i * CALENDAR_CARD_SPACING, CALENDAR_FIRST_ROW_Y_OFFSET + cardYOffset, -0.05)
            const cardRoot = addCalendarEventCard(container, placeholderEvent, pos, false)
            updateCalendarEventCard(cardRoot, placeholderEvent, false)
            cardSlots.push(cardRoot)
        }
    }

    ContainerInfo.getMutable(container).cardEntities = cardSlots
    CalendarPageShellInfo.create(container, { monthTextEntity: monthText, dayTextEntities, dayNumberEntities, columnEntities, cardSlots })
    return container
}

export function populateCalendarPage(container: Entity, eventBoardEntity: Entity, pageCount: number) {
    const eventBoardMutable = EventBoardInfo.get(eventBoardEntity)
    const shellInfo = CalendarPageShellInfo.get(container)

    const startingDate = new Date(Date.now())
    startingDate.setDate(startingDate.getDate() + CALENDAR_DAYS_SHOWN * pageCount)

    TextShape.getMutable(shellInfo.monthTextEntity).text = `<cspace=-0.1em><b>${getMonthOfYearString(startingDate.toISOString())}</b></cspace>`

    // Reset all card slots to hidden and clear column card lists
    for (let slot of shellInfo.cardSlots) {
        updateCalendarEventCard(slot, { id: '', eventName: '', thumbnailSrc: '', date: startingDate.toISOString(), user_name: '', coordinateX: '0', coordinateZ: '0', world: false, server: '', detailText: '' }, false)
    }
    for (let col of shellInfo.columnEntities) {
        CalendarColumnInfo.getMutable(col).cardEntities = []
    }

    // Update day labels
    for (let i = 0; i < CALENDAR_DAYS_SHOWN; i++) {
        const dayDate = new Date(startingDate.getTime() + i * 24 * 60 * 60 * 1000)
        const isToday = pageCount === 0 && i === 0
        const color = isToday ? Color4.fromHexString(CALENDAR_DATE_COLOR_TODAY) : Color4.fromHexString(CALENDAR_DATE_COLOR_DEFAULT)
        const dayTextShape = TextShape.getMutable(shellInfo.dayTextEntities[i])
        dayTextShape.text = `<cspace=-0.1em><b>${getDayOfWeek(dayDate.toISOString())}</b></cspace>`
        dayTextShape.textColor = color
        dayTextShape.outlineColor = color
        const dayNumberShape = TextShape.getMutable(shellInfo.dayNumberEntities[i])
        dayNumberShape.text = `<cspace=-0.1em><b>${getDayOfMonth(dayDate.toISOString())}</b></cspace>`
        dayNumberShape.textColor = color
    }

    // Assign events to slots
    const colCounts = new Array(CALENDAR_DAYS_SHOWN).fill(0)
    const activeCardEntities: Entity[] = []
    for (let i = 0; i < eventBoardMutable.savedEvents.length; i++) {
        const dayOffset = Math.round(getDateOffset(startingDate.toISOString(), eventBoardMutable.savedEvents[i].date))
        if (dayOffset < 0 || dayOffset >= CALENDAR_DAYS_SHOWN) continue
        if (colCounts[dayOffset] >= CALENDAR_CARDS_PER_DAY) continue

        const row = colCounts[dayOffset]
        const slotIndex = dayOffset * CALENDAR_CARDS_PER_DAY + row
        const cardRoot = shellInfo.cardSlots[slotIndex]
        updateCalendarEventCard(cardRoot, eventBoardMutable.savedEvents[i], true)
        colCounts[dayOffset]++

        const colInfo = CalendarColumnInfo.getMutable(shellInfo.columnEntities[dayOffset])
        colInfo.cardEntities.push(cardRoot)
        colInfo.container = container
        activeCardEntities.push(cardRoot)
    }

    ContainerInfo.getMutable(container).cardEntities = activeCardEntities
}