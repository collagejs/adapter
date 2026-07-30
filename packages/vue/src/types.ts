import type { Relocate } from "@collagejs/core";
import type { App, VNodeProps } from "vue";

export type BuildPieceOptions<
    TProps extends VNodeProps = any,
    TMeta extends Record<string, any> = {}
> = {
    configureApp?: ((app: App<Element>) => void) | undefined;
    props?: TProps | undefined;
    relocation?: 'supported' | 'unsupported' | Relocate;
    remountable?: boolean;
    meta?: TMeta | undefined;
};

export type PieceOptions = {
    shadow?: boolean | ShadowRootInit;
};
