import type { MountPiece } from "@collagejs/core";
import type { InjectionKey } from "vue";

/**
 * Key used to provide (as in `app.provide()`) the parent-aware `mountPiece` function to the component tree.
 * 
 * - `CorePiece` objects created with `buildPiece()` will automatically provide this key to the component tree when
 * the piece mounts.
 * - The `Piece` component will inject the value and will default to the core library's `mountPiece()` function if the
 * key is not found.
 * 
 * *Generally speaking, you should not need to use this key directly.*
 */
export const mountPieceContextKey = Symbol() as InjectionKey<MountPiece>;
