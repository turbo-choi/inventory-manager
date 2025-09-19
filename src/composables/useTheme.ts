import { ref, watch, computed } from 'vue'

type Theme = 'light' | 'dark'

export function useTheme() {
  const getPreferredTheme = (): Theme => {
    const saved = localStorage.getItem('theme') as Theme | null
    if (saved === 'light' || saved === 'dark') return saved
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
  }

  // 초기값을 저장된 선호 테마로 설정하여 즉시 반영되게 함
  const theme = ref<Theme>(getPreferredTheme())

  const applyTheme = (t: Theme) => {
    document.documentElement.classList.remove('light', 'dark')
    document.documentElement.classList.add(t)
    localStorage.setItem('theme', t)
  }

  const toggleTheme = () => {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
  }

  // theme 값이 바뀔 때만 적용하며, 즉시 초기값도 적용
  watch(
    theme,
    (t) => {
      applyTheme(t)
    },
    { immediate: true }
  )

  return {
    theme,
    toggleTheme,
    isDark: computed(() => theme.value === 'dark'),
  }
}
