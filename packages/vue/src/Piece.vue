<script setup lang="ts" generic="TProps extends Record<string, any> = any">

import type { CorePiece, MountPiece } from '@collagejs/core';
import { computed, inject, onMounted, ref, getCurrentInstance, onUnmounted, watch } from 'vue';
import type { PieceOptions } from './types.js';
import { mountPieceContextKey } from './context.js';
import { CorePieceLcQueue, getPieceTarget, hostAttributes } from '@collagejs/adapter';

type Props = PieceOptions & {
    piece: CorePiece<TProps> | Promise<CorePiece<TProps>>;
    pieceProps?: TProps;
};

let cntEl = ref<HTMLDivElement | undefined>();

const mountPiece = inject(mountPieceContextKey) as MountPiece<TProps>;

defineOptions({
    inheritAttrs: false,
});

let lc: CorePieceLcQueue<TProps>;

const props = defineProps<Props>();
const corePiece = computed(() => props.piece);
const shadow = computed(() => props.shadow ?? false);
const pieceProps = computed(() => props.pieceProps ?? {} as TProps);
const hostAttrs = computed(() => hostAttributes({ framework: 'vue', shadow: shadow.value }));

const curInstance = getCurrentInstance();
console.log('Props: ', pieceProps.value);
console.log('Attributes: ', curInstance?.attrs);
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
    lc?.update(newVal);
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