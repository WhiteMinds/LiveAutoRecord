import { onMounted, onUnmounted, ref } from 'vue'

export function useEffectInLifecycle(effect: () => () => void): void {
  const destroy = ref<() => void>()
  onMounted(() => {
    destroy.value = effect()
  })
  onUnmounted(() => {
    destroy.value?.()
  })
}
