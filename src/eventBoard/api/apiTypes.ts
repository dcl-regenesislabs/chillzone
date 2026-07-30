export enum EventRecurrenceFrequency {
    SECONDLY = "SECONDLY",
    MINUTELY = "MINUTELY",
    HOURLY = "HOURLY",
    DAILY = "DAILY",
    WEEKLY = "WEEKLY",
    MONTHLY = "MONTHLY",
    YEARLY = "YEARLY"
}

export type EventApiResponse = {
    ok: boolean
    data: EventData[]
}

export type EventData = {
    id: string
    name: string
    image: string
    description: string
    start_at: string
    finish_at: string
    coordinates: [string, string]
    x: number
    y: number
    user: string
    approved: boolean
    rejected: boolean
    trending: boolean
    created_at: string
    updated_at: string
    total_attendees: number
    latest_attendees: string[]
    url: string
    scene_name: string
    user_name: string
    server: string //realm name
    estate_id: string
    estate_name: string

    all_day: boolean
    recurrent: boolean

    recurrent_frequency: EventRecurrenceFrequency | null //Rrule FREQ configuration, see: https://datatracker.ietf.org/doc/html/rfc5545
    recurrent_weekday_mask: number                       //Rrule WEEKDAY configuration, see: https://datatracker.ietf.org/doc/html/rfc5545 minimum: 0
    recurrent_month_mask: number                         //Rrule BYMONTH configuration, see: https://datatracker.ietf.org/doc/html/rfc5545 minimum: 0
    recurrent_interval: number                           //Rrule INTERVAL configuration, see: https://datatracker.ietf.org/doc/html/rfc5545 minimum: 0
    recurrent_count: number | null
    recurrent_until: string | null
    recurrent_dates: string[]
    recurrent_setpos: number | null                      //Rrule BYSETPOS configuration, see: https://datatracker.ietf.org/doc/html/rfc5545 minimum: -1
    recurrent_monthday: number | null
    duration: number

    highlighted: boolean
    next_start_at: string
    next_finish_at: string
    categories: string[]
    schedules: string[]
    approved_by: string
    rejected_by: string
    attending: boolean                                      //Show if user is attending when searching by user
    notify: boolean                                         //Show if user get notify when searching by user
    position: string[]                                      //pattern: "^-?\\d{1,3}$"
    live: boolean
    world: boolean
    community_id: string
}
