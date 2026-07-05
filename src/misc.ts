import type { HostAttributesOptions } from "./types.js";

/**
 * Host HTML elements are marked with this attribute by official *CollageJS* framework adapters.  It carries one of 
 * 3 possible values:
 * 
 * - `dom`:  The mounted piece is hosted in a (light) DOM element.
 * - `open`:  The mounted piece is hosted in an open Shadow DOM element.
 * - `closed`:  The mounted piece is hosted in a closed Shadow DOM element.
 * 
 * @see {@link hostAttributes} for a function that generates this attribute for a given shadow configuration.
 */
export const hostDataAttribute = "data-cjs-piece-host";
/**
 * Data attribute applied to host HTML elements that indicate which framework mounted the piece.
 */
export const frameworkDataAttribute = "data-cjs-framework";
/**
 * Creates a spreadable object with host-related attributes for a given shadow configuration.
 * @param options Options for generating host-related attributes.
 * @returns An object that can be spread over an HTML element to apply the returned attributes.
 */
export function hostAttributes(options: HostAttributesOptions): Record<string, string> {
    const { shadow, framework } = options;
    const result: Record<string, string> = {};
    if (shadow !== undefined) {
        result[hostDataAttribute] = shadow === true ? "open" :
            shadow === false ? "dom" :
                typeof shadow === "object" ? shadow.mode :
                    shadow;
    }
    if (framework !== undefined) {
        result[frameworkDataAttribute] = framework;
    }
    return result;
}
