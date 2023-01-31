export function prepareRoute(route: string): string {

    // Ensure route ends with a slash
    if (route.slice(route.length -1, route.length) != "/") {
        route = route + "/"
    }

    return route
    
}