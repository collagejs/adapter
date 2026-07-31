import { contextKey } from "$lib/collageContext.js";
import type { BuildPieceOptions } from "$lib/types.js";
import { type AcceptableTarget, type CorePiece, type CorePieceMeta, mountPieceKey, type MountProps, preventRemount } from "@collagejs/core";
import { mount, unmount, type Component } from "svelte";

/**
 * Class used to track instances.
 */
class SveltePiece<TProps extends Record<string, any> = Record<string, any>> {
    props = $state({} as TProps);
    target?: AcceptableTarget;
    instance?: Object;
}

/**
 * Creates a `buildPiece` function for Svelte v5 components.
 * @param mountFn Svelte's mount() function (or a substitute).
 * @param unmountFn Svelte's unmount() function (or a substitute).
 * @returns A `buildPiece` function that uses the given mounting and unmounting functions.
 */
export function buildPieceFactory(
    mountFn = mount,
    unmountFn = unmount
) {
    return function <
        TProps extends Record<string, any> = Record<string, any>,
        TMeta extends Record<string, any> = {}
    >(
        component: Component<TProps>,
        options?: BuildPieceOptions<TProps, TMeta>
    ) {
        if (!component) {
            throw new Error('No component was given to the function.');
        }
        if ((options?.mount as any)?.target) {
            console.warn("Specifying the 'target' mount option has no effect.");
        }
        if (options?.meta) {
            if ('remountable' in options.meta) {
                console.warn("The 'meta.remountable' property is calculated automatically.  The specified value will be ignored.");
                delete options.meta.remountable;
            }
            if ('relocatable' in options.meta) {
                console.warn("The 'meta.relocatable' property is calculated automatically.  The specified value will be ignored.");
                delete options.meta.relocatable;
            }
        }
        const thisValue = new SveltePiece<TProps>();

        async function mountComponent(this: SveltePiece<TProps>, target: AcceptableTarget, props?: MountProps<TProps>) {
            this.target = target;
            // Don't lose any potential incoming context.
            const context = options?.mount?.context ?? new Map();
            context.set(contextKey, {
                mountPiece: props?.[mountPieceKey]
            });
            delete props?.[mountPieceKey];
            const mergedProps = {
                ...options?.mount?.props,
                ...props
            } as TProps;
            for (let key in mergedProps) {
                this.props[key] = mergedProps[key];
            }
            this.instance = mountFn(component, {
                ...options?.mount,
                context,
                target: this.target,
                props: this.props
            });
            return async () => {
                if (!this.instance) {
                    throw new Error('Cannot unmount:  There is no component to unmount.');
                }
                await unmountFn(this.instance, options?.unmount);
                this.instance = undefined;
                this.target = undefined;
                this.props = {} as TProps;
            };
        }

        function updateComponent(this: SveltePiece<TProps>, newProps: TProps) {
            if (!this.instance) {
                return Promise.reject(new Error('Cannot update:  No component has been mounted.'));
            }
            for (let key in newProps) {
                this.props[key] = newProps[key];
            }
            // TODO: Perhaps we need await tick() here?
            return Promise.resolve();
        }

        const relocation = options?.relocation ?? 'supported';
        const meta = {
            remountable: options?.remountable ?? true,
            relocatable: !!relocation && relocation != 'unsupported',
            ...options?.meta,
        };

        return {
            mount: [meta.remountable === false && preventRemount(), mountComponent.bind(thisValue)] as const,
            update: updateComponent.bind(thisValue),
            relocate: typeof relocation === 'string' ? () => Promise.resolve(relocation) : relocation,
            get meta() {
                return meta as CorePieceMeta & TMeta;
            }
        } satisfies CorePiece<TProps, TMeta>;
    }
}
