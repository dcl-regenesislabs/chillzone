import { ColliderLayer, EasingFunction, engine, Entity, Font, GltfContainer, GltfNodeModifiers, InputAction, Material, MeshRenderer, pointerEventsSystem, Schemas, TextAlignMode, TextShape, TextureUnion, Transform, Tween, VisibilityComponent } from "@dcl/sdk/ecs"
import { Color4, Quaternion, Vector3 } from "@dcl/sdk/math"
import { LIVE_DATE_Y_OFFSET, DETAIL_TEXT_X_OFFSET, DETAIL_TEXT_Y_OFFSET, EventShortInfo, modelFolder, ORGANIZED_BY_Y_OFFSET, LIVE_TITLE_X_OFFSET, LIVE_TITLE_Y_OFFSET, LIVE_TITLE_CHARACTER_LIMIT, CHAR_SPACING_DETAILS } from "./config"
import { addJumpInButton, JumpData, updateJumpInButton } from "./jumpInButton"
import { TextLineAnimation } from "./boardComponents"
import { fixCharSpacing, getDateString, getDayOfWeek, getTimeString } from "./boardFunctions"

export const LiveEventCardInfo = engine.defineComponent('live-event-card-info-component', {
  // rotationPivot:Schemas.Entity,  
  // scalePivot:Schemas.Entity,  
  eventName: Schemas.String,
  titleEntity: Schemas.Entity,
  dateEntity: Schemas.Entity,
  organizedByEntity: Schemas.Entity,
  jumpInButton: Schemas.Entity,
  thumbnailSrc: Schemas.String,
  thumbnail: Schemas.Entity,
  user_name: Schemas.String,
  date: Schemas.String,
  coordinateX: Schemas.String,
  coordinateZ: Schemas.String,
  world: Schemas.Boolean,
  server: Schemas.String,
  detailText: Schemas.String,
  detailTextEntity: Schemas.Entity,
  scalingBG: Schemas.Entity,
  infoBackground: Schemas.Entity,
  originalPosition: Schemas.Vector3,
  detailsExpanded: Schemas.Boolean,
})

export type LiveEventCardInfoReadOnly = ReturnType<typeof LiveEventCardInfo.get>

export function setDescriptionPanel(eventCard: Entity, expanded: boolean) {

  if (LiveEventCardInfo.get(eventCard).detailsExpanded == expanded) {
    return
  }
  let cardInfo = LiveEventCardInfo.get(eventCard)
  let scalingBG = cardInfo.scalingBG
  let infoBackground = cardInfo.infoBackground
  let eventCardPos = cardInfo.originalPosition
  let expandSize = 0.55

  let startPosBG = expanded ? Vector3.create(0, -0.625, 0) : Vector3.create(0, -0.625 - expandSize, 0)
  let endPosBG = expanded ? Vector3.create(0, -0.625 - expandSize, 0) : Vector3.create(0, -0.625, 0)
  let startScale = expanded ? Vector3.create(1, 0, 1) : Vector3.create(1, expandSize, 1)
  let endScale = expanded ? Vector3.create(1, expandSize, 1) : Vector3.create(1, 0, 1)
  let startPosEventCard = expanded ? Vector3.create(eventCardPos.x, eventCardPos.y, eventCardPos.z) : Vector3.create(eventCardPos.x, 0.5 + eventCardPos.y + expandSize * 1.5, eventCardPos.z)
  let endPosEventCard = expanded ? Vector3.create(eventCardPos.x, 0.5 + eventCardPos.y + expandSize * 1.5, eventCardPos.z) : Vector3.create(eventCardPos.x, eventCardPos.y, eventCardPos.z)

  Tween.createOrReplace(infoBackground, {
    duration: 300,
    easingFunction: EasingFunction.EF_EASEOUTCIRC,
    currentTime: 0,
    playing: true,
    mode: Tween.Mode.Move({
      start: startPosBG,
      end: endPosBG
    })
  })

  Tween.createOrReplace(scalingBG, {
    duration: 300,
    easingFunction: EasingFunction.EF_EASEOUTCIRC,
    currentTime: 0,
    playing: true,
    mode: Tween.Mode.Scale({
      start: startScale,
      end: endScale
    })
  })

  Tween.createOrReplace(eventCard, {
    duration: 300,
    easingFunction: EasingFunction.EF_EASEOUTCIRC,
    currentTime: 0,
    playing: true,
    mode: Tween.Mode.Move({
      start: startPosEventCard,
      end: endPosEventCard
    })
  })
  LiveEventCardInfo.getMutable(eventCard).detailsExpanded = expanded
  TextLineAnimation.getMutable(cardInfo.detailTextEntity).active = expanded
  TextLineAnimation.getMutable(cardInfo.detailTextEntity).currentLineNumber = 0
  TextLineAnimation.getMutable(cardInfo.detailTextEntity).elapsedTime = 0
  TextShape.getMutable(cardInfo.detailTextEntity).lineCount = 1
  TextLineAnimation.getMutable(cardInfo.detailTextEntity).currentColor = Color4.fromHexString("#6E7E8E00")
  TextLineAnimation.getMutable(cardInfo.detailTextEntity).currentAlpha = 0
  VisibilityComponent.getMutable(cardInfo.detailTextEntity).visible = expanded
}
export function expandDescriptionToggle(eventCard: Entity) {
  setDescriptionPanel(eventCard, !LiveEventCardInfo.get(eventCard).detailsExpanded)
  VisibilityComponent.getMutable(LiveEventCardInfo.get(eventCard).detailTextEntity).visible = LiveEventCardInfo.get(eventCard).detailsExpanded
}

export function addLiveEventCard(container: Entity, eventInfo: EventShortInfo, visible: boolean = false): Entity {


  let eventCardRoot = engine.addEntity()
  Transform.create(eventCardRoot, {
    position: Vector3.create(0, 0, 0),
    rotation: Quaternion.fromEulerDegrees(0, 0, 0),
    scale: Vector3.create(5, 5, 1),
    parent: container
  })

  //thumbnail
  let thumbnailEntity = engine.addEntity()
  Transform.createOrReplace(thumbnailEntity, {
    position: Vector3.create(0, 0, 0),
    rotation: Quaternion.fromEulerDegrees(0, 0, 0),
    scale: Vector3.create(1, 1, 1),
    parent: eventCardRoot
  })
  // MeshRenderer.setPlane(thumbnailEntity)
  GltfContainer.create(thumbnailEntity, { src: modelFolder + "event_card_thumbnail.glb", visibleMeshesCollisionMask: ColliderLayer.CL_POINTER })
  GltfNodeModifiers.create(
    thumbnailEntity,
    {
      modifiers: [{
        path: '',
        material: {
          material: {
            $case: 'unlit', unlit: {
              texture: Material.Texture.Common({src: eventInfo.thumbnailSrc}),
              castShadows: false
            }
          }
        }
      }]
    }
  )
  pointerEventsSystem.onPointerDown(
    {
      entity: thumbnailEntity,
      opts: {
        hoverText: 'SEE DETAILS',
        button: InputAction.IA_POINTER,
        showFeedback: true,
        showHighlight: false,
        maxDistance: 32
      }
    },
    (e) => {
      expandDescriptionToggle(eventCardRoot)
    }
  )

  //info background

  let infoBackground = engine.addEntity()
  Transform.create(infoBackground, {
    position: Vector3.create(0, -0.625, 0),
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
  pointerEventsSystem.onPointerDown(
    {
      entity: infoBackground,
      opts: {
        hoverText: 'SEE DETAILS',
        button: InputAction.IA_POINTER,
        showFeedback: true,
        showHighlight: false,
        maxDistance: 32
      }
    },
    (e) => {
      expandDescriptionToggle(eventCardRoot)
    }
  )
  // Material.setBasicMaterial(infoBackground, {
  //     diffuseColor: Color4.White(),
  //     alphaTexture: Material.Texture.Common({src: imgFolder + "event_bottom_alpha.png"}),     
  // })

  //description scalable BG
  let scalingBG = engine.addEntity()
  Transform.create(scalingBG, {
    position: Vector3.create(0, 0.125, 0),
    rotation: Quaternion.fromEulerDegrees(0, 0, 0),
    scale: Vector3.create(1, 0, 1),
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
  pointerEventsSystem.onPointerDown(
    {
      entity: scalingBG,
      opts: {
        hoverText: 'SEE DETAILS',
        button: InputAction.IA_POINTER,
        showFeedback: true,
        showHighlight: false,
        maxDistance: 32
      }
    },
    (e) => {
      expandDescriptionToggle(eventCardRoot)
    }
  )

  //event name
  let eventTitle = engine.addEntity()
  Transform.create(eventTitle, {
    position: Vector3.create(LIVE_TITLE_X_OFFSET, LIVE_TITLE_Y_OFFSET, -0.02),
    rotation: Quaternion.fromEulerDegrees(0, 0, 0),
    scale: Vector3.create(1, 1, 1),
    parent: eventCardRoot
  })
  let eventTiletString = eventInfo.eventName.length > LIVE_TITLE_CHARACTER_LIMIT ? eventInfo.eventName.substring(0, LIVE_TITLE_CHARACTER_LIMIT) + "..." : eventInfo.eventName
  TextShape.create(eventTitle, {
    text: ("<cspace=-0.1em><b>" + fixCharSpacing(eventTiletString) + "</b></cspace>"),
    fontSize: 0.55,
    font: Font.F_SERIF,
    textAlign: TextAlignMode.TAM_MIDDLE_LEFT,
    textColor: Color4.fromHexString("#4D5F70")
  })

  //event date
  let eventDate = engine.addEntity()
  Transform.create(eventDate, {
    position: Vector3.create(LIVE_TITLE_X_OFFSET, LIVE_DATE_Y_OFFSET, -0.02),
    rotation: Quaternion.fromEulerDegrees(0, 0, 0),
    scale: Vector3.create(1, 1, 1),
    parent: eventCardRoot
  })
  TextShape.create(eventDate, {
    text: ("<cspace=-0.1em><b>FROM: " + getDayOfWeek(eventInfo.date, false) + ", " + getDateString(eventInfo.date) + " AT " + getTimeString(eventInfo.date) + "</b></cspace>"),
    fontSize: 0.3,
    font: Font.F_SERIF,
    textAlign: TextAlignMode.TAM_MIDDLE_LEFT,
    textColor: Color4.fromHexString("#95ABC1")
  })

  //organized by text
  let organizedByText = engine.addEntity()
  Transform.create(organizedByText, {
    position: Vector3.create(LIVE_TITLE_X_OFFSET, ORGANIZED_BY_Y_OFFSET, -0.02),
    rotation: Quaternion.fromEulerDegrees(0, 0, 0),
    scale: Vector3.create(1, 1, 1),
    parent: eventCardRoot
  })
  TextShape.create(organizedByText, {
    text: ("<cspace=-0.05em><color=#736E7D>Organized by </color></cspace><b><cspace=-0.1em><color=#FF2D55>" + eventInfo.user_name + "</b>"),
    fontSize: 0.35,
    font: Font.F_SERIF,
    textAlign: TextAlignMode.TAM_MIDDLE_LEFT,
    textColor: Color4.fromHexString("#95ABC1")
  })

  let detailText = engine.addEntity()
  Transform.create(detailText, {
    position: Vector3.create(DETAIL_TEXT_X_OFFSET, DETAIL_TEXT_Y_OFFSET, -0.02),
    rotation: Quaternion.fromEulerDegrees(0, 0, 0),
    scale: Vector3.create(1, 1, 1),
    parent: eventCardRoot
  })
  TextShape.create(detailText, {
    text: ("<cspace=-0.1em>" + fixCharSpacing(eventInfo.detailText, CHAR_SPACING_DETAILS) + "</cspace>"),
    fontSize: 0.4,
    font: Font.F_SERIF,
    textAlign: TextAlignMode.TAM_TOP_LEFT,
    textColor: Color4.fromHexString("#6E7E8EFF"),
    width: 1.8,
    height: 1.0,
    textWrapping: true,
    lineCount: 1,

  })
  TextLineAnimation.create(detailText, {
    active: false,
    startLineNumber: 1,
    endLineNumber: 9,
    currentLineNumber: 0,
    elapsedTime: 0,
    currentColor: Color4.White(),
    currentAlpha: 1,
    duration: 0.3
  })
  VisibilityComponent.createOrReplace(detailText, { visible: false })

  // jump in button — shadow entity stored so it can be updated without entity churn
  const jumpInButtonShadow = addJumpInButton(eventCardRoot, {
    coordinates: [eventInfo.coordinateX, eventInfo.coordinateZ],
    server: eventInfo.server,
    world: eventInfo.world
  })

  LiveEventCardInfo.create(eventCardRoot, {
    eventName: eventInfo.eventName,
    thumbnailSrc: eventInfo.thumbnailSrc,
    thumbnail: thumbnailEntity,
    // rotationPivot: rotationPivot,
    // scalePivot: scalePivot,
    titleEntity: eventTitle,
    dateEntity: eventDate,
    organizedByEntity: organizedByText,
    jumpInButton: jumpInButtonShadow,
    scalingBG: scalingBG,
    infoBackground: infoBackground,
    originalPosition: Transform.get(eventCardRoot).position,
    detailsExpanded: false,
    detailText: eventInfo.detailText,
    detailTextEntity: detailText
  })


  return eventCardRoot
}

export function updateLiveEventCard(cardRoot: Entity, eventInfo: EventShortInfo) {
  const cardInfo = LiveEventCardInfo.getMutable(cardRoot)

  if (cardInfo.detailsExpanded) {
    setDescriptionPanel(cardRoot, false)
  }

  GltfNodeModifiers.createOrReplace(cardInfo.thumbnail, {
    modifiers: [{ path: '', material: { material: { $case: 'unlit', unlit: { texture: Material.Texture.Common({ src: eventInfo.thumbnailSrc }), castShadows: false } } } }]
  })

  const titleStr = eventInfo.eventName.length > LIVE_TITLE_CHARACTER_LIMIT
    ? eventInfo.eventName.substring(0, LIVE_TITLE_CHARACTER_LIMIT) + "..."
    : eventInfo.eventName
  TextShape.getMutable(cardInfo.titleEntity).text = `<cspace=-0.1em><b>${fixCharSpacing(titleStr)}</b></cspace>`
  TextShape.getMutable(cardInfo.dateEntity).text = `<cspace=-0.1em><b>FROM: ${getDayOfWeek(eventInfo.date, false)}, ${getDateString(eventInfo.date)} AT ${getTimeString(eventInfo.date)}</b></cspace>`
  TextShape.getMutable(cardInfo.organizedByEntity).text = `<cspace=-0.05em><color=#736E7D>Organized by </color></cspace><b><cspace=-0.1em><color=#FF2D55>${eventInfo.user_name}</b>`
  TextShape.getMutable(cardInfo.detailTextEntity).text = `<cspace=-0.1em>${fixCharSpacing(eventInfo.detailText, CHAR_SPACING_DETAILS)}</cspace>`

  TextLineAnimation.getMutable(cardInfo.detailTextEntity).active = false
  TextLineAnimation.getMutable(cardInfo.detailTextEntity).currentLineNumber = 0
  TextLineAnimation.getMutable(cardInfo.detailTextEntity).elapsedTime = 0
  TextShape.getMutable(cardInfo.detailTextEntity).lineCount = 1
  VisibilityComponent.getMutable(cardInfo.detailTextEntity).visible = false

  updateJumpInButton(cardInfo.jumpInButton, {
    coordinates: [eventInfo.coordinateX, eventInfo.coordinateZ],
    server: eventInfo.server,
    world: eventInfo.world
  })

  cardInfo.eventName = eventInfo.eventName
  cardInfo.thumbnailSrc = eventInfo.thumbnailSrc
  cardInfo.user_name = eventInfo.user_name
  cardInfo.date = eventInfo.date
  cardInfo.coordinateX = eventInfo.coordinateX
  cardInfo.coordinateZ = eventInfo.coordinateZ
  cardInfo.world = eventInfo.world
  cardInfo.server = eventInfo.server
  cardInfo.detailText = eventInfo.detailText
}

