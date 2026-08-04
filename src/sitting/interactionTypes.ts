import { Entity, engine, GltfContainer, Transform } from "@dcl/sdk/ecs"
import { Quaternion, Vector3 } from "@dcl/sdk/math"

const animsFolder = 'models/anims/'

export type InteractionData = {
    // Absolute scene position, computed once when the interaction is set up.
    // Deliberately NOT relative to the furniture entity — the sit height is
    // tuned as a fixed scene value, independent of wherever the couch model
    // itself is positioned.
    transform: { position: Vector3; rotation: Quaternion }
    animData: AnimationDataType
    clickBox: Entity
    clickDistance: number
    loop: boolean
}

export type AnimationDataType = {
    name: string
    isPredefinedEmote: boolean
    animations: string[]
    hoverText: string
    highlightOffset: Vector3
    teleportsPlayer: boolean
    teleportOffset: Vector3
    rotationOffset: Quaternion
    distance: number
    loop: boolean
    // When set, overrides the final Y of the sit position outright — not an
    // offset added on top of the couch/anchor's own Y, a hard replacement.
    // Edit this single number to change sit height with zero dependency on
    // where the furniture model is positioned.
    absoluteHeight?: number
    // Added to teleport Y only on mobile (checked at sit-time in
    // interactiveObject.ts); desktop never applies this.
    mobileHeightOffset?: number
    // Pushes the mobile teleport forward, along the seat's own facing
    // direction (not a raw world-Z add — each seat faces a different way).
    // Desktop never applies this either.
    mobileForwardOffset?: number
}

// "sittingChair1"/"sittingChair2" are Decentraland's built-in predefined avatar
// emotes for sitting upright (the same ones used by the scene editor's "Chair"
// smart item). Sofas use a different, reclined pose — see anim_spot_sofa_* below.
export let animTypes: AnimationDataType[] = [
    {
        name: "anim_spot_chair",
        isPredefinedEmote: true,
        animations: ["sittingChair1", "sittingChair2"],
        hoverText: "SIT",
        // Raised above the seat for visibility — teleport target is
        // unaffected by this, they're independent offsets.
        highlightOffset: Vector3.create(0, 0.8, 0.0),
        teleportsPlayer: true,
        // z was 0.33 in the reference repo (pushes the sit position forward
        // off the chair's own pivot). Our combined glb's chair pivot already
        // sits at seat-center, so that push landed players off the front
        // edge of the seat — confirmed across 3 separate chair instances,
        // all needing the exact same correction. Zeroed out here instead of
        // per-seat, since it's a property of this furniture pack, not of
        // any individual chair. Left untouched otherwise.
        teleportOffset: Vector3.create(0, 0.14, 0.0),
        mobileHeightOffset: -0.15,
        mobileForwardOffset: 0.2,
        distance: 6,
        rotationOffset: Quaternion.fromEulerDegrees(0, 0, 0),
        loop: true,
    },
    {
        // Sofas use the same reclined "puff" scene-emote clips as the reference
        // repo (not the sittingChair predefined emote) — sittingChair1/2 are
        // tuned for upright chairs and look wrong on a couch cushion.
        // Each of the 6 sofa seats now gets its own exact anchor position
        // (from Creator Hub markers), so no left/right split or offset is
        // needed here anymore — teleportOffset is zero on purpose.
        name: "anim_spot_sofa",
        isPredefinedEmote: false,
        animations: [animsFolder + "Puff_Idle_01_emote.glb", animsFolder + "Puff_Idle_02_emote.glb"],
        hoverText: "SIT",
        // Raised a bit above the marker height for visibility (doesn't
        // affect teleportOffset, they're independent).
        highlightOffset: Vector3.create(0, 0.3, 0.0),
        teleportsPlayer: true,
        teleportOffset: Vector3.create(0, 0, 0),
        // EDIT THIS NUMBER to change sit height — it's the final Y, full
        // stop. Has nothing to do with the couch's position or the anchor's
        // own Y; nothing else needs to change when you tune this.
        absoluteHeight: -0.1,
        mobileHeightOffset: 0.65,
        distance: 6,
        rotationOffset: Quaternion.fromEulerDegrees(0, 0, 0),
        loop: true,
    },
]

// Scene emotes (as opposed to predefined avatar emotes) must reference an
// already-loaded glb, so each one gets preloaded off-screen once at startup.
export function preLoadAnimations() {
    for (const anim of animTypes) {
        if (anim.isPredefinedEmote) continue
        for (const animation of anim.animations) {
            const entity = engine.addEntity()
            Transform.create(entity, {
                position: Vector3.create(10, -10, 10),
                scale: Vector3.create(1, 1, 1),
            })
            GltfContainer.create(entity, { src: animation })
        }
    }
}

export function getAnimTypeByName(name: string): AnimationDataType | null {
    for (const anim of animTypes) {
        if (anim.name === name) return anim
    }
    return null
}
