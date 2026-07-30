import { engine, Schemas } from "@dcl/sdk/ecs";

export const TextLineAnimation = engine.defineComponent('text-line-animation-component', { 
    active:Schemas.Boolean,
    startLineNumber:Schemas.Number,  
    endLineNumber:Schemas.Number,
    currentLineNumber:Schemas.Number,
    //frequency:Schemas.Number,
    elapsedTime:Schemas.Number,
    currentColor:Schemas.Color4,
    currentAlpha:Schemas.Number,
    duration:Schemas.Number,
   
  })