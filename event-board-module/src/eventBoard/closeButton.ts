import { ColliderLayer, EasingFunction, engine, Entity, GltfContainer, GltfNodeModifiers, InputAction, Material, pointerEventsSystem, Transform, VisibilityComponent } from "@dcl/sdk/ecs";
import { Quaternion, Vector3 } from "@dcl/sdk/math";
import { imgFolder, modelFolder } from "./config";
import { scaleTween } from "./boardFunctions";

export function addCloseButton(rootParent:Entity, position:Vector3, scale:Vector3, callback:() => void):Entity{

    let closeButton = engine.addEntity()
    Transform.create(closeButton, {
        position: Vector3.create(position.x, position.y, position.z),
        rotation: Quaternion.fromEulerDegrees(0, 0, 0),
        scale: Vector3.create(scale.x, scale.y, 1),
        parent: rootParent
    })
    GltfContainer.create(closeButton, { src: modelFolder + "close_button.glb", invisibleMeshesCollisionMask: ColliderLayer.CL_POINTER})
    GltfNodeModifiers.create(
        closeButton,
        {
          modifiers: [{
            path: '',
            material: {
              material: {
                $case: 'unlit', unlit: {
                  texture: Material.Texture.Common({src: imgFolder + "button_atlas.png"}),  
                }
              }
            }
          }]
        }
      )
      VisibilityComponent.create(closeButton, {visible:true})
    pointerEventsSystem.onPointerDown(
        {
          entity: closeButton,
          opts: { 
            hoverText: 'CLOSE',
            button: InputAction.IA_POINTER,
            showFeedback: true,
            showHighlight: false,
            maxDistance: 32
          }
        },
        (e) => {          
            callback()
        
        }
      )
      pointerEventsSystem.onPointerHoverEnter(
        {
          entity: closeButton,
          opts: { 
            hoverText: 'CLOSE',
            button: InputAction.IA_POINTER,
            showFeedback: true,
            showHighlight: false,
            maxDistance: 32
          }
        },
        (e) => {          
            scaleTween(closeButton, Vector3.create(scale.x, scale.y, 1), Vector3.create(scale.x*1.2, scale.y*1.2, 1), EasingFunction.EF_EASEOUTCIRC)
          }
      )
      pointerEventsSystem.onPointerHoverLeave(
        {
          entity: closeButton,
          opts: { 
            hoverText: 'CLOSE',
            button: InputAction.IA_POINTER,
            showFeedback: true,
            showHighlight: false,
            maxDistance: 32
          }
        },
        (e) => {          
            scaleTween(closeButton, Vector3.create(scale.x*1.2, scale.y*1.2, 1), Vector3.create(scale.x, scale.y, 1), EasingFunction.EF_EASEOUTELASTIC, 400)
          }
      )
      return closeButton
}