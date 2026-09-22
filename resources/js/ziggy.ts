import { route as ziggyRoute, Config, RouteParam } from 'ziggy-js';
import { Ziggy } from './ziggy'; // Laravel injects this via @routes

declare global {
    interface Window {
        Ziggy: Config;
    }
}

export default function route(
    name: string,
    params?: RouteParam | RouteParam[],
    absolute?: boolean
) {
    const ziggyConfig = typeof Ziggy !== 'undefined' ? Ziggy : window.Ziggy;
    return ziggyRoute(name, params, absolute, ziggyConfig);
}
