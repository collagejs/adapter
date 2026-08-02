import type { CorePieceMeta } from "@collagejs/core";

/**
 * Makes sure that the metadata object (provided externally) does not contain core-defined meta information that is
 * calculated by framework adapters.
 * 
 * Emits console warnings if sanitation action is taken.
 * @param meta Metadata object to sanitize.
 * @returns The same metadata object that was provided.
 */
export function sanitizeMeta<TMeta extends Record<string, any>>(
    meta: TMeta | undefined,
    ...properties: (keyof CorePieceMeta)[]
) {
    if (meta && properties.length) {
        for (const property of properties) {
            if (property in meta) {
                console.warn(
                    `The 'meta.${property}' property is calculated automatically.  The specified value will be ignored.`
                );
                delete meta[property];
            }
        }
    }
    return meta;
}
