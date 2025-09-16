import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import LoginPage from '@/pages/LoginPage.vue'
import DashboardPage from '@/pages/DashboardPage.vue'
import HomePage from '@/pages/HomePage.vue'

// 라우트 설정
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/login',
    name: 'login',
    component: LoginPage,
    meta: { requiresGuest: true }
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: DashboardPage,
    meta: { requiresAuth: true }
  },
  {
    path: '/inventory',
    name: 'inventory',
    component: () => import('@/pages/InventoryPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/transactions',
    name: 'transactions',
    component: () => import('@/pages/TransactionsPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/users',
    name: 'users',
    component: () => import('@/pages/UsersPage.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('@/pages/SettingsPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/home',
    name: 'home',
    component: HomePage,
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/dashboard'
  }
]

// 라우터 인스턴스 생성
const router = createRouter({
  history: createWebHistory(),
  routes,
})

// 네비게이션 가드
router.beforeEach(async (to, from, next) => {
  const { isAuthenticated, isAdmin, fetchCurrentUser, user } = useAuth()
  
  // 토큰이 있지만 사용자 정보가 없는 경우 사용자 정보 가져오기
  if (isAuthenticated.value && !user.value) {
    await fetchCurrentUser()
  }
  
  // 인증이 필요한 페이지
  if (to.meta.requiresAuth && !isAuthenticated.value) {
    next('/login')
    return
  }
  
  // 관리자 권한이 필요한 페이지
  if (to.meta.requiresAdmin && !isAdmin.value) {
    next('/dashboard')
    return
  }
  
  // 게스트만 접근 가능한 페이지 (로그인 페이지)
  if (to.meta.requiresGuest && isAuthenticated.value) {
    next('/dashboard')
    return
  }
  
  next()
})

export default router
