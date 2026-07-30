import { logObject } from "../deps/uvUtils"
import { EventApiResponse, EventData } from "./apiTypes"

export class EventsService {
    private static _instance: EventsService
    public static instance(): EventsService {
        if(!EventsService._instance) {
            EventsService._instance = new EventsService()
        }
        return EventsService._instance
    }

    private readonly LIMIT = 100
    private _gotAllEvents = false
    private _events: EventData[] = []

    private constructor() {}

    async updateEventsList() {
        let url = 'https://events.decentraland.org/api/events/?limit=' + this.LIMIT
        try {

            let response = await fetch(url)
            let json = await response.json() as EventApiResponse

            if(!json.ok) {
                console.log('error getting event data ')
                logObject(json)
            }

            
            this._gotAllEvents = json.data.length < this.LIMIT
            this._events = json.data

        } catch (error) {
            console.log('error getting event data ', error)
            logObject(error)
        }
    }

    getUpcomingEvents(limit = 0) {
        let events = this._events.filter(event => new Date(event.next_start_at).getTime() > Date.now()).sort((a, b) => {
            return compareUpcomingEvents(a, b)
        })
        if(limit > 0 && events.length > limit){
            return events.slice(0, limit)
        }
        return events
    }

    getLiveEvents(limit = 0) {
        let events = this._events.filter(event => event.live).sort((a, b) => {
            return compareLiveEvents(a, b)
        })
        if(limit > 0 && events.length > limit){
            return events.slice(0, limit)
        }
        return events
    }

    getCommunityEvents(communityIds: string[], limit = 0) {
        let events = this._events.filter(event => communityIds.includes(event.community_id)).sort((a, b) => {
            return compareByDateEvents(a, b)
        })
        if(limit > 0 && events.length > limit){
            return events.slice(0, limit)
        }
        return events
    }

    getEventsByIds(ids: string[], limit = 0) {
        let events = this._events.filter(event => ids.includes(event.id)).sort((a, b) => {
            return genericCompareEvents(a, b)
        })
        if(limit > 0 && events.length > limit){
            return events.slice(0, limit)
        }
        return events
    }
    getCalendarEvents(limit = 0) {
        let events = this._events.filter(event => new Date(event.next_start_at).getTime() > Date.now()).sort((a, b) => {
            return compareUpcomingEvents(a, b)
        })
        if(limit > 0 && events.length > limit){
            return events.slice(0, limit)
        }
        return events
    }
}

function compareLiveEvents(a: EventData, b: EventData) {
    //highlighted events first
    if(a.highlighted && !b.highlighted){ return -1 }
    if(!a.highlighted && b.highlighted){ return 1 }

    //Number of attendees
    if(a.total_attendees > b.total_attendees){ return -1 }
    if(a.total_attendees < b.total_attendees){ return 1 }

    //No recurrent events first
    if(!a.recurrent && b.recurrent){ return -1 }
    if(a.recurrent && !b.recurrent){ return 1  }

    return 0
}

function compareByDateEvents(a: EventData, b: EventData) {
    //Closer start date first
    if(new Date(a.next_start_at).getTime() < new Date(b.next_start_at).getTime()){ return -1 }
    if(new Date(a.next_start_at).getTime() > new Date(b.next_start_at).getTime()){ return 1 }

    return 0
}

function compareUpcomingEventsPriorizeOneTimedEvents(a: EventData, b: EventData) {
    //Closer start date first
    if(a.start_at < b.start_at){ return -1 }
    if(a.start_at > b.start_at){ return 1 }
    
    //highlighted events first
    if(a.highlighted && !b.highlighted){ return -1 }
    if(!a.highlighted && b.highlighted){ return 1 }

    return 0
}
function compareUpcomingEvents(a: EventData, b: EventData) {
    //Closer start date first
    if(a.next_start_at < b.next_start_at){ return -1 }
    if(a.next_start_at > b.next_start_at){ return 1 }
    
    //highlighted events first
    if(a.highlighted && !b.highlighted){ return -1 }
    if(!a.highlighted && b.highlighted){ return 1 }

    return 0
}

function genericCompareEvents(a: EventData, b: EventData) {

    //highlighted events first
    if(a.highlighted && !b.highlighted){ return -1 }
    if(!a.highlighted && b.highlighted){ return 1 }
    //live events first
    if(a.live && !b.live){ return -1 }
    if(!a.live && b.live){ return 1 }
    //Not recurrent events first
    if(!a.recurrent && b.recurrent){ return -1 }
    if(a.recurrent && !b.recurrent){ return 1  }
    //reverse order for live events
    if(a.live && b.live){
        if(a.next_start_at > b.next_start_at){ return -1 }
        if(a.next_start_at < b.next_start_at){ return 1 } 
    }  
    
    //otherwise sort by next start date
    if(a.next_start_at < b.next_start_at){ return -1 }
    if(a.next_start_at > b.next_start_at){ return 1 } 

    return 0
}