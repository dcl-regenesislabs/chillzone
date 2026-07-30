import { EasingFunction, engine, Entity, Transform, Tween, tweenSystem } from "@dcl/sdk/ecs"
import { ContainerInfo } from "./pageContainer"
import { Quaternion, Vector3 } from "@dcl/sdk/math"
import { closeAllDescriptionPanels, EventBoardInfo, populateLiveEventPage, populateUpcomingPage } from "./boardLiveEvents"
import { EVENT_BOARD_TYPE } from "./config"
import { populateBlogPage } from "./blogCard"
import { populateCalendarPage } from "./setupCalendarPage"

// Tracks which of the 2 pool slots (index 0 or 1) is the currently visible page per board
const boardCurrentSlot = new Map<Entity, number>()

export function resetBoardSlot(eventBoard: Entity) {
    boardCurrentSlot.set(eventBoard, 0)
}

export function rotateEventCard(container:Entity, left:boolean, outwward: boolean){
    let rotationPivot = ContainerInfo.get(container).rotationPivot
    let scalePivot = ContainerInfo.get(container).scalePivot
    let dirMult = left ? -1 : 1
    let angle = dirMult * 60

    let startAngle = outwward ? 0 :  angle
    let endAngle = outwward ? angle : 0

    let startScale = outwward ?1 : 0.3
    let endScale = outwward ? 0.001: 1

    Tween.createOrReplace(rotationPivot, {
        duration: 300,
        easingFunction: EasingFunction.EF_EASEOUTCIRC,
        currentTime: 0,
        playing: true,
        mode: Tween.Mode.Rotate({
            start: Quaternion.fromEulerDegrees(0, startAngle, 0),
            end: Quaternion.fromEulerDegrees(0, endAngle, 0)
        })
    })
    Tween.createOrReplace(scalePivot, {
        duration: 300,
        easingFunction: EasingFunction.EF_EASEOUTCIRC,
        currentTime: 0,
        playing: true,
        mode: Tween.Mode.Scale({
            start: Vector3.create(startScale, startScale, 1),
            end: Vector3.create(endScale, endScale, 1)
        })
    })
}

export async function rotateWhenDocked(container:Entity, left:boolean, outwward: boolean){
    let rotationPivot = ContainerInfo.get(container).rotationPivot
    let scalePivot = ContainerInfo.get(container).scalePivot
    let dirMult = left ? -1 : 1
    let angle = dirMult * 60

    let startAngle = outwward ? 0 :  angle
    let endAngle = outwward ? 0 : 0

    let startScale = outwward ?1 : 0.001
    let endScale = outwward ? 0.001: 1

    if(!outwward){
        Tween.createOrReplace(container, {
            duration: 600,
            easingFunction: EasingFunction.EF_EASESINE,
            currentTime: 0,
            playing: true,
            mode: Tween.Mode.Move({
                start:Vector3.create(0,0,-1.5),
                end: Vector3.create(0,0,0)
            })
        })
    }
    Tween.createOrReplace(rotationPivot, {
        duration: 300,
        easingFunction: EasingFunction.EF_EASEOUTCIRC,
        currentTime: 0,
        playing: true,
        mode: Tween.Mode.Rotate({
            start: Quaternion.fromEulerDegrees(0, startAngle, 0),
            end: Quaternion.fromEulerDegrees(0, endAngle, 0)
        })
    })
    Tween.createOrReplace(scalePivot, {
        duration: outwward ? 600 : 300,
        easingFunction: EasingFunction.EF_EASEOUTCIRC,
        currentTime: 0,
        playing: true,
        mode: Tween.Mode.Scale({
            start: Vector3.create(startScale, startScale, 1),
            end: Vector3.create(endScale, endScale, 1)
        })
    })

}

export function scrollLiveEvents(eventBoard:Entity, left:boolean, isDocked:boolean = false){
    if(EventBoardInfo.get(eventBoard).pageDots.length <= 1){
        return
    }

    const eventBoardMutable = EventBoardInfo.getMutable(eventBoard)
    const pagesLength = eventBoardMutable.pageDots.length

    let nextPageIndex = eventBoardMutable.currentPageIndex + (left ? -1 : 1)
    if(nextPageIndex < 0){
        nextPageIndex = pagesLength - 1
    }else if(nextPageIndex >= pagesLength){
        nextPageIndex = 0
    }

    const currentSlot = boardCurrentSlot.get(eventBoard) ?? 0
    const incomingSlot = 1 - currentSlot

    switch (eventBoardMutable.type){
        case (EVENT_BOARD_TYPE.LIVE):
            populateLiveEventPage(eventBoardMutable.pages[incomingSlot], eventBoard, nextPageIndex)
            break
        case (EVENT_BOARD_TYPE.UPCOMING):
            populateUpcomingPage(eventBoardMutable.pages[incomingSlot], eventBoard, nextPageIndex)
            break
        case (EVENT_BOARD_TYPE.CALENDAR):
            populateCalendarPage(eventBoardMutable.pages[incomingSlot], eventBoard, nextPageIndex)
            break
        case (EVENT_BOARD_TYPE.BLOG):
            populateBlogPage(eventBoardMutable.pages[incomingSlot], eventBoard, nextPageIndex)
            break
    }

    if(isDocked){
        rotateWhenDocked(eventBoardMutable.pages[incomingSlot], !left, false)
        rotateWhenDocked(eventBoardMutable.pages[currentSlot], left, true)
    }
    else{
        rotateEventCard(eventBoardMutable.pages[incomingSlot], !left, false)
        rotateEventCard(eventBoardMutable.pages[currentSlot], left, true)
    }

    activatePagingDot(eventBoard, nextPageIndex)

    eventBoardMutable.currentPageIndex = nextPageIndex
    boardCurrentSlot.set(eventBoard, incomingSlot)
}

export function activatePagingDot(eventBoard:Entity, index:number){

    let eventBoardInfo = EventBoardInfo.get(eventBoard)
    let pageDots = eventBoardInfo.pageDots
    let activePagingDot = eventBoardInfo.activePagingDot
    Transform.getMutable(activePagingDot).parent = pageDots[index]
    Tween.createOrReplace(activePagingDot, {
        duration: 300,
        easingFunction: EasingFunction.EF_EASEOUTCIRC,
        currentTime: 0,
        playing: true,
        mode: Tween.Mode.Scale({
            start: Vector3.create(0.01, 0.01, 1),
            end: Vector3.create(1, 1, 1)
        })
    })
}

let timer = 0
export function autoScrollSystem(dt:number){
    timer += dt

    if (timer < 1) return
    timer = 0

    let eventBoardGroup = engine.getEntitiesWith(EventBoardInfo)
    for(let [eventBoard, info] of eventBoardGroup){
        if(!info.eventInteractionActive && info.autoScrollInterval > 0){
            let eventBoardInfo = EventBoardInfo.getMutable(eventBoard)
            eventBoardInfo.autoScrollElapsed += 1
            if(eventBoardInfo.autoScrollElapsed >= eventBoardInfo.autoScrollInterval){
                eventBoardInfo.autoScrollElapsed = 0
                scrollLiveEvents(eventBoard, false, true)
            }
        }
    }
}
