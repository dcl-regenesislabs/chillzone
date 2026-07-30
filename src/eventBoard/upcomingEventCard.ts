import { Billboard, BillboardMode, ColliderLayer, EasingFunction, engine, Entity, Font, GltfContainer, GltfNodeModifiers, InputAction, Material, MeshCollider, MeshRenderer, pointerEventsSystem, Schemas, TextAlignMode, TextShape, Transform, Tween, VisibilityComponent } from "@dcl/sdk/ecs"
import { Color4, Quaternion, Vector3 } from "@dcl/sdk/math"
import { LIVE_DATE_Y_OFFSET, DETAIL_TEXT_X_OFFSET, DETAIL_TEXT_Y_OFFSET, EventShortInfo, modelFolder, ORGANIZED_BY_Y_OFFSET, LIVE_TITLE_X_OFFSET, LIVE_TITLE_Y_OFFSET, UPCOMING_FONTS_SIZE, UPCOMING_TITLE_Y_OFFSET, UPCOMING_DATE_FONT_SIZE, UPCOMING_DATE_Y_OFFSET, BOARD_HEIGHT, BOARD_WIDTH, CHAR_SPACING_DETAILS, UPCOMING_TITLE_Y_OFFSET_DOCKED, UPCOMING_DATE_Y_OFFSET_DOCKED, UPCOMING_FONTS_SIZE_DOCKED, CHAR_SPACING_DEFAULT } from "./config"

import { TextLineAnimation } from "./boardComponents"
import { addInterestedButton } from "./interestedButton"
import { ContainerInfo } from "./pageContainer"
import { fixCharSpacing, getDateString, getDayOfWeek, getTimeString } from "./boardFunctions"
import { closeAllDescriptionPanels } from "./boardLiveEvents"
import { addBlackMask, EventMenuBlackMask, startDetailMaskFade } from "./blackMask"
import { addOpenExternalBtn, ExternalButtonInfo } from "./openExternalBtn"



export const UpcomingEventCardInfo = engine.defineComponent('upcoming-event-card-info-component', { 
   
    eventName:Schemas.String,
    titleEntity:Schemas.Entity,
    dateEntity:Schemas.Entity,
    organizedByEntity:Schemas.Entity,
    interestedButton:Schemas.Entity,    
    thumbnailSrc:Schemas.String,  
    thumbnail:Schemas.Entity,
    user_name:Schemas.String,
    date:Schemas.String,
    coordinateX:Schemas.String,
    coordinateZ:Schemas.String,
    world:Schemas.Boolean,
    server:Schemas.String,    
    detailText:Schemas.String,
    detailTextEntity:Schemas.Entity,
    scalingBG:Schemas.Entity,
    infoBackground:Schemas.Entity,
    originalPosition:Schemas.Vector3,
    detailsExpanded:Schemas.Boolean,
    originalScale:Schemas.Vector3,
    cardScalePivot:Schemas.Entity,
    cardPositionPivot:Schemas.Entity,
    page:Schemas.Entity,
    blackMask:Schemas.Entity
})


export function closeDescriptionPanelsOnPage(page:Entity, exceptCard?:Entity){
  for(let card of ContainerInfo.get(page).cardEntities){
    if(!exceptCard || card != exceptCard){
      setDescriptionPanelUpcoming(card, false)
    }
  }
}

export function setDescriptionPanelUpcoming(eventCard:Entity, expanded:boolean){

  if(UpcomingEventCardInfo.get(eventCard).detailsExpanded == expanded){
    return
  }

  //closeDescriptionPanelsOnPage(UpcomingEventCardInfo.get(eventCard).page, eventCard)

  let blackMask = UpcomingEventCardInfo.get(eventCard).blackMask
  if(expanded){
    Transform.getMutable(blackMask).scale = Vector3.create(10, 10, 1)
    startDetailMaskFade(blackMask)
  }
  else{
    EventMenuBlackMask.getMutable(blackMask).active = false
    VisibilityComponent.getMutable(blackMask).visible = false
    Transform.getMutable(blackMask).scale = Vector3.create(0, 0, 1)
    //MeshCollider.createOrReplace(blackMask, {collisionMask: ColliderLayer.CL_NONE})
  }
  // EventMenuBlackMask.getMutable(blackMask).active = expanded
  // VisibilityComponent.getMutable(blackMask).visible = expanded
  //MeshCollider.getMutable(blackMask).collisionMask = expanded ? ColliderLayer.CL_POINTER : ColliderLayer.CL_NONE
  //Transform.getMutable(blackMask).scale = expanded ? Vector3.create(100, 100, 1 ) : Vector3.create(10,10, 1 )
  
  let cardInfo = UpcomingEventCardInfo.get(eventCard)
  let cardScalePivot = cardInfo.cardScalePivot
  let cardPositionPivot = cardInfo.cardPositionPivot
  let scalingBG = cardInfo.scalingBG
  let infoBackground = cardInfo.infoBackground
  let eventCardPos = cardInfo.originalPosition
  let expandSize = 0.55

  let startPosBG = expanded ?  Vector3.create(0, -0.625, 0): Vector3.create(0, -0.625 - expandSize  , 0)
  let endPosBG = expanded ? Vector3.create(0, -0.625 - expandSize, 0) : Vector3.create(0, -0.625, 0)
  let startScale = expanded ? Vector3.create(1, 0, 1) : Vector3.create(1, expandSize, 1)
  let endScale = expanded ? Vector3.create(1, expandSize, 1) : Vector3.create(1, 0, 1)
  let startThumbnailPos = expanded ?Vector3.create(eventCardPos.x, eventCardPos.y, eventCardPos.z) :  Vector3.create(eventCardPos.x, eventCardPos.y + expandSize*1.5, eventCardPos.z)
  let endThumbnailPos = expanded ?  Vector3.create(eventCardPos.x, eventCardPos.y + expandSize*1.5, eventCardPos.z) : Vector3.create(eventCardPos.x, eventCardPos.y, eventCardPos.z)
  let startCardPos = expanded ? Vector3.create(0, 0, 0) : Vector3.create(-cardInfo.originalPosition.x, -cardInfo.originalPosition.y-0.5, -4.5)
  let endCardPos = expanded ?  Vector3.create(-cardInfo.originalPosition.x, -cardInfo.originalPosition.y-0.5, -4.5) : Vector3.create(0, 0, 0)

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
          start: startThumbnailPos,
          end: endThumbnailPos
      })
  })
  let eventInfo = UpcomingEventCardInfo.get(eventCard)
  UpcomingEventCardInfo.getMutable(eventCard).detailsExpanded = expanded
  TextLineAnimation.getMutable(cardInfo.detailTextEntity).active = expanded
  TextLineAnimation.getMutable(cardInfo.detailTextEntity).currentLineNumber = 0
  TextLineAnimation.getMutable(cardInfo.detailTextEntity).elapsedTime = 0
  TextShape.getMutable(cardInfo.detailTextEntity).lineCount = 1
  TextLineAnimation.getMutable(cardInfo.detailTextEntity).currentColor = Color4.fromHexString("#6E7E8E00")
  TextLineAnimation.getMutable(cardInfo.detailTextEntity).currentAlpha = 0
  VisibilityComponent.getMutable(cardInfo.detailTextEntity).visible = expanded
  Transform.getMutable(cardInfo.titleEntity).position.y = expanded ? UPCOMING_TITLE_Y_OFFSET : UPCOMING_TITLE_Y_OFFSET_DOCKED
  Transform.getMutable(cardInfo.dateEntity).position.y = expanded ? UPCOMING_DATE_Y_OFFSET : UPCOMING_DATE_Y_OFFSET_DOCKED
  TextShape.getMutable(cardInfo.titleEntity).fontSize = expanded ? UPCOMING_FONTS_SIZE : UPCOMING_FONTS_SIZE_DOCKED
  //TextShape.getMutable(cardInfo.dateEntity).fontSize = expanded ? UPCOMING_DATE_FONT_SIZE : UPCOMING_DATE_FONT_SIZE_DOCKED
  let titleLimit = expanded ? 60 : 30
  let eventTiletString = cardInfo.eventName.length > titleLimit ? cardInfo.eventName.substring(0, titleLimit) + "..." : cardInfo.eventName
  TextShape.getMutable(cardInfo.titleEntity).text = "<cspace=" + CHAR_SPACING_DEFAULT + "em><b>" + fixCharSpacing(eventTiletString) + "</b></cspace>"

  let dateSting = expanded ? ("<cspace=-0.1em><b>" + getDayOfWeek(eventInfo.date, false) + ", " + getDateString(eventInfo.date) + " AT " + getTimeString(eventInfo.date) + "</b></cspace>") : ("<cspace=-0.1em><b>" + getDayOfWeek(eventInfo.date, false) + ", " + getDateString(eventInfo.date) + "</b></cspace>")
  TextShape.getMutable(cardInfo.dateEntity).text = dateSting

}
export function expandDescriptionToggleUpcoming(eventCard:Entity){
    setDescriptionPanelUpcoming(eventCard, !UpcomingEventCardInfo.get(eventCard).detailsExpanded) 
    VisibilityComponent.getMutable(UpcomingEventCardInfo.get(eventCard).detailTextEntity).visible = UpcomingEventCardInfo.get(eventCard).detailsExpanded
}


export function addUpcomingEventCard(container:Entity, eventInfo:EventShortInfo, positionOffset:Vector3, visible:boolean = false):Entity{

   
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
        expandDescriptionToggleUpcoming(eventCardRoot)
      }
    )
    
    // Material.setBasicMaterial(thumbnailEntity, {
    //     texture: Material.Texture.Common({src: eventInfo.thumbnailSrc}),   
    //     alphaTexture: Material.Texture.Common({src: imgFolder + "event_top_alpha.png"}),    
    //     castShadows: false 
    // })
    

    
    //info background
   
    let infoBackground = engine.addEntity()        
    Transform.create(infoBackground, {
        position: Vector3.create(0 , -0.625, 0),
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
      expandDescriptionToggleUpcoming(eventCardRoot)
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
          expandDescriptionToggleUpcoming(eventCardRoot)
        }
      )

    //event name
    let eventTitle = engine.addEntity()
    Transform.create(eventTitle, {
        position: Vector3.create(LIVE_TITLE_X_OFFSET, UPCOMING_TITLE_Y_OFFSET_DOCKED, -0.02),
        rotation: Quaternion.fromEulerDegrees(0, 0, 0),
        scale: Vector3.create(1, 1, 1),
        parent: eventCardRoot
    })
    let eventTiletString = eventInfo.eventName.length > 30 ? eventInfo.eventName.substring(0, 30) + "..." : eventInfo.eventName
    TextShape.create(eventTitle, {        
        text: ("<cspace=-0.1em><b>" + fixCharSpacing(eventTiletString) + "</b></cspace>"),
        fontSize: UPCOMING_FONTS_SIZE_DOCKED,
        font:Font.F_SERIF,
        textAlign: TextAlignMode.TAM_MIDDLE_LEFT,
        textColor: Color4.fromHexString("#4D5F70")
    })

    //event date
    let eventDate = engine.addEntity()
    Transform.create(eventDate, {
        position: Vector3.create(LIVE_TITLE_X_OFFSET, UPCOMING_DATE_Y_OFFSET_DOCKED, -0.02),
        rotation: Quaternion.fromEulerDegrees(0, 0, 0),
        scale: Vector3.create(1, 1, 1),
        parent: eventCardRoot
    })
    TextShape.create(eventDate, {
        text: ("<cspace=-0.1em><b>" + getDayOfWeek(eventInfo.date) + ", " + getDateString(eventInfo.date) + "</b></cspace>"),
        fontSize: UPCOMING_DATE_FONT_SIZE,
        font:Font.F_SERIF,
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
        //text: ("<cspace=-0.05em><color=#736E7D>Organized by </color></cspace><b><cspace=-0.1em><color=#FF2D55>" + eventInfo.user_name + "</b>"),
        text: "",
        fontSize: 0.35,
        font:Font.F_SERIF,
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
      text: ("<cspace=-0.05em>" + fixCharSpacing(eventInfo.detailText, CHAR_SPACING_DETAILS) + "</cspace>"),
      fontSize: 0.4,
      font:Font.F_SERIF,
      textAlign: TextAlignMode.TAM_TOP_LEFT,
      textColor: Color4.fromHexString("#6E7E8EFF"),
      width: 1.8,
      height: 1.0,
      textWrapping: true,
      lineCount:1,

  })
  TextLineAnimation.create(detailText, {
    active: false,
    startLineNumber: 1,
    endLineNumber: 10,
    currentLineNumber: 0,
    elapsedTime: 0,
    currentColor: Color4.White(),
    currentAlpha: 1,
    duration: 0.3
  })
  VisibilityComponent.createOrReplace(detailText, {visible: false})

  
  //   let interestedButton = addInterestedButton(eventCardRoot, eventCardRoot, {
  //     server: "bencedcl.dcl.eth",
  //     coordinates: [10, 10],
  //     world: false
  // })

  let interestedButton = addOpenExternalBtn(eventCardRoot, {url: `https://decentraland.org/events/event/?id=` + eventInfo.id})

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
        thumbnailSrc: eventInfo.thumbnailSrc ,
        thumbnail: thumbnailEntity,
        originalScale: Transform.get(cardScalePivot).scale,
        titleEntity: eventTitle,
        dateEntity: eventDate,
        date: eventInfo.date,
        organizedByEntity: organizedByText,
        interestedButton: interestedButton,        
        scalingBG: scalingBG,
        infoBackground: infoBackground,
        originalPosition: positionOffset,
        detailsExpanded: false,
        detailText: eventInfo.detailText,
        detailTextEntity: detailText,
        cardScalePivot: cardScalePivot,
        cardPositionPivot: cardPositionPivot,
        page: container,
        blackMask: blackMask
    })
    
    
    return eventCardRoot
}

export function updateUpcomingEventCard(cardRoot: Entity, eventInfo: EventShortInfo) {
    const cardInfo = UpcomingEventCardInfo.getMutable(cardRoot)

    if (cardInfo.detailsExpanded) {
        setDescriptionPanelUpcoming(cardRoot, false)
    }

    GltfNodeModifiers.createOrReplace(cardInfo.thumbnail, {
        modifiers: [{ path: '', material: { material: { $case: 'unlit', unlit: { texture: Material.Texture.Common({ src: eventInfo.thumbnailSrc }), castShadows: false } } } }]
    })

    const titleStr = eventInfo.eventName.length > 30 ? eventInfo.eventName.substring(0, 30) + "..." : eventInfo.eventName
    TextShape.getMutable(cardInfo.titleEntity).text = `<cspace=-0.1em><b>${fixCharSpacing(titleStr)}</b></cspace>`
    TextShape.getMutable(cardInfo.dateEntity).text = `<cspace=-0.1em><b>${getDayOfWeek(eventInfo.date)}, ${getDateString(eventInfo.date)}</b></cspace>`
    TextShape.getMutable(cardInfo.detailTextEntity).text = `<cspace=-0.05em>${fixCharSpacing(eventInfo.detailText, CHAR_SPACING_DETAILS)}</cspace>`

    TextLineAnimation.getMutable(cardInfo.detailTextEntity).active = false
    TextLineAnimation.getMutable(cardInfo.detailTextEntity).currentLineNumber = 0
    TextLineAnimation.getMutable(cardInfo.detailTextEntity).elapsedTime = 0
    TextShape.getMutable(cardInfo.detailTextEntity).lineCount = 1
    VisibilityComponent.getMutable(cardInfo.detailTextEntity).visible = false

    ExternalButtonInfo.getMutable(cardInfo.interestedButton).url = `https://decentraland.org/events/event/?id=${eventInfo.id}`

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

