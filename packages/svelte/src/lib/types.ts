import type { MountOptions, unmount } from "svelte";
import type { MountPiece, Relocate } from "@collagejs/core";

/**
 * Options for Svelte's `mount()` function.
 */
export type SvelteMountOptions<
    TProps extends Record<string, any> = Record<string, any>
> = Omit<MountOptions<TProps>, 'target'>;

/**
 * Options for the `buildPiece()` function.
 */
export type BuildPieceOptions<
    TProps extends Record<string, any> = Record<string, any>,
    TMeta extends Record<string, any> = {}
> = {
    /**
     * Optional options for Svelte's `mount()` function.  Refer to Svelte's `mount()` function documentation for
     * information about each option.
     * @default undefined
     */
    mount?: SvelteMountOptions<TProps>;
    /**
     * Optional options for Svelte's `unmount()` function.  Refer to Svelte's `unmount()` function documentation for
     * information about each option.
     * @default undefined
     */
    unmount?: Parameters<typeof unmount>[1];
    /**
     * Controls how the piece handles relocation.  If not specified, the default behavior is to accept relocation.
     * @default 'supported'
     */
        relocation?: 'supported' | 'unsupported' | Relocate;
    /**
     * Declares the produced core piece as remountable or not.
     *
     * - `false`: The core piece is not remountable and the fact is enforced by injecting a mount step that throws an
     * error if the piece is mounted more than once.
     * - `true`: The core piece is remountable and can be mounted multiple times.
     * @default true
     */
    remountable?: boolean | undefined;
    /**
     * Specify the desired metadata for the piece.
     *
     * - Specify `remountable: false` to inject a mount step that makes sure the piece object can only be mounted once.
     * @default undefined
     */
    meta?: TMeta;
};
/**
 * The *CollageJS* context.
 */
export type CollageContext = {
    /**
     * The parent-aware `mountPiece()` function, which is used to mount a child piece from within a parent piece.
     */
    mountPiece: MountPiece | undefined;
}
