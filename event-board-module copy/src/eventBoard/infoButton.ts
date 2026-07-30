import { engine, Entity, InputAction, Material, MaterialTransparencyMode, MeshCollider, MeshRenderer, PointerEvents, pointerEventsSystem, Transform } from "@dcl/sdk/ecs"
import { Quaternion, Vector3 } from "@dcl/sdk/math"
import { JUMP_IN_BUTTON_X_OFFSET, JUMP_IN_BUTTON_Y_OFFSET, UI_ATLAS_SRC, UI_ATLAS_SRC_ALPHA } from "./config"
import { clickTeleportToEvent } from "./boardFunctions"
import { expandDescriptionToggle } from "./liveEventCard"
import { ui3dAtlasData } from "./deps/atlas/uiAtlasData"
import { getAtlasPlaneUVs, getAtlasTexture } from "./deps/atlas/atlasTextures"

export function addInfoButton(eventCardRoot:Entity, transformParent:Entity, _event:any):Entity{

   // let jumpInButtonShadow = engine.addEntity()
    let scaleMultiplier = 1.8
    // Transform.create(jumpInButtonShadow, {
    //     position: Vector3.create(JUMP_IN_BUTTON_X_OFFSET, JUMP_IN_BUTTON_Y_OFFSET, -0.02),
    //     rotation: Quaternion.fromEulerDegrees(0, 0, 0),
    //     scale: Vector3.create(0.3 *scaleMultiplier, 0.11 * scaleMultiplier, 1),
    //     parent: transformParent
    // })
    // MeshRenderer.setPlane(jumpInButtonShadow, getAtlasPlaneUVs(ui3dAtlasData, "jump_in_btn_shadow.png"))
    // Material.setPbrMaterial(jumpInButtonShadow, {
    //     texture: getAtlasTexture(UI_ATLAS_SRC),
    //     transparencyMode: MaterialTransparencyMode.MTM_ALPHA_BLEND,
    //     roughness: 1,
    //     metallic: 0,
    //     specularIntensity: 0,  
    //     castShadows: false     
    //    
    // })

    // info button
    let infoButton = engine.addEntity()
    Transform.create(infoButton, {
        position: Vector3.create(JUMP_IN_BUTTON_X_OFFSET - 0.35, JUMP_IN_BUTTON_Y_OFFSET, -0.03),
        rotation: Quaternion.fromEulerDegrees(0, 0, 0),
        scale:Vector3.create(0.075, 0.075, 1),
        parent: transformParent
    })
    MeshRenderer.setPlane(infoButton, getAtlasPlaneUVs(ui3dAtlasData, "info_btn.png"))
    MeshCollider.setPlane(infoButton)
    Material.setBasicMaterial(infoButton, {
        texture: getAtlasTexture(UI_ATLAS_SRC),             
       alphaTexture: getAtlasTexture(UI_ATLAS_SRC_ALPHA),     
    })
    pointerEventsSystem.onPointerDown(
        {
          entity: infoButton,
          opts: { 
            hoverText: 'DETAILS',
            button: InputAction.IA_POINTER,
            showFeedback: true,
            showHighlight: false,
            maxDistance: 32
          }
        },
        (e) => {          
          console.log("info button clicked")    
          //showDetailCard(detailCard, true)
          expandDescriptionToggle(eventCardRoot)
        }
      )
    return infoButton
}