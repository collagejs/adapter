import { createApp, type Component, h, reactive, type App, type VNodeProps, type ComponentPublicInstance } from "vue";
import type { BuildPieceOptions } from "./types.js";
import { mountPiece as coreMountPiece, mountPieceKey, preventRemount, type AcceptableTarget, type CorePiece, type CorePieceMeta, type MountPiece } from "@collagejs/core";
import { mountPieceContextKey } from "./context.js";

export type MountProps<TProps extends Record<string, any> = Record<string, any>> = TProps & {
    [x: symbol]: MountPiece;
};

class PieceContext<TProps extends VNodeProps> {
    #initialProps: TProps | undefined;
    app: App<Element> | undefined;
    props: TProps;
    instance: ComponentPublicInstance<TProps> | undefined;

    constructor(initialProps?: TProps) {
        this.#initialProps = initialProps;
        this.props = reactive({}) as TProps;
    }

    createApp(component: Component<TProps>, props?: TProps) {
        this.props = reactive({
            ...this.#initialProps,
            ...props
        }) as TProps;
        this.app = createApp({
            render: () => h(component, this.props)
        });
        return this.app;
    }
}

export function buildPiece<
    TProps extends Record<string, any> = Record<string, any>,
    TMeta extends Record<string, any> = {}
>(component: Component<TProps>, options?: BuildPieceOptions<TProps, TMeta>) {
    const pieceContext = new PieceContext<TProps>(options?.props);
    
    const relocation = options?.relocation ?? 'supported';
    const meta = {
        remountable: options?.remountable ?? true,
        relocatable: !!relocation && relocation !== 'unsupported',
        ...options?.meta
    };

    return {
        mount: [meta.remountable === false && preventRemount(), mountComponent.bind(pieceContext)] as const,
        update: updateComponent.bind(pieceContext),
        relocate: typeof relocation === 'string' ?
            () => Promise.resolve(relocation) :
            relocation,
        get meta() {
            return meta as CorePieceMeta & TMeta;
        }
    } satisfies CorePiece<TProps, TMeta>;

    async function mountComponent(this: PieceContext<TProps>, target: AcceptableTarget, props?: MountProps<TProps>) {
        const mountPiece = props?.[mountPieceKey];
        delete props?.[mountPieceKey];
        const app = this.createApp(component, props);
        app.provide(mountPieceContextKey, mountPiece ?? coreMountPiece);
        options?.configureApp?.(app);
        let targetElement: Element | ShadowRoot;
        if (target instanceof ShadowRoot) {
            targetElement = globalThis.document.createElement('div');
            target.appendChild(targetElement);
        }
        else {
            targetElement = target;
        }
        this.instance = app.mount(targetElement) as ComponentPublicInstance<TProps>;
        return () => {
            app.unmount();
            targetElement.remove();
            this.instance = undefined;
            return Promise.resolve();
        }
    }

    async function updateComponent(this: PieceContext<TProps>, newProps: TProps) {
        if (!this.instance) {
            throw new Error('Cannot update:  No component has been mounted.');
        }
        for (let key in newProps) {
            const typedKey = key as keyof TProps;
            this.props[typedKey] = newProps[typedKey];
        }
        return Promise.resolve();
    }
}
