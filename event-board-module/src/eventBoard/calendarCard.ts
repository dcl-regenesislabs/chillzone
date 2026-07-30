import { Billboard, BillboardMode, ColliderLayer, EasingFunction, engine, Entity, Font, GltfContainer, GltfNodeModifiers, InputAction, Material, MaterialTransparencyMode, MeshCollider, MeshRenderer, pointerEventsSystem, Schemas, TextAlignMode, TextShape, Transform, Tween, VisibilityComponent } from "@dcl/sdk/ecs"
import { Color4, Quaternion, Vector3 } from "@dcl/sdk/math"
import { LIVE_DATE_Y_OFFSET, DETAIL_TEXT_X_OFFSET, DETAIL_TEXT_Y_OFFSET, EventShortInfo, imgFolder, modelFolder, ORGANIZED_BY_Y_OFFSET, LIVE_TITLE_X_OFFSET, LIVE_TITLE_Y_OFFSET, UPCOMING_FONTS_SIZE, UPCOMING_TITLE_Y_OFFSET, UPCOMING_DATE_FONT_SIZE, UPCOMING_DATE_Y_OFFSET, BOARD_HEIGHT, BOARD_WIDTH, CALENDAR_CARD_WIDTH, CALENDAR_DAYS_SHOWN, CALENDAR_CONTENT_WIDTH, CALENDAR_TITLE_FONT_SIZE, CALENDAR_DATE_Y_OFFSET, CALENDAR_TITLE_X_OFFSET, CALENDAR_TITLE_Y_OFFSET, CALENDAR_ORGANIZED_BY_Y_OFFSET, CALENDAR_DETAIL_TEXT_Y_OFFSET, CALENDAR_DATE_FONT_SIZE, CHAR_SPACING_DEFAULT, CHAR_SPACING_DETAILS } from "./config"

import { TextLineAnimation } from "./boardComponents"
import { addInterestedButton } from "./interestedButton"
import { ContainerInfo } from "./pageContainer"
import { fixCharSpacing, getDateString, getDayOfWeek, getTimeString } from "./boardFunctions"
import { closeAllDescriptionPanels } from "./boardLiveEvents"
import { addBlackMask, EventMenuBlackMask, startDetailMaskFade } from "./blackMask"
import { addOpenExternalBtn } from "./openExternalBtn"
import { detailsRoot, hideCalendarDetailCard, setCalendarDetailCard, showCalendarDetailCard } from "./calendarDetails"



export const CalendarEventCardInfo = engine.defineComponent('calendar-card-info-component', {
    id:Schemas.String,
    eventName:Schemas.String,
    thumbnailSrc:Schemas.String,
    thumbnail:Schemas.Entity,
    user_name:Schemas.String,
    date:Schemas.String,
    coordinateX:Schemas.String,
    coordinateZ:Schemas.String,
    world:Schemas.Boolean,
    server:Schemas.String,
    detailText:Schemas.String,
    originalPosition:Schemas.Vector3,
    hoverPosition:Schemas.Vector3,
    detailsExpanded:Schemas.Boolean,
    originalScale:Schemas.Vector3,
    cardScalePivot:Schemas.Entity,
    cardPositionPivot:Schemas.Entity,
    cardRotationPivot:Schemas.Entity,
    page:Schemas.Entity,
    blackMask:Schemas.Entity,
    hoverText:Schemas.String,
    shadowEntity:Schemas.Entity,
})
export const CalendarColumnInfo = engine.defineComponent('calendar-column-info-component', {    
    cardEntities:Schemas.Array(Schemas.Entity),  
    container:Schemas.Entity,
    xOffset:Schemas.Number,

})
export const CalendarHoverInfo = engine.defineComponent('calendar-hover-info-component', {         
})


export function closeDescriptionPanelsOnPage(page:Entity, exceptCard?:Entity){
  for(let card of ContainerInfo.get(page).cardEntities){
    if(!exceptCard || card != exceptCard){
      setDescriptionPanelCalendar(card, false)
    }
  }
  
}


export function setDescriptionPanelCalendar(eventCard:Entity, expanded:boolean){

  if(CalendarEventCardInfo.get(eventCard).detailsExpanded == expanded){
    return
  }

  closeDescriptionPanelsOnPage(CalendarEventCardInfo.get(eventCard).page, eventCard)

  let blackMask = CalendarEventCardInfo.get(eventCard).blackMask
  if(expanded){
    Transform.getMutable(blackMask).scale = Vector3.create(10, 10, 1)
    startDetailMaskFade(blackMask)
    
  }
  else{
    EventMenuBlackMask.getMutable(blackMask).active = false
    VisibilityComponent.getMutable(blackMask).visible = false
    Transform.getMutable(blackMask).scale = Vector3.create(0, 0, 1)
    hideCalendarDetailCard()
    //MeshCollider.createOrReplace(blackMask, {collisionMask: ColliderLayer.CL_NONE})
  }

  
  
  let cardInfo = CalendarEventCardInfo.get(eventCard)
  let cardScalePivot = cardInfo.cardScalePivot
  let cardPositionPivot = cardInfo.cardPositionPivot
  let cardRotationPivot = cardInfo.cardRotationPivot

  let eventCardPos = cardInfo.originalPosition
  let expandSize = 0.85

  let startCardPos = expanded ? Vector3.create(cardInfo.originalPosition.x, cardInfo.originalPosition.y, cardInfo.originalPosition.z) : Vector3.create(0,-1.9 + expandSize*0.4, -5.2)
  let endCardPos = expanded ?    Vector3.create(0,-1.9 +expandSize*0.4, -5.2) :  Vector3.create(cardInfo.originalPosition.x, cardInfo.originalPosition.y, cardInfo.originalPosition.z)
  let startCardScale = expanded ? Vector3.create(1,1,1) : Vector3.create(2,2,1)
  let endCardScale = expanded ?    Vector3.create(2,2,1) :  Vector3.create(1,1,1)

  let startRotation = expanded ? Quaternion.fromEulerDegrees(0, 0, 0) : Quaternion.fromEulerDegrees(0, 180, 0)
  let endRotation = expanded ? Quaternion.fromEulerDegrees(0, 180, 0) : Quaternion.fromEulerDegrees(0, 0, 0) 

  Tween.createOrReplace(cardPositionPivot, { 
    duration: 300,
    easingFunction: EasingFunction.EF_EASEOUTCIRC,
    currentTime: 0,
    playing: true,
    mode: Tween.Mode.Move({ 
        start: startCardPos,
        end: endCardPos,

    })

  })
  Tween.createOrReplace(cardScalePivot, { 
    duration: 300,
    easingFunction: EasingFunction.EF_EASEOUTCIRC,
    currentTime: 0,
    playing: true,
    mode: Tween.Mode.Scale({ 
        start: startCardScale,
        end: endCardScale,

    })

  })
  

  Tween.createOrReplace(cardRotationPivot, { 
      duration: 300,
      easingFunction: EasingFunction.EF_EASEOUTCIRC,
      currentTime: 0,
      playing: true,
      mode: Tween.Mode.Rotate({ 
          start: startRotation,
          end: endRotation
      })
  })
  CalendarEventCardInfo.getMutable(eventCard).detailsExpanded = expanded

}
export function expandDescriptionToggleCalendar(eventCard:Entity){
    setDescriptionPanelCalendar(eventCard, !CalendarEventCardInfo.get(eventCard).detailsExpanded) 
   // VisibilityComponent.getMutable(CalendarEventCardInfo.get(eventCard).detailTextEntity).visible = CalendarEventCardInfo.get(eventCard).detailsExpanded

   if(CalendarEventCardInfo.get(eventCard).detailsExpanded){
    setCalendarDetailCard(eventCard)
    showCalendarDetailCard()
    CalendarEventCardInfo.getMutable(eventCard).hoverText = 'CLOSE DETAILS'
   }
   else{
    CalendarEventCardInfo.getMutable(eventCard).hoverText = 'SEE DETAILS'
   }
}


export function addCalendarEventShadow(container:Entity, positionOffset:Vector3):Entity{
  let cardShadow = engine.addEntity()
  Transform.create(cardShadow, {
    position: Vector3.create(positionOffset.x, positionOffset.y, positionOffset.z+0.02),
    rotation: Quaternion.fromEulerDegrees(0, 0, 0),
    scale: Vector3.create(CALENDAR_CONTENT_WIDTH/CALENDAR_DAYS_SHOWN, CALENDAR_CONTENT_WIDTH/CALENDAR_DAYS_SHOWN, 1),
    parent: container
  })
  GltfContainer.create(cardShadow, { src: modelFolder + "calendar_card_shadow.glb"})
  GltfNodeModifiers.create(
    cardShadow,
    {
      modifiers: [{
        path: '',
        material: {
          material: {
            $case: 'pbr', pbr: {  
              texture: Material.Texture.Common({src: imgFolder + "calendar_shadow.png"}),
              transparencyMode: MaterialTransparencyMode.MTM_ALPHA_BLEND,
              roughness: 1,
              metallic: 0,
              specularIntensity: 0,  
              castShadows: false
            }
          }
        }
      }]
    }
  ) 
  return cardShadow
}
export function addCalendarEventPlaceholder(container:Entity, positionOffset:Vector3):Entity{
  let cardShadow = engine.addEntity()
  Transform.create(cardShadow, {
    position: Vector3.create(positionOffset.x, positionOffset.y, positionOffset.z+0.02),
    rotation: Quaternion.fromEulerDegrees(0, 0, 0),
    // scale: Vector3.create(CALENDAR_CONTENT_WIDTH/CALENDAR_DAYS_SHOWN, CALENDAR_CONTENT_WIDTH/CALENDAR_DAYS_SHOWN, 1),
    scale: Vector3.create(CALENDAR_CONTENT_WIDTH/CALENDAR_DAYS_SHOWN * 2.4, CALENDAR_CONTENT_WIDTH/CALENDAR_DAYS_SHOWN * 1.25, 1),
    parent: container
  })
  // GltfContainer.create(cardShadow, { src: modelFolder + "calendar_card_shadow.glb"})
  // GltfNodeModifiers.create(
  //   cardShadow,
  //   {
  //     modifiers: [{
  //       path: '',
  //       material: {
  //         material: {
  //           $case: 'unlit', unlit: {  
  //             texture: Material.Texture.Common({src: imgFolder + "calendar_placeholder.png"}), 
  //             alphaTexture: Material.Texture.Common({src: imgFolder + "calendar_placeholder.png"}),
  //             alphaTest: 0.5,
  //             castShadows: false
  //           }
  //         }
  //       }
  //     }]
  //   }
  // ) 
  Material.setBasicMaterial(cardShadow, {
    texture: Material.Texture.Common({ src: imgFolder + "calendar_placeholder.png" }),
    castShadows: false,
    alphaTexture: Material.Texture.Common({src: imgFolder + "calendar_placeholder.png"}),   
    alphaTest: 0.5  
  })
  MeshRenderer.setPlane(cardShadow)


  return cardShadow
}


export function addCalendarEventCard(container:Entity, eventInfo:EventShortInfo, positionOffset:Vector3, visible:boolean = false):Entity{


    let cardShadow = addCalendarEventShadow(container, positionOffset)
  
    let cardPositionPivot = engine.addEntity()
    Transform.create(cardPositionPivot, {
        position: Vector3.create(positionOffset.x, positionOffset.y, positionOffset.z),
        rotation: Quaternion.fromEulerDegrees(0, 0, 0),
        scale: Vector3.create(1, 1, 1),
        parent: container
    })
    let cardRotationPivot = engine.addEntity()
    Transform.create(cardRotationPivot, {
        position: Vector3.create(0, 0, 0),
        rotation: Quaternion.fromEulerDegrees(0, 0, 0),
        scale: Vector3.create(1, 1, 1),
        parent: cardPositionPivot
    })
    let cardScalePivot = engine.addEntity()
    Transform.create(cardScalePivot, {
        position: Vector3.create(0, 0, 0),
        rotation: Quaternion.fromEulerDegrees(0, 0, 0),
        scale: Vector3.create(1, 1, 1),
        parent: cardRotationPivot
    })

    let eventCardRoot = engine.addEntity()
    Transform.create(eventCardRoot, {
        position: Vector3.create(0, 0, 0),
        rotation: Quaternion.fromEulerDegrees(0, 0, 0),
        scale: Vector3.create(CALENDAR_CONTENT_WIDTH/CALENDAR_DAYS_SHOWN, CALENDAR_CONTENT_WIDTH/CALENDAR_DAYS_SHOWN, 1),
        parent: cardScalePivot
    })

    //thumbnail front
    let thumbnailEntity = engine.addEntity()
    Transform.createOrReplace(thumbnailEntity, {
        position: Vector3.create(0, 0, 0),  
        rotation: Quaternion.fromEulerDegrees(0, 0, 0),
        scale: Vector3.create(1, 1, 1),
        parent: eventCardRoot
    })
    GltfContainer.create(thumbnailEntity, { src: modelFolder + "calendar_thumbnail.glb", visibleMeshesCollisionMask: ColliderLayer.CL_POINTER })
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
    let blackMask = addBlackMask(cardPositionPivot)
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

    CalendarEventCardInfo.create(eventCardRoot, {
      id: eventInfo.id,
      eventName: eventInfo.eventName,
      thumbnailSrc: eventInfo.thumbnailSrc,
      thumbnail: thumbnailEntity,
      originalScale: Transform.get(cardScalePivot).scale,
      date: eventInfo.date,
      originalPosition: Vector3.create(positionOffset.x, positionOffset.y, positionOffset.z),
      detailsExpanded: false,
      detailText: eventInfo.detailText,
      cardScalePivot: cardScalePivot,
      cardPositionPivot: cardPositionPivot,
      cardRotationPivot: cardRotationPivot,
      page: container,
      blackMask: blackMask,
      user_name: eventInfo.user_name,
      hoverText: 'SEE DETAILS',
      shadowEntity: cardShadow,
  })

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
        expandDescriptionToggleCalendar(eventCardRoot)
      }
    )

    pointerEventsSystem.onPointerHoverEnter(
      {
        entity: thumbnailEntity,
        opts: { 
          hoverText:'SEE DETAILS',
          button: InputAction.IA_POINTER,
          showFeedback: true,
          showHighlight: false,
          maxDistance: 32
        } 
      },
      (e) => {       
       setCalendarDetailCard(eventCardRoot)
      }
    )
    pointerEventsSystem.onPointerHoverLeave(
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
       
      }
    )

 
  
  
    
  
    
    
    return eventCardRoot
}

export function updateCalendarEventCard(cardRoot: Entity, eventInfo: EventShortInfo, show: boolean) {
    const cardInfo = CalendarEventCardInfo.getMutable(cardRoot)
    const showScale = Vector3.create(1, 1, 1)
    const hideScale = Vector3.create(0.001, 0.001, 1)

    Transform.getMutable(cardInfo.cardScalePivot).scale = show ? showScale : hideScale
    Transform.getMutable(cardInfo.shadowEntity).scale = show
        ? Vector3.create(CALENDAR_CONTENT_WIDTH / CALENDAR_DAYS_SHOWN, CALENDAR_CONTENT_WIDTH / CALENDAR_DAYS_SHOWN, 1)
        : hideScale

    if (!show) return

    if (cardInfo.detailsExpanded) {
        setDescriptionPanelCalendar(cardRoot, false)
    }

    GltfNodeModifiers.createOrReplace(cardInfo.thumbnail, {
        modifiers: [{ path: '', material: { material: { $case: 'unlit', unlit: { texture: Material.Texture.Common({ src: eventInfo.thumbnailSrc }), castShadows: false } } } }]
    })

    cardInfo.id = eventInfo.id
    cardInfo.eventName = eventInfo.eventName
    cardInfo.thumbnailSrc = eventInfo.thumbnailSrc
    cardInfo.user_name = eventInfo.user_name
    cardInfo.date = eventInfo.date
    cardInfo.coordinateX = eventInfo.coordinateX
    cardInfo.coordinateZ = eventInfo.coordinateZ
    cardInfo.world = eventInfo.world
    cardInfo.server = eventInfo.server
    cardInfo.detailText = eventInfo.detailText
    cardInfo.detailsExpanded = false
    cardInfo.hoverText = 'SEE DETAILS'
}
