<template>
  <div class="min-h-screen bg-gray-50">
    <!-- 헤더 -->
    <header class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center">
            <div class="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center mr-3">
              <svg class="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h1 class="text-xl font-semibold text-gray-900">재고 관리 시스템</h1>
          </div>
          
          <div class="flex items-center space-x-4">
            <span class="text-sm text-gray-600">{{ user?.username }}님 환영합니다</span>
            <button
              @click="handleLogout"
              class="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >로그아웃</button>
          </div>
        </div>
      </div>
    </header>

    <!-- 메인 컨텐츠 -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- 페이지 제목 -->
      <div class="mb-8">
        <h2 class="text-2xl font-bold text-gray-900">대시보드</h2>
        <p class="mt-1 text-sm text-gray-600">재고 현황을 한눈에 확인하세요</p>
      </div>

      <!-- 통계 카드 -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <!-- 총 재고 수 -->
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="p-2 bg-blue-100 rounded-lg">
              <svg class="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">총 재고 품목</p>
              <p class="text-2xl font-semibold text-gray-900">{{ stats.totalItems }}</p>
            </div>
          </div>
        </div>

        <!-- 총 재고 수량 -->
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="p-2 bg-green-100 rounded-lg">
              <svg class="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">총 재고 수량</p>
              <p class="text-2xl font-semibold text-gray-900">{{ stats.totalQuantity.toLocaleString() }}</p>
            </div>
          </div>
        </div>

        <!-- 부족한 재고 -->
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="p-2 bg-red-100 rounded-lg">
              <svg class="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">부족한 재고</p>
              <p class="text-2xl font-semibold text-gray-900">{{ stats.lowStockItems }}</p>
            </div>
          </div>
        </div>

        <!-- 오늘 거래 -->
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="p-2 bg-purple-100 rounded-lg">
              <svg class="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">오늘 거래</p>
              <p class="text-2xl font-semibold text-gray-900">{{ stats.todayTransactions }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 빠른 액션 -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <!-- 빠른 액션 버튼 -->
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">빠른 액션</h3>
          <div class="grid grid-cols-2 gap-4">
            <router-link
              to="/inventory"
              class="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div class="p-2 bg-blue-100 rounded-lg mr-3">
                <svg class="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-900">재고 관리</p>
                <p class="text-xs text-gray-500">재고 조회 및 관리</p>
              </div>
            </router-link>

            <router-link
              to="/transactions"
              class="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div class="p-2 bg-green-100 rounded-lg mr-3">
                <svg class="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-900">입출고 관리</p>
                <p class="text-xs text-gray-500">입출고 내역 조회</p>
              </div>
            </router-link>

            <router-link
              v-if="isAdmin"
              to="/users"
              class="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div class="p-2 bg-purple-100 rounded-lg mr-3">
                <svg class="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-900">사용자 관리</p>
                <p class="text-xs text-gray-500">직원 계정 관리</p>
              </div>
            </router-link>

            <router-link
              to="/settings"
              class="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div class="p-2 bg-gray-100 rounded-lg mr-3">
                <svg class="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-900">설정</p>
                <p class="text-xs text-gray-500">계정 및 시스템 설정</p>
              </div>
            </router-link>
          </div>
        </div>

        <!-- 부족한 재고 목록 -->
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">부족한 재고 알림</h3>
          <div v-if="lowStockItems.length === 0" class="text-center py-8">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p class="mt-2 text-sm text-gray-500">부족한 재고가 없습니다</p>
          </div>
          <div v-else class="space-y-3">
            <div
              v-for="item in lowStockItems.slice(0, 5)"
              :key="item.id"
              class="flex items-center justify-between p-3 bg-red-50 rounded-lg"
            >
              <div>
                <p class="text-sm font-medium text-gray-900">{{ item.name }}</p>
                <p class="text-xs text-gray-500">SKU: {{ item.sku }}</p>
              </div>
              <div class="text-right">
                <p class="text-sm font-medium text-red-600">{{ (item.current_stock ?? item.current_quantity ?? item.currentQuantity ?? 0).toLocaleString() }}</p>
                <p class="text-xs text-gray-500">최소: {{ (item.min_stock ?? item.minimum_quantity ?? item.min_stock_level ?? 0).toLocaleString() }}</p>
              </div>
            </div>
            <router-link
              v-if="lowStockItems.length > 5"
              to="/inventory?filter=low-stock"
              class="block text-center text-sm text-indigo-600 hover:text-indigo-500 mt-3"
            >
              모든 부족한 재고 보기 ({{ lowStockItems.length - 5 }}개 더)
            </router-link>
          </div>
        </div>
      </div>

      <!-- 최근 거래 -->
      <div class="bg-white rounded-lg shadow">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-medium text-gray-900">최근 거래</h3>
        </div>
        <div class="p-6">
          <div v-if="recentTransactions.length === 0" class="text-center py-8">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p class="mt-2 text-sm text-gray-500">최근 거래가 없습니다</p>
          </div>
          <div v-else class="space-y-4">
            <div
              v-for="transaction in recentTransactions"
              :key="transaction.id"
              class="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
            >
              <div class="flex items-center">
                <div :class="[
                  'p-2 rounded-lg mr-3',
                  transaction.type === 'in' ? 'bg-green-100' : 'bg-red-100'
                ]">
                  <svg
                    :class="[
                      'h-5 w-5',
                      transaction.type === 'in' ? 'text-green-600' : 'text-red-600'
                    ]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      v-if="transaction.type === 'in'"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                    <path
                      v-else
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M18 12H6"
                    />
                  </svg>
                </div>
                <div>
                  <p class="text-sm font-medium text-gray-900">{{ transaction.inventory_name }}</p>
                  <p class="text-xs text-gray-500">
                    {{ transaction.type === 'in' ? '입고' : '출고' }} • {{ formatDate(transaction.created_at) }}
                  </p>
                </div>
              </div>
              <div class="text-right">
                <p :class="[
                  'text-sm font-medium',
                  transaction.type === 'in' ? 'text-green-600' : 'text-red-600'
                ]">
                  {{ transaction.type === 'in' ? '+' : '-' }}{{ transaction.quantity }}
                </p>
                <p class="text-xs text-gray-500">{{ transaction.created_by_username }}</p>
              </div>
            </div>
            <router-link
              to="/transactions"
              class="block text-center text-sm text-indigo-600 hover:text-indigo-500 mt-4"
            >
              모든 거래 보기
            </router-link>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '../composables/useAuth';
import type { Inventory, Transaction } from '../../shared/types';

const router = useRouter();
const { user, isAdmin, logout, authenticatedFetch } = useAuth();

// 상태
const stats = ref({
  totalItems: 0,
  totalQuantity: 0,
  lowStockItems: 0,
  todayTransactions: 0
});

const lowStockItems = ref<Inventory[]>([]);
const recentTransactions = ref<Transaction[]>([]);
const isLoading = ref(true);

/**
 * 로그아웃 처리
 */
const handleLogout = async () => {
  await logout();
  router.push('/login');
};

/**
 * 날짜 포맷팅
 */
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * 대시보드 데이터 로드
 */
const loadDashboardData = async () => {
  try {
    isLoading.value = true;

    // 재고 통계 조회
    const inventoryResponse = await authenticatedFetch('/api/inventory');
    const inventoryData = await inventoryResponse.json();
    
    if (inventoryData.success) {
      // 1) 응답 정규화: 혼재된 필드명을 current_stock / min_stock로 통일
      const rawInventories = inventoryData.data as any[];
      const normalized: Inventory[] = rawInventories.map((d: any) => ({
        ...d,
        current_stock: Number(d.current_stock ?? d.current_quantity ?? d.currentQuantity ?? 0),
        min_stock: Number(d.min_stock ?? d.minimum_quantity ?? d.min_stock_level ?? 0),
      }));

      // 2) 정규화된 데이터로 통계 계산
      stats.value.totalItems = normalized.length;
      stats.value.totalQuantity = normalized.reduce((sum: number, item: Inventory) => sum + (Number(item.current_stock) || 0), 0);
      
      // 부족한 재고 필터링
      lowStockItems.value = normalized.filter((item: Inventory) => (Number(item.current_stock) || 0) <= (Number(item.min_stock) || 0));
      stats.value.lowStockItems = lowStockItems.value.length;
    }

    // 최근 거래 조회
    const transactionsResponse = await authenticatedFetch('/api/transactions?limit=10');
    const transactionsData = await transactionsResponse.json();
    
    if (transactionsData.success) {
      recentTransactions.value = transactionsData.data;
      
      // 오늘 거래 수 계산
      const today = new Date().toISOString().split('T')[0];
      stats.value.todayTransactions = transactionsData.data.filter(
        (transaction: Transaction) => transaction.created_at.startsWith(today)
      ).length;
    }
  } catch (error) {
    console.error('Error loading dashboard data:', error);
  } finally {
    isLoading.value = false;
  }
};

/**
 * 컴포넌트 마운트 시 데이터 로드
 */
onMounted(() => {
  loadDashboardData();
});
</script>