/**
 * Helpers de UVs para leer sprites de un texture atlas, y logging.
 * Extraído de `src/modules/utils/utils.ts` de Genesis Plaza (solo lo que usa el board).
 */

export function posToUVS(rangeX: [number, number], rangeY: [number, number], atlasSize: { width: number, height: number }) {
  //rangeX [minX, maxX] in px
  //rangeY [minY, maxY] in px

  return [
      rangeX[0] / atlasSize.width, (atlasSize.height - rangeY[1]) / atlasSize.height,
      rangeX[0] / atlasSize.width, (atlasSize.height - rangeY[0]) / atlasSize.height,
      rangeX[1] / atlasSize.width, (atlasSize.height - rangeY[0]) / atlasSize.height,
      rangeX[1] / atlasSize.width, (atlasSize.height - rangeY[1]) / atlasSize.height
  ]

}

export function posToUVSEmptyBackSide(rangeX: [number, number], rangeY: [number, number], atlasSize: { width: number, height: number }) {
  return [
      rangeX[0] / atlasSize.width, (atlasSize.height - rangeY[1]) / atlasSize.height,
      rangeX[0] / atlasSize.width, (atlasSize.height - rangeY[0]) / atlasSize.height,
      rangeX[1] / atlasSize.width, (atlasSize.height - rangeY[0]) / atlasSize.height,
      rangeX[1] / atlasSize.width, (atlasSize.height - rangeY[1]) / atlasSize.height,

      0,0,
      0,0,
      0,0,
      0,0
  ]

}

export function posToUVSDoubleSide(rangeX: [number, number], rangeY: [number, number], atlasSize: { width: number, height: number }) {
  return [
      rangeX[0] / atlasSize.width, (atlasSize.height - rangeY[1]) / atlasSize.height,
      rangeX[0] / atlasSize.width, (atlasSize.height - rangeY[0]) / atlasSize.height,
      rangeX[1] / atlasSize.width, (atlasSize.height - rangeY[0]) / atlasSize.height,
      rangeX[1] / atlasSize.width, (atlasSize.height - rangeY[1]) / atlasSize.height,

      rangeX[1] / atlasSize.width, (atlasSize.height - rangeY[1]) / atlasSize.height,
      rangeX[1] / atlasSize.width, (atlasSize.height - rangeY[0]) / atlasSize.height,
      rangeX[0] / atlasSize.width, (atlasSize.height - rangeY[0]) / atlasSize.height,
      rangeX[0] / atlasSize.width, (atlasSize.height - rangeY[1]) / atlasSize.height,
  ]

}

export function logObject(...obj: any[]) {
    console.log("Log Object:")
    for (const o of obj) {
        console.log(JSON.stringify(o, null, 2))
    }
}
