import type { Relocate } from "@collagejs/core";
import type { ComponentPropsWithoutRef } from "react";
import type { RootOptions } from "react-dom/client";

/**
 * Options for the `buildPiece()` function.
 */
export type BuildPieceOptions<
    TProps extends Record<string, any> = Record<string, any>,
    TMeta extends Record<string, any> = {},
> = {
    /**
     * Whether or not the piece can be remounted after it has been unmounted.
     *
     * - `true`:  The piece declares it can be remounted.
     * - `false`: The piece declares it cannot be remounted.
     *
     * Set it to `false` if the piece cannot guarantee the integrity of its internal state after it has been unmounted.
     * @default true
     */
    remountable?: boolean | undefined;
    /**
     * States whether or not the piece can be relocated to a different target after it has been mounted.
     *
     * - `supported`:  The piece declares it doesn't care if it is relocated; it does not affect it.
     * - `unsupported`: The piece declares it cannot be relocated.
     * - A `Relocate` function or array:  Logic that either prepares for relocation, or performs relocation.
     * @default 'supported'
     */
    relocation?: "supported" | "unsupported" | Relocate | undefined;
    /**
     * Initial set of properties for the component when it is mounted.
     * @default undefined
     */
    props?: TProps | undefined;
    /**
     * Optional metadata that is helpful for consumers to know about, or even functionality.
     * @default undefined
     */
    meta?: TMeta | undefined;
    /**
     * Optional React options for the creation of the root object.
     * @default undefined
     */
    rootOptions?: RootOptions | undefined;
};
/**
 * Options for the `piece()` function.
 */
export type PieceOptions = {
    /**
     * Optional props to be applied to the host `<div>` element that wraps the mounted piece.
     * @default undefined
     */
    containerProps?: ComponentPropsWithoutRef<"div"> | undefined;
    /**
     * Whether or not the piece should be mounted in a shadow root.
     * 
     * - `true`:  Mount the piece in an open shadow root with default options.
     * - `false`: Mount the piece in the light DOM (no shadow root).
     * - `ShadowRootInit`: Mount the piece in a shadow root with the specified options.
     * @default false
     */
    shadow?: boolean | ShadowRootInit | undefined;
    /**
     * Whether or not to enable logging for the piece's lifecycle events.  This is useful for debugging and development.
     * @default false
     */
    logging?: boolean | undefined;
};
