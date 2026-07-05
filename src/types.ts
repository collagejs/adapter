import type { AcceptableTarget } from "@collagejs/core";

/**
 * Options for configuring a `CorePieceLcQueue` instance.
 */
export type CorePieceLcQueueOptions = {
    /**
     * Optional function that handles the relocation of the `CorePiece` object's root element(s). If not provided, a 
     * default relocation function will be used.
     * @default trivialRelocate
     */
    relocateFn?: (source: AcceptableTarget, target: AcceptableTarget) => Promise<boolean>;
    /**
     * Optional flag to enable logging for lifecycle events.
     * @default false
     */
    enableLcLogging?: boolean;
}
/**
 * Options for generating host-related attributes for an HTML element.
 */
export type HostAttributesOptions = {
    /**
     * Shadow configuration value that determines how the piece is hosted.
     */
    shadow?: boolean | ShadowRootInit | ShadowRootMode;
    /**
     * Optional string that indicates which framework mounted the piece (Svelte, React, etc.).
     */
    framework?: string;
}
