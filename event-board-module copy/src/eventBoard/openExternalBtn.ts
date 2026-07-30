import { Entity, engine, Transform, Material, MaterialTransparencyMode, MeshRenderer, MeshCollider, ColliderLayer, VisibilityComponent, pointerEventsSystem, InputAction, Tween, EasingFunction, TweenSequence, GltfContainer, GltfNodeModifiers, Schemas } from "@dcl/sdk/ecs"
import { Vector3, Quaternion } from "@dcl/sdk/math"
import { openExternalUrl } from "~system/RestrictedActions"
import { UI_ATLAS_SRC, UPCOMING_INTERESTED_BUTTON_X_OFFSET, UPCOMING_INTERESTED_BUTTON_Y_OFFSET, modelFolder } from "./config"
import { getAtlasEmptyBackSideUVs, getAtlasPlaneUVs, getAtlasTexture } from "./deps/atlas/atlasTextures"
import { ui3dAtlasData } from "./deps/atlas/uiAtlasData"


export const ExternalButtonInfo = engine.defineComponent('external-button-info-component', {   
    url:Schemas.String    
})

export function addOpenExternalBtn(transformParent: Entity, _event: any, visible: boolean = true): Entity {

    let buttonShadow = engine.addEntity()
    let scaleMultiplier = 1.8
    Transform.create(buttonShadow, {
        position: Vector3.create(UPCOMING_INTERESTED_BUTTON_X_OFFSET, UPCOMING_INTERESTED_BUTTON_Y_OFFSET - 0.002, -0.02),
        rotation: Quaternion.fromEulerDegrees(0, 0, 0),
        scale: Vector3.create(0.12 * scaleMultiplier, 0.12 * scaleMultiplier, 1),
        parent: transformParent
    })
    
    // GltfContainer.create(buttonShadow, {
    //     src: modelFolder + "plane_GLTF.glb",
    //     visibleMeshesCollisionMask: ColliderLayer.CL_POINTER
    // })
    // GltfNodeModifiers.createOrReplace(
    //     buttonShadow,
    //     {
    //         modifiers: [{
    //             path: '',
    //             material: {
    //                 material: {
    //                     $case: 'pbr', pbr: {
    //                         texture: Material.Texture.Common({ src: imgFolder + "open_btn_shadow.png" }),
    //                         transparencyMode: MaterialTransparencyMode.MTM_ALPHA_BLEND,
    //                         roughness: 1,
    //                         metallic: 0,
    //                         specularIntensity: 0,
    //                         castShadows: false
    //                     }
    //                 }
    //             }
    //         }]
    //     }
    // )
    Material.setPbrMaterial(buttonShadow, {
        texture: getAtlasTexture(UI_ATLAS_SRC),
        transparencyMode: MaterialTransparencyMode.MTM_ALPHA_BLEND,
        roughness: 1,
        metallic: 0,
        specularIntensity: 0,
        castShadows: false
        // alphaTexture: getAtlasTexture(UI_ATLAS_SRC),     
    })
    MeshRenderer.setPlane(buttonShadow, getAtlasEmptyBackSideUVs(ui3dAtlasData, "open_btn_shadow.png"))
    MeshCollider.setPlane(buttonShadow, ColliderLayer.CL_POINTER)
    // VisibilityComponent.create(buttonShadow, {
    //         visible: visible
    // })

    // interested button
    let button = engine.addEntity()
    Transform.create(button, {
        position: Vector3.create(UPCOMING_INTERESTED_BUTTON_X_OFFSET, UPCOMING_INTERESTED_BUTTON_Y_OFFSET, -0.05),
        rotation: Quaternion.fromEulerDegrees(0, 0, 0),
        scale: Vector3.create(0.12 * scaleMultiplier, 0.12 * scaleMultiplier, 1),
        parent: transformParent
    })
    MeshRenderer.setPlane(button, getAtlasEmptyBackSideUVs(ui3dAtlasData, "open_btn.png"))

    Material.setBasicMaterial(button, {
        texture: getAtlasTexture(UI_ATLAS_SRC),
        alphaTexture: getAtlasTexture(UI_ATLAS_SRC),
    })

    ExternalButtonInfo.create(button, {
        url: _event.url
    })

    // VisibilityComponent.create(button, {
    //     visible: visible
    // })
    

    pointerEventsSystem.onPointerDown(
        {
            entity: buttonShadow,
            opts: {
                hoverText: 'OPEN IN BROWSER',
                button: InputAction.IA_POINTER,
                showFeedback: true,
                showHighlight: false,
                maxDistance: 32
            }
        },
        (e) => {
            //clickTeleportToEvent(_event)    
            openExternalUrl({ url: ExternalButtonInfo.get(button).url })
            Tween.createOrReplace(button, {
                duration: 200,
                easingFunction: EasingFunction.EF_EASEOUTBACK,
                currentTime: 0,
                playing: true,
                mode: Tween.Mode.Move({
                    start: Vector3.create(UPCOMING_INTERESTED_BUTTON_X_OFFSET, UPCOMING_INTERESTED_BUTTON_Y_OFFSET + 0.01, -0.05),
                    end: Vector3.create(UPCOMING_INTERESTED_BUTTON_X_OFFSET, UPCOMING_INTERESTED_BUTTON_Y_OFFSET, -0.05),
                })
            })
            TweenSequence.createOrReplace(button, {
                sequence: [
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
                ]
            })


        }
    )
    pointerEventsSystem.onPointerHoverEnter(
        {
            entity: buttonShadow,
            opts: {
                hoverText: 'OPEN IN BROWSER',
                button: InputAction.IA_POINTER,
                showFeedback: true,
                showHighlight: false,
                maxDistance: 32
            }
        },
        (e) => {
            //clickTeleportToEvent(_event)   
            Tween.createOrReplace(button, {
                duration: 400,
                easingFunction: EasingFunction.EF_EASEOUTQUAD,
                currentTime: 0,
                playing: true,
                mode: Tween.Mode.Move({
                    start: Vector3.create(UPCOMING_INTERESTED_BUTTON_X_OFFSET, UPCOMING_INTERESTED_BUTTON_Y_OFFSET, -0.03),
                    end: Vector3.create(UPCOMING_INTERESTED_BUTTON_X_OFFSET, UPCOMING_INTERESTED_BUTTON_Y_OFFSET + 0.01, -0.05)
                })
            })
        }
    )
    pointerEventsSystem.onPointerHoverLeave(
        {
            entity: buttonShadow,
            opts: {
                hoverText: 'OPEN IN BROWSER',
                button: InputAction.IA_POINTER,
                showFeedback: true,
                showHighlight: false,
                maxDistance: 32
            }
        },
        (e) => {
            //clickTeleportToEvent(_event)   
            Tween.createOrReplace(button, {
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
    return button
}