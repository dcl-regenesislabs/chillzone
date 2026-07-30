import { engine, Entity, MeshRenderer, Schemas, Transform } from "@dcl/sdk/ecs";
import { Quaternion, Vector3 } from "@dcl/sdk/math";

export const ContainerInfo = engine.defineComponent('container-component', { 
    rotationPivot:Schemas.Entity,  
    scalePivot:Schemas.Entity,
    cardEntities:Schemas.Array(Schemas.Entity),    
})


export function addPageContainer(parent:Entity, visible:boolean = false):Entity{
    
    let rotationPivot = engine.addEntity()
    Transform.create(rotationPivot, {
        position: Vector3.create(0, 0, 5),
        rotation: Quaternion.fromEulerDegrees(0, 0, 0),
        scale: Vector3.create(1, 1, 1),
        parent: parent
    })
    let scalePivot = engine.addEntity()
    Transform.create(scalePivot, {
        position: Vector3.create(0, 0, -5.05),
        rotation: Quaternion.fromEulerDegrees(0, 0, 0),
        scale: visible ? Vector3.create(1, 1, 1) : Vector3.create(0, 0, 0),
        parent: rotationPivot
    })
    let containerRoot = engine.addEntity()
    Transform.create(containerRoot, {
        position: Vector3.create(0, 0, 0),
        rotation: Quaternion.fromEulerDegrees(0, 0, 0),
        scale: Vector3.create(1, 1, 1),
        parent: scalePivot
    })
    ContainerInfo.create(containerRoot, {
        rotationPivot:rotationPivot,
        scalePivot:scalePivot,
        cardEntities:[]
    })
    
    return containerRoot
}