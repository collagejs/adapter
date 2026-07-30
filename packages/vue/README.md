# @collagejs/vue

## Research

- [single-spa-vue](https://github.com/single-spa/single-spa-vue)
- [Typescript content with generic and Partial](https://github.com/orgs/vuejs/discussions/9823)
- [Compound component with passing props](https://github.com/orgs/vuejs/discussions/12955)
- [What TypeScript type to use for a variable to contain a mounted Vue Component](https://github.com/orgs/vuejs/discussions/13808)

### Watching

**Composition API**:
```vue
<script setup>
import { ref, reactive, watch, watchEffect } from 'vue'

// Reactive state
const count = ref(0)
const user = reactive({ name: 'Alice', age: 25 })

// Watch a single ref
watch(count, (newVal, oldVal) => {
  console.log(`count changed from ${oldVal} to ${newVal}`)
})

// Watch a reactive object's property
watch(() => user.age, (newAge, oldAge) => {
  console.log(`Age changed from ${oldAge} to ${newAge}`)
})

// Watch deeply for nested changes
watch(user, (newVal, oldVal) => {
  console.log('User object changed:', newVal)
}, { deep: true })

// Automatically run whenever dependencies change
watchEffect(() => {
  console.log(`User is ${user.name} and count is ${count.value}`)
})
</script>

<template>
  <div>
    <p>{{ user.name }} - {{ user.age }}</p>
    <p>Count: {{ count }}</p>
    <button @click="count++">Increment</button>
    <button @click="user.age++">Increase Age</button>
  </div>
</template>
```

**Options API**:
```vue
<template>
  <div>
    <p>{{ message }}</p>
    <input v-model="message" />
  </div>
</template>

<script>
export default {
  data() {
    return {
      message: 'Hello Vue!'
    }
  },
  watch: {
    message(newVal, oldVal) {
      console.log(`Message changed from "${oldVal}" to "${newVal}"`)
    }
  }
}
</script>
```

