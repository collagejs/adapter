<script setup lang="ts" generic="TProps extends Record<string, any> = any">

import { mountPiece as defaultMountPiece, type AcceptableTarget, type MountPiece } from '@collagejs/core';
import { computed, inject, onMounted, ref, onUnmounted, watch, type PropType } from 'vue';
import type { PieceProps } from './types.js';
import { mountPieceContextKey } from './context.js';
import { CorePieceLcQueue, getPieceTarget, hostAttributes, unmountAndTransferLcQueue } from '@collagejs/adapter';

const props = defineProps({
    piece: {
        type: Object as PropType<PieceProps<TProps>['piece']>,
        required: true
    },
    shadow: {
        type: [Boolean, Object] as PropType<PieceProps<TProps>['shadow']>,
        required: false,
        default: false
    },
    pieceProps: {
        type: Object as PropType<TProps>,
        required: false,
        default: () => ({})
    }
});

/**
 * Container element reference.
 */
let cntEl = ref<HTMLDivElement | undefined>();
/**
 * Contextual `mountPiece` function, injected from the parent component or defaulting to the core implementation.
 */
const mountPiece = inject(mountPieceContextKey, defaultMountPiece) as MountPiece<TProps>;
/**
 * The lifecycle queue for the piece to manage mounting, unmounting, and updates.
 */
let lc: CorePieceLcQueue<TProps>;
/**
 * Standardized host attributes for the container element.
 */
const hostAttrs = computed(() => hostAttributes({ framework: 'vue', shadow: props.shadow }));
/**
 * Tracking variable for the current target for relocation purposes.
 */
let target: AcceptableTarget;

onMounted(() => {
    target = getPieceTarget(cntEl.value!, props.shadow);
    lc = new CorePieceLcQueue(props.piece, mountPiece);
    lc.mount(target, {
        ...props.pieceProps,
    } as TProps);
});

onUnmounted(() => {
    lc?.unmount();
});
/**
 * Runtime support for reactive shadow setting.
 */
watch(() => props.shadow, (newVal) => {
    const newTarget = getPieceTarget(cntEl.value!, newVal);
    if (newTarget === target) {
        return;
    }
    lc.relocate(target, newTarget, props.pieceProps as TProps);
    lc.enqueue(() => {
        target = newTarget;
    });
}, { flush: 'post' });
/**
 * Runtime support for reactive piece setting.
 */
watch(() => props.piece, (newVal) => {
    lc = unmountAndTransferLcQueue(lc, newVal, mountPiece);
    lc.mount(target, {
        ...props.pieceProps,
    } as TProps);
});
/**
 * Runtime support for property changes.
 */
watch(() => props.pieceProps, (newVal, oldVal) => {
    const newProps = {
        ...newVal
    } as TProps;
    // Set as undefined the properties that disappear
    for (const key in oldVal) {
        if (!(key in newVal)) {
            // @ts-expect-error TS2322: TProps could have required properties.  Cannot be helped.
            newProps[key] = undefined;
        }
    }
    lc.update(newProps);
});
</script>

<template>
    <div ref="cntEl" v-bind="hostAttrs" :key="JSON.stringify(shadow)"></div>
</template>