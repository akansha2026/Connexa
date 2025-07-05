import { IMAGE_BASEURL_PREFIX } from "../constants/service.constants";

export function isValidImageUrl(url: any){
    if(typeof url !== "string") return false
    return url.startsWith("http") || url.startsWith(IMAGE_BASEURL_PREFIX)
}