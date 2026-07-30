// import { ColliderLayer, EasingFunction, engine, Entity, Font, GltfContainer, GltfNodeModifiers, InputAction, Material, MaterialTransparencyMode, MeshCollider, MeshRenderer, pointerEventsSystem, Schemas, TextAlignMode, TextShape, Transform, Tween, VisibilityComponent } from "@dcl/sdk/ecs"
// import { Color4, Quaternion, Vector3 } from "@dcl/sdk/math"
// import { BOARD_HEIGHT, BOARD_WIDTH, LIVE_DATE_Y_OFFSET, DETAIL_DATE_Y_OFFSET, DETAIL_TEXT_X_OFFSET, DETAIL_TEXT_Y_OFFSET, EventShortInfo, imgFolder, modelFolder, ORGANIZED_BY_Y_OFFSET, LIVE_TITLE_X_OFFSET, LIVE_TITLE_Y_OFFSET } from "./config"
// import { addJumpInButton } from "./jumpInButton"
// import { addInfoButton } from "./infoButton"
// import { EventBoardInfo } from "./boardLiveEvents"
// import { addCloseButton } from "./closeButton"
// import { EventMenuBlackMask } from "./blackMask"



// export const DetailCardInfo = engine.defineComponent('detail-card-info-component', { 
//     rotationPivot:Schemas.Entity,    
//     eventName:Schemas.String,
//     titleEntity:Schemas.Entity,
//     dateEntity:Schemas.Entity,
//     organizedByEntity:Schemas.Entity,
//     jumpInButton:Schemas.Entity,
//     infoButton:Schemas.Entity,
//     thumbnailSrc:Schemas.String,  
//     thumbnail:Schemas.Entity,
//     user_name:Schemas.String,
//     date:Schemas.String,
//     coordinateX:Schemas.String,
//     coordinateZ:Schemas.String,
//     world:Schemas.Boolean,
//     server:Schemas.String,
//     descriptionEntity:Schemas.Entity,
//     detailText:Schemas.String,
//     detailBlackMask:Schemas.Entity,
//     closeButton:Schemas.Entity,
// })


// export function loadDetailCard(parent:Entity, event:EventShortInfo){

//     let detailCardGrp = engine.getEntitiesWith(DetailCardInfo)

//     for (let [detailCard] of detailCardGrp) {

//         Transform.getMutable(detailCard).parent = parent
//         let detailCardInfo = DetailCardInfo.getMutable(detailCard)
         
//         detailCardInfo.eventName = event.eventName
//         detailCardInfo.thumbnailSrc = event.thumbnailSrc
//         detailCardInfo.user_name = event.user_name
//         detailCardInfo.date = event.date
//         detailCardInfo.coordinateX = event.coordinateX
//         detailCardInfo.coordinateZ = event.coordinateZ
//         detailCardInfo.world = event.world
//         detailCardInfo.server = event.server

//         let eventTiletString = event.eventName.length > 30 ? event.eventName.substring(0, 30) + "..." : event.eventName
//         TextShape.getMutable(detailCardInfo.titleEntity).text = ("<cspace=-0.1em><b>" + eventTiletString + "</b></cspace>")
//         TextShape.getMutable(detailCardInfo.dateEntity).text = event.date
//         TextShape.getMutable(detailCardInfo.organizedByEntity).text = ("<cspace=-0.05em><color=#736E7D>Organized by </color></cspace><b><cspace=-0.1em><color=#FF2D55>" + event.user_name + "</cspace></b>")
//         TextShape.getMutable(detailCardInfo.descriptionEntity).text = ("<b><cspace=-0.1em>" + event.detailText + "</cspace></b>")
//         console.log(event.thumbnailSrc)

//         Material.setBasicMaterial(detailCardInfo.thumbnail, {
//             texture: Material.Texture.Common({src: event.thumbnailSrc}),   
//             alphaTexture: Material.Texture.Common({src: imgFolder + "event_top_alpha.png"}),    
//             castShadows: false 
//         })
//     }
    
   
// }

// function startDetailMaskFade(eventCard:Entity){
//     let blackMask = DetailCardInfo.get(eventCard).detailBlackMask
//     Transform.getMutable(blackMask).scale = Vector3.create(BOARD_WIDTH, BOARD_HEIGHT*2, 1 )
//     EventMenuBlackMask.getMutable(blackMask).active = true
//     EventMenuBlackMask.getMutable(blackMask).fadeFactor = 0
//     VisibilityComponent.getMutable(blackMask).visible = true
// }

// export function showDetailCard(detailCard:Entity, show:boolean, instahide:boolean = false){

//     if(show){
//         startDetailMaskFade(detailCard)
//     }
//     else{
//         let blackMask = DetailCardInfo.get(detailCard).detailBlackMask
//         EventMenuBlackMask.getMutable(blackMask).active = false
//         VisibilityComponent.getMutable(blackMask).visible = false
//         Transform.getMutable(blackMask).scale = Vector3.create(0, 0, 1)
//     }

   
//     let detailCardInfo = DetailCardInfo.getMutable(detailCard)

//     if(instahide){
//         Transform.getMutable(detailCard).scale = Vector3.create(0, 0, 1)
//         return
//     }

//     //Transform.getMutable(detailCard).scale = Vector3.create(0.6, 0.6, 1)
   
//     let rotationPivot = detailCardInfo.rotationPivot
//     let dirMult = show ? -1 : 1 
//     let angle = dirMult * 60

//     let startAngle = show ? angle : 0
//     let endAngle = show ? 0 :  angle
//     let startScale = show ? 0 : 0.6 
//     let endScale = show ? 0.6 : 0

//     if(show){
//         Transform.getMutable(detailCardInfo.thumbnail).position = Vector3.create(0, 0, 0)
//     }
    
//     Tween.createOrReplace(rotationPivot, {
//         duration: 300,
//         easingFunction: EasingFunction.EF_EASEOUTCIRC,
//         currentTime: 0,
//         playing: true,
//         mode: Tween.Mode.Rotate({
//             start: Quaternion.fromEulerDegrees(0, startAngle, 0),
//             end: Quaternion.fromEulerDegrees(0, endAngle, 0)
//         })
//     })
//     Tween.createOrReplace(detailCard, {
//         duration: 300,
//         easingFunction: EasingFunction.EF_EASEOUTCIRC,
//         currentTime: 0,
//         playing: true,
//         mode: Tween.Mode.Scale({
//             start: Vector3.create(startScale, startScale, 1),
//             end: Vector3.create(endScale, endScale, 1)
//         })
//     })
    

// }


// export function addDetailCard(eventBoard:Entity):Entity{

//     let rotationPivot = engine.addEntity()
//     Transform.create(rotationPivot, {
//         position: Vector3.create(0, 0, 1),
//         rotation: Quaternion.fromEulerDegrees(0, 0, 0),
//         scale: Vector3.create(1, 1, 1),
//         parent: eventBoard
//     })
//     let detailCardRoot = engine.addEntity()
//     Transform.create(detailCardRoot, {
//         position: Vector3.create(0, 0, -1.1),
//         rotation: Quaternion.fromEulerDegrees(0, 0, 0),
//         scale: Vector3.create(0.6, 0.6, 1),
//         parent: rotationPivot
//     })

//     //thumbnail
//     let thumbnailEntity = engine.addEntity()
//     Transform.create(thumbnailEntity, {
//         position: Vector3.create(0, 0, 0),
//         rotation: Quaternion.fromEulerDegrees(0, 0, 0),
//         scale: Vector3.create(2, 1, 1),
//         parent: detailCardRoot
//     })
//     MeshRenderer.setPlane(thumbnailEntity)
//     MeshCollider.setPlane(thumbnailEntity)
//     Material.setBasicMaterial(thumbnailEntity, {
//        // texture: Material.Texture.Common({src: _thumbnailSrc}),   
//         alphaTexture: Material.Texture.Common({src: imgFolder + "event_top_alpha.png"}),    
//         castShadows: false 
//     })
    

//     //info background
   
//     let infoBackground = engine.addEntity()        
//     Transform.create(infoBackground, {
//         position: Vector3.create(0 , -0.625, 0),
//         rotation: Quaternion.fromEulerDegrees(0, 0, 0),
//         scale: Vector3.create(1, 1, 1),
//         parent: detailCardRoot
//     })
//    // MeshRenderer.setPlane(infoBackground)
//    GltfContainer.create(infoBackground, { src: modelFolder + "event_card_bottom_tall.glb", visibleMeshesCollisionMask: ColliderLayer.CL_POINTER })
//    GltfNodeModifiers.create(
//     infoBackground,
//     {
//       modifiers: [{
//         path: '',
//         material: {
//           material: {
//             $case: 'unlit', unlit: {
//               diffuseColor: Color4.White(),
//             }
//           }
//         }
//       }]
//     }
//   )
//     // Material.setBasicMaterial(infoBackground, {
//     //     diffuseColor: Color4.White(),
//     //     alphaTexture: Material.Texture.Common({src: imgFolder + "event_bottom_alpha.png"}),     
//     // })
   

//     //event name
//     let eventTitle = engine.addEntity()
//     Transform.create(eventTitle, {
//         position: Vector3.create(LIVE_TITLE_X_OFFSET, LIVE_TITLE_Y_OFFSET, -0.02),
//         rotation: Quaternion.fromEulerDegrees(0, 0, 0),
//         scale: Vector3.create(1, 1, 1),
//         parent: detailCardRoot
//     })
//     let eventTiletString = "Event Name"
//     TextShape.create(eventTitle, {        
//         text: ("<cspace=-0.1em><b>" + eventTiletString + "</b></cspace>"),
//         fontSize: 0.65,
//         font:Font.F_SERIF,
//         textAlign: TextAlignMode.TAM_MIDDLE_LEFT,
//         textColor: Color4.fromHexString("#4D5F70")
//     })

//     //event date
//     let eventDate = engine.addEntity()
//     Transform.create(eventDate, {
//         position: Vector3.create(LIVE_TITLE_X_OFFSET, DETAIL_DATE_Y_OFFSET, -0.02),
//         rotation: Quaternion.fromEulerDegrees(0, 0, 0),
//         scale: Vector3.create(1, 1, 1),
//         parent: detailCardRoot
//     })
//     TextShape.create(eventDate, {
//         text: ("<cspace=-0.1em><b>" + "JAN, 32" + "</b></cspace>"),
//         fontSize: 0.3,
//         font:Font.F_SERIF,
//         textAlign: TextAlignMode.TAM_MIDDLE_LEFT,
//         textColor: Color4.fromHexString("#95ABC1")
//     })

//     //organized by text
//     let organizedByText = engine.addEntity()
//     Transform.create(organizedByText, {
//         position: Vector3.create(LIVE_TITLE_X_OFFSET, ORGANIZED_BY_Y_OFFSET, -0.02),
//         rotation: Quaternion.fromEulerDegrees(0, 0, 0),
//         scale: Vector3.create(1, 1, 1),
//         parent: detailCardRoot
//     })
//     TextShape.create(organizedByText, {
//         text: ("<cspace=-0.05em><color=#736E7D>Organized by </color></cspace><b><cspace=-0.1em><color=#FF2D55>" + "DCL SDK" + "</b>"),
//         fontSize: 0.35,
//         font:Font.F_SERIF,
//         textAlign: TextAlignMode.TAM_MIDDLE_LEFT,
//         textColor: Color4.fromHexString("#95ABC1")
//     })

//     //description
//     let descriptionEntity = engine.addEntity()
//     Transform.create(descriptionEntity, {
//         position: Vector3.create(DETAIL_TEXT_X_OFFSET, DETAIL_TEXT_Y_OFFSET, -0.02),
//         rotation: Quaternion.fromEulerDegrees(0, 0, 0),
//         scale: Vector3.create(1, 1, 1),
//         parent: detailCardRoot
//     })
//     TextShape.create(descriptionEntity, {
//         text: ("<cspace=-0.1em>" + "Description" + "</cspace>"),
//         fontSize: 0.4,
//         font:Font.F_SERIF,
//         textAlign: TextAlignMode.TAM_TOP_LEFT,
//         textColor: Color4.fromHexString("#6E7E8EFF"),
//         width: 1.8,
//         height: 1.0,
//         textWrapping: true,
//         lineCount:3,

//     })

//     // jump in button
//     addJumpInButton(detailCardRoot, detailCardRoot, {
//         server: "bencedcl.dcl.eth",
//         coordinates: [10, 10],
//         world: false
//     })

//     // close button
//     let closeButton = addCloseButton(detailCardRoot, Vector3.create(0.9, 0.5, -0.6), Vector3.create(0.1, 0.1, 1), () => {
//         showDetailCard(detailCardRoot, false)
//     })
    

//     let detailBlackMask = addDetailBlackMask(eventBoard)
//     pointerEventsSystem.onPointerDown(
//         {
//           entity: detailBlackMask,
//           opts: { 
//             hoverText: 'BACK',
//             button: InputAction.IA_POINTER,
//             showFeedback: true,
//             showHighlight: false,
//             maxDistance: 32
//           }
//         },
//         (e) => {          
//             showDetailCard(detailCardRoot, false)

//         }
//       )
   
//     DetailCardInfo.create(detailCardRoot, {
//         eventName: "Event Name",
//         thumbnailSrc: "" ,
//         thumbnail: thumbnailEntity,
//         rotationPivot: rotationPivot,
//         titleEntity: eventTitle,
//         dateEntity: eventDate,
//         organizedByEntity: organizedByText,
//         jumpInButton: detailCardRoot,
//         infoButton: detailCardRoot,
//         descriptionEntity: descriptionEntity,
//         detailBlackMask: detailBlackMask,
//         closeButton: closeButton
//     })

//     showDetailCard(detailCardRoot, false, true)
    
    
//     return detailCardRoot
// }

// function addDetailBlackMask(liveCardRoot:Entity):Entity{
//     let detailBlackMask = engine.addEntity()
   
//     Transform.create(detailBlackMask, {
//         position: Vector3.create(0, 0, -0.1),
//         rotation: Quaternion.fromEulerDegrees(0, 0, 0),
//         scale: Vector3.create(BOARD_WIDTH, BOARD_HEIGHT*2, 1 ),
//         parent: liveCardRoot
//     })
//     MeshRenderer.setPlane(detailBlackMask)
//     MeshCollider.setPlane(detailBlackMask)
//     Material.setPbrMaterial(detailBlackMask, {
//         albedoColor: Color4.fromHexString("#000000dd"),
//         castShadows:false,
//         roughness:1,
//         metallic:0,
//         specularIntensity:0,
          
//     })
//     VisibilityComponent.create(detailBlackMask, {visible:false})
//     EventMenuBlackMask.create(detailBlackMask, {
//         fadeFactor:0,
//         endAlpha:0.85,
//         active:false,
//         speed: 3
//     })
//     return detailBlackMask
// }
