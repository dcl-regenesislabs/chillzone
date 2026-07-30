import { ColliderLayer, engine, Entity, Material, MeshCollider, MeshRenderer, Schemas, Transform, VisibilityComponent } from "@dcl/sdk/ecs"
import { Color4, Quaternion, Vector3 } from "@dcl/sdk/math"
import { BOARD_HEIGHT, BOARD_WIDTH, CAMERA_TRANSITION_TIME } from "./config"

export const EventMenuBlackMask = engine.defineComponent('event-menu-black-mask-component', {   
    delayTime:Schemas.Number,
    fadeFactor:Schemas.Number,
    endAlpha:Schemas.Number,
    active:Schemas.Boolean,
    speed:Schemas.Number,
})

export function addBlackMask(cardRoot:Entity):Entity{
    let blackMask = engine.addEntity()
   
    Transform.create(blackMask, {
        position: Vector3.create(0, 0, 1),
        rotation: Quaternion.fromEulerDegrees(0, 0, 0),
        //scale: Vector3.create(BOARD_WIDTH, BOARD_HEIGHT*2, 1 ),
        scale: Vector3.create(0.001,0.001,1),
        parent: cardRoot
    })
    MeshRenderer.setPlane(blackMask)
    MeshCollider.setPlane(blackMask, ColliderLayer.CL_NONE)
    Material.setPbrMaterial(blackMask, {
        albedoColor: Color4.fromHexString("#000000dd"),
        castShadows:false,
        roughness:1,
        metallic:0,
        specularIntensity:0,
          
    })
    VisibilityComponent.create(blackMask, {visible:false})
    EventMenuBlackMask.create(blackMask, {
        fadeFactor:0,
        endAlpha:0.85,
        active:false,
        speed: 6
    })
   
    return blackMask
  }
  
  export function startDetailMaskFade(mask:Entity, withDelay:boolean = false){  
    Transform.getMutable(mask).scale = Vector3.create(BOARD_WIDTH, BOARD_HEIGHT*2, 1 )
    EventMenuBlackMask.getMutable(mask).active = true
    EventMenuBlackMask.getMutable(mask).fadeFactor = 0
    EventMenuBlackMask.getMutable(mask).delayTime = withDelay ? 0 : CAMERA_TRANSITION_TIME
    VisibilityComponent.getMutable(mask).visible = true
    MeshCollider.getMutable(mask).collisionMask = ColliderLayer.CL_POINTER 
  }

  export function maskFadeSystem(dt:number){
    let blackMaskGroup = engine.getEntitiesWith(EventMenuBlackMask)
    for(let [maskEntity] of blackMaskGroup){
        let mask = EventMenuBlackMask.get(maskEntity)
        if(mask.active){
            const fadeInfo = EventMenuBlackMask.getMutable(maskEntity)
            fadeInfo.delayTime += dt

            if(fadeInfo.delayTime >= CAMERA_TRANSITION_TIME*0.8){
            fadeInfo.fadeFactor += dt * fadeInfo.speed
            if(fadeInfo.fadeFactor >= fadeInfo.endAlpha){
                fadeInfo.active = false
                fadeInfo.delayTime = 0
                fadeInfo.fadeFactor = fadeInfo.endAlpha
            }
                
            }

            Material.setPbrMaterial(maskEntity, {
                albedoColor: Color4.fromArray([0, 0, 0, fadeInfo.fadeFactor]),
                castShadows:false,
                roughness:1,
                metallic:0,
                specularIntensity:0
                  
            })
        }
    }
}
