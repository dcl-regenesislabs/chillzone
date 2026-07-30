import { EasingFunction, engine, Entity, InputAction, Material, MaterialTransparencyMode, MeshCollider, MeshRenderer, PointerEvents, pointerEventsSystem, Schemas, Transform, Tween, TweenLoop, TweenSequence } from "@dcl/sdk/ecs"
import { Quaternion, Vector3 } from "@dcl/sdk/math"
import { JUMP_IN_BUTTON_X_OFFSET, JUMP_IN_BUTTON_Y_OFFSET, UI_ATLAS_SRC, UI_ATLAS_SRC_ALPHA } from "./config"
import { clickTeleportToEvent } from "./boardFunctions"
import { addSpriteEffect, playSpriteEffect } from "./deps/spriteAnimator"
import { timeout } from "./deps/animUtils"
import { ui3dAtlasData } from "./deps/atlas/uiAtlasData"
import { getAtlasPlaneUVs, getAtlasTexture } from "./deps/atlas/atlasTextures"

export const AnimatedButton = engine.defineComponent('anim-button-component', {
  wasPressed:Schemas.Boolean,
})

export const JumpButtonInfo = engine.defineComponent('jump-button-info-component', {
    coordinateX: Schemas.String,
    coordinateZ: Schemas.String,
    world: Schemas.Boolean,
    server: Schemas.String,
})

export function updateJumpInButton(shadow: Entity, newData: JumpData) {
    const info = JumpButtonInfo.getMutable(shadow)
    info.coordinateX = newData.coordinates[0]
    info.coordinateZ = newData.coordinates[1]
    info.world = newData.world
    info.server = newData.server ?? ""
}


export interface JumpData {
    server?: string,
    coordinates: [string, string],
    world: boolean
}

export function addJumpInButton(transformParent:Entity, _event:JumpData):Entity{

   let jumpInButtonShadow = engine.addEntity()
    let scaleMultiplier = 1.5
    Transform.create(jumpInButtonShadow, {
        position: Vector3.create(JUMP_IN_BUTTON_X_OFFSET, JUMP_IN_BUTTON_Y_OFFSET, -0.02),
        rotation: Quaternion.fromEulerDegrees(0, 0, 0),
        scale: Vector3.create(0.3 *scaleMultiplier, 0.11 * scaleMultiplier, 1),
        parent: transformParent
    })
    MeshRenderer.setPlane(jumpInButtonShadow, getAtlasPlaneUVs(ui3dAtlasData, "jump_in_btn_shadow.png"))
    MeshCollider.setPlane(jumpInButtonShadow)
    Material.setPbrMaterial(jumpInButtonShadow, {
        texture: getAtlasTexture(UI_ATLAS_SRC),
        transparencyMode: MaterialTransparencyMode.MTM_ALPHA_BLEND,
        roughness: 1,
        metallic: 0,
        specularIntensity: 0,  
        castShadows: false     
       // alphaTexture: getAtlasTexture(UI_ATLAS_SRC),     
    })

    AnimatedButton.create(jumpInButtonShadow, {
      wasPressed: false,
    })
    JumpButtonInfo.create(jumpInButtonShadow, {
      coordinateX: _event.coordinates[0],
      coordinateZ: _event.coordinates[1],
      world: _event.world,
      server: _event.server ?? "",
    })

    // jump in button
    let jumpInButton = engine.addEntity()
    Transform.create(jumpInButton, {
        position: Vector3.create(JUMP_IN_BUTTON_X_OFFSET, JUMP_IN_BUTTON_Y_OFFSET, -0.03),
        rotation: Quaternion.fromEulerDegrees(0, 0, 0),
        scale:Vector3.create(0.3 *scaleMultiplier, 0.12 * scaleMultiplier, 1),
        parent: transformParent
    })
    MeshRenderer.setPlane(jumpInButton, getAtlasPlaneUVs(ui3dAtlasData, "jump_in_btn.png"))
    
    Material.setBasicMaterial(jumpInButton, {
        texture: getAtlasTexture(UI_ATLAS_SRC),             
       alphaTexture: getAtlasTexture(UI_ATLAS_SRC),     
    })

    let sprite = addSpriteEffect(
      "images/events-board/spritesheetJumpin3.png",
      3,
      13,
      Vector3.create(0,0.05, -0.03), 
      0.4,
      0, 
      false)
    let spriteTransform = Transform.getMutable(sprite)
    spriteTransform.parent = jumpInButton
    spriteTransform.scale = Vector3.create(0.7, 0.4, 1)
    playSpriteEffect(sprite, 0, 0, 30, true)  

    pointerEventsSystem.onPointerDown(
        {
          entity: jumpInButtonShadow,
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
          Tween.createOrReplace(jumpInButton, {
            duration: 200,
            easingFunction: EasingFunction.EF_EASEOUTBACK,
            currentTime: 0,
            playing: true,
            mode: Tween.Mode.Move({
              start: Vector3.create(JUMP_IN_BUTTON_X_OFFSET, JUMP_IN_BUTTON_Y_OFFSET + 0.01, -0.05),
              end: Vector3.create(JUMP_IN_BUTTON_X_OFFSET, JUMP_IN_BUTTON_Y_OFFSET, -0.05),
            })
          })     
          TweenSequence.createOrReplace(jumpInButton, {
            sequence:[
            {
              duration: 200,
              easingFunction: EasingFunction.EF_EASEOUTBACK,
              currentTime: 0,
              playing: true,
              mode: Tween.Mode.Move({
                start: Vector3.create(JUMP_IN_BUTTON_X_OFFSET, JUMP_IN_BUTTON_Y_OFFSET, -0.05),
                end: Vector3.create(JUMP_IN_BUTTON_X_OFFSET, JUMP_IN_BUTTON_Y_OFFSET + 0.01, -0.05)
              })
            }
          ]})

          playSpriteEffect(sprite, 22, 38, 30, false)
          if(!AnimatedButton.get(jumpInButtonShadow).wasPressed){
            AnimatedButton.getMutable(jumpInButtonShadow).wasPressed = true
            timeout(700, () => {
              const jumpInfo = JumpButtonInfo.get(jumpInButtonShadow)
              clickTeleportToEvent({ coordinates: [jumpInfo.coordinateX, jumpInfo.coordinateZ], world: jumpInfo.world, server: jumpInfo.server })
              AnimatedButton.getMutable(jumpInButtonShadow).wasPressed = false
            })
          }
        }
      )
    pointerEventsSystem.onPointerHoverEnter(
        {
          entity: jumpInButtonShadow,
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
          Tween.createOrReplace(jumpInButton, {
            duration: 400,
            easingFunction: EasingFunction.EF_EASEOUTQUAD,
            currentTime: 0,
            playing: true,
            mode: Tween.Mode.Move({
              start:Vector3.create(JUMP_IN_BUTTON_X_OFFSET, JUMP_IN_BUTTON_Y_OFFSET, -0.03),
              end:Vector3.create(JUMP_IN_BUTTON_X_OFFSET, JUMP_IN_BUTTON_Y_OFFSET + 0.01, -0.05)
            })
          }) 
          playSpriteEffect(sprite, 1, 7, 30, false)
        }
      )
    pointerEventsSystem.onPointerHoverLeave(
        {
          entity: jumpInButtonShadow,
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
          Tween.createOrReplace(jumpInButton, {
            duration: 300,
            easingFunction: EasingFunction.EF_EASEOUTQUAD,
            currentTime: 0,
            playing: true,
            mode: Tween.Mode.Move({
              start: Vector3.create(JUMP_IN_BUTTON_X_OFFSET, JUMP_IN_BUTTON_Y_OFFSET + 0.01, -0.05),
              end: Vector3.create(JUMP_IN_BUTTON_X_OFFSET, JUMP_IN_BUTTON_Y_OFFSET, -0.03),
            })
          })     
          playSpriteEffect(sprite, 0, 0, 30, true)      
        }
      )
    return jumpInButtonShadow
}