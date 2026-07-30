import { EasingFunction, engine, Entity, TextShape, Transform, Tween } from "@dcl/sdk/ecs";
import { Color4, Vector3 } from "@dcl/sdk/math";
import { changeRealm, teleportTo } from "~system/RestrictedActions";
import { TextLineAnimation } from "./boardComponents";
import { CHAR_SPACING_DEFAULT } from "./config";
import { JumpData } from "./jumpInButton";

export function _teleportTo(parcelX: number, parcelZ: number) {     
    teleportTo({
      worldCoordinates: { x: parcelX, y: parcelZ }
    })
  }
  
  export function _teleportToWorld(worldname: string) {    
    changeRealm({realm: worldname})
  }

export function clickTeleportToEvent(_event: JumpData){
    if(_event.world) {
      _event.server && _teleportToWorld(_event.server)
      return;
    }    
    _teleportTo(parseInt(_event.coordinates[0]) , parseInt(_event.coordinates[1])) 
  }

export function monthToString(_monthID:number):string{

  switch(_monthID){
    case 0: {
      return "Jan"
    }
    case 1: {
      return "Feb"
    }
    case 2: {
      return "Mar"
    }
    case 3: {
      return "Apr"
    }
    case 4: {
      return "May"
    }
    case 5: {
      return "Jun"
    }
    case 6: {
      return "Jul"
    }
    case 7: {
      return "Aug"
    }
    case 8: {
      return "Sep"
    }
    case 9: {
      return "Oct"
    }
    case 10: {
      return "Nov"
    }
    case 11: {
      return "Dec"
    }
  }
  
  return "N/A"
}

// to fix U and A characters being too close to each other
export function fixCharSpacing(_text:string, charSpacing:number = CHAR_SPACING_DEFAULT):string{
  let newText = "<cspace=0.0em>u<cspace="+charSpacing+"em>a"
  return _text.replace(/ua/g, newText)
}

export function getDayOfWeek(_date:string, short:boolean = true):string{
  let date = new Date(_date)
  return date.toLocaleDateString('en-US', { weekday: short ? 'short' : 'long' }).toUpperCase()
}

export function getDayOfMonth(_date:string):number{
  let date = new Date(_date)
  return date.getDate()
}
export function getMonthOfYearString(_date:string):string{
  let date = new Date(_date)
  return date.toLocaleDateString('en-US', { month: 'long' }).toUpperCase()
}
export function getMonthNumberOfYear(_date:string):number{
  let date = new Date(_date)
  return date.getMonth()
}

export function getDayOfWeekUTC(_date:string, short:boolean = true):string{
  let date = new Date(_date)
  return date.toLocaleDateString('en-US', { weekday: short ? 'short' : 'long', timeZone: 'UTC'}).toUpperCase()
  
}
export function getDateString(_date:string):string{
  let date = new Date(_date)
 let month = monthToString( date.getMonth() ).toUpperCase()
 let day = date.getDate()
 return month + " " + day
}

export function getDateOffset(startDate:string, _date:string):number{
  let date = new Date(_date)
  let start = new Date(startDate)

  start.setHours(0, 0, 0, 0)
  date.setHours(0, 0, 0, 0)

  let dayDifference = (date.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  // console.log("DATE: " + date)
  // console.log("NOW: " + start)
  // console.log("DAY DIFFERENCE: " + dayDifference)

  return dayDifference 
}

export function getTimeString(_date:string):string{
  let result = _date

  let hours = new Date(_date).getHours()
  let minutes = new Date(_date).getMinutes()

  // console.log("DATE: " + _date)
  // console.log("LOCAL: " + getDayOfWeek(_date, false) + " " + hours + ":" + minutes)
  // console.log("UTC: " + getDayOfWeekUTC(_date, false) + " " + new Date(_date).getUTCHours() + ":" + new Date(_date).getUTCMinutes())
  // console.log("--------------------------------")

  let ampm = "PM"
  let minutesPrefix = ""

  if(hours > 12){
    hours -= 12
    ampm = "PM"
  }
  else{
    ampm = "AM"
  }

  if(minutes < 10){
    minutesPrefix = "0" 
  }

  result = hours + ":" + minutesPrefix + minutes + " " + ampm
  return result
}


export function scaleTween(entity:Entity, startScale:Vector3, endScale:Vector3, easingFunction:EasingFunction, duration:number = 200){

  let originalScale = Transform.get(entity).scale
  Tween.createOrReplace(entity, {
    duration: duration,
    easingFunction: easingFunction,
    currentTime: 0,
    playing: true,
    mode: Tween.Mode.Scale({
      start: startScale,
      end: endScale
    })
  })
}

export function lineAnimatorSystem(dt:number){

  let textGroup = engine.getEntitiesWith(TextLineAnimation, TextShape)
  for(let [textEntity, textLineAnimation] of textGroup){

    if(textLineAnimation.active){
      let animInfo = TextLineAnimation.getMutable(textEntity)
      
      animInfo.elapsedTime += dt
      
      if(animInfo.elapsedTime >= animInfo.duration / animInfo.endLineNumber){
        let textShape = TextShape.getMutable(textEntity)
        //animInfo.elapsedTime = 0
        animInfo.currentLineNumber += 1
       
        if(animInfo.currentLineNumber < animInfo.endLineNumber){
          textShape.lineCount = animInfo.currentLineNumber
        }
        else{
          textShape.lineCount = animInfo.endLineNumber
        }
        
      }
      animInfo.currentAlpha = animInfo.elapsedTime / animInfo.duration
      if(animInfo.currentAlpha > 1){
        animInfo.currentAlpha = 1
        animInfo.active = false
      }
      let textShape = TextShape.getMutable(textEntity)
      Color4.copyFromFloats(0.431, 0.494, 0.557, animInfo.currentAlpha,  animInfo.currentColor)
      textShape.textColor = animInfo.currentColor
    }
  }
   
}