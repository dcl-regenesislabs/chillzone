import { Billboard, BillboardMode, engine, Entity, Material, MaterialTransparencyMode, MeshRenderer, Schemas, Transform, TransformComponent, TransformTypeWithOptionals, VisibilityComponent } from "@dcl/sdk/ecs"
import { Color4, Vector2, Vector3 } from "@dcl/sdk/math"


export const SpriteAnim = engine.defineComponent('sprite-anim-id', {
    id: Schemas.Number,
    active: Schemas.Boolean,
    countU: Schemas.Number,
    countV: Schemas.Number,
    stepU: Schemas.Number,
    stepV: Schemas.Number,
    currentSpriteU: Schemas.Number,
    currentSpriteV: Schemas.Number,
    elapsed: Schemas.Number,
    freq: Schemas.Number,
    delay: Schemas.Number,
    loop: Schemas.Boolean,
    random: Schemas.Number,
    startID: Schemas.Number,
    endID: Schemas.Number,
  })
  

  function getUCoordByID(id:number, columns:number):number{
    return id % columns
  }
  function getVCoordByID(id:number, columns:number):number{
    return Math.floor(id / columns)
  }

  function uvs(entity: Entity): number[] {

    const spriteInfo = SpriteAnim.get(entity)

    return [
      spriteInfo.currentSpriteU * spriteInfo.stepU, 1 - ((spriteInfo.currentSpriteV + 1) * spriteInfo.stepV),
      spriteInfo.currentSpriteU * spriteInfo.stepU, 1 - (spriteInfo.currentSpriteV * spriteInfo.stepV),
      (spriteInfo.currentSpriteU + 1) * spriteInfo.stepU, 1 - (spriteInfo.currentSpriteV * spriteInfo.stepV),
      (spriteInfo.currentSpriteU + 1) * spriteInfo.stepU, 1 - ((spriteInfo.currentSpriteV + 1) * spriteInfo.stepV)
    ]
  }

  // system to step along each sprite in each row with the given frequency
  export function SpriteAnimSystem(dt: number) {
  
    const spriteGroup = engine.getEntitiesWith(SpriteAnim)
  
    for (const [entity, baseInfo] of spriteGroup) {
  
      if(!baseInfo.active){
        continue
      }         

      if(baseInfo.delay > 0){
        const spriteInfo = SpriteAnim.getMutable(entity)
        spriteInfo.delay -= dt *1000
        continue
      }
      else{
        if(!VisibilityComponent.get(entity).visible){
          VisibilityComponent.getMutable(entity).visible = true
        }
      }
     // console.log("SPRITE ACTIVE AND DELAY IS 0")

      const spriteInfo = SpriteAnim.getMutable(entity)
      spriteInfo.elapsed += dt
  
      if (spriteInfo.elapsed >= spriteInfo.freq) {
  
        spriteInfo.currentSpriteU += 1
  
        if (spriteInfo.currentSpriteU >= spriteInfo.countU) {
          spriteInfo.currentSpriteU = 0
          spriteInfo.currentSpriteV += 1
        }
  
        if (spriteInfo.currentSpriteV >= getVCoordByID(spriteInfo.endID, spriteInfo.countU) && spriteInfo.currentSpriteU >= getUCoordByID(spriteInfo.endID, spriteInfo.countU)) {
  
          if(spriteInfo.loop){
            spriteInfo.currentSpriteU = getUCoordByID(spriteInfo.startID, spriteInfo.countU)
            spriteInfo.currentSpriteV = getVCoordByID(spriteInfo.startID, spriteInfo.countU)
          }else{
            spriteInfo.active = false
            VisibilityComponent.getMutable(entity).visible = false
          }
        }
  
        spriteInfo.elapsed = 0
      }

      MeshRenderer.setPlane(entity, uvs(entity)) 
    }
  }
  
  export function resetSpriteEffect(entity:Entity){     
    SpriteAnim.getMutable(entity).elapsed = 0
    SpriteAnim.getMutable(entity).currentSpriteU = 0
    SpriteAnim.getMutable(entity).currentSpriteV = 0
  }

  export function playSpriteEffect(entity:Entity, startID:number, endID:number, fps:number = 30, loop:boolean = false){
    let spriteInfo = SpriteAnim.getMutable(entity)
    VisibilityComponent.getMutable(entity).visible = true
    spriteInfo.startID = startID
    spriteInfo.endID = endID
    spriteInfo.active = true
    spriteInfo.delay = 0
    spriteInfo.currentSpriteU = getUCoordByID(startID, spriteInfo.countU)
    spriteInfo.currentSpriteV = getVCoordByID(startID, spriteInfo.countU)
    spriteInfo.loop = loop
    spriteInfo.freq = 1/fps
  }

  export function addSpriteEffect(spriteSheetSrc:string, columns:number, rows:number, position: Vector3, emissiveIntensity:number = 0.4, delay: number = 0, loop:boolean = false):Entity{
    let spriteEntity = engine.addEntity()

   // let randomScale = Math.random() 
    
    //let scale = randomScale* 3 + 2    
    Transform.create(spriteEntity, {
        position: position,
        //position:Vector3.create(GRID_CENTER.x,GRID_CENTER.y+ 2,GRID_CENTER.z),
        scale: Vector3.create(1,1,1),
    })
    MeshRenderer.setPlane(spriteEntity)
    //Billboard.create(spriteEntity, {billboardMode: BillboardMode.BM_ALL})
    SpriteAnim.create(spriteEntity, {
        id: 0,
        countU: columns,
        countV: rows,
        stepU: 1/columns,
        stepV: 1/rows,
        currentSpriteU: 0,
        currentSpriteV: 0,  
        elapsed: 0,
        freq: 1/30,
        delay: delay,
        active: false,
        loop: loop,
       // random:  randomScale,
        startID: 0,
        endID: 12
    })
    Material.setPbrMaterial(spriteEntity, {
        texture: Material.Texture.Common({src: spriteSheetSrc}),
        transparencyMode:MaterialTransparencyMode.MTM_ALPHA_BLEND,
        metallic: 0,
        roughness: 1,
        emissiveTexture: Material.Texture.Common({src: spriteSheetSrc}),
        emissiveColor: Color4.create(1,1,1,1),
        emissiveIntensity: emissiveIntensity,
        castShadows: false,
    })
    VisibilityComponent.createOrReplace(spriteEntity, {visible:false})
    return spriteEntity
  }

  export function hideAllSprites(){
    const spriteGroup = engine.getEntitiesWith(SpriteAnim, VisibilityComponent)
    for (const [entity, baseInfo] of spriteGroup) {
      VisibilityComponent.getMutable(entity).visible = false
    }
  }
  