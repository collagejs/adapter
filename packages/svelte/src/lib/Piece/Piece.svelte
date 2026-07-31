<script module lang="ts">
    const piecePropsSymbol = Symbol();

    /**
     * Defines the special properties accepted by the `Piece` component.  This type is to be used in conjunction with
     * the `piece()` helper function to create the special property required by the `Piece` component.
     */
    export type PieceProps<
        TProps extends Record<string, any> = Record<string, any>,
    > = {
        /**
         * The special property that contains the `CorePiece` instance to render, along with optional container
         * properties.
         */
        [piecePropsSymbol]: {
            /**
             * The `CorePiece` instance to render.
             */
            piece: CorePiece<TProps> | Promise<CorePiece<TProps>>;
            /**
             * Optional shadow DOM configuration for the container element that wraps the piece.
             */
            shadow?: boolean | ShadowRootInit;
            /**
             * Optional HTML attributes to set on the container element that wraps the piece.
             */
            containerProps?: HTMLAttributes<HTMLDivElement>;
            /**
             * Enables log entries for the various lifecycle events of the `CorePiece` component.  This is useful for
             * debugging and understanding the lifecycle of the piece, but be turned off for production builds.
             * @example
             * ```svelte
             * <Piece {...piece(myPiece, { lifecycleLogging: import.meta.env.DEV })} foo="bar" count={42} />
             * ```
             * @default false
             */
            lifecycleLogging?: boolean;
        };
    };

    /**
     * Helper function to create the special property required by the `Piece` component.  The result of this function
     * is to be spread into the props of the `Piece` component.
     *
     * @example
     * ```svelte
     * <Piece {...piece(myPiece, { containerProps: { onfocusin: focusInHandler } })} foo="bar" count={42} />
     * ```
     *
     * @param piece The `CorePiece` instance to render.
     * @param options Optional configuration for the `Piece` component.
     * @returns An object containing the special property to pass to the `Piece` component.
     */
    export function piece<
        TProps extends Record<string, any> = Record<string, any>,
    >(
        piece: CorePiece<TProps> | Promise<CorePiece<TProps>>,
        options?: Omit<PieceProps<TProps>[typeof piecePropsSymbol], "piece">,
    ) {
        return {
            [piecePropsSymbol]: {
                piece,
                ...options,
            },
        } satisfies PieceProps<TProps>;
    }
</script>

<script
    lang="ts"
    generics="TProps extends Record<string, any> = Record<string, any>"
>
    import { getCollageContext } from "$lib/collageContext.js";
    import {
        mountPiece,
        type AcceptableTarget,
        type CorePiece,
        type MountPiece,
    } from "@collagejs/core";
    import {
        CorePieceLcQueue,
        getPieceTarget,
        hostAttributes,
    } from "@collagejs/adapter";
    import { onMount, untrack } from "svelte";
    import type { HTMLAttributes } from "svelte/elements";

    type Props = TProps & PieceProps<TProps>;

    let { ...restProps }: Props = $props();

    const {
        piece: corePiece,
        containerProps,
        shadow = false,
        lifecycleLogging = false,
    } = $derived(restProps[piecePropsSymbol]);
    let containerEl = $state<HTMLDivElement | null>(null);
    let firstRun = true;
    const ctx = getCollageContext();
    const mountPieceFn = $derived(
        (ctx?.mountPiece as MountPiece<TProps, {}>) ?? mountPiece<TProps, {}>,
    );
    let lc = $state() as CorePieceLcQueue<TProps, {}>;
    let target: AcceptableTarget | undefined = undefined;

    onMount(() => {
        target = getPieceTarget(containerEl!, shadow);
        lc.mount(target, restProps);
        return async () => {
            await lc.unmount();
        };
    });

    $effect.pre(() => {
        const newLc = new CorePieceLcQueue<TProps>(corePiece, mountPieceFn, {
            enableLcLogging: untrack(() => lifecycleLogging),
        });
        const currentLc = untrack(() => lc);
        if (currentLc) {
            const [currPiece, currMountPiece, currMountedPiece] =
                currentLc.transferTo(newLc);
            if (currPiece !== corePiece || currMountPiece !== mountPieceFn) {
                newLc.enqueue(() => currMountedPiece?.unmount());
                newLc.mount(
                    target!,
                    untrack(() => restProps),
                );
            }
        }
        lc = newLc;
    });

    $effect(() => {
        shadow;
        if (firstRun || !target) {
            return;
        }
        const newTarget = getPieceTarget(containerEl!, shadow);
        if (newTarget === target) {
            return;
        }
        lc.relocate(target, newTarget, restProps);
        lc.enqueue(() => (target = newTarget));
    });

    $effect(() => {
        // Must be the first line so the dependency on restProps is tracked.
        const newProps = { ...restProps };
        if (firstRun) {
            firstRun = false;
            return;
        }
        delete (newProps as any)[piecePropsSymbol];
        lc.update(newProps);
    });
</script>

{#key shadow}
    <div
        bind:this={containerEl}
        {...containerProps}
        {...hostAttributes({ shadow, framework: "svelte" })}
    ></div>
{/key}


<style>
    div {
        display: contents;
    }
</style>

<!--
@component

### Piece Component

Renders a CollageJS "piece" (micro-frontend) inside a Svelte application.  The piece itself may be built using any
valid framework or library, as long as it adheres to the *CollageJS* `CorePiece` interface.

#### Props

Properties passed to the `Piece` component must include a special property created using the `piece()` helper
function. This property contains the `CorePiece` instance to render, along with optional container properties.  One can
also pass additional properties that will be forwarded to the mounted piece.

If the mounted piece supports property updates, any changes to the additional properties will be propagated to the
piece reactively as per the rules of Svelte's reactivity system.

#### Example Usage

1. Import the `Piece` component and the `piece()` helper function from the library.
2. Import whatever you need to get a hold of your `CorePiece` instance.  Normally, one imports a factory function that
creates the piece from a *bare module specifier* (an alias defined by your application's import map):
    ```typescript
    import { Piece, piece } from '@collagejs/svelte';
    import { myPieceFactory } from '@my/bare-module-specifier';
    ```
3. Create a `CorePiece` instance using your factory function.  Pass whatever arguments the factory function requires:
    ```typescript
    // Try to never call the factory function directly in the template code, as Svelte will re-run the factory function
    // on reactive updates.  Instead, create the piece in your component's script block and pass it to the template.
    const myPiece = myPieceFactory();
    ```
4. Render the `Piece` component in your Svelte template, passing the `CorePiece` instance using the `piece()` helper
function.  Also pass any additional properties that the piece supports:
    ```svelte
    <Piece {...piece(myPiece, { containerProps: { class: 'my-piece-container' } })} foo="bar" count={42} />
    ```

The above sets the `my-piece-container` CSS class on the container element that wraps the piece, and also passes the
`foo` and `count` properties to the mounted piece.  This example uses constant values in the properties, but you can
also pass stateful values that can update reactively, as if it were a regular Svelte component.

Online Documentation: Pending (https://collagejs.dev)
-->
