import { changeRealm } from '~system/RestrictedActions'
import { Portal } from './portals-kit/src/portal'

// Portal destinations - currently only Cozy Farm is exposed here.
// To add more: drop a thumbnail in assets/images/ and add an entry here.
type PortalDestination = {
  name: string
  realm: string
  thumbnail: string
  position: { x: number; y: number; z: number }
  rotation?: { x: number; y: number; z: number }
}

const DESTINATIONS: PortalDestination[] = [
  {
    name: 'Cozy Farm',
    realm: 'cozyfarm.dcl.eth',
    thumbnail: 'assets/images/CozyFarm.png',
    position: { x: 13, y: 0.95, z: 31.25 },
    // Front renders opposite rotation.y (README gotcha #2): 270 = facing east, inward
    rotation: { x: 0, y: 270, z: 0 }
  }
]

export function setupPortals(): Portal[] {
  return DESTINATIONS.map(
    (dest) =>
      new Portal({
        position: dest.position,
        rotation: dest.rotation,
        size: 1.4,
        name: dest.name,
        thumbnail: dest.thumbnail,
        onActivate: () => {
          void changeRealm({ realm: dest.realm, message: `Jump to ${dest.name}?` })
        }
      })
  )
}
