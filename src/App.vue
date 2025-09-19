<template>
  <div>
    <router-view />

    <!-- 전역 테마 토글 버튼 (모든 페이지에서 노출) -->
    <button
      class="fixed bottom-6 right-6 z-50 inline-flex items-center justify-center gap-2 rounded-full border border-gray-200 bg-white/90 px-4 py-2 text-sm font-medium shadow backdrop-blur transition hover:shadow-md dark:border-gray-700 dark:bg-gray-800/80"
      type="button"
      aria-label="Toggle dark mode"
      title="테마 전환"
      @click="toggleTheme"
    >
      <Sun v-if="isDark" class="h-5 w-5 text-yellow-300" />
      <Moon v-else class="h-5 w-5 text-gray-800 dark:text-gray-100" />
      <span class="hidden sm:inline">{{ isDark ? '라이트' : '다크' }} 모드</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { useTheme } from '@/composables/useTheme'
import { Sun, Moon } from 'lucide-vue-next'

// 전역 테마 상태/토글 제공
// - useTheme는 로컬스토리지에 테마를 저장하고, html(documentElement)에 light/dark 클래스를 적용합니다.
// - 초기 마운트 시 시스템 선호 테마를 반영하고, 토글 시 즉시 클래스가 갱신됩니다.
const { isDark, toggleTheme } = useTheme()
</script>

<!-- 글로벌 다크모드 오버라이드: 각 페이지의 Tailwind 유틸리티 클래스를 다크 환경에서 보기 좋게 재매핑합니다. -->
<style>
/* 접근성: 브라우저에 다크/라이트 색 구성표 제공 */
:root { color-scheme: light dark; }
html.dark { color-scheme: dark; }

/* 배경(페이지/카드 등) */
html.dark .bg-gray-50 { background-color: #030712 !important; } /* gray-950 */
html.dark .bg-white { background-color: #111827 !important; }   /* gray-900 */
html.dark .bg-gray-100 { background-color: #1F2937 !important; } /* gray-800 */

/* 테두리 */
html.dark .border-gray-200 { border-color: #374151 !important; } /* gray-700 */
html.dark .border-gray-300 { border-color: #4B5563 !important; } /* gray-600 */

/* 텍스트 컬러 매핑 (컨텍스트 한정: 어두운 배경 컨테이너 내부에서만 밝게 처리) */
html.dark .bg-gray-50 .text-gray-900, html.dark .bg-white .text-gray-900, html.dark .bg-gray-100 .text-gray-900 { color: #F9FAFB !important; } /* gray-50 */
html.dark .bg-gray-50 .text-gray-800, html.dark .bg-white .text-gray-800, html.dark .bg-gray-100 .text-gray-800 { color: #F3F4F6 !important; } /* gray-100 */
html.dark .bg-gray-50 .text-gray-700, html.dark .bg-white .text-gray-700, html.dark .bg-gray-100 .text-gray-700 { color: #E5E7EB !important; } /* gray-200 */
html.dark .bg-gray-50 .text-gray-600, html.dark .bg-white .text-gray-600, html.dark .bg-gray-100 .text-gray-600 { color: #D1D5DB !important; } /* gray-300 */

/* 호버 배경(리스트/카드 hover) */
html.dark .hover\:bg-gray-50:hover { background-color: #111827 !important; }

/* 폼 컨트롤(입력/셀렉트/텍스트영역) */
html.dark input[type="text"],
html.dark input[type="password"],
html.dark input[type="number"],
html.dark input[type="email"],
html.dark input[type="search"],
html.dark select,
html.dark textarea {
  background-color: #111827 !important; /* gray-900 */
  border-color: #374151 !important;      /* gray-700 */
  color: #E5E7EB !important;             /* gray-200 */
}

/* 플레이스홀더 컬러 */
html.dark ::placeholder { color: #9CA3AF !important; }

/* 구분선 */
html.dark hr { border-color: #374151 !important; }

/* 스크롤바(웹킷) */
html.dark ::-webkit-scrollbar { width: 10px; height: 10px; }
html.dark ::-webkit-scrollbar-track { background: #0b0f19; }
html.dark ::-webkit-scrollbar-thumb { background: #374151; border-radius: 8px; }
html.dark ::-webkit-scrollbar-thumb:hover { background: #4B5563; }
</style>