import { Event } from "../constants/events.constants";

export function handleEvent(eventType: string, data: any){
    switch (eventType) {
        case Event.USER_TYPING:
            // Handle USER_TYPING event
            console.log(data)
            break;
     
        default:
            break;
    }
}