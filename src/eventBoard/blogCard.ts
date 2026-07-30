import { Entity, engine, Transform, GltfContainer, ColliderLayer, GltfNodeModifiers, Material, pointerEventsSystem, InputAction, TextShape, Font, TextAlignMode, VisibilityComponent, EasingFunction, MaterialTransparencyMode, MeshRenderer, Tween, TweenSequence, MeshCollider } from "@dcl/sdk/ecs"
import { Vector3, Quaternion, Color4 } from "@dcl/sdk/math"
import { addBlackMask } from "./blackMask"
import { TextLineAnimation } from "./boardComponents"
import { fixCharSpacing, getDayOfWeek, getDateString } from "./boardFunctions"
import { EventShortInfo, modelFolder, LIVE_TITLE_X_OFFSET, DETAIL_TEXT_X_OFFSET, CHAR_SPACING_DETAILS, CHAR_SPACING_DEFAULT, BLOG_DATE_Y_OFFSET, BLOG_TITLE_X_OFFSET, BLOG_TITLE_Y_OFFSET, BLOG_DATE_FONT_SIZE, BLOG_TITLE_FONTS_SIZE, BLOG_TEXT_FONTS_SIZE, BLOG_TEXT_Y_OFFSET, BLOG_OFFSET } from "./config"
import { closeDescriptionPanelsOnPage, UpcomingEventCardInfo } from "./upcomingEventCard"
import { openExternalUrl } from "~system/RestrictedActions"
import { addPageContainer, ContainerInfo } from "./pageContainer"
import { EventBoardInfo } from "./boardLiveEvents"
import { addOpenExternalBtn, ExternalButtonInfo } from "./openExternalBtn"

export function addBlogPostCard(container: Entity, eventInfo: EventShortInfo, positionOffset: Vector3): Entity {

    let cardPositionPivot = engine.addEntity()
    Transform.create(cardPositionPivot, {
        position: Vector3.create(positionOffset.x, positionOffset.y, positionOffset.z),
        rotation: Quaternion.fromEulerDegrees(0, 0, 0),
        scale: Vector3.create(1, 1, 1),
        parent: container
    })
    let cardScalePivot = engine.addEntity()
    Transform.create(cardScalePivot, {
        position: Vector3.create(0, 0, 0),
        rotation: Quaternion.fromEulerDegrees(0, 0, 0),
        scale: Vector3.create(1, 1, 1),
        parent: cardPositionPivot
    })

    let eventCardRoot = engine.addEntity()
    Transform.create(eventCardRoot, {
        position: Vector3.create(0, 0, 0),
        rotation: Quaternion.fromEulerDegrees(0, 0, 0),
        scale: Vector3.create(2.5, 2.5, 1),
        parent: cardScalePivot
    })

    //thumbnail
    let thumbnailEntity = engine.addEntity()
    Transform.createOrReplace(thumbnailEntity, {
        position: Vector3.create(0, 0, 0),
        rotation: Quaternion.fromEulerDegrees(0, 0, 0),
        scale: Vector3.create(1, 1, 1),
        parent: eventCardRoot
    })
    GltfContainer.create(thumbnailEntity, { src: modelFolder + "event_card_thumbnail.glb", visibleMeshesCollisionMask: ColliderLayer.CL_POINTER })
    GltfNodeModifiers.create(
        thumbnailEntity,
        {
            modifiers: [{
                path: '',
                material: {
                    material: {
                        $case: 'unlit', unlit: {
                            texture: Material.Texture.Common({ src: eventInfo.thumbnailSrc }),
                            castShadows: false
                        }
                    }
                }
            }]
        }
    )
    // pointerEventsSystem.onPointerDown(
    //     {
    //         entity: thumbnailEntity,
    //         opts: {
    //             hoverText: 'SEE DETAILS',
    //             button: InputAction.IA_POINTER,
    //             showFeedback: true,
    //             showHighlight: false,
    //             maxDistance: 32
    //         }
    //     },
    //     (e) => {
    //         // expandDescriptionToggleUpcoming(eventCardRoot)
    //     }
    // )

    // Material.setBasicMaterial(thumbnailEntity, {
    //     texture: Material.Texture.Common({src: eventInfo.thumbnailSrc}),   
    //     alphaTexture: Material.Texture.Common({src: imgFolder + "event_top_alpha.png"}),    
    //     castShadows: false 
    // })



    //info background

    let infoBackground = engine.addEntity()
    Transform.create(infoBackground, {
        // position: Vector3.create(0, -0.625, 0),
        position: Vector3.create(0, -0.625 - 0.55, 0),
        rotation: Quaternion.fromEulerDegrees(0, 0, 0),
        scale: Vector3.create(1, 1, 1),
        parent: eventCardRoot
    })
    // MeshRenderer.setPlane(infoBackground)
    GltfContainer.create(infoBackground, { src: modelFolder + "event_card_bottom.glb", visibleMeshesCollisionMask: ColliderLayer.CL_POINTER })
    GltfNodeModifiers.create(
        infoBackground,
        {
            modifiers: [{
                path: '',
                material: {
                    material: {
                        $case: 'unlit', unlit: {
                            diffuseColor: Color4.White(),
                        }
                    }
                }
            }]
        }
    )
    // pointerEventsSystem.onPointerDown(
    //     {
    //         entity: infoBackground,
    //         opts: {
    //             hoverText: 'SEE DETAILS',
    //             button: InputAction.IA_POINTER,
    //             showFeedback: true,
    //             showHighlight: false,
    //             maxDistance: 32
    //         }
    //     },
    //     (e) => {
    //         // expandDescriptionToggleUpcoming(eventCardRoot)
    //     }
    // )
    // Material.setBasicMaterial(infoBackground, {
    //     diffuseColor: Color4.White(),
    //     alphaTexture: Material.Texture.Common({src: imgFolder + "event_bottom_alpha.png"}),     
    // })

    //description scalable BG
    let scalingBG = engine.addEntity()
    Transform.create(scalingBG, {
        position: Vector3.create(0, 0.125, 0),
        rotation: Quaternion.fromEulerDegrees(0, 0, 0),
        scale: Vector3.create(1, 0.55, 1),
        parent: infoBackground
    })
    GltfContainer.create(scalingBG, { src: modelFolder + "event_card_scalable.glb", visibleMeshesCollisionMask: ColliderLayer.CL_POINTER })
    GltfNodeModifiers.createOrReplace(
        scalingBG,
        {
            modifiers: [{
                path: '',
                material: {
                    material: {
                        $case: 'unlit', unlit: {
                            diffuseColor: Color4.White(),
                        }
                    }
                }
            }]
        }
    )
    // pointerEventsSystem.onPointerDown(
    //     {
    //         entity: scalingBG,
    //         opts: {
    //             hoverText: 'SEE DETAILS',
    //             button: InputAction.IA_POINTER,
    //             showFeedback: true,
    //             showHighlight: false,
    //             maxDistance: 32
    //         }
    //     },
    //     (e) => {
    //         // expandDescriptionToggleUpcoming(eventCardRoot)
    //     }
    // )

    //event date
    let eventDate = engine.addEntity()
    Transform.create(eventDate, {
        position: Vector3.create(LIVE_TITLE_X_OFFSET, BLOG_DATE_Y_OFFSET, -0.02),
        rotation: Quaternion.fromEulerDegrees(0, 0, 0),
        scale: Vector3.create(1, 1, 1),
        parent: eventCardRoot
    })
    TextShape.create(eventDate, {
        text: ("<cspace=-0.1em><b>" + getDayOfWeek(eventInfo.date) + ", " + getDateString(eventInfo.date) + "</b></cspace>"),
        fontSize: BLOG_DATE_FONT_SIZE,
        font: Font.F_SERIF,
        textAlign: TextAlignMode.TAM_TOP_LEFT,
        textColor: Color4.fromHexString("#95ABC1")
    })

    //event name
    let eventTitle = engine.addEntity()
    Transform.create(eventTitle, {
        position: Vector3.create(BLOG_TITLE_X_OFFSET, BLOG_TITLE_Y_OFFSET, -0.02),
        rotation: Quaternion.fromEulerDegrees(0, 0, 0),
        scale: Vector3.create(1, 1, 1),
        parent: eventCardRoot
    })
    let eventTiletString = eventInfo.eventName.length > 120 ? eventInfo.eventName.substring(0, 120) + "..." : eventInfo.eventName
    TextShape.create(eventTitle, {
        text: ("<cspace=" + CHAR_SPACING_DEFAULT + "em><b>" + fixCharSpacing(eventTiletString) + "</b></cspace>"),
        fontSize: BLOG_TITLE_FONTS_SIZE,
        font: Font.F_SERIF,
        textAlign: TextAlignMode.TAM_TOP_LEFT,
        textColor: Color4.fromHexString("#4D5F70"),
        textWrapping: true,
        width: 1.7
    })


    let detailText = engine.addEntity()
    Transform.create(detailText, {
        position: Vector3.create(DETAIL_TEXT_X_OFFSET, BLOG_TEXT_Y_OFFSET, -0.02),
        rotation: Quaternion.fromEulerDegrees(0, 0, 0),
        scale: Vector3.create(1, 1, 1),
        parent: eventCardRoot
    })
    TextShape.create(detailText, {
        text: ("<cspace=-0.05em>" + fixCharSpacing(eventInfo.detailText, CHAR_SPACING_DETAILS) + "</cspace>"),
        fontSize: BLOG_TEXT_FONTS_SIZE,
        font: Font.F_SERIF,
        textAlign: TextAlignMode.TAM_TOP_LEFT,
        textColor: Color4.fromHexString("#6E7E8E00"),
        width: 1.8,
        height: 1.0,
        textWrapping: true
    })
    TextLineAnimation.create(detailText, {
        active: true,
        startLineNumber: 1,
        endLineNumber: 10,
        currentLineNumber: 0,
        elapsedTime: 0,
        currentColor: Color4.fromHexString("#6E7E8E00"),
        currentAlpha: 0,
        duration: 0.3
    })
    VisibilityComponent.createOrReplace(detailText, { visible: true })


    let openExternalButton = addOpenExternalBtn(eventCardRoot, {
        url: eventInfo.server,
    })

    let blackMask = addBlackMask(eventCardRoot)
    pointerEventsSystem.onPointerDown(
        {
            entity: blackMask,
            opts: {
                hoverText: 'BACK',
                button: InputAction.IA_POINTER,
                showFeedback: true,
                showHighlight: false,
                maxDistance: 32
            }
        },
        (e) => {
            closeDescriptionPanelsOnPage(container)
        }
    )

    UpcomingEventCardInfo.create(eventCardRoot, {
        eventName: eventInfo.eventName,
        thumbnailSrc: eventInfo.thumbnailSrc,
        thumbnail: thumbnailEntity,
        originalScale: Transform.get(cardScalePivot).scale,
        titleEntity: eventTitle,
        dateEntity: eventDate,
        organizedByEntity: undefined,
        interestedButton: openExternalButton,
        scalingBG: scalingBG,
        infoBackground: infoBackground,
        originalPosition: positionOffset,
        detailsExpanded: true,
        detailText: eventInfo.detailText,
        detailTextEntity: detailText,
        cardScalePivot: cardScalePivot,
        cardPositionPivot: cardPositionPivot,
        page: container,
        blackMask: blackMask
    })

    return eventCardRoot
}

export function createBlogPageShell(eventBoardEntity: Entity, visible: boolean): Entity {
    const eventBoardMutable = EventBoardInfo.get(eventBoardEntity)
    const container = addPageContainer(eventBoardMutable.boardScalePivot, visible)
    const eventCards: Entity[] = []
    for (let j = 0; j < 2; j++) {
        const eventIndex = j < eventBoardMutable.savedEvents.length ? j : 0
        const eventCard = addBlogPostCard(container, eventBoardMutable.savedEvents[eventIndex], BLOG_OFFSET[j])
        if (j >= eventBoardMutable.savedEvents.length) {
            Transform.getMutable(UpcomingEventCardInfo.get(eventCard).cardScalePivot).scale = Vector3.create(0.001, 0.001, 1)
        }
        eventCards.push(eventCard)
    }
    ContainerInfo.getMutable(container).cardEntities = eventCards
    return container
}

export function updateBlogPostCard(cardRoot: Entity, eventInfo: EventShortInfo) {
    const cardInfo = UpcomingEventCardInfo.getMutable(cardRoot)

    GltfNodeModifiers.createOrReplace(cardInfo.thumbnail, {
        modifiers: [{ path: '', material: { material: { $case: 'unlit', unlit: { texture: Material.Texture.Common({ src: eventInfo.thumbnailSrc }), castShadows: false } } } }]
    })

    const titleStr = eventInfo.eventName.length > 120 ? eventInfo.eventName.substring(0, 120) + "..." : eventInfo.eventName
    TextShape.getMutable(cardInfo.titleEntity).text = `<cspace=${CHAR_SPACING_DEFAULT}em><b>${fixCharSpacing(titleStr)}</b></cspace>`
    TextShape.getMutable(cardInfo.dateEntity).text = `<cspace=-0.1em><b>${getDayOfWeek(eventInfo.date)}, ${getDateString(eventInfo.date)}</b></cspace>`
    TextShape.getMutable(cardInfo.detailTextEntity).text = `<cspace=-0.05em>${fixCharSpacing(eventInfo.detailText, CHAR_SPACING_DETAILS)}</cspace>`

    TextLineAnimation.getMutable(cardInfo.detailTextEntity).active = true
    TextLineAnimation.getMutable(cardInfo.detailTextEntity).currentLineNumber = 0
    TextLineAnimation.getMutable(cardInfo.detailTextEntity).elapsedTime = 0

    ExternalButtonInfo.getMutable(cardInfo.interestedButton).url = eventInfo.server

    cardInfo.eventName = eventInfo.eventName
    cardInfo.thumbnailSrc = eventInfo.thumbnailSrc
    cardInfo.date = eventInfo.date
    cardInfo.detailText = eventInfo.detailText
}

export function populateBlogPage(container: Entity, eventBoardEntity: Entity, pageIndex: number) {
    const eventBoardInfo = EventBoardInfo.get(eventBoardEntity)
    const cardEntities = ContainerInfo.get(container).cardEntities
    for (let j = 0; j < 2; j++) {
        const eventIndex = pageIndex * 2 + j
        const cardRoot = cardEntities[j]
        if (eventIndex < eventBoardInfo.savedEvents.length) {
            updateBlogPostCard(cardRoot, eventBoardInfo.savedEvents[eventIndex])
            Transform.getMutable(UpcomingEventCardInfo.get(cardRoot).cardScalePivot).scale = Vector3.create(1, 1, 1)
        } else {
            Transform.getMutable(UpcomingEventCardInfo.get(cardRoot).cardScalePivot).scale = Vector3.create(0.001, 0.001, 1)
        }
    }
}
