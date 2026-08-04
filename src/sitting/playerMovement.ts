import { engine, InputModifier } from "@dcl/sdk/ecs"

export function movementEmoteOnly() {
    InputModifier.createOrReplace(engine.PlayerEntity, {
        mode: {
            $case: 'standard',
            standard: {
                disableJog: true,
                disableJump: true,
                disableRun: true,
                disableWalk: true
            }
        },
    })
}

export function movementAll() {
    InputModifier.createOrReplace(engine.PlayerEntity, {
        mode: {
            $case: 'standard',
            standard: {
                disableAll: false
            },
        },
    })
}
