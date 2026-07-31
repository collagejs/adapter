<script setup lang="ts" generic="TProps extends Record<string, any> = any">

import type { MountPiece } from '@collagejs/core';
import { computed, inject, onMounted, ref, onUnmounted, watch } from 'vue';
import type { PieceProps } from './types.js';
import { mountPieceContextKey } from './context.js';
import { CorePieceLcQueue, getPieceTarget, hostAttributes } from '@collagejs/adapter';

let cntEl = ref<HTMLDivElement | undefined>();

const mountPiece = inject(mountPieceContextKey) as MountPiece<TProps>;

let lc: CorePieceLcQueue<TProps>;

const props = defineProps<PieceProps<TProps>>();
const corePiece = computed(() => props.piece);
const shadow = computed(() => props.shadow ?? false);
const pieceProps = computed(() => props.pieceProps ?? {} as TProps);
const hostAttrs = computed(() => hostAttributes({ framework: 'vue', shadow: shadow.value }));
// let firstRun = true;

onMounted(() => {
    const target = getPieceTarget(cntEl.value!, shadow.value);
    lc = new CorePieceLcQueue(corePiece.value, mountPiece);
    lc.mount(target, {
        ...pieceProps.value,
    } as TProps);
});

onUnmounted(() => {
    lc?.unmount();
});

watch(pieceProps, (newVal, oldVal) => {
    console.log('Watcher: pieceProps changed:', newVal, oldVal);
    const newProps = {
        ...newVal
    };
    // Set as undefined the properties that disappear
    for (const key in oldVal) {
        if (!(key in newVal)) {
            // @ts-expect-error TS2322: TProps could have required properties.  Cannot be helped.
            newProps[key] = undefined;
        }
    }
    lc?.update(newProps);
});

// watchEffect(() => {
//     curInstance?.proxy?.$attrs;
//     if (firstRun) {
//         firstRun = false;
//         return;
//     }
//     console.log('Watcher: attrs changed:', curInstance?.proxy?.$attrs);
//     lc?.update(curInstance?.proxy?.$attrs as TProps);
// });
</script>

<template>
    <div ref="cntEl" v-bind="hostAttrs"></div>
</template>