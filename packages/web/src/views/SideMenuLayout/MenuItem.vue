<template>
  <router-link
    :to="{ name: routeName }"
    class="text-[#06485D] py-4 px-2 rounded hover:bg-[#DBDFE1] hover:shadow flex space-x-2"
    active-class="bg-[#DBDFE1] shadow"
  >
    <slot name="icon" :svgProps="{ width: 24, height: 24 }"></slot>
    <div><slot></slot></div>
  </router-link>
</template>

<script setup lang="ts">
defineProps<{
  routeName: string
}>()
</script>
