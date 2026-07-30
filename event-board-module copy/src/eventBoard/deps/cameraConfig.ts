import { EasingFunction, Entity } from "@dcl/sdk/ecs"
import { Quaternion, Vector3 } from "@dcl/sdk/math"


export enum ANIMATION_TYPE {
    NONE, 
    DOLLY_IN,
    DOLLY_OUT,
    DOLLY_IN_FAST, 
    DOLLY_OUT_FAST,
    CRANE_DOWN,
    MOVE_ALONG_RUNWAY_OPPOSITE,
    MOVE_WITH_AVATAR,

}
export enum CAMERA_TYPE {    
    CENTER_TARGET  
}

export type TutorialCameraData = {   
    name: string,
    position: Vector3,
    fov: number,
    target: Vector3,
    transitionDuration: number
}

export type CameraData = {
    types: CAMERA_TYPE[],
    position: Vector3,
    fov: number,
    targetVerticalOffset: number,
    avatarAttached: boolean,
    rotation: Quaternion,
    importedRotation: boolean  
    lookAtTarget: boolean
}

export let cameras:CameraData[] = [
    {
        types: [CAMERA_TYPE.CENTER_TARGET],
        position: Vector3.create( 4, 3, 4), 
        fov: 40,
        targetVerticalOffset: 1.0,   
        avatarAttached:false,
        rotation: Quaternion.fromEulerDegrees(0,0,0),
        importedRotation: false,
        lookAtTarget: false
    },
    {
        types: [CAMERA_TYPE.CENTER_TARGET],
        position: Vector3.create( 2, 3.5, 1), 
        fov: 50,
        targetVerticalOffset: 1.5 ,      
        avatarAttached:false,
        rotation: Quaternion.fromEulerDegrees(0,0,0),
        importedRotation: false,
        lookAtTarget: false
    },
    {
        types: [CAMERA_TYPE.CENTER_TARGET],
        position: Vector3.create( 3, 1.5, 8), 
        fov: 120,
        targetVerticalOffset: 1.5,
        avatarAttached:false,
        rotation: Quaternion.fromEulerDegrees(0,0,0),
        importedRotation: false,
        lookAtTarget: false
    },
    {
        types: [CAMERA_TYPE.CENTER_TARGET],
        position: Vector3.create( 9, 3.5, 12),     
        fov: 90,
        targetVerticalOffset: 2.0,
        avatarAttached:false,
        rotation: Quaternion.fromEulerDegrees(0,0,0),
        importedRotation: false,
        lookAtTarget: false
    }
    ]

export let cameraAnimations:any = {
    
    dolly_in: 
    {
        duration: 3,
        easing: EasingFunction.EF_EASEOUTSINE
    
    },
    dolly_out: 
    {
        duration: 3,
        easing: EasingFunction.EF_EASEOUTSINE
    
    },
    crane_down:
    {
        duration: 7,
        easing: EasingFunction.EF_LINEAR
    
    },
    dolly_in_fast:
    {
        duration: 1,
        easing: EasingFunction.EF_EASECUBIC
    
    },
    dolly_out_fast:
    {
        duration: 0.8,
        easing: EasingFunction.EF_EASEOUTQUAD
    
    },
    move_along_runway_opposite:
    {
        duration: 7,
        easing: EasingFunction.EF_LINEAR    
    },
    move_with_avatar:
    {
        duration: 3,
        easing: EasingFunction.EF_LINEAR    
    },
    

}  

