import { engine, Entity, Schemas } from '@dcl/sdk/ecs'
import { syncEntity, myProfile } from '@dcl/sdk/network'
import { onLeaveScene } from '@dcl/sdk/players'

export const SeatState = engine.defineComponent('seat-state', {
  taken: Schemas.Boolean,
  occupantUserId: Schemas.String
})

const pendingSeatSyncIds = new Map<Entity, number>()
let syncRegistrationSystemAdded = false
let leaveSceneCleanupAdded = false

function flushPendingSeatSyncs() {
  if (!myProfile.networkId || pendingSeatSyncIds.size === 0) return

  for (const [entity, syncId] of pendingSeatSyncIds) {
    syncEntity(entity, [SeatState.componentId], syncId)
    pendingSeatSyncIds.delete(entity)
  }
}

function ensureSeatSyncRegistrationSystem() {
  if (syncRegistrationSystemAdded) return
  engine.addSystem(flushPendingSeatSyncs, undefined, 'seat-state-sync-registration')
  syncRegistrationSystemAdded = true
}

function ensureLeaveSceneCleanup() {
  if (leaveSceneCleanupAdded) return

  onLeaveScene((userId) => {
    for (const [entity, seatState] of engine.getEntitiesWith(SeatState)) {
      if (seatState.occupantUserId === userId) {
        releaseSeat(entity)
      }
    }
  })

  leaveSceneCleanupAdded = true
}

export function initSeatState(entity: Entity, syncId: number) {
  SeatState.createOrReplace(entity, {
    taken: false,
    occupantUserId: ''
  })

  pendingSeatSyncIds.set(entity, syncId)
  ensureSeatSyncRegistrationSystem()
  ensureLeaveSceneCleanup()
}

export function occupySeat(entity: Entity, occupantUserId: string) {
  SeatState.createOrReplace(entity, {
    taken: true,
    occupantUserId
  })
}

export function releaseSeat(entity: Entity) {
  if (!SeatState.has(entity)) return

  SeatState.createOrReplace(entity, {
    taken: false,
    occupantUserId: ''
  })
}
