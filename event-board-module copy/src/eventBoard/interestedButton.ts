import { ColliderLayer, EasingFunction, engine, Entity, InputAction, Material, MaterialTransparencyMode, MeshCollider, MeshRenderer, pointerEventsSystem, Transform, Tween, TweenSequence, VisibilityComponent } from "@dcl/sdk/ecs"
import { Quaternion, Vector3 } from "@dcl/sdk/math"
import { UI_ATLAS_SRC, UI_ATLAS_SRC_ALPHA, UPCOMING_INTERESTED_BUTTON_X_OFFSET, UPCOMING_INTERESTED_BUTTON_Y_OFFSET } from "./config"
import { ui3dAtlasData } from "./deps/atlas/uiAtlasData"
import { getAtlasPlaneUVs, getAtlasTexture } from "./deps/atlas/atlasTextures"

export function addInterestedButton(eventCardRoot:Entity, transformParent:Entity, _event:any, visible:boolean = true):Entity{

   let interestedButtonShadow = engine.addEntity()
    let scaleMultiplier = 1.8
    Transform.create(interestedButtonShadow, {
        // position: Vector3.create(UPCOMING_INTERESTED_BUTTON_X_OFFSET, UPCOMING_INTERESTED_BUTTON_Y_OFFSET + 0.015, -0.02),
        position: Vector3.create(UPCOMING_INTERESTED_BUTTON_X_OFFSET, UPCOMING_INTERESTED_BUTTON_Y_OFFSET, -0.02),
        rotation: Quaternion.fromEulerDegrees(0, 0, 0),
        // scale: Vector3.create(0.3 *scaleMultiplier, 0.12 * scaleMultiplier, 1),
        scale: Vector3.create(0.3 *scaleMultiplier, 0.12 * scaleMultiplier, 1),
        parent: transformParent
    })
    // GltfContainer.create(interestedButtonShadow, {
    //     src: modelFolder + "plane_GLTF.glb",
    //     visibleMeshesCollisionMask: ColliderLayer.CL_POINTER
    // })
    // GltfNodeModifiers.createOrReplace(
    //   interestedButtonShadow,
    //   {
    //     modifiers: [{
    //       path: '',
    //       material: {
    //         material: {
    //           $case: 'pbr', pbr: {
    //             texture: Material.Texture.Common({src: imgFolder + "jump_in_btn_shadow.png"}),
    //             transparencyMode: MaterialTransparencyMode.MTM_ALPHA_BLEND,
    //             roughness: 1,
    //             metallic: 0,
    //             specularIntensity: 0,  
    //             castShadows: false    
    //           }
    //         }
    //       }
    //     }]
    //   }
    // )
    MeshRenderer.setPlane(interestedButtonShadow, getAtlasPlaneUVs(ui3dAtlasData, "jump_in_btn_shadow.png"))
    Material.setPbrMaterial(interestedButtonShadow, {
        texture: getAtlasTexture(UI_ATLAS_SRC),
        transparencyMode: MaterialTransparencyMode.MTM_ALPHA_BLEND,
        roughness: 1,
        metallic: 0,
        specularIntensity: 0,  
        castShadows: false     
       // alphaTexture: getAtlasTexture(UI_ATLAS_SRC_ALPHA),     
    })
    MeshCollider.setPlane(interestedButtonShadow, ColliderLayer.CL_POINTER)

    // interested button
    let interestedButton = engine.addEntity()
    Transform.create(interestedButton, {
        position: Vector3.create(UPCOMING_INTERESTED_BUTTON_X_OFFSET, UPCOMING_INTERESTED_BUTTON_Y_OFFSET, -0.05),
        rotation: Quaternion.fromEulerDegrees(0, 0, 0),
        scale:Vector3.create(0.3 *scaleMultiplier, 0.12 * scaleMultiplier, 1),
        parent: transformParent
    })
    MeshRenderer.setPlane(interestedButton, getAtlasPlaneUVs(ui3dAtlasData, "interested_btn.png"))
    
    Material.setBasicMaterial(interestedButton, {
        texture: getAtlasTexture(UI_ATLAS_SRC),             
       alphaTexture: getAtlasTexture(UI_ATLAS_SRC_ALPHA),     
    })   

    VisibilityComponent.create(interestedButton, {
        visible: visible
    })
    pointerEventsSystem.onPointerDown(
        {
          entity: interestedButtonShadow,
          opts: { 
            hoverText: 'SIGN UP',
            button: InputAction.IA_POINTER,
            showFeedback: false,
            showHighlight: false,
            maxDistance: 32
          }
        },
        (e) => {          
          //clickTeleportToEvent(_event)    
          Tween.createOrReplace(interestedButton, {
            duration: 200,
            easingFunction: EasingFunction.EF_EASEOUTBACK,
            currentTime: 0,
            playing: true,
            mode: Tween.Mode.Move({
              start: Vector3.create(UPCOMING_INTERESTED_BUTTON_X_OFFSET, UPCOMING_INTERESTED_BUTTON_Y_OFFSET + 0.01, -0.05),
              end: Vector3.create(UPCOMING_INTERESTED_BUTTON_X_OFFSET, UPCOMING_INTERESTED_BUTTON_Y_OFFSET, -0.05),
            })
          })     
          TweenSequence.createOrReplace(interestedButton, {
            sequence:[
            {
              duration: 200,
              easingFunction: EasingFunction.EF_EASEOUTBACK,
              currentTime: 0,
              playing: true,
              mode: Tween.Mode.Move({
                start: Vector3.create(UPCOMING_INTERESTED_BUTTON_X_OFFSET, UPCOMING_INTERESTED_BUTTON_Y_OFFSET, -0.05),
                end: Vector3.create(UPCOMING_INTERESTED_BUTTON_X_OFFSET, UPCOMING_INTERESTED_BUTTON_Y_OFFSET + 0.01, -0.05)
              })
            }
          ]})

        
        }
      )
    pointerEventsSystem.onPointerHoverEnter(
        {
          entity: interestedButtonShadow,
          opts: { 
            hoverText: 'JUMP IN',
            button: InputAction.IA_POINTER,
            showFeedback: false,
            showHighlight: false,
            maxDistance: 32
          }
        },
        (e) => {          
          //clickTeleportToEvent(_event)   
          Tween.createOrReplace(interestedButton, {
            duration: 400,
            easingFunction: EasingFunction.EF_EASEOUTQUAD,
            currentTime: 0,
            playing: true,
            mode: Tween.Mode.Move({
              start:Vector3.create(UPCOMING_INTERESTED_BUTTON_X_OFFSET, UPCOMING_INTERESTED_BUTTON_Y_OFFSET, -0.03),
              end:Vector3.create(UPCOMING_INTERESTED_BUTTON_X_OFFSET, UPCOMING_INTERESTED_BUTTON_Y_OFFSET + 0.01, -0.05)
            })
          })          
        }
      )
    pointerEventsSystem.onPointerHoverLeave(
        {
          entity: interestedButtonShadow,
          opts: { 
            hoverText: 'SIGN UP',
            button: InputAction.IA_POINTER,
            showFeedback: false,
            showHighlight: false,
            maxDistance: 32
          }
        },
        (e) => {          
          //clickTeleportToEvent(_event)   
          Tween.createOrReplace(interestedButton, {
            duration: 300,
            easingFunction: EasingFunction.EF_EASEOUTQUAD,
            currentTime: 0,
            playing: true,
            mode: Tween.Mode.Move({
              start: Vector3.create(UPCOMING_INTERESTED_BUTTON_X_OFFSET, UPCOMING_INTERESTED_BUTTON_Y_OFFSET + 0.01, -0.05),
              end: Vector3.create(UPCOMING_INTERESTED_BUTTON_X_OFFSET, UPCOMING_INTERESTED_BUTTON_Y_OFFSET, -0.03),
            })
          })     
           
        }
      )
    return interestedButton
}