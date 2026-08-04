import { engine, Entity, Transform } from "@dcl/sdk/ecs"
import { Quaternion, Vector3 } from "@dcl/sdk/math"
import { isMobile } from "@dcl/sdk/platform"
import { EntityNames } from "../../assets/scene/entity-names"
import { addCustomInteraction } from "./animationActions"
import { getAnimTypeByName } from "./interactionTypes"
import { delay_ms_cb } from "./sittingUtils"

// pullBack: shifts the seat backward along its own local Z (cancels forward teleportOffset push)
// sideShift: shifts the seat sideways along its own local X (positive = to the seat's right)
type SeatPivot = { position: Vector3; rotation: Quaternion; pullBack?: number; sideShift?: number }

// One anchor per physical seat (2 per sofa: left/right), taken from the 6
// marker balls (sofa_1..sofa_6) placed by hand in Creator Hub — Y is exactly
// 0.60 on all 6, confirmed as the correct seat height. Rotation reuses each
// physical sofa's own facing (a marker ball carries no facing direction).
const SOFA_SEATS: SeatPivot[] = [
    // sofa_1 (left seat of sofa #1)
    { position: Vector3.create(5.100012, 0.6, -0.249990), rotation: Quaternion.create(0, -0.712154, 0, 0.702023) },
    // sofa_2 (right seat of sofa #1)
    { position: Vector3.create(5.100012, 0.6, 1.150015), rotation: Quaternion.create(0, -0.712154, 0, 0.702023) },
    // sofa_3 (left seat of sofa #2)
    { position: Vector3.create(1.000002, 0.6, 5.450020), rotation: Quaternion.create(0, 0.999999, 0, 0.001171) },
    // sofa_4 (right seat of sofa #2)
    { position: Vector3.create(-0.700005, 0.6, 5.450020), rotation: Quaternion.create(0, 0.999999, 0, 0.001171) },
    // sofa_5 (left seat of sofa #3)
    { position: Vector3.create(-4.800011, 0.6, 1.450024), rotation: Quaternion.create(0, 0.714940, 0, 0.699186) },
    // sofa_6 (right seat of sofa #3)
    { position: Vector3.create(-4.800011, 0.6, -0.549982), rotation: Quaternion.create(0, 0.714940, 0, 0.699186) },
]

const CHAIR_SEATS: SeatPivot[] = [
    // XZ taken from the 9 marker spheres (chair_1..chair_9) placed by hand in
    // Creator Hub, matched to these entries by nearest position (the spheres
    // were placed right-to-left around the room, which doesn't match this
    // array's Blender-export order — see mapping below). Y keeps the
    // glb-derived floor height (0.679352/0.679353) since the spheres float at
    // 1.3 purely for visibility. Rotation is unchanged (a sphere carries no
    // facing direction).
    // label 1 <- chair_2
    { position: Vector3.create(7.299995, 0.679352, 0.350008), rotation: Quaternion.create(0, -0.748540, 0, 0.663089) },
    // label 2 <- chair_3
    { position: Vector3.create(6.899998, 0.679352, 2.350014), rotation: Quaternion.create(0, -0.863360, 0, 0.504589) },
    // label 3 <- chair_1
    { position: Vector3.create(6.899998, 0.679352, -1.650000), rotation: Quaternion.create(0, -0.548471, 0, 0.836170) },
    // label 4 <- chair_9
    { position: Vector3.create(-6.500002, 0.679352, -1.549995), rotation: Quaternion.create(0, 0.438540, 0, 0.898712) },
    // label 5 <- chair_8
    { position: Vector3.create(-6.800003, 0.679352, 0.450012), rotation: Quaternion.create(0, 0.726893, 0, 0.686751) },
    // label 6 <- chair_7
    { position: Vector3.create(-6.400002, 0.679353, 2.650013), rotation: Quaternion.create(0, 0.809409, 0, 0.587246) },
    // label 7 <- chair_6
    { position: Vector3.create(-1.900007, 0.679353, 7.050022), rotation: Quaternion.create(0, 0.986171, 0, 0.165733) },
    // label 8 <- chair_5
    { position: Vector3.create(0.299995, 0.679352, 7.350018), rotation: Quaternion.create(0, 0.999674, 0, 0.025548) },
    // label 9 <- chair_4
    { position: Vector3.create(2.399994, 0.679352, 6.950022), rotation: Quaternion.create(0, -0.990596, 0, 0.136820) },
]

function createSeatAnchor(parent: Entity, seat: SeatPivot): Entity {
    const anchor = engine.addEntity()
    const localOffset = Vector3.create(seat.sideShift ?? 0, 0, -(seat.pullBack ?? 0))
    const position = (seat.pullBack || seat.sideShift)
        ? Vector3.add(seat.position, Vector3.rotate(localOffset, seat.rotation))
        : seat.position
    Transform.create(anchor, { position, rotation: seat.rotation, parent })
    return anchor
}

export function setupChairsAndSofasSitting() {
    const furniture = engine.getEntityOrNullByName(EntityNames.ChairsAndSofas_glb)
    if (!furniture) return

    // turnsOffCollider disables the WHOLE ChairsAndSofas mesh's collision
    // while someone is seated (it's all one combined glb, can't toggle a
    // single cushion) — trade-off accepted to stop physics from resettling
    // the avatar against the seat's real collider after teleporting.
    SOFA_SEATS.forEach((seat) => {
        const anchor = createSeatAnchor(furniture, seat)
        addCustomInteraction(anchor, getAnimTypeByName("anim_spot_sofa")!, true, false, () => { }, furniture)
    })

    CHAIR_SEATS.forEach((seat) => {
        const anchor = createSeatAnchor(furniture, seat)
        addCustomInteraction(anchor, getAnimTypeByName("anim_spot_chair")!, true, false, () => { }, furniture)
    })

    // Mobile-only: lower the actual furniture model 0.15 on Y, done AFTER
    // the seats above are already set up so their (fixed, absolute) sit
    // positions are baked against the original couch height and don't move
    // with it. isMobile() needs a beat to resolve after scene start, hence
    // the delay instead of checking immediately.
    delay_ms_cb(1000, () => {
        if (isMobile()) {
            Transform.getMutable(furniture).position.y -= 0.15
        }
    })
}
