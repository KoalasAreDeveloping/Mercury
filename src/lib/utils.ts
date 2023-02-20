export function prepareRoute(route: string): string[] {

    // Ensure route ends with a slash
    if (route.slice(route.length -1, route.length) != "/") {
        route = route + "/"
    }

    // Remove first slash if it exists
    if (route.slice(0, 1) != "/") {
        route = route.substring(1)
    }

    return route.split("/")
    
}