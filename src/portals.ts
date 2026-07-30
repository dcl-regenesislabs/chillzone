import { changeRealm } from '~system/RestrictedActions'
import { Portal } from './portals-kit/src/portal'

// Portal destinations — Worlds surfaced by the crowd/activity analysis
// (cozyfarm and flagtag are the most consistently active Worlds).
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
    position: { x: 13, y: 0.95, z: 22.25 },
    // Front renders opposite rotation.y (README gotcha #2): 270 = facing east, inward
    rotation: { x: 0, y: 270, z: 0 }
  },
  {
    name: 'Flag Tag',
    realm: 'flagtag.dcl.eth',
    thumbnail: 'assets/images/flagtag.png',
    position: { x: 13, y: 0.95, z: 31.25 },
    rotation: { x: 0, y: 270, z: 0 } // same wall as Cozy Farm, facing east

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
