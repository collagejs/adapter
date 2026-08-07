import { createContext, useContext } from "react";
import type { MountPiece } from "@collagejs/core";

/**
 * React context object that stores the parent-aware CollageJS mount function.
 */
export const CollageContextObject =
    createContext<MountPiece | undefined>(undefined);

/**
 * Provider component for the CollageJS context.
 */
export const CollageProvider = CollageContextObject.Provider;

/**
 * Returns the current CollageJS context if one is available.
 */
export function useCollageContext() {
    return useContext(CollageContextObject);
}
