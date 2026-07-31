import { getContext, setContext } from "svelte";
import type { CollageContext } from "./types.js";

/**
 * Defines the context key used to store the parent-aware `mountPiece()` function.
 */
export const contextKey = Symbol();

/**
 * Obtains the *CollageJS* context, which is an object that contains the parent-aware `mountPiece()` function.
 * @returns The stored *CollageJS* context.
 */
export function getCollageContext() {
    return getContext<CollageContext>(contextKey);
};

/**
 * Sets the *CollageJS* context, which is an object that contains the parent-aware `mountPiece()` function.
 * @param context The *CollageJS* context to store.
 */
export function setCollageContext(context: CollageContext) {
    setContext<CollageContext>(contextKey, context);
}
