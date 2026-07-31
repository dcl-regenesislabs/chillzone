import { ColliderLayer, EasingFunction, engine, Entity, getWorldPosition, GltfContainer, InputAction, inputSystem, Material, MaterialTransparencyMode, MeshCollider, MeshRenderer, pointerEventsSystem, PointerEventType, Schemas, timers, Transform, TransformTypeWithOptionals, Tween, VisibilityComponent } from "@dcl/sdk/ecs"
import { Color3, Color4, Quaternion, Vector3 } from "@dcl/sdk/math"
import { BOARD_HEIGHT, BOARD_WIDTH, LIVE_CARD_WIDTH, PAGING_DOT_SPACING, CAMERA_DISTANCE, EVENT_BOARD_TYPE, UPCOMING_OFFSET, LIVE_BOARD_SCROLL_INTERVAL, UPCOMING_BOARD_SCROLL_INTERVAL, CAMERA_TRANSITION_TIME, CALENDAR_BOARD_SCROLL_INTERVAL, LIVE_BOARD_AUTO_UPDATE_INTERVAL, LIVE_CAMERA_Y, LIVE_ACTIVE_POS_Y, TITLE_MODEL_LIVE, TITLE_MODEL_UPCOMING, TITLE_MODEL_PIVOT_COMPENSATION } from "./config"
import { SpriteAnimSystem } from "./deps/spriteAnimator"
import { addCamera, enterCinematicMode, exitCinematicMode, lockPlayer } from "./deps/cameras"
import { CAMERA_TYPE } from "./deps/cameraConfig"
import { EventsService } from "./api/apiService"
import { addLiveEventCard, setDescriptionPanel, updateLiveEventCard } from "./liveEventCard"
import { lineAnimatorSystem, scaleTween, clickTeleportToEvent } from "./boardFunctions"
import { addCloseButton } from "./closeButton"
import { addPageContainer, ContainerInfo } from "./pageContainer"
import { addUpcomingEventCard, setDescriptionPanelUpcoming, updateUpcomingEventCard, UpcomingEventCardInfo } from "./upcomingEventCard"
import { activatePagingDot, autoScrollSystem, resetBoardSlot, scrollLiveEvents } from "./scrollPage"
import { realDistance } from "./deps/animUtils"
import { PlayerState } from "./deps/playerState"
import { setDescriptionPanelCalendar } from "./calendarCard"
import { EventMenuBlackMask, maskFadeSystem } from "./blackMask"
import { setupCalendarPages } from "./setupCalendarPage"
import { getSceneRoot } from "./deps/sceneRoot"
import { blogEntries } from "./deps/blogEntries"
import { createBlogPageShell, populateBlogPage } from "./blogCard"
import { getAtlasPlaneUVs, getAtlasTexture } from "./deps/atlas/atlasTextures"
import { ui3dAtlasData } from "./deps/atlas/uiAtlasData"
import { showUnlockCursorToast } from "./deps/cinematicUI"
import { initCalendarDetailCard } from "./calendarDetails"
import { lockCursor, unlockCursor } from "./deps/cursorLock"


const SavedEventSchema = Schemas.Map({
    id: Schemas.String,
    eventName: Schemas.String,
    thumbnailSrc: Schemas.String,
    user_name: Schemas.String,
    date: Schemas.String,
    coordinateX: Schemas.String,
    coordinateZ: Schemas.String,
    world: Schemas.Boolean,
    server: Schemas.String,
    detailText: Schemas.String,
})


export const EventBoardInfo = engine.defineComponent('event-board-info-component', {
    root: Schemas.Entity,
    pages: Schemas.Array(Schemas.Entity),
    pageDots: Schemas.Array(Schemas.Entity),
    activePagingDot: Schemas.Entity,
    currentPageIndex: Schemas.Number,
    eventCam: Schemas.Entity,
    width: Schemas.Number,
    height: Schemas.Number,
    eventInteractionActive: Schemas.Boolean,
    savedEvents: Schemas.Array(SavedEventSchema),
    scrollCooldown: Schemas.Number,
    blackMask: Schemas.Entity,
    inactivePosition: Schemas.Vector3,
    activePosition: Schemas.Vector3,
    closeButton: Schemas.Entity,
    rightScrollArrow: Schemas.Entity,
    leftScrollArrow: Schemas.Entity,
    type: Schemas.Number,
    autoScrollInterval: Schemas.Number,
    autoScrollElapsed: Schemas.Number,
    autoUpdateInterval: Schemas.Number,
    autoUpdateElapsed: Schemas.Number,
    playerOriginalPosition: Schemas.Vector3,
    boardScalePivot: Schemas.Entity,
    liveBoardTitleEntity: Schemas.Entity,
    showTitle: Schemas.Boolean,

})

export const EventMenuCollider = engine.defineComponent('event-menu-collider-component', {
    originalScale: Schemas.Vector3,
})


function addEventMenuCollider(eventBoardRoot: Entity, doubleHeight: boolean = false): Entity {
    let eventMenuCollider = engine.addEntity()
    const scale = Vector3.create(LIVE_CARD_WIDTH * 2.4, doubleHeight ? LIVE_CARD_WIDTH * 3 : LIVE_CARD_WIDTH * 1.4, 1)
    Transform.create(eventMenuCollider, {
        position: Vector3.create(0, -0.5, 0),
        rotation: Quaternion.fromEulerDegrees(0, 0, 0),
        scale,
        parent: eventBoardRoot
    })
    MeshCollider.setBox(eventMenuCollider, ColliderLayer.CL_POINTER || ColliderLayer.CL_PHYSICS)
    //MeshRenderer.setBox(eventMenuCollider)
    EventMenuCollider.create(eventMenuCollider, { originalScale: scale })
    return eventMenuCollider
}

function addEventMenuBlackMask(eventBoardRoot: Entity): Entity {

    let eventMenuBlackMask = engine.addEntity()

    Transform.create(eventMenuBlackMask, {
        position: Vector3.create(0, 0, 5),
        rotation: Quaternion.fromEulerDegrees(0, 0, 0),
        // scale: Vector3.create(BOARD_WIDTH, BOARD_HEIGHT*2, 1 ),
        scale: Vector3.create(0, 0, 1),
        parent: eventBoardRoot
    })
    MeshRenderer.setPlane(eventMenuBlackMask)
    MeshCollider.setPlane(eventMenuBlackMask, ColliderLayer.CL_POINTER)
    Material.setPbrMaterial(eventMenuBlackMask, {
        albedoColor: Color4.fromHexString("#000000dd"),
        castShadows: false,
        roughness: 1,
        metallic: 0,
        specularIntensity: 0

    })
    VisibilityComponent.create(eventMenuBlackMask, { visible: false })
    EventMenuBlackMask.create(eventMenuBlackMask, {
        fadeFactor: 0,
        endAlpha: 0.85,
        active: false,
        speed: 2
    })

    pointerEventsSystem.onPointerDown(
        {
            entity: eventMenuBlackMask,
            opts: {
                hoverText: 'EXIT',
                button: InputAction.IA_POINTER,
                showFeedback: true,
                showHighlight: false,
                maxDistance: 32
            }
        },
        (e) => {
            endEventInteraction()
            exitCinematicMode()
        }
    )
    return eventMenuBlackMask
}

let eventMenusSystemsStarted = false

export function initEventMenuSystems() {
    if (eventMenusSystemsStarted) return
    eventMenusSystemsStarted = true
    initCalendarDetailCard()
    engine.addSystem(SpriteAnimSystem)
    engine.addSystem(maskFadeSystem)
    engine.addSystem(lineAnimatorSystem)
    engine.addSystem(autoScrollSystem)

    timers.setInterval(() => {
        let eventBoardGroup = engine.getEntitiesWith(EventBoardInfo)
        for(let [eventBoard, info] of eventBoardGroup){
            if(!info.eventInteractionActive && info.type === EVENT_BOARD_TYPE.LIVE){                          
                    updateLiveEvents(eventBoard)
            }
        }
    }, LIVE_BOARD_AUTO_UPDATE_INTERVAL * 1000)
    
}



/** Opciones de montaje del board. Todas opcionales. */
export type EventBoardOptions = {
    /**
     * Entidad de la que colgar el board. Por defecto la raíz del módulo
     * (ver `deps/sceneRoot.ts`), que vive en (0,0,0).
     */
    parent?: Entity
    /**
     * Muestra los carteles 3D "LIVE EVENTS" / "NEXT LIVE EVENTS" (solo tipo LIVE).
     * El board alterna entre los dos según haya o no eventos en vivo.
     * Default: false.
     */
    showTitle?: boolean
    /**
     * Dónde va el cartel de título. La posición que pases es donde aparece el texto:
     * el offset horneado en el .glb ya está compensado internamente
     * (ver TITLE_MODEL_PIVOT_COMPENSATION en config.ts).
     * Se ignora si `showTitle` es false.
     */
    titleTransform?: TransformTypeWithOptionals
}

export async function initLiveEventBoard(
    transform: TransformTypeWithOptionals,
    _hoverText: string,
    type: EVENT_BOARD_TYPE,
    options: EventBoardOptions = {}
) {
    initEventMenuSystems()

    const boardParent = options.parent ?? getSceneRoot()
    const showTitle = options.showTitle === true

    let eventBoardRoot = engine.addEntity()
    Transform.create(eventBoardRoot, {
        ...transform,
        parent: boardParent
    })
    let boardScalePivot = engine.addEntity()
    Transform.create(boardScalePivot, {
        position: Vector3.create(0, 0, 0),
        rotation: Quaternion.fromEulerDegrees(0, 0, 0),
        scale: Vector3.create(1, 1, 1),
        parent: eventBoardRoot
    })

    // Anchor del cartel de título: acá se aplica el titleTransform que pasó el usuario.
    let liveBoardTitleAnchor = engine.addEntity()
    Transform.create(liveBoardTitleAnchor, {
        position: Vector3.create(0, 0, 0),
        rotation: Quaternion.fromEulerDegrees(0, 0, 0),
        scale: Vector3.create(1, 1, 1),
        parent: boardParent,
        ...options.titleTransform
    })

    // Hijo que lleva el .glb. Compensa el transform horneado en el modelo (ver
    // TITLE_MODEL_PIVOT_COMPENSATION en config.ts) para que el texto quede centrado
    // en el origen del anchor. Al ser una entidad aparte, la rotación del anchor
    // gira el cartel sobre sí mismo en vez de arrastrarlo por el offset horneado.
    let liveBoardTitleEntity = engine.addEntity()
    Transform.create(liveBoardTitleEntity, {
        position: TITLE_MODEL_PIVOT_COMPENSATION,
        rotation: Quaternion.fromEulerDegrees(0, 0, 0),
        scale: Vector3.create(1, 1, 1),
        parent: liveBoardTitleAnchor
    })

    let activePosition = Vector3.add(transform.position!, Vector3.rotate(Vector3.create(0,1,-5), transform.rotation!))
    let cameraPosition =  Vector3.create(0, -0.2, -CAMERA_DISTANCE)

    switch (type) {
        case EVENT_BOARD_TYPE.LIVE:
            activePosition = Vector3.add(transform.position!, Vector3.rotate(Vector3.create(0,LIVE_ACTIVE_POS_Y,-5), transform.rotation!))
            cameraPosition =  Vector3.create(0, LIVE_CAMERA_Y, -CAMERA_DISTANCE)         
            break
        case EVENT_BOARD_TYPE.UPCOMING:
            activePosition = Vector3.add(transform.position!, Vector3.rotate(Vector3.create(0,1,-5), transform.rotation!))
            cameraPosition =  Vector3.create(0, -0.2, -CAMERA_DISTANCE)
            break
        case EVENT_BOARD_TYPE.CALENDAR:
            activePosition = Vector3.add(transform.position!, Vector3.rotate(Vector3.create(0,2,-7), transform.rotation!))
            cameraPosition =  Vector3.create(0, -1.4, -CAMERA_DISTANCE *0.75)
            break
        case EVENT_BOARD_TYPE.BLOG:
            activePosition = Vector3.add(transform.position!, Vector3.rotate(Vector3.create(0,1,-5), transform.rotation!))
            cameraPosition =  Vector3.create(0, -0.4, -CAMERA_DISTANCE + 1)
            break
        
      
    }

    // initCamera()
    let eventCam = addCamera({
        types: [CAMERA_TYPE.CENTER_TARGET],
        avatarAttached: false,
        fov: 70,
        //position: Vector3.add(activePosition, Vector3.rotate(Vector3.create(0, -0.5, -CAMERA_DISTANCE), transform.rotation!)),
        position: cameraPosition,
        rotation:  Quaternion.fromEulerDegrees(0, 0, 0),
        targetVerticalOffset: 0.0,
        importedRotation: false,
        lookAtTarget: false
    }, CAMERA_TRANSITION_TIME)

    let cameraTransform = Transform.getMutable(eventCam)
    cameraTransform.position = cameraPosition
    cameraTransform.parent = eventBoardRoot

    //let detailCard = addDetailCard(liveBoardRoot)
    let eventMenuCollider = addEventMenuCollider(boardScalePivot, type === EVENT_BOARD_TYPE.CALENDAR)

    let liveBoardBG = addEventMenuBlackMask(boardScalePivot)

    let closeButton = addCloseButton(boardScalePivot, Vector3.create(5.5, +2.6, -0.05), Vector3.create(0.5, 0.5, 1), () => {
        exitCinematicMode()
        endEventInteraction()

    })
    VisibilityComponent.getMutable(closeButton).visible = false


    pointerEventsSystem.onPointerDown(
        {
            entity: eventMenuCollider,
            opts: {
                hoverText: _hoverText,
                button: InputAction.IA_POINTER,
                showFeedback: true,
                showHighlight: false,
                maxDistance: 32
            }
        },
        (e) => {
            // Same behaviour as the portals: jump straight into the currently shown
            // event's scene — changeRealm for Worlds, teleportTo for Genesis City
            // parcels (clickTeleportToEvent handles both). No focus/cinematic mode,
            // which renders poorly on mobile.
            const info = EventBoardInfo.get(eventBoardRoot)
            const current = info.savedEvents[info.currentPageIndex]
            if (current) {
                clickTeleportToEvent({
                    coordinates: [current.coordinateX, current.coordinateZ],
                    world: current.world,
                    server: current.server
                })
            }
        }
    )

    engine.addSystem((dt: number) => {
        let eventBoardInfo = EventBoardInfo.get(eventBoardRoot)
        if (eventBoardInfo.eventInteractionActive) {
            if (inputSystem.isTriggered(InputAction.IA_RIGHT, PointerEventType.PET_DOWN)) {
                scrollLiveEvents(eventBoardRoot, false)
                scaleTween(eventBoardInfo.rightScrollArrow, Vector3.create(0.25, 0.5, 1), Vector3.create(0.5, 1, 1), EasingFunction.EF_EASEOUTCIRC)
            }
            if (inputSystem.isTriggered(InputAction.IA_LEFT, PointerEventType.PET_DOWN)) {
                scrollLiveEvents(eventBoardRoot, true)
                scaleTween(eventBoardInfo.leftScrollArrow, Vector3.create(0.25, 0.5, 1), Vector3.create(0.5, 1, 1), EasingFunction.EF_EASEOUTCIRC)
            }
            if (inputSystem.isTriggered(InputAction.IA_PRIMARY, PointerEventType.PET_DOWN)) {
                endEventInteraction()
                exitCinematicMode()
            }

            if (realDistance(eventBoardInfo.playerOriginalPosition, Transform.get(engine.PlayerEntity).position) > 0.1) {
                endEventInteraction()
                exitCinematicMode()
            }
        }


    })

    let rightScrollArrow = engine.addEntity()
    Transform.create(rightScrollArrow, {
        position: Vector3.create(LIVE_CARD_WIDTH + 0.65, type === EVENT_BOARD_TYPE.CALENDAR ? -2.5 : -0.5, 0),
        rotation: Quaternion.fromEulerDegrees(0, 0, 0),
        scale: Vector3.create(0.5, 1, 1),
        parent: boardScalePivot
    })
    MeshRenderer.setPlane(rightScrollArrow, getAtlasPlaneUVs(ui3dAtlasData, "event_menu_arrow.png"))
    VisibilityComponent.create(rightScrollArrow, { visible: false })
    //MeshCollider.setPlane(rightScrollArrow, ColliderLayer.CL_POINTER)
    Material.setBasicMaterial(rightScrollArrow, {
        texture: getAtlasTexture(ui3dAtlasData.atlas.src),
        alphaTexture: getAtlasTexture(ui3dAtlasData.atlas.src),
    })

    let rightScrollArrowCollider = engine.addEntity()
    Transform.create(rightScrollArrowCollider, {
        position: Vector3.create(0, 0, 0),
        rotation: Quaternion.fromEulerDegrees(0, 0, 0),
        scale: Vector3.create(2, 2, 0.1),
        parent: rightScrollArrow
    })
    MeshCollider.setBox(rightScrollArrowCollider, ColliderLayer.CL_POINTER)
    // MeshRenderer.setBox(rightScrollArrowCollider)
    pointerEventsSystem.onPointerDown(
        {
            entity: rightScrollArrowCollider,
            opts: {
                hoverText: 'SCROLL RIGHT',
                button: InputAction.IA_POINTER,
                showFeedback: true,
                showHighlight: false,
                maxDistance: 32
            }
        },
        (e) => {
            //console.log("right scroll arrow clicked")
            //rotateEventCard(getCurrentEventCard(liveBoardRoot), false, false)
            scrollLiveEvents(eventBoardRoot, false)
            scaleTween(rightScrollArrow, Vector3.create(0.25, 0.5, 1), Vector3.create(0.5, 1, 1), EasingFunction.EF_EASEOUTCIRC)
        }
    )
    pointerEventsSystem.onPointerHoverEnter(
        {
            entity: rightScrollArrowCollider,
            opts: {
                hoverText: 'SCROLL RIGHT',
                button: InputAction.IA_POINTER,
                showFeedback: true,
                showHighlight: false,
                maxDistance: 32
            }
        },
        (e) => {
            scaleTween(rightScrollArrow, Vector3.create(0.5, 1, 1), Vector3.create(0.6, 1.2, 1), EasingFunction.EF_EASEOUTCIRC)
        }
    )
    pointerEventsSystem.onPointerHoverLeave(
        {
            entity: rightScrollArrowCollider,
            opts: {
                hoverText: 'SCROLL RIGHT',
                button: InputAction.IA_POINTER,
                showFeedback: true,
                showHighlight: false,
                maxDistance: 32
            }
        },
        (e) => {
            scaleTween(rightScrollArrow, Vector3.create(0.6, 1.2, 1), Vector3.create(0.5, 1, 1), EasingFunction.EF_EASEOUTELASTIC, 400)
        }
    )
    let leftScrollArrow = engine.addEntity()
    Transform.create(leftScrollArrow, {
        position: Vector3.create(-LIVE_CARD_WIDTH - 0.65, type === EVENT_BOARD_TYPE.CALENDAR ? -2.5 : -0.5, 0),
        rotation: Quaternion.fromEulerDegrees(0, 0, 180),
        scale: Vector3.create(0.5, 1, 1),
        parent: boardScalePivot
    })
    MeshRenderer.setPlane(leftScrollArrow, getAtlasPlaneUVs(ui3dAtlasData, "event_menu_arrow.png"))
    VisibilityComponent.create(leftScrollArrow, { visible: false })
    //MeshCollider.setPlane(leftScrollArrow, ColliderLayer.CL_POINTER)
    Material.setBasicMaterial(leftScrollArrow, {
        texture: getAtlasTexture(ui3dAtlasData.atlas.src),
        alphaTexture: getAtlasTexture(ui3dAtlasData.atlas.src),
    })
    let leftScrollArrowCollider = engine.addEntity()
    Transform.create(leftScrollArrowCollider, {
        position: Vector3.create(0, 0, 0),
        rotation: Quaternion.fromEulerDegrees(0, 0, 0),
        scale: Vector3.create(2, 2, 0.1),
        parent: leftScrollArrow
    })
    MeshCollider.setBox(leftScrollArrowCollider, ColliderLayer.CL_POINTER)
    //MeshRenderer.setBox(leftScrollArrowCollider)
    pointerEventsSystem.onPointerDown(
        {
            entity: leftScrollArrowCollider,
            opts: {
                hoverText: 'SCROLL LEFT',
                button: InputAction.IA_POINTER,
                showFeedback: true,
                showHighlight: false,
                maxDistance: 32
            }
        },
        (e) => {
            //console.log("left scroll arrow clicked")
            //rotateEventCard(getCurrentEventCard(liveBoardRoot), true, false)
            scrollLiveEvents(eventBoardRoot, true)
            scaleTween(leftScrollArrow, Vector3.create(0.25, 0.5, 1), Vector3.create(0.5, 1, 1), EasingFunction.EF_EASEOUTCIRC)
        }

    )
    pointerEventsSystem.onPointerHoverEnter(
        {
            entity: leftScrollArrowCollider,
            opts: {
                hoverText: 'SCROLL LEFT',
                button: InputAction.IA_POINTER,
                showFeedback: true,
                showHighlight: false,
                maxDistance: 32
            }
        },
        (e) => {
            scaleTween(leftScrollArrow, Vector3.create(0.5, 1, 1), Vector3.create(0.6, 1.2, 1), EasingFunction.EF_EASEOUTCIRC)
        }
    )
    pointerEventsSystem.onPointerHoverLeave(
        {
            entity: leftScrollArrowCollider,
            opts: {
                hoverText: 'SCROLL LEFT',
                button: InputAction.IA_POINTER,
                showFeedback: true,
                showHighlight: false,
                maxDistance: 32
            }
        },
        (e) => {
            scaleTween(leftScrollArrow, Vector3.create(0.6, 1.2, 1), Vector3.create(0.5, 1, 1), EasingFunction.EF_EASEOUTELASTIC, 400)
        }
    )


    let activePagingDot = engine.addEntity()
    Transform.create(activePagingDot, {
        position: Vector3.create(0, 0, -0.02),
        rotation: Quaternion.fromEulerDegrees(0, 0, 0),
        scale: Vector3.create(1, 1, 1),
        parent: boardScalePivot
    })
    MeshRenderer.setPlane(activePagingDot, getAtlasPlaneUVs(ui3dAtlasData, "paging_dot_red.png"))
    Material.setPbrMaterial(activePagingDot, {
        texture: getAtlasTexture(ui3dAtlasData.atlas.src),
        transparencyMode: MaterialTransparencyMode.MTM_ALPHA_BLEND,
        emissiveTexture: getAtlasTexture(ui3dAtlasData.atlas.src),
        emissiveColor: Color3.fromHexString("#FFFFFF"),
        emissiveIntensity: 0.4,
        castShadows: false,
        //alphaTexture: getAtlasTexture(ui3dAtlasData.atlas.srcAlpha),
    })

    let autoScrollInterval = 10
    let autoUpdateInterval = 100
    switch (type) {
        case EVENT_BOARD_TYPE.LIVE:
            autoScrollInterval = LIVE_BOARD_SCROLL_INTERVAL
            autoUpdateInterval = LIVE_BOARD_AUTO_UPDATE_INTERVAL
            break
        case EVENT_BOARD_TYPE.UPCOMING:
            autoScrollInterval = UPCOMING_BOARD_SCROLL_INTERVAL
            break
        case EVENT_BOARD_TYPE.CALENDAR:
            autoScrollInterval = CALENDAR_BOARD_SCROLL_INTERVAL
            break
    }

    EventBoardInfo.create(eventBoardRoot, {
        root: eventBoardRoot,
        // pages: [],
        pageDots: [],
        activePagingDot: activePagingDot,
        currentPageIndex: 0,
        width: BOARD_WIDTH,
        height: BOARD_HEIGHT,
        eventInteractionActive: false,
        savedEvents: [],
        eventCam: eventCam,
        blackMask: liveBoardBG,
        inactivePosition: transform.position!,
        activePosition: activePosition,
        closeButton: closeButton,
        rightScrollArrow: rightScrollArrow,
        leftScrollArrow: leftScrollArrow,
        type: type,
        autoScrollInterval: autoScrollInterval,
        autoScrollElapsed: 0,
        autoUpdateInterval: autoUpdateInterval,
        autoUpdateElapsed: 0,
        playerOriginalPosition: Vector3.create(0, 0, 0),
        boardScalePivot: boardScalePivot,
        liveBoardTitleEntity: liveBoardTitleEntity,
        showTitle: showTitle
    })

    // engine.addSystem((dt: number) => {
    //     if (EventBoardInfo.get(eventBoardRoot).scrollCooldown > 0) {
    //         EventBoardInfo.getMutable(eventBoardRoot).scrollCooldown -= dt
    //     }
    // })
    await EventsService.instance().updateEventsList()

    let events = []
    switch (type) {
        case EVENT_BOARD_TYPE.LIVE:
            //events = EventsService.instance().getLiveEvents()
            events = EventsService.instance().getLiveEvents(20)
            if(events.length > 0){
                if (showTitle) GltfContainer.createOrReplace(liveBoardTitleEntity, { src: TITLE_MODEL_LIVE })
            } else {
                // No hay nada en vivo ahora mismo: el board LIVE cae de vuelta a los
                // próximos 4 eventos y cambia el cartel a "NEXT LIVE EVENTS".
                events = EventsService.instance().getUpcomingEvents(4)
                if (showTitle) GltfContainer.createOrReplace(liveBoardTitleEntity, { src: TITLE_MODEL_UPCOMING })
            }
            break
        case EVENT_BOARD_TYPE.UPCOMING:
            events = EventsService.instance().getUpcomingEvents(24)
            break
        case EVENT_BOARD_TYPE.CALENDAR:
            //events = EventsService.instance().getCalendarEvents(Date.now(), Date.now() + 1000*60*60*24*7)
            events = EventsService.instance().getCalendarEvents(96)
            break
        default:
            events = EventsService.instance().getUpcomingEvents(20)
            break
    }


    const savedEventList = []
    if (events && type !== EVENT_BOARD_TYPE.BLOG) {
        for (let event of events) {

            // console.log(event.name)
            // console.log("- " + event.image)
            // console.log("- " + event.user_name)
            // console.log("- " + event.start_at)
            // console.log("- " + event.world)
            // console.log("- " + event.server)
            // console.log("- " + event.coordinates)
            savedEventList.push({
                id: event.id,
                eventName: event.name,
                thumbnailSrc: event.image,
                user_name: event.user_name,
                date: event.next_start_at,
                coordinateX: event.coordinates[0],
                coordinateZ: event.coordinates[1],
                world: event.world,
                server: event.server ? event.server : "",
                detailText: event.description,
            })
        }
        
    } else if (type == EVENT_BOARD_TYPE.BLOG) {
        for (const entry of blogEntries) {
            savedEventList.push({
                id: entry.url,
                eventName: entry.title,
                thumbnailSrc: entry.imageUrl,
                user_name: '',
                date: entry.date,
                coordinateX: "0",
                coordinateZ: "0",
                world: false,
                server: entry.url,
                detailText: entry.description,
            })
            
        }
    }
    
    const eventBoardInfo = EventBoardInfo.getMutable(eventBoardRoot)
    eventBoardInfo.savedEvents = savedEventList
    

    switch (type) {

        case EVENT_BOARD_TYPE.LIVE:
            for (let i = 0; i < savedEventList.length; i++) {
                let pageDot = engine.addEntity()
                Transform.create(pageDot, {
                    position: Vector3.create(-((savedEventList.length - 1) * PAGING_DOT_SPACING) / 2 + i * PAGING_DOT_SPACING, -LIVE_CARD_WIDTH * 0.82, 0),
                    rotation: Quaternion.fromEulerDegrees(0, 0, 0),
                    scale: Vector3.create(0.25, 0.25, 1),
                    parent: boardScalePivot
                })
                MeshRenderer.setPlane(pageDot, getAtlasPlaneUVs(ui3dAtlasData, "paging_dot_gray.png"))
                Material.setBasicMaterial(pageDot, {
                    texture: getAtlasTexture(ui3dAtlasData.atlas.src),
                    alphaTexture: getAtlasTexture(ui3dAtlasData.atlas.srcAlpha),
                })
                eventBoardInfo.pageDots.push(pageDot)
                if (i == 0) {
                    activatePagingDot(eventBoardRoot, i)
                }
            }
            eventBoardInfo.pages[0] = createLiveEventPageShell(eventBoardRoot, true)
            eventBoardInfo.pages[1] = createLiveEventPageShell(eventBoardRoot, false)
            populateLiveEventPage(eventBoardInfo.pages[0], eventBoardRoot, 0)
            break

        case EVENT_BOARD_TYPE.UPCOMING:
            let pageCountUpcoming = Math.ceil(savedEventList.length / 4)
            for (let i = 0; i < pageCountUpcoming; i++) {
                let pageDot = engine.addEntity()
                Transform.create(pageDot, {
                    position: Vector3.create(-((pageCountUpcoming - 1) * PAGING_DOT_SPACING) / 2 + Math.floor(i) * PAGING_DOT_SPACING, -LIVE_CARD_WIDTH * 0.82, 0),
                    rotation: Quaternion.fromEulerDegrees(0, 0, 0),
                    scale: Vector3.create(0.25, 0.25, 1),
                    parent: boardScalePivot
                })
                MeshRenderer.setPlane(pageDot, getAtlasPlaneUVs(ui3dAtlasData, "paging_dot_gray.png"))
                Material.setBasicMaterial(pageDot, {
                    texture: getAtlasTexture(ui3dAtlasData.atlas.src),
                    alphaTexture: getAtlasTexture(ui3dAtlasData.atlas.srcAlpha),
                })
                eventBoardInfo.pageDots.push(pageDot)
                if (i == 0) {
                    activatePagingDot(eventBoardRoot, i)
                }
            }
            eventBoardInfo.pages[0] = createUpcomingPageShell(eventBoardRoot, true)
            eventBoardInfo.pages[1] = createUpcomingPageShell(eventBoardRoot, false)
            populateUpcomingPage(eventBoardInfo.pages[0], eventBoardRoot, 0)
            break

        case EVENT_BOARD_TYPE.BLOG:
            let pageCount = Math.ceil(savedEventList.length / 2)
            for (let i = 0; i < savedEventList.length - 1; i += 2) {
                let pageDot = engine.addEntity()
                Transform.create(pageDot, {
                    position: Vector3.create(-((pageCount - 1) * PAGING_DOT_SPACING) / 2 + Math.floor(i / 2) * PAGING_DOT_SPACING, -LIVE_CARD_WIDTH * 0.82, 0),
                    rotation: Quaternion.fromEulerDegrees(0, 0, 0),
                    scale: Vector3.create(0.25, 0.25, 1),
                    parent: boardScalePivot
                })
                MeshRenderer.setPlane(pageDot, getAtlasPlaneUVs(ui3dAtlasData, "paging_dot_gray.png"))
                Material.setBasicMaterial(pageDot, {
                    texture: getAtlasTexture(ui3dAtlasData.atlas.src),
                    alphaTexture: getAtlasTexture(ui3dAtlasData.atlas.srcAlpha),
                })
                eventBoardInfo.pageDots.push(pageDot)
                if (i == 0) {
                    activatePagingDot(eventBoardRoot, i)
                }
            }
            eventBoardInfo.pages[0] = createBlogPageShell(eventBoardRoot, true)
            eventBoardInfo.pages[1] = createBlogPageShell(eventBoardRoot, false)
            populateBlogPage(eventBoardInfo.pages[0], eventBoardRoot, 0)
            break

        case EVENT_BOARD_TYPE.CALENDAR:
            setupCalendarPages(eventBoardRoot)
            break
        }
    
}





export function createUpcomingPageShell(eventBoardEntity: Entity, visible: boolean): Entity {
    const eventBoardMutable = EventBoardInfo.get(eventBoardEntity)
    const container = addPageContainer(eventBoardMutable.boardScalePivot, visible)
    const eventCards: Entity[] = []
    for (let j = 0; j < 4; j++) {
        const eventIndex = j < eventBoardMutable.savedEvents.length ? j : 0
        const eventCard = addUpcomingEventCard(container, eventBoardMutable.savedEvents[eventIndex], UPCOMING_OFFSET[j], false)
        if (j >= eventBoardMutable.savedEvents.length) {
            Transform.getMutable(UpcomingEventCardInfo.get(eventCard).cardScalePivot).scale = Vector3.create(0.001, 0.001, 1)
        }
        eventCards.push(eventCard)
    }
    ContainerInfo.getMutable(container).cardEntities = eventCards
    return container
}

export function populateUpcomingPage(container: Entity, eventBoardEntity: Entity, pageIndex: number) {
    const eventBoardInfo = EventBoardInfo.get(eventBoardEntity)
    const cardEntities = ContainerInfo.get(container).cardEntities
    for (let j = 0; j < 4; j++) {
        const eventIndex = pageIndex * 4 + j
        const cardRoot = cardEntities[j]
        if (eventIndex < eventBoardInfo.savedEvents.length) {
            updateUpcomingEventCard(cardRoot, eventBoardInfo.savedEvents[eventIndex])
            Transform.getMutable(UpcomingEventCardInfo.get(cardRoot).cardScalePivot).scale = Vector3.create(1, 1, 1)
        } else {
            Transform.getMutable(UpcomingEventCardInfo.get(cardRoot).cardScalePivot).scale = Vector3.create(0.001, 0.001, 1)
        }
    }
}

export async function updateLiveEvents(eventBoardEntity: Entity) {
    await EventsService.instance().updateEventsList()
    const eventBoardMutable = EventBoardInfo.getMutable(eventBoardEntity)
    let events = EventsService.instance().getLiveEvents(20)
    if(events.length > 0){
        if (eventBoardMutable.showTitle) GltfContainer.createOrReplace(eventBoardMutable.liveBoardTitleEntity, { src: TITLE_MODEL_LIVE })
    } else {
        events = EventsService.instance().getUpcomingEvents(4)
        if (eventBoardMutable.showTitle) GltfContainer.createOrReplace(eventBoardMutable.liveBoardTitleEntity, { src: TITLE_MODEL_UPCOMING })
    }

    const savedEventList = []
    if (events && eventBoardMutable.type !== EVENT_BOARD_TYPE.BLOG) {
        for (let event of events) {           
            savedEventList.push({
                id: event.id,
                eventName: event.name,
                thumbnailSrc: event.image,
                user_name: event.user_name,
                date: event.next_start_at,
                coordinateX: event.coordinates[0],
                coordinateZ: event.coordinates[1],
                world: event.world,
                server: event.server ? event.server : "",
                detailText: event.description,
            })
        }       
    
    }
    
    const eventBoardInfo = EventBoardInfo.getMutable(eventBoardEntity)
    eventBoardInfo.savedEvents = savedEventList

    // Repopulate slot 0 with fresh data; hide slot 1
    if (eventBoardInfo.pages.length >= 1) {
        populateLiveEventPage(eventBoardInfo.pages[0], eventBoardEntity, 0)
    }
    if (eventBoardInfo.pages.length >= 2) {
        Transform.getMutable(ContainerInfo.get(eventBoardInfo.pages[1]).scalePivot).scale = Vector3.create(0.001, 0.001, 1)
    }
    resetBoardSlot(eventBoardEntity)
    eventBoardInfo.currentPageIndex = 0

    while (eventBoardInfo.pageDots.length > 0) {
        const dot = eventBoardInfo.pageDots.pop()
        if (dot) engine.removeEntity(dot)
    }
    eventBoardInfo.pageDots = []
    for (let i = 0; i < savedEventList.length; i++) {
        let pageDot = engine.addEntity()
        Transform.create(pageDot, {
            position: Vector3.create(-((savedEventList.length - 1) * PAGING_DOT_SPACING) / 2 + i * PAGING_DOT_SPACING, -LIVE_CARD_WIDTH * 0.82, 0),
            rotation: Quaternion.fromEulerDegrees(0, 0, 0),
            scale: Vector3.create(0.25, 0.25, 1),
            parent: eventBoardMutable.boardScalePivot
        })
        MeshRenderer.setPlane(pageDot, getAtlasPlaneUVs(ui3dAtlasData, "paging_dot_gray.png"))
        Material.setBasicMaterial(pageDot, {
            texture: getAtlasTexture(ui3dAtlasData.atlas.src),
            alphaTexture: getAtlasTexture(ui3dAtlasData.atlas.srcAlpha),
        })
        eventBoardInfo.pageDots.push(pageDot)
    }
    activatePagingDot(eventBoardEntity, 0)
    

}

export function createLiveEventPageShell(eventBoardEntity: Entity, visible: boolean): Entity {
    const eventBoardMutable = EventBoardInfo.get(eventBoardEntity)
    const container = addPageContainer(eventBoardMutable.boardScalePivot, visible)
    const eventCard = addLiveEventCard(container, eventBoardMutable.savedEvents[0], visible)
    Transform.getMutable(eventCard).parent = container
    ContainerInfo.getMutable(container).cardEntities.push(eventCard)
    return container
}

export function populateLiveEventPage(container: Entity, eventBoardEntity: Entity, pageIndex: number) {
    const eventBoardInfo = EventBoardInfo.get(eventBoardEntity)
    const cardEntities = ContainerInfo.get(container).cardEntities
    updateLiveEventCard(cardEntities[0], eventBoardInfo.savedEvents[pageIndex])
}

export function closeAllDescriptionPanels(eventBoard: Entity) {
    let eventBoardInfo = EventBoardInfo.get(eventBoard)
    for (let page of eventBoardInfo.pages) {
        for (let card of ContainerInfo.get(page).cardEntities) {
            switch (eventBoardInfo.type) {
                case EVENT_BOARD_TYPE.LIVE:
                    // console.log("closing description panel for LIVE EVENT")
                    setDescriptionPanel(card, false)
                    break
                case EVENT_BOARD_TYPE.UPCOMING:
                    // console.log("closing description panel for UPCOMING EVENT")
                    setDescriptionPanelUpcoming(card, false)
                    break
                case EVENT_BOARD_TYPE.CALENDAR:
                    // console.log("closing description panel for CALENDAR EVENT")
                    setDescriptionPanelCalendar(card, false)
                    break
            }
        }
    }
}





export function startEventInteraction(eventBoard: Entity) {
    lockPlayer()

    let eventBoardInfo = EventBoardInfo.getMutable(eventBoard)
    eventBoardInfo.playerOriginalPosition = Transform.get(engine.PlayerEntity).position
    enterCinematicMode(eventBoardInfo.eventCam)
    //showUnlockCursorToast()
    unlockCursor()
    eventBoardInfo.eventInteractionActive = true
    PlayerState.getMutable(engine.PlayerEntity).isPlayerInteractingWithMenus = true
    deactivateEventColliders()
    VisibilityComponent.getMutable(eventBoardInfo.blackMask).visible = true
    startMaskFade(eventBoard)
    MeshCollider.getMutable(eventBoardInfo.blackMask).collisionMask = ColliderLayer.CL_POINTER
    Tween.createOrReplace(eventBoard, {
        duration: 1000,
        easingFunction: EasingFunction.EF_EASEOUTCIRC,
        currentTime: 0,
        playing: true,
        mode: Tween.Mode.Move({
            start: EventBoardInfo.get(eventBoard).inactivePosition,
            end: EventBoardInfo.get(eventBoard).activePosition
        })
    })
    Tween.createOrReplace(eventBoardInfo.boardScalePivot, {
        duration: 1000,
        easingFunction: EasingFunction.EF_EASEOUTCIRC,
        currentTime: 0,
        playing: true,
        mode: Tween.Mode.Scale({
            start: Vector3.create(1, 1, 1),
            end: Vector3.create(0.5, 0.5, 0.5)
        })
    })

    VisibilityComponent.getMutable(eventBoardInfo.closeButton).visible = true
    Transform.getMutable(eventBoardInfo.rightScrollArrow).scale = Vector3.create(0.5, 1, 1)
    Transform.getMutable(eventBoardInfo.leftScrollArrow).scale = Vector3.create(0.5, 1, 1)
    VisibilityComponent.getMutable(eventBoardInfo.rightScrollArrow).visible = true
    VisibilityComponent.getMutable(eventBoardInfo.leftScrollArrow).visible = true
    

}

function startMaskFade(eventBoard: Entity) {
    let blackMask = EventBoardInfo.get(eventBoard).blackMask
    let maskInfo = EventMenuBlackMask.getMutable(blackMask)
    maskInfo.active = true
    maskInfo.fadeFactor = 0
    maskInfo.delayTime = 0
    Transform.getMutable(blackMask).scale = Vector3.create(BOARD_WIDTH * 2, BOARD_HEIGHT * 2, 1)
    


}

export function endEventInteraction() {
    lockCursor()
    let eventBoardGroup = engine.getEntitiesWith(EventBoardInfo)

    for (let [eventBoard, info] of eventBoardGroup) {
        if (info.eventInteractionActive) {
            let eventBoardInfo = EventBoardInfo.getMutable(eventBoard)
            eventBoardInfo.eventInteractionActive = false
            PlayerState.getMutable(engine.PlayerEntity).isPlayerInteractingWithMenus = false
            activateEventColliders()
            VisibilityComponent.getMutable(eventBoardInfo.blackMask).visible = false
            MeshCollider.getMutable(eventBoardInfo.blackMask).collisionMask = ColliderLayer.CL_NONE
            Tween.createOrReplace(eventBoard, {
                duration: 300,
                easingFunction: EasingFunction.EF_EASEOUTCIRC,
                currentTime: 0,
                playing: true,
                mode: Tween.Mode.Move({
                    start: eventBoardInfo.activePosition,
                    end: eventBoardInfo.inactivePosition
                })
            })
            Tween.createOrReplace(eventBoardInfo.boardScalePivot, {
                duration: 300,
                easingFunction: EasingFunction.EF_EASEOUTCIRC,
                currentTime: 0,
                playing: true,
                mode: Tween.Mode.Scale({
                    start: Vector3.create(0.5, 0.5, 0.5),
                    end: Vector3.create(1, 1, 1)
                })
            })
            // showDetailCard(LiveEventCardInfo.get(getCurrentEventCard(eventBoard)).detailCard, false, true)
            VisibilityComponent.getMutable(eventBoardInfo.closeButton).visible = false
            //Transform.getMutable(eventBoardInfo.blackMask).scale = Vector3.create(0, 0, 1)
            VisibilityComponent.getMutable(eventBoardInfo.blackMask).visible = false

            for (let page of eventBoardInfo.pages) {
                for (let card of ContainerInfo.get(page).cardEntities) {
                    switch (eventBoardInfo.type) {
                        case EVENT_BOARD_TYPE.LIVE:
                            setDescriptionPanel(card, false)
                            break
                        case EVENT_BOARD_TYPE.UPCOMING:
                            setDescriptionPanelUpcoming(card, false)
                            break
                    }
                }
            }
            Transform.getMutable(eventBoardInfo.rightScrollArrow).scale = Vector3.create(0.5, 1, 1)
            Transform.getMutable(eventBoardInfo.leftScrollArrow).scale = Vector3.create(0.5, 1, 1)
            VisibilityComponent.getMutable(eventBoardInfo.rightScrollArrow).visible = false
            VisibilityComponent.getMutable(eventBoardInfo.leftScrollArrow).visible = false
        }
    }



}

function deactivateEventColliders() {
    let eventColliders = engine.getEntitiesWith(EventMenuCollider)
    for (let [eventCollider] of eventColliders) {
        Transform.getMutable(eventCollider).scale = Vector3.create(0.001, 0.001, 1)
    }
}

function activateEventColliders() {
    for (let [eventCollider, info] of engine.getEntitiesWith(EventMenuCollider)) {
        Transform.getMutable(eventCollider).scale = info.originalScale
    }
}