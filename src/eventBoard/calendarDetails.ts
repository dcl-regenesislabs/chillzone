import { ColliderLayer, EasingFunction, engine, Entity, Font, GltfContainer, GltfNodeModifiers, InputAction, Material, pointerEventsSystem, Schemas, TextAlignMode, TextShape, Transform, Tween, VisibilityComponent } from "@dcl/sdk/ecs"
import { Color4, Quaternion, Vector3 } from "@dcl/sdk/math"
import { CALENDAR_DATE_FONT_SIZE, CALENDAR_DATE_Y_OFFSET, CALENDAR_DETAIL_TEXT_Y_OFFSET, CALENDAR_ORGANIZED_BY_Y_OFFSET, CALENDAR_TITLE_FONT_SIZE, CALENDAR_TITLE_X_OFFSET, CALENDAR_TITLE_Y_OFFSET, CHAR_SPACING_DEFAULT, CHAR_SPACING_DETAILS, DETAIL_TEXT_X_OFFSET, EventShortInfo, imgFolder, modelFolder } from "./config"
import { fixCharSpacing, getDateString, getDayOfWeek, getTimeString } from "./boardFunctions"
import { TextLineAnimation } from "./boardComponents"
import { CalendarEventCardInfo, expandDescriptionToggleCalendar } from "./calendarCard"
import { addOpenExternalBtn, ExternalButtonInfo } from "./openExternalBtn"
import { timeout } from "./deps/animUtils"


export let detailsRoot:Entity

export const DetailCardInfo = engine.defineComponent('detail-card-info-component', {   
    infoBackground:Schemas.Entity,   
    scalingBG:Schemas.Entity,
    thumbnailBackEntity:Schemas.Entity,
    detailTextEntity:Schemas.Entity,
    eventTitleEntity:Schemas.Entity,
    eventDateEntity:Schemas.Entity,
    organizedByEntity:Schemas.Entity,
    interestedButton:Schemas.Entity,
    infoButton:Schemas.Entity,   
})

export function initCalendarDetailCard() {

    if(detailsRoot) {
        return
    }
    
    detailsRoot = engine.addEntity()
    Transform.create(detailsRoot, {
        position: Vector3.create(0, 0, 0),
        rotation: Quaternion.fromEulerDegrees(0, 180, 0),
        scale: Vector3.create(1, 1, 1)       
    })
     //thumbnail backside
     let thumbnailBackEntity = engine.addEntity()    
     Transform.create(thumbnailBackEntity, {
         position: Vector3.create(0, 0, 0),
         rotation: Quaternion.fromEulerDegrees(0, 0, 0),
         scale: Vector3.create(1, 1, 1),
         parent: detailsRoot
     })
     //MeshRenderer.setPlane(thumbnailEntity)
     
     GltfContainer.create(thumbnailBackEntity, { src: modelFolder + "event_card_thumbnail.glb", visibleMeshesCollisionMask: ColliderLayer.CL_POINTER })
     VisibilityComponent.create(thumbnailBackEntity, {visible:false})
    
    
    //info background
   
    let infoBackground = engine.addEntity()        
    Transform.create(infoBackground, {
        position: Vector3.create(0 , -0.625, 0),
        rotation: Quaternion.fromEulerDegrees(0, 0, 0),
        scale: Vector3.create(1, 1, 1),
        parent: detailsRoot
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
    Material.setBasicMaterial(infoBackground, {
        diffuseColor: Color4.White(),
        alphaTexture: Material.Texture.Common({src: imgFolder + "event_bottom_alpha.png"}),     
    })
   
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
    
    //event name
    let eventTitle = engine.addEntity()
    Transform.create(eventTitle, {
        position: Vector3.create(CALENDAR_TITLE_X_OFFSET, CALENDAR_TITLE_Y_OFFSET, -0.02),
        rotation: Quaternion.fromEulerDegrees(0, 0, 0),
        scale: Vector3.create(1, 1, 1),
        parent: detailsRoot
    })
    let eventTiletString = "TITLE"
    TextShape.create(eventTitle, {        
        text: ("<cspace=" + CHAR_SPACING_DEFAULT + "em><b>" + fixCharSpacing(eventTiletString) + "</b></cspace>"),
        fontSize: CALENDAR_TITLE_FONT_SIZE,
        font:Font.F_SERIF,
        textAlign: TextAlignMode.TAM_MIDDLE_LEFT,
        textColor: Color4.fromHexString("#4D5F70")
    })
    VisibilityComponent.create(eventTitle, {visible: false})

    //event date
    let eventDate = engine.addEntity()
    Transform.create(eventDate, {
        position: Vector3.create(CALENDAR_TITLE_X_OFFSET, CALENDAR_DATE_Y_OFFSET, -0.02),
        rotation: Quaternion.fromEulerDegrees(0, 0, 0),
        scale: Vector3.create(1, 1, 1),
        parent: detailsRoot
    })
    TextShape.create(eventDate, {
        text: ("<cspace=-0.1em><b>MON 1, JAN 1971</b></cspace>"),
        fontSize: CALENDAR_DATE_FONT_SIZE,
        font:Font.F_SERIF,
        textAlign: TextAlignMode.TAM_MIDDLE_LEFT,
        textColor: Color4.fromHexString("#95ABC1")
    })
    VisibilityComponent.create(eventDate, {visible: false})

    //organized by text
    let organizedByText = engine.addEntity()
    Transform.create(organizedByText, {
        position: Vector3.create(CALENDAR_TITLE_X_OFFSET, CALENDAR_ORGANIZED_BY_Y_OFFSET, -0.02),
        rotation: Quaternion.fromEulerDegrees(0, 0, 0),
        scale: Vector3.create(1, 1, 1),
        parent: detailsRoot
    })
    TextShape.create(organizedByText, {
        text: ("<cspace=-0.05em><color=#736E7D>Organized by </color></cspace><b><cspace=-0.1em><color=#FF2D55> USERNAME </b>"),
        fontSize: 0.35,
        font:Font.F_SERIF,
        textAlign: TextAlignMode.TAM_MIDDLE_LEFT,
        textColor: Color4.fromHexString("#95ABC1")
    })
    VisibilityComponent.create(organizedByText, {visible: false})

    let detailText = engine.addEntity()
    Transform.create(detailText, {
      position: Vector3.create(DETAIL_TEXT_X_OFFSET, CALENDAR_DETAIL_TEXT_Y_OFFSET, -0.02),
      rotation: Quaternion.fromEulerDegrees(0, 0, 0),
      scale: Vector3.create(1, 1, 1),
      parent: detailsRoot
  })
  TextShape.create(detailText, {
      text: ("<cspace=-0.05em> details here </cspace>"),
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
    endLineNumber: 16,
    currentLineNumber: 0,
    elapsedTime: 0,
    currentColor: Color4.White(),
    currentAlpha: 1,
    duration: 0.3
  })
  VisibilityComponent.createOrReplace(detailText, {visible: false})

  
  //   let interestedButton = addInterestedButton(eventCardRoot, detailsRoot, {
  //     server: "bencedcl.dcl.eth",
  //     coordinates: [10, 10],
  //     world: false
  // }, false)

  let interestedButton = addOpenExternalBtn(detailsRoot, {url: `https://decentraland.org/events/event/?id=123`}, false)

  DetailCardInfo.create(detailsRoot, {
    infoBackground: infoBackground,
    scalingBG: scalingBG,
    thumbnailBackEntity: thumbnailBackEntity,
    detailTextEntity: detailText,
    eventTitleEntity: eventTitle,
    eventDateEntity: eventDate,
    organizedByEntity: organizedByText,
    interestedButton: interestedButton,   
   
  })
}


export function setCalendarDetailCard(eventCardRoot:Entity) {


    let eventInfo = CalendarEventCardInfo.get(eventCardRoot)

    if(!detailsRoot) {
        return
    }

    Transform.getMutable(detailsRoot).parent = eventCardRoot
    //showCalendarDetailCard()
    let detailInfo = DetailCardInfo.get(detailsRoot)
    VisibilityComponent.getMutable(detailInfo.thumbnailBackEntity).visible = true

    GltfNodeModifiers.createOrReplace(
        detailInfo.thumbnailBackEntity,
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
           entity: detailInfo.thumbnailBackEntity,
           opts: { 
             hoverText: 'CLOSE DETAILS',
             button: InputAction.IA_POINTER,
             showFeedback: true,
             showHighlight: false,
             maxDistance: 32
           }
         },
         (e) => {       
           expandDescriptionToggleCalendar(eventCardRoot)
           hideCalendarDetailCard()
         }
       )

       pointerEventsSystem.onPointerDown(
        {
          entity: detailInfo.infoBackground,
          opts: { 
            hoverText: 'CLOSE DETAILS',
            button: InputAction.IA_POINTER,
            showFeedback: true,
            showHighlight: false,
            maxDistance: 32
          }
        },
        (e) => {       
          expandDescriptionToggleCalendar(eventCardRoot)
          hideCalendarDetailCard()
        }
      )

      pointerEventsSystem.onPointerDown(
        {
          entity: detailInfo.scalingBG,
          opts: { 
            hoverText: 'CLOSE DETAILS',
            button: InputAction.IA_POINTER,
            showFeedback: true,
            showHighlight: false,
            maxDistance: 32
          }
        },
        (e) => {       
          expandDescriptionToggleCalendar(eventCardRoot)
          hideCalendarDetailCard()
        }
      )

      let eventTiletString = eventInfo.eventName.length > 60 ? eventInfo.eventName.substring(0, 60) + "..." : eventInfo.eventName
      let titleMutable = TextShape.getMutable(detailInfo.eventTitleEntity)
      titleMutable.text = ("<cspace=" + CHAR_SPACING_DEFAULT + "em><b>" + fixCharSpacing(eventTiletString) + "</b></cspace>")
      titleMutable.fontSize = CALENDAR_TITLE_FONT_SIZE
      titleMutable.font = Font.F_SERIF
      titleMutable.textAlign = TextAlignMode.TAM_MIDDLE_LEFT
      titleMutable.textColor = Color4.fromHexString("#4D5F70")
      //VisibilityComponent.getMutable(detailInfo.eventTitleEntity).visible = true   

      let dateMutable = TextShape.getMutable(detailInfo.eventDateEntity)
      let dateSting =  ("<cspace=-0.1em><b>" + getDayOfWeek(eventInfo.date, false) + ", " + getDateString(eventInfo.date) + " AT " + getTimeString(eventInfo.date) + "</b></cspace>")
      dateMutable.text = dateSting
      dateMutable.fontSize = CALENDAR_DATE_FONT_SIZE
      dateMutable.font = Font.F_SERIF
      dateMutable.textAlign = TextAlignMode.TAM_MIDDLE_LEFT
      dateMutable.textColor = Color4.fromHexString("#95ABC1")
      //VisibilityComponent.getMutable(detailInfo.eventDateEntity).visible = true   

      let organizedByMutable = TextShape.getMutable(detailInfo.organizedByEntity)
      organizedByMutable.text = ("<cspace=-0.05em><color=#736E7D>Organized by </color></cspace><b><cspace=-0.1em><color=#FF2D55>" + eventInfo.user_name + "</b>")
      organizedByMutable.fontSize = 0.35
      organizedByMutable.font = Font.F_SERIF
      organizedByMutable.textAlign = TextAlignMode.TAM_MIDDLE_LEFT
      organizedByMutable.textColor = Color4.fromHexString("#95ABC1")
      //VisibilityComponent.getMutable(detailInfo.organizedByEntity).visible = true   

      let detailTextMutable = TextShape.getMutable(detailInfo.detailTextEntity)
      detailTextMutable.text = ("<cspace=-0.05em>" + fixCharSpacing(eventInfo.detailText, CHAR_SPACING_DETAILS) + "</cspace>")
      detailTextMutable.fontSize = 0.4
      detailTextMutable.font = Font.F_SERIF
      detailTextMutable.textAlign = TextAlignMode.TAM_TOP_LEFT
      detailTextMutable.textColor = Color4.fromHexString("#6E7E8EFF")
      //VisibilityComponent.getMutable(detailInfo.detailTextEntity).visible = true   
      
      let interestedButtonMutable = ExternalButtonInfo.getMutable(detailInfo.interestedButton)
      interestedButtonMutable.url = `https://decentraland.org/events/event/?id=` + eventInfo.id
     
      TextLineAnimation.getMutable(detailInfo.detailTextEntity).active = true
        TextLineAnimation.getMutable(detailInfo.detailTextEntity).currentLineNumber = 0
        TextLineAnimation.getMutable(detailInfo.detailTextEntity).elapsedTime = 0
        TextShape.getMutable(detailInfo.detailTextEntity).lineCount = 1
        TextLineAnimation.getMutable(detailInfo.detailTextEntity).currentColor = Color4.fromHexString("#6E7E8E00")
        TextLineAnimation.getMutable(detailInfo.detailTextEntity).currentAlpha = 0
        //VisibilityComponent.getMutable(detailInfo.detailTextEntity).visible = true
       
        let expandSize = 0.85

       
        let startScale = Vector3.create(1, 0, 1) 
        let endScale = Vector3.create(1, expandSize, 1)
        let startPosBG = Vector3.create(0, -0.625, 0)
        let endPosBG = Vector3.create(0, -0.625 - expandSize, 0)

        Tween.createOrReplace(detailInfo.infoBackground, { 
            duration: 300,
            easingFunction: EasingFunction.EF_EASEOUTCIRC,
            currentTime: 0,
            playing: true,
            mode: Tween.Mode.Move({ 
                start: startPosBG,
                end: endPosBG
            })
          })
        
          Tween.createOrReplace(detailInfo.scalingBG, { 
              duration: 300,
              easingFunction: EasingFunction.EF_EASEOUTCIRC,
              currentTime: 0,
              playing: true,
              mode: Tween.Mode.Scale({ 
                  start: startScale,
                  end: endScale
              })
          })
        
      //VisibilityComponent.getMutable(detailInfo.interestedButton).visible = true   

}

export function hideCalendarDetailCard() {

    if(!detailsRoot) {
        return
    }

    //VisibilityComponent.getMutable(DetailCardInfo.get(detailsRoot).interestedButton).visible = false
    VisibilityComponent.getMutable(DetailCardInfo.get(detailsRoot).detailTextEntity).visible = false
    VisibilityComponent.getMutable(DetailCardInfo.get(detailsRoot).eventTitleEntity).visible = false
    VisibilityComponent.getMutable(DetailCardInfo.get(detailsRoot).eventDateEntity).visible = false
    VisibilityComponent.getMutable(DetailCardInfo.get(detailsRoot).organizedByEntity).visible = false
    VisibilityComponent.getMutable(DetailCardInfo.get(detailsRoot).thumbnailBackEntity).visible = false

    timeout(200, () => {
        Transform.getMutable(detailsRoot).scale = Vector3.create(0, 0, 0)
    })
}

export function showCalendarDetailCard() {

    if(!detailsRoot) {
        return
    }
    //VisibilityComponent.getMutable(DetailCardInfo.get(detailsRoot).interestedButton).visible = true 
    VisibilityComponent.getMutable(DetailCardInfo.get(detailsRoot).detailTextEntity).visible = true
    VisibilityComponent.getMutable(DetailCardInfo.get(detailsRoot).eventTitleEntity).visible = true
    VisibilityComponent.getMutable(DetailCardInfo.get(detailsRoot).eventDateEntity).visible = true
    VisibilityComponent.getMutable(DetailCardInfo.get(detailsRoot).organizedByEntity).visible = true
    Transform.getMutable(detailsRoot).scale = Vector3.create(1, 1, 1)
}
