import {} from '@dcl/sdk/math'
import { engine } from '@dcl/sdk/ecs'
import { setupUi } from './ui'
import { setupPortals } from './portals'


export function main() {
    // uncomment the line below to initialize UI from ui.tsx
    //setupUi()

    setupPortals()
}

