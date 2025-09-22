<template>
  <div class="min-h-screen bg-gray-50 text-gray-900 transition-colors duration-200 dark:bg-gray-950 dark:text-gray-100">
    <!-- 고정 헤더: 라우트 전환 영역 밖 -->
    <header class="fixed top-0 inset-x-0 z-40 border-b border-gray-200/80 bg-white/70 backdrop-blur dark:border-gray-700/60 dark:bg-gray-900/60">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <!-- 브랜드 + 내비게이션 -->
        <div class="flex items-center gap-3">
          <router-link :to="{ name: 'dashboard' }" aria-label="재고 관리 시스템" class="inline-flex items-center gap-2 px-2 py-1 text-sm font-semibold tracking-tight text-gray-900 dark:text-gray-100 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 whitespace-nowrap shrink-0">
             <svg class="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
             </svg>
             <span class="hidden sm:inline">재고 관리 시스템</span>
           </router-link>
          <nav class="flex items-center gap-1">
            <router-link
              v-for="link in navLinks"
              :key="link.name"
              :to="{ name: link.name }"
              :aria-current="isActive(link.name) ? 'page' : undefined"
              class="inline-flex items-center gap-2 rounded-md border border-transparent px-3 py-1.5 text-sm font-medium transition-colors"
              :class="isActive(link.name)
                ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100'
                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'"
            >
              <component :is="link.icon" class="h-4 w-4" />
              <span class="hidden sm:inline">{{ link.label }}</span>
            </router-link>
          </nav>
        </div>

        <!-- 사용자 메뉴 / 로그인 버튼 -->
        <div class="relative flex items-center gap-2">

          <!-- 알림 (뱃지 포함) -->
           <div class="relative">
             <button
               type="button"
               class="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white/80 shadow-sm backdrop-blur transition hover:shadow dark:border-gray-700 dark:bg-gray-800/70"
               @click="toggleNotifications"
               aria-haspopup="menu"
               :aria-expanded="isNotificationsOpen"
               aria-label="알림"
             >
               <Bell class="h-4 w-4" />
              <span v-if="unreadCount > 0" class="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-semibold leading-4 text-white ring-2 ring-white dark:ring-gray-900">
                {{ unreadCount }}
              </span>
            </button>

            <!-- 알림 오버레이 -->
            <div v-if="isNotificationsOpen" class="fixed inset-0 z-40" @click="isNotificationsOpen = false"></div>

            <!-- 알림 드롭다운 -->
            <div
              v-if="isNotificationsOpen"
              class="absolute right-0 top-11 z-50 w-72 overflow-hidden rounded-lg border border-gray-200 bg-white/95 p-1.5 shadow-lg backdrop-blur dark:border-gray-700 dark:bg-gray-900/95"
              role="menu"
              aria-label="알림 목록"
            >
              <div class="flex items-center justify-between px-2 py-2">
                <span class="text-xs text-gray-500 dark:text-gray-400">알림</span>
                <button class="text-xs text-indigo-600 hover:underline" @click="markAllAsRead">모두 읽음</button>
              </div>
              <ul v-if="notifications.length > 0" class="max-h-80 overflow-y-auto">
                <li v-for="n in notifications" :key="n.id" class="rounded-md px-2.5 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800">
                  <p class="text-gray-800 dark:text-gray-200">{{ n.title }}</p>
                  <p class="mt-0.5 text-xs text-gray-500">{{ n.time }}</p>
                </li>
              </ul>
              <div v-else class="px-2 py-3 text-sm text-gray-500">새 알림이 없습니다.</div>
            </div>
          </div>

          <template v-if="isAuthenticated">
            <button
              type="button"
              class="group inline-flex items-center gap-3 rounded-full border border-gray-200 bg-white/80 px-2.5 py-1.5 text-sm shadow-sm backdrop-blur transition hover:shadow dark:border-gray-700 dark:bg-gray-800/70"
              @click="isUserMenuOpen = !isUserMenuOpen"
              aria-haspopup="menu"
              :aria-expanded="isUserMenuOpen"
            >
              <span class="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-700 ring-1 ring-inset ring-gray-200 dark:bg-gray-700 dark:text-gray-100 dark:ring-gray-600">
                {{ user?.name?.[0] ?? 'U' }}
              </span>
              <span class="hidden md:flex flex-col text-left leading-tight">
                <span class="font-medium text-gray-900 dark:text-gray-100">{{ user?.name }}</span>
                <span class="text-[11px] text-gray-500 dark:text-gray-400">{{ user?.email }}</span>
              </span>
            </button>

            <!-- 오버레이: 바깥 클릭으로 닫기 -->
            <div v-if="isUserMenuOpen" class="fixed inset-0 z-40" @click="isUserMenuOpen = false"></div>

            <!-- 드롭다운 메뉴 -->
            <div
              v-if="isUserMenuOpen"
              class="absolute right-0 top-12 z-50 w-56 overflow-hidden rounded-lg border border-gray-200 bg-white/95 p-1.5 shadow-lg backdrop-blur dark:border-gray-700 dark:bg-gray-900/95"
              role="menu"
            >
              <div class="px-2 py-2 text-xs text-gray-500 dark:text-gray-400">
                {{ user?.email }}
              </div>
              <!-- 프로필 보기 -->
              <button
                class="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                role="menuitem"
                @click="openProfile"
              >
                <UserIcon class="h-4 w-4" />
                프로필
              </button>
              <router-link
                :to="{ name: 'settings' }"
                class="flex items-center gap-2 rounded-md px-2.5 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                role="menuitem"
                @click="isUserMenuOpen = false"
              >
                <Settings class="h-4 w-4" />
                설정
              </router-link>
              
              <button
                class="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                role="menuitem"
                @click="handleLogout"
              >
                <LogOut class="h-4 w-4" />
                로그아웃
              </button>
            </div>
          </template>
          <template v-else>
            <router-link
              :to="{ name: 'login' }"
              class="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white/80 px-3 py-1.5 text-sm font-medium shadow-sm backdrop-blur transition hover:shadow dark:border-gray-700 dark:bg-gray-800/70"
            >
              <UserIcon class="h-4 w-4" />
              로그인
            </router-link>
          </template>
        </div>
      </div>
    </header>

    <!-- 라우트 콘텐츠: 고정 헤더/푸터 높이만큼 패딩 확보 -->
    <main class="pt-14 pb-12">
      <router-view v-slot="{ Component }">
        <transition name="slide-fade" mode="out-in" appear>
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <!-- 고정 푸터: 라우트 전환 영역 밖 -->
    <footer class="fixed bottom-0 inset-x-0 z-40 border-t border-gray-200/80 bg-white/70 backdrop-blur dark:border-gray-700/60 dark:bg-gray-900/60">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-10 flex items-center justify-between">
        <p class="text-xs text-gray-600 dark:text-gray-300">© 2025 Inventory Manager</p>
        <div class="text-xs text-gray-500 dark:text-gray-400">v1.0</div>
      </div>
    </footer>

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
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTheme } from '@/composables/useTheme'
import { useAuth } from '@/composables/useAuth'
import { Sun, Moon, LayoutDashboard, Boxes, ListOrdered, Users as UsersIcon, Settings, User as UserIcon, Bell, LogOut } from 'lucide-vue-next'

// 전역 테마 상태/토글 제공
// - useTheme는 로컬스토리지에 테마를 저장하고, html(documentElement)에 light/dark 클래스를 적용합니다.
// - 초기 마운트 시 시스템 선호 테마를 반영하고, 토글 시 즉시 클래스가 갱신됩니다.
const { isDark, toggleTheme } = useTheme()

// 인증 상태/정보
const { user, isAuthenticated, isAdmin, authenticatedFetch, logout } = useAuth()

// 라우터/현재 경로
const route = useRoute()
const router = useRouter()

// 내비 링크 (권한 기반)
const navLinks = computed(() => {
  const base = [
    { name: 'dashboard' as const, label: '대시보드', icon: LayoutDashboard },
    { name: 'inventory' as const, label: '재고', icon: Boxes },
    { name: 'transactions' as const, label: '입출고', icon: ListOrdered },
  ]
  const tail = [
    { name: 'settings' as const, label: '설정', icon: Settings },
  ]
  const admin = isAdmin.value ? [{ name: 'users' as const, label: '사용자', icon: UsersIcon }] : []
  return [...base, ...admin, ...tail]
})

/** 현재 라우트가 활성 상태인지 확인 */
function isActive(name: string) {
  return route.name === name
}

// 사용자 메뉴 상태
 const isUserMenuOpen = ref(false)
 
/** 전역 검색 제거됨 - 관련 상태/함수 삭제 */
 const isNotificationsOpen = ref(false)
/** 알림 목록 */
const notifications = ref<{ id: number; title: string; time: string; read: boolean }[]>([])
/** 안 읽은 알림 수 */
const unreadCount = computed(() => notifications.value.filter(n => !n.read).length)

/** 알림 토글 및 최초 열림 시 로드 */
function toggleNotifications() {
  isNotificationsOpen.value = !isNotificationsOpen.value
  if (isNotificationsOpen.value && notifications.value.length === 0) {
    void loadNotifications()
  }
}

/** 모든 알림을 읽음 처리 */
function markAllAsRead() {
  notifications.value = notifications.value.map(n => ({ ...n, read: true }))
}

/** 재고 부족 항목을 기반으로 간단한 알림을 로드 */
async function loadNotifications() {
  try {
    const params = new URLSearchParams({ page: '1', limit: '5', low_stock: 'true' })
    const res = await authenticatedFetch(`/api/inventory?${params}`)
    const data = await res.json()
    if (data?.success) {
      notifications.value = (data.data || []).map((d: any, idx: number) => ({
        id: Number(d.id ?? idx),
        title: `${d.name} 재고 부족 (${Number(d.current_stock ?? d.current_quantity ?? 0)})`,
        time: new Date(d.updated_at ?? Date.now()).toLocaleString('ko-KR'),
        read: false
      }))
    }
  } catch (_e) {
    // 실패 시 조용히 무시
  }
}

/** 날짜-시간 포맷터 (프로필 모달 표기용) */
function _formatDateTime(value?: string) {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(+d)) return '-'
  return d.toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

/** 프로필 모달 상태 */
const isProfileModalOpen = ref(false)
/** 프로필 모달 열기 */
function openProfile() { isUserMenuOpen.value = false; isProfileModalOpen.value = true }
/** 프로필 모달 닫기 */
function _closeProfile() { isProfileModalOpen.value = false }
async function handleLogout() {
  try {
    await logout()
  } finally {
    isUserMenuOpen.value = false
    router.push({ name: 'login' })
  }
}
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

/* 라우트 전환: 좌우 슬라이드 + 페이드 (배경 깜빡임 방지용) */
.slide-fade-enter-active, .slide-fade-leave-active {
  transition: opacity 160ms ease, transform 220ms cubic-bezier(0.22, 1, 0.36, 1);
  will-change: opacity, transform;
}
.slide-fade-enter-from {
  opacity: 0;
  transform: translateX(12px);
}
.slide-fade-enter-to {
  opacity: 1;
  transform: translateX(0);
}
.slide-fade-leave-from {
  opacity: 1;
  transform: translateX(0);
}
.slide-fade-leave-to {
  opacity: 0;
  transform: translateX(-12px);
}
@media (prefers-reduced-motion: reduce) {
  .slide-fade-enter-active, .slide-fade-leave-active { transition: opacity 150ms ease; }
  .slide-fade-enter-from, .slide-fade-leave-to { transform: none; }
}
</style>