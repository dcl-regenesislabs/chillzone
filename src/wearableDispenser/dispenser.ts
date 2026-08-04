import {
  Animator, ColliderLayer, EasingFunction, GltfContainer, InputAction, MeshCollider,
  Transform, Tween, TweenLoop, TweenSequence, engine, pointerEventsSystem
} from '@dcl/sdk/ecs'
import { Quaternion, Vector3 } from '@dcl/sdk/math'
import { claimWearable } from './claim'

// Model path is relative to the SCENE ROOT. If you keep this folder at the scene root,
// this default works as-is. Otherwise move the .glb and update the path.
const BASE_MODEL = 'wearableDispenser/models/dispenser_1.glb'
// Animation clips baked into dispenser_1.glb. Change if you swap the base model.
const BASE_CLIPS = ['Cylinder.135Action', 'Cylinder.138Action.001', 'Dispenser_gownAction']
// dispenser_1.glb has a Genesis Plaza position baked into its nodes (~7.69, 0, 21.58),
// so the base renders far from the entity origin — often out of scene bounds and culled.
// This offset re-centers the base on the dispenser's position. Set to (0,0,0) if you
// swap in a base model whose pivot is already at the origin.
const BASE_MODEL_OFFSET = { x: -7.687, y: 0, z: -21.583 }

export type DispenserOptions = {
  position: { x: number; y: number; z: number }
  rotation?: { x: number; y: number; z: number }
  scale?: number
  wearableModel: string       // GLB of the spinning prize (e.g. 'wearableDispenser/models/wearable_male.glb')
  wearableOffsetY?: number    // height of the wearable above the base (default 1.5)
  hoverText?: string
  showBase?: boolean          // render the animated base glb (default true). Set false
                              // to place the base yourself (e.g. from the scene editor).
}

// Spawns: animated base + spinning wearable + click-to-claim. Call once per dispenser.
export function createDispenser(opts: DispenserOptions) {
  const rot = opts.rotation ?? { x: 0, y: 0, z: 0 }
  const s = opts.scale ?? 1
  const wy = opts.wearableOffsetY ?? 1.5

  const root = engine.addEntity()
  Transform.create(root, {
    position: Vector3.create(opts.position.x, opts.position.y, opts.position.z),
    rotation: Quaternion.fromEulerDegrees(rot.x, rot.y, rot.z),
    scale: Vector3.create(s, s, s)
  })

  // ── Animated base ── (offset counters the baked-in GP position, see BASE_MODEL_OFFSET)
  if (opts.showBase !== false) {
    const base = engine.addEntity()
    Transform.create(base, {
      parent: root,
      position: Vector3.create(BASE_MODEL_OFFSET.x, BASE_MODEL_OFFSET.y, BASE_MODEL_OFFSET.z)
    })
    GltfContainer.create(base, { src: BASE_MODEL })
    Animator.createOrReplace(base, { states: BASE_CLIPS.map(clip => ({ clip, playing: true, loop: true })) })
  }

  // ── Spinning wearable (the prize) ──
  const wearable = engine.addEntity()
  Transform.create(wearable, { parent: root, position: Vector3.create(0, wy, 0) })
  GltfContainer.create(wearable, { src: opts.wearableModel })
  spin(wearable)

  // ── Click surface over the wearable → claim ──
  const clicker = engine.addEntity()
  Transform.create(clicker, {
    parent: root,
    position: Vector3.create(0, wy + 0.2, 0),
    scale: Vector3.create(2.2, 3, 2.2)
  })
  MeshCollider.setBox(clicker, ColliderLayer.CL_POINTER)
  pointerEventsSystem.onPointerDown(
    { entity: clicker, opts: { button: InputAction.IA_POINTER, hoverText: opts.hoverText ?? 'Claim your free wearable', maxDistance: 5 } },
    () => claimWearable()
  )
}

// Continuous spin: 0→180 once, then loop 180→0 forever (same as the original scene).
function spin(entity: ReturnType<typeof engine.addEntity>) {
  Tween.createOrReplace(entity, {
    mode: Tween.Mode.Rotate({
      start: Quaternion.fromEulerDegrees(0, 0, 0),
      end: Quaternion.fromEulerDegrees(0, 180, 0)
    }),
    duration: 4000,
    easingFunction: EasingFunction.EF_LINEAR
  })
  TweenSequence.create(entity, {
    sequence: [{
      mode: Tween.Mode.Rotate({
        start: Quaternion.fromEulerDegrees(0, 180.000001, 0),
        end: Quaternion.fromEulerDegrees(0, 0, 0)
      }),
      duration: 4000,
      easingFunction: EasingFunction.EF_LINEAR
    }],
    loop: TweenLoop.TL_RESTART
  })
}
