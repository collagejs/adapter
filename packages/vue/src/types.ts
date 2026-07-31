import type { CorePiece, Relocate } from "@collagejs/core";
import type { App, VNodeProps } from "vue";

/**
 * Defines the options for creating a *CollageJS* core piece from a Vue component.  These options allow you to
 * configure the piece's behavior, including how it is mounted, updated, and relocated.
 */
export type BuildPieceOptions<
    TProps extends VNodeProps = any,
    TMeta extends Record<string, any> = {}
> = {
    /**
     * Callback function executed when the *CollageJS* piece is mounted.  Use it to configure the Vue application,
     * such as adding plugins, global components or context.
     * @default undefined
     */
    configureApp?: ((app: App<Element>) => void) | undefined;
    /**
     * Initial props to pass to the Vue component when the *CollageJS* piece is mounted.
     * @default undefined
     */
    props?: TProps | undefined;
    /**
     * Controls how the *CollageJS* piece relocates.
     *
     * - `"supported"`:  The generated DOM trees can be relocated to a different location in the DOM, and the Vue
     * component has no special requirements for relocation.
     * - `"unsupported"`:  The generated DOM trees cannot be relocated to a different location in the DOM.
     * - `Relocate`:  A function or array of functions that defines custom relocation behavior for the *CollageJS* piece.
     * @default "supported"
     */
    relocation?: "supported" | "unsupported" | Relocate;
    /**
     * Declare the Vue component's capability to be mounted repeatedly.
     *
     * - `true`:  The Vue component can be mounted repeatedly.  This is the default behavior.
     * - `false`:  The Vue component cannot be mounted repeatedly.  Use this value for components that lose internal
     * state integrity when unmounted.
     * @default true
     */
    remountable?: boolean;
    /**
     * Additional metadata to associate with the *CollageJS* piece.  This metadata can be used to store arbitrary
     * information about the piece, such as its version, author, or any other relevant data.
     * @default undefined
     */
    meta?: TMeta | undefined;
};
/**
 * Defines the properties for the `<Piece>` component.  This component is used to mount a *CollageJS* core piece in a
 * Vue application.
 */
export type PieceProps<TProps extends Record<string, any> = any> = {
    /**
     * The *CollageJS* piece to mount.  This can be a core piece or a promise that resolves to a core piece.
     */
    piece: CorePiece<TProps> | Promise<CorePiece<TProps>>;
    /**
     * Controls whether the piece is mounted in a shadow root.
     *
     * - `true`:  The piece will be mounted in an open shadow root with default options.
     * - `false`:  The piece will be mounted in the light DOM.
     * - `ShadowRootInit`:  The piece will be mounted in a shadow root with the specified options.
     * @default false
     */
    shadow?: boolean | ShadowRootInit;
    /**
     * The props to pass to the piece when it is mounted.  These props will be merged with any props specified in the
     * piece itself when mounting.
     * @default undefined
     */
    pieceProps?: TProps;
};
