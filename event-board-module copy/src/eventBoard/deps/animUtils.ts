import { engine, Entity, Transform } from "@dcl/sdk/ecs";
import { Vector3 } from "@dcl/sdk/math";

export function shuffle(array: number[]): number[] {
    let currentIndex = array.length,  randomIndex;
  
    // While there remain elements to shuffle.
    while (currentIndex != 0) {
  
      // Pick a remaining element.
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
  
      // And swap it with the current element.
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }
  
    return array;
  };

export function shuffleEntities(array: Entity[]): Entity[] {
    let currentIndex = array.length,  randomIndex;
  
    // While there remain elements to shuffle.
    while (currentIndex != 0) {
  
      // Pick a remaining element.
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
  
      // And swap it with the current element.
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }
  
    return array;
  };

  export function realDistance(pos1: Vector3, pos2: Vector3): number {
    return Math.sqrt(Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2) + Math.pow(pos1.z - pos2.z, 2))
  }


  export function compareDistance(a:any, b:any):number{ 
 
 
    
    if(realDistance(Transform.get(a).position, Transform.get(engine.PlayerEntity).position) < realDistance(Transform.get(b).position, Transform.get(engine.PlayerEntity).position)){ return 1 }
    else { return -1 } 
    
  
  }
  
export function timeout (ms:number, callback:()=>void){
  const timeoutId = Date.now().toString() + Math.random().toString(36).substring(2, 9)

  let elapsedTimeMs = 0
  engine.addSystem((dt:number)=>{
      elapsedTimeMs += dt * 1000
      if(elapsedTimeMs >= ms){
          callback()
          // console.log("timeout", timeoutId)
          engine.removeSystem(`timeout-sys-${timeoutId}`)
      }


  },0,`timeout-sys-${timeoutId}`)
}

 
  
