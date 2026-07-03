import type { AcceptableTarget } from "@collagejs/core";

/**
 * Returns the target for a `CorePiece` object based on the provided HTML element and shadow root configuration.
 * 
 * > **⚠️IMPORTANT**:  There is no check to see if the element already has a shadow root.  If it does and this 
 * > function is called asking for a shadow root, it will throw an error.  Ensure a clean element before using.
 * @param element HTML element used as anchor for the `CorePiece` object.
 * @param shadow Desired shadow root configuration for the `CorePiece` object.
 * @returns The target for the `CorePiece` object, which can be the element itself or its shadow root.
 */
export function getPieceTarget(element: HTMLElement, shadow: boolean | ShadowRootInit): AcceptableTarget {
    switch (shadow) {
        case false:
            return element;
        case true:
            return element.attachShadow({ mode: "open" });
        default:
            return element.attachShadow(shadow);
    }
}
