import {  EasingFunction, engine, Entity, GltfContainer, InputAction, InputModifier, inputSystem, MainCamera, PointerEventType, Schemas, Transform, Tween, VirtualCamera } from "@dcl/sdk/ecs";
import { Color4, Quaternion, Vector3 } from "@dcl/sdk/math";
import { hideCinematicButton, hideWideScreen, showCinematicButton, showWideScreen } from "./cinematicUI";
import { ANIMATION_TYPE, CAMERA_TYPE, cameraAnimations, CameraData, cameras,  } from "./cameraConfig";
import { getSceneRoot } from "./sceneRoot";


const cameraPos =  Vector3.create(8, 20, 0)
export var cameraManager: Entity

export const MultiCameraManager = engine.defineComponent('MultiCameraManagerComponent', { 
    cameraSwitchEnabled: Schemas.Boolean,
    cameraActive: Schemas.Boolean,
    animActive: Schemas.Boolean,
    activeCam: Schemas.Number,
    animFactor: Schemas.Number,
    zoomTarget: Schemas.Number,
    currentAnimType: Schemas.EnumNumber<ANIMATION_TYPE>(ANIMATION_TYPE, ANIMATION_TYPE.NONE),
    switchTime: Schemas.Number,
    switchInterval:Schemas.Number,    
    _nextAnimationIndexes: Schemas.Array(Schemas.EnumNumber<ANIMATION_TYPE>(ANIMATION_TYPE, ANIMATION_TYPE.NONE)),
    cameras: Schemas.Array(Schemas.Entity),
    currentCameraRef: Schemas.Entity   

})

export const CamData = engine.defineComponent('CamDataComponent', { 
    types: Schemas.Array(Schemas.EnumNumber<CAMERA_TYPE>(CAMERA_TYPE, CAMERA_TYPE.CENTER_TARGET)),
    fov: Schemas.Number,
    originalPosition: Schemas.Vector3,
    targetVerticalOffset: Schemas.Number,
    avatarAttached: Schemas.Boolean,
    rotation: Schemas.Quaternion
})

export const CameraTarget = engine.defineComponent('CameraTargetComponent', { 
    startPos: Schemas.Vector3,
    endPos: Schemas.Vector3,
    factor: Schemas.Number,
    duration: Schemas.Number,
    wobble: Schemas.Boolean
})

export const ModelTracker = engine.defineComponent('ModelTrackerComponent', {    
    model: Schemas.Entity,
    defaultCenterTarget: Schemas.Entity
})

export let sceneCenterTarget:Entity = engine.addEntity()
Transform.create(sceneCenterTarget, {
    position: Vector3.create(8, 1, 8),
    scale: Vector3.create(1,1,1)
})

export let modelTracker:Entity = engine.addEntity()
Transform.create(modelTracker, {
    position: Vector3.create(0, 0, 0),
    scale: Vector3.create(1,1,1)
})
ModelTracker.create(modelTracker, {
    model: engine.PlayerEntity,
    defaultCenterTarget: sceneCenterTarget
})

export let cameraTarget:Entity = engine.addEntity()
Transform.create(cameraTarget, {
    position: Vector3.create(0, 1, 0),
    scale: Vector3.create(1,1,1),
    
})

export let cameraWobbleTarget:Entity = engine.addEntity()
Transform.create(cameraWobbleTarget, {
    position: Vector3.create(0, 1, 0),
    scale: Vector3.create(1,1,1),
    //parent: modelTracker
})

CameraTarget.create(cameraWobbleTarget, {
    wobble: true,
    startPos: Vector3.create(0, 0, 0),
    endPos: Vector3.create(0, 0, 0),
    factor: 0,
    duration: 0
})

export function setCameraFollowTarget(entity:Entity){
    ModelTracker.getMutable(modelTracker).model = entity
    Transform.getMutable(cameraTarget).parent = entity
    Transform.getMutable(cameraWobbleTarget).parent = entity
}

function wobbleCamera(){
    let amplitude = 0.15

    let cameraTargetInfo = CameraTarget.getMutable(cameraWobbleTarget)
   
    cameraTargetInfo.factor = 0
    cameraTargetInfo.duration = 0.2 + Math.random()
    cameraTargetInfo.wobble = true
    cameraTargetInfo.startPos = Transform.get(cameraWobbleTarget).position
    cameraTargetInfo.endPos = Vector3.create((Math.random() * (2*amplitude)) - amplitude, (Math.random() * (2*amplitude)) - amplitude, (Math.random() * (2*amplitude)) - amplitude)
}

export function lockPlayer(){     
 
    
    InputModifier.createOrReplace(engine.PlayerEntity, {
        mode: {
            $case: 'standard',
            standard: {
                disableJog: true,
                disableJump: true,
                disableRun: true,
                disableWalk: true
            },
        },
    })
    
}

export function unlockPlayer(){      
   
    // movePlayerTo({
    //     newRelativePosition: spectatorPos,        
    // })
    InputModifier.createOrReplace(engine.PlayerEntity, {
        mode: {
            $case: 'standard',
            standard: {
                disableAll: false,
                
            },
        },
    })
}


export function centerCameraTarget(){
   
    setCameraFollowTarget(ModelTracker.get(modelTracker).defaultCenterTarget)
}

export function disableCameraSwitch(){
    MultiCameraManager.getMutable(cameraManager).cameraSwitchEnabled = false
}

export function enableCameraSwitch(){
    MultiCameraManager.getMutable(cameraManager).cameraSwitchEnabled = true
}

export function addCamera(cameraData:CameraData, transitionTime:number = 0):Entity{
    
    if(!cameraManager){
        
        // console.log('Camera manager not found')
        initCamera()
    }
    let cameraEntity = engine.addEntity()

    let rotation = cameraData.rotation
    if(cameraData.importedRotation){
        rotation = Quaternion.multiply(Quaternion.fromEulerDegrees(-90,0,0),Quaternion.multiply(Quaternion.fromEulerDegrees(0,180,0),cameraData.rotation))
    }

    Transform.create(cameraEntity, {
        position:Vector3.add(Vector3.negate(Transform.get(getSceneRoot()).position), cameraData.position), 
        rotation: rotation,
        parent: getSceneRoot()
    })    
    
    if(cameraData.lookAtTarget){
        VirtualCamera.create(cameraEntity,  { 
            lookAtEntity: cameraTarget,
            // fov: cameraData.fov,
            defaultTransition: { transitionMode: VirtualCamera.Transition.Time(transitionTime) },
        })
    }
    else{
        VirtualCamera.create(cameraEntity,  { 
            //lookAtEntity: cameraTarget,
            // fov: cameraData.fov,
            defaultTransition: { transitionMode: VirtualCamera.Transition.Time(transitionTime) },
        })
    }
    
    CamData.create(cameraEntity, {
        types: cameraData.types,
        fov: cameraData.fov,
        originalPosition: cameraData.position,
        targetVerticalOffset: cameraData.targetVerticalOffset,
        avatarAttached: cameraData.avatarAttached,
        rotation: cameraData.rotation
    })

    MultiCameraManager.getMutable(cameraManager).cameras.push(cameraEntity)

    return cameraEntity
}

export function initCamera() {
    console.log('Camera initializing')
    try {

        if(!cameraManager) {           

            cameraManager = engine.addEntity()
            Transform.create(cameraManager, {
                position: Vector3.create(cameraPos.x, cameraPos.y, cameraPos.z),
                rotation: Quaternion.fromEulerDegrees(0,0,0)
            })

            let cameraEntities:Entity[] = []

            // for(let i = 0; i < cameras.length; i++){
                let cameraData = cameras[0]
                let cameraEntity = engine.addEntity()
                Transform.create(cameraEntity, {
                    position: cameraData.position,                                   
                })
                VirtualCamera.create(cameraEntity,  { 
                    lookAtEntity: cameraTarget,
                    // fov: cameraData.fov,
                    defaultTransition: { transitionMode: VirtualCamera.Transition.Time(0) },
                })
                CamData.create(cameraEntity, {
                    types: cameraData.types,
                    fov: cameraData.fov,
                    originalPosition: cameraData.position,
                    targetVerticalOffset: cameraData.targetVerticalOffset,
                    avatarAttached: cameraData.avatarAttached,
                    rotation: cameraData.rotation
                })
                cameraEntities.push(cameraEntity)
            // }

            VirtualCamera.create(cameraManager,  {
                lookAtEntity: cameraTarget,
                // fov: 60,
                defaultTransition: { transitionMode: VirtualCamera.Transition.Time(2),
            
                 },
            })
            MultiCameraManager.create(cameraManager,{
                cameraSwitchEnabled: false,
                animActive: false,
                activeCam : 0,
                animFactor: 0,
                zoomTarget: 0,
                cameraActive: false,
                cameras: cameraEntities,
                currentCameraRef: cameraEntities[0]

            })

            setCameraFollowTarget(engine.PlayerEntity)

            engine.addSystem(CameraFollowSystem)  
            //createCameraTriggerArea(true)

            // engine.addSystem((dt:number)=>{
            //     if (
            //         inputSystem.isTriggered(InputAction.IA_PRIMARY, PointerEventType.PET_DOWN)
            //     ) {

            //        //console.log("TOGGLE CINEMATIC CAMERA") 
            //       exitCinematicMode()
            //      // toggleCinematicMode()         
            
            //     }               
            //     if (
            //         inputSystem.isTriggered(InputAction.IA_SECONDARY, PointerEventType.PET_DOWN)
            //     ) {

            //        console.log("CUT TO NEXT CAMERA") 
                  
            //        setNextCameraWithType(CAMERA_TYPE.CENTER_TARGET, true)        
            
            //     }               
            //     if (inputSystem.isTriggered(InputAction.IA_ACTION_3, PointerEventType.PET_DOWN)) {             
            //         startCameraAnimation(ANIMATION_TYPE.DOLLY_IN)     
                     
            
            //     } 
            //     if (inputSystem.isTriggered(InputAction.IA_ACTION_4, PointerEventType.PET_DOWN)) {          
            //         startCameraAnimation(ANIMATION_TYPE.DOLLY_OUT)    
                     
            
            //     } 
            //     if (inputSystem.isTriggered(InputAction.IA_ACTION_5, PointerEventType.PET_DOWN)) {          
            //        startCameraAnimation(ANIMATION_TYPE.CRANE_DOWN)      
                     
            //     } 
            //     if (inputSystem.isTriggered(InputAction.IA_ACTION_6, PointerEventType.PET_DOWN)) {          
            //        startCameraAnimation(ANIMATION_TYPE.MOVE_ALONG_RUNWAY_OPPOSITE)      
                     
            //     } 
            // })

        }
    } catch (error) {
        console.error(error); 
    }
}

export function enterCinematicMode(camera:Entity){  
    //if(  MultiCameraManager.get(cameraManager).cameraSwitchEnabled){
        //lockPlayer()
       // blockCamera()
        useVirtualCamera(camera)
        showWideScreen()     
        showCinematicButton()   
   // }
}

export function exitCinematicMode(){
    freeCamera()
    unlockPlayer()
    hideWideScreen()   
    hideCinematicButton()
}



export function useVirtualCamera(camera:Entity) {
    try {

        MainCamera.createOrReplace(engine.CameraEntity, {
            virtualCameraEntity: camera,
        })
        MultiCameraManager.getMutable(cameraManager).cameraActive = true
        
    } catch (error) {
        console.error(error); 
    }
}
// export function blockCamera() {
//     try {

//        // let cam = getRandomCameraWithType(CAMERA_TYPE.CENTER_TARGET)
//         MainCamera.createOrReplace(engine.CameraEntity, {
//             virtualCameraEntity: cam,
//         })
//         MultiCameraManager.getMutable(cameraManager).cameraActive = true
        
//     } catch (error) {
//         console.error(error); 
//     }
// }
export function freeCamera() {
    try {
       // setCameraFollowTarget(engine.PlayerEntity)
        MainCamera.getMutable(engine.CameraEntity).virtualCameraEntity = undefined
        MultiCameraManager.getMutable(cameraManager).cameraActive = false
    } catch (error) {
        console.error(error); 
    }
}


export function CameraFollowSystem(dt:number){
    let camInfo = MultiCameraManager.get(cameraManager)       
    let wobbleTargetInfo = CameraTarget.getMutable(cameraWobbleTarget)   
    let camData = CamData.get(camInfo.currentCameraRef)  
    
    // wobble camera
    if(wobbleTargetInfo.wobble && !camData.avatarAttached){
        if(wobbleTargetInfo.factor < wobbleTargetInfo.duration){
            wobbleTargetInfo.factor += dt / wobbleTargetInfo.duration
            const t = wobbleTargetInfo.factor
            const smoothT = t * t * (3 - 2 * t) // Smoothstep interpolation
            Transform.getMutable(cameraWobbleTarget).position = Vector3.lerp(wobbleTargetInfo.startPos, wobbleTargetInfo.endPos, smoothT)
        }
        else{
            wobbleCamera()
        }
        let wobbleTransform = Transform.get(cameraWobbleTarget)
        let wobblePos = Vector3.create(wobbleTransform.position.x, wobbleTransform.position.y+camData.targetVerticalOffset, wobbleTransform.position.z)

        const targetTransform = Transform.getMutable(cameraTarget)
        targetTransform.position =  Vector3.lerp(targetTransform.position, wobblePos, 0.1)

    }    

    const trackerTransform = Transform.getMutable(modelTracker)
    const trackerPos = Transform.get(ModelTracker.get(modelTracker).model).position

    trackerTransform.position = Vector3.create(trackerPos.x, trackerPos.y + 2, trackerPos.z)

}

export function getDefaultCamera():Entity{
    let camInfo = MultiCameraManager.getMutable(cameraManager)
    return camInfo.currentCameraRef
}

// export function getRandomCameraWithType(type:CAMERA_TYPE):Entity{
//     let camInfo = MultiCameraManager.getMutable(cameraManager)
//     let camArray = shuffleEntities(camInfo.cameras)
//     for(let i = 0; i < camArray.length; i++){
//         if(CamData.get(camArray[i]).types.includes(type)){
//             camInfo.currentCameraRef = camArray[i]           
//             return camArray[i]
//         }
//     }
//     return camArray[0]
// }

// export function setNextCameraWithType(type:CAMERA_TYPE, animated:boolean = true){   


//     console.log('1 - setting next camera with type', type.toString())
//     let camInfo = MultiCameraManager.get(cameraManager)

//     if(camInfo.cameraActive){

//         let cam = getRandomCameraWithType(type)
//         let camData = CamData.get(cam)
//         let camStartingPos = camData.originalPosition
      
//         let camTransform = Transform.getMutable(cam)
//         Vector3.copyFrom(camStartingPos, camTransform.position) 

//         let wobbleTransform = Transform.get(cameraWobbleTarget)
//         let wobblePos = Vector3.create(wobbleTransform.position.x, wobbleTransform.position.y + camData.targetVerticalOffset, wobbleTransform.position.z)

//         const targetTransform = Transform.getMutable(cameraTarget)
//         Vector3.copyFrom (wobblePos, targetTransform.position)
        
//         MainCamera.createOrReplace(engine.CameraEntity, {
//             virtualCameraEntity: cam,
//         })

//         // if(animated && !camData.avatarAttached){
//         //     let newAnimState = getRandomState()
//         //     while(newAnimState == ANIMATION_TYPE.MOVE_WITH_AVATAR){
//         //         newAnimState = getRandomState()
//         //     }
//         //     startCameraAnimation(newAnimState)
//         // }
//         // else if(camData.avatarAttached){
//         //     startCameraAnimation(ANIMATION_TYPE.MOVE_WITH_AVATAR)
//         // }
//         // else{
//         //     startCameraAnimation(ANIMATION_TYPE.NONE)
//         // }   
//     }

// }



export function startCameraAnimation(animationType: ANIMATION_TYPE){    

    let camFollowInfo = MultiCameraManager.getMutable(cameraManager)
    camFollowInfo.animActive = true
    camFollowInfo.zoomTarget = 0.4   
    const trackerTransform = Transform.getMutable(modelTracker)
    const trackerPos = Transform.get(ModelTracker.get(modelTracker).model).position

    const camData = CamData.get(camFollowInfo.currentCameraRef)
    let camPos = camData.originalPosition                           
    let camVerticalOffset = camData.targetVerticalOffset

    trackerTransform.position = Vector3.create(trackerPos.x, trackerPos.y + camVerticalOffset, trackerPos.z)
    let pos2 = Vector3.lerp(camPos,  Vector3.add(trackerTransform.position, Vector3.create(0,camVerticalOffset,0)), camFollowInfo.zoomTarget)

    let activeCamPos = camPos

    let duration = 1
    let startPos = activeCamPos
    let endPos = Vector3.create(activeCamPos.x, activeCamPos.y, activeCamPos.z + 0.05)
    let easing = EasingFunction.EF_EASECUBIC


    switch(animationType){
        case ANIMATION_TYPE.NONE:
            duration = 0.3
            startPos = activeCamPos
            endPos = Vector3.create(activeCamPos.x, activeCamPos.y, activeCamPos.z+0.01)
            easing = EasingFunction.EF_EASEQUAD
            console.log('none')
            break
        case ANIMATION_TYPE.DOLLY_IN:
            duration = cameraAnimations.dolly_in.duration
            startPos = activeCamPos
            endPos = Vector3.create(pos2.x-1, activeCamPos.y, pos2.z)
            easing = cameraAnimations.dolly_in.easing
            console.log('dolly in')
            break
        case ANIMATION_TYPE.DOLLY_OUT:
            duration = cameraAnimations.dolly_out.duration
            startPos = Vector3.create(pos2.x, activeCamPos.y, pos2.z)
            endPos = activeCamPos
            easing = cameraAnimations.dolly_out.duration
            console.log('dolly out')
            break
        case ANIMATION_TYPE.CRANE_DOWN:
            duration = cameraAnimations.crane_down.duration
            startPos = Vector3.create(activeCamPos.x, 9, activeCamPos.z)
            endPos = Vector3.create(activeCamPos.x, 1.5, activeCamPos.z)
            easing = cameraAnimations.crane_down.easing
            console.log('crane down')
            break
        case ANIMATION_TYPE.DOLLY_IN_FAST:
            duration = cameraAnimations.dolly_in_fast.duration
            startPos = activeCamPos
            endPos = Vector3.create(pos2.x - 1, activeCamPos.y, pos2.z)
            easing = cameraAnimations.dolly_in_fast.easing
            console.log('dolly in fast')
            break
        case ANIMATION_TYPE.DOLLY_OUT_FAST:
            duration = cameraAnimations.dolly_out_fast.duration
            startPos = Vector3.create(pos2.x, activeCamPos.y, pos2.z)
            endPos = activeCamPos
            easing = cameraAnimations.dolly_out_fast.easing
            console.log('dolly out fast')
            break
        case ANIMATION_TYPE.MOVE_ALONG_RUNWAY_OPPOSITE:
            duration = cameraAnimations.move_along_runway_opposite.duration
            startPos = Vector3.create(15, activeCamPos.y, 16)
            endPos = Vector3.create(15, activeCamPos.y, 0)
            easing = cameraAnimations.move_along_runway_opposite.easing
            console.log('move along runway opposite')
            break
        case ANIMATION_TYPE.MOVE_WITH_AVATAR:
            let avatarPos = Transform.get(ModelTracker.get(modelTracker).model).position
            duration = cameraAnimations.move_with_avatar.duration
            startPos = Vector3.create(15, 2, avatarPos.z+3)
            endPos = Vector3.create(15, 2,avatarPos.z + 12)
            easing = cameraAnimations.move_with_avatar.easing
            console.log('move with avatar')
            break
       default:
        return
    }

    Tween.createOrReplace(camFollowInfo.currentCameraRef, {
        duration: duration * 1000,
        easingFunction: easing,
        currentTime: 0,
        playing: true,
        mode: Tween.Mode.Move({
            start: startPos,
            end:  endPos, 
        }),
    }) 
}

