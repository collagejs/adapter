<script setup lang="ts">
import HelloWorld from './components/HelloWorld.vue'
export interface Props {
  /** 
   * The message to display in the header.
   */
  msg: string;
}
export interface Exposed {
  test: typeof test;
}
const props = defineProps<Props>();
function test() {
  console.log('test')
}
defineExpose({
  test
})
</script>

<template>
  <h1>{{ props.msg || '(set message first)' }}</h1>
  <HelloWorld />
</template>
