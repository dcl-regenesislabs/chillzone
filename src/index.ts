import {} from '@dcl/sdk/math'
import { engine, pointerEventsSystem, InputAction } from '@dcl/sdk/ecs'
import { openExternalUrl } from '~system/RestrictedActions'
import { setupUi } from './ui'
import { EntityNames } from '../assets/scene/entity-names'


export function main() {
    // uncomment the line below to initialize UI from ui.tsx
    //setupUi()

    // your scene code here

    const smartphone = engine.getEntityOrNullByName(EntityNames.SmartPhone)
    if (smartphone) {
        pointerEventsSystem.onPointerDown(
            {
                entity: smartphone,
                opts: { button: InputAction.IA_POINTER, hoverText: 'Follow Decentraland on X' },
            },
            () => {
                openExternalUrl({ url: 'https://x.com/decentraland' })
            }
        )
    }

    const laptop = engine.getEntityOrNullByName(EntityNames.Laptop)
    if (laptop) {
        pointerEventsSystem.onPointerDown(
            {
                entity: laptop,
                opts: { button: InputAction.IA_POINTER, hoverText: 'Connect with the Community' },
            },
            () => {
                openExternalUrl({ url: 'https://discord.gg/6RvBZYXFBf' })
            }
        )
    }
}

