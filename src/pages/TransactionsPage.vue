<template>
  <div class="min-h-screen bg-gray-50">
    <!-- 헤더 -->
    <header class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center">
            <router-link to="/dashboard" class="text-gray-500 hover:text-gray-700 mr-4">
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </router-link>
            <h1 class="text-xl font-semibold text-gray-900">입출고 관리</h1>
          </div>
          
          <div class="flex items-center space-x-4">
            <button
              @click="handleLogout"
              class="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              로그아웃
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- 메인 컨텐츠 -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- 필터 및 검색 -->
      <div class="bg-white rounded-lg shadow p-6 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
          <!-- 검색 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">검색</label>
            <input
              v-model="filters.search"
              type="text"
              placeholder="상품명 또는 SKU 검색"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              @input="debouncedSearch"
            />
          </div>
          
          <!-- 거래 유형 필터 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">거래 유형</label>
            <select
              v-model="filters.type"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              @change="loadTransactions"
            >
              <option value="">모든 유형</option>
              <option value="in">입고</option>
              <option value="out">출고</option>
            </select>
          </div>
          
          <!-- 날짜 범위 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">시작일</label>
            <input
              v-model="filters.startDate"
              type="date"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              @change="loadTransactions"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">종료일</label>
            <input
              v-model="filters.endDate"
              type="date"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              @change="loadTransactions"
            />
          </div>
          
          <!-- 정렬 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">정렬</label>
            <select
              v-model="filters.sortBy"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              @change="loadTransactions"
            >
              <option value="created_at">최신순</option>
              <option value="quantity">수량순</option>
              <option value="inventory_name">상품명순</option>
            </select>
          </div>
        </div>
      </div>

      <!-- 통계 카드 -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500">오늘 입고</p>
              <p class="text-2xl font-semibold text-gray-900">{{ stats.todayIn.toLocaleString() }}</p>
            </div>
          </div>
        </div>
        
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <svg class="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 12H6" />
                </svg>
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500">오늘 출고</p>
              <p class="text-2xl font-semibold text-gray-900">{{ stats.todayOut.toLocaleString() }}</p>
            </div>
          </div>
        </div>
        
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500">이번 주 거래</p>
              <p class="text-2xl font-semibold text-gray-900">{{ stats.weekTotal.toLocaleString() }}</p>
            </div>
          </div>
        </div>
        
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <svg class="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500">이번 달 거래</p>
              <p class="text-2xl font-semibold text-gray-900">{{ stats.monthTotal.toLocaleString() }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 거래 목록 -->
      <div class="bg-white rounded-lg shadow">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-medium text-gray-900">
            거래 내역 ({{ pagination.total }}건)
          </h3>
        </div>
        
        <!-- 로딩 상태 -->
        <div v-if="isLoading" class="p-8 text-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p class="mt-2 text-sm text-gray-500">로딩 중...</p>
        </div>
        
        <!-- 빈 상태 -->
        <div v-else-if="transactions.length === 0" class="p-8 text-center">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          <p class="mt-2 text-sm text-gray-500">거래 내역이 없습니다</p>
        </div>
        
        <!-- 거래 테이블 -->
        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  거래 정보
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상품 정보
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  유형
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  수량
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  처리자
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  메모
                </th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  액션
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="transaction in transactions" :key="transaction.id" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div class="text-sm font-medium text-gray-900">
                      {{ formatDate(transaction.created_at) }}
                    </div>
                    <div class="text-xs text-gray-500">
                      ID: {{ transaction.id }}
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div class="text-sm font-medium text-gray-900">{{ transaction.inventory_name }}</div>
                    <div class="text-sm text-gray-500">SKU: {{ transaction.inventory_sku }}</div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span :class="getTransactionTypeClass(transaction.type)">
                    {{ transaction.type === 'in' ? '입고' : '출고' }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900">
                    {{ transaction.quantity.toLocaleString() }}개
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900">{{ transaction.user_name }}</div>
                </td>
                <td class="px-6 py-4">
                  <div class="text-sm text-gray-500 max-w-xs truncate">
                    {{ transaction.notes || '-' }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div class="flex justify-end space-x-2">
                    <button
                      @click="viewTransaction(transaction)"
                      class="text-indigo-600 hover:text-indigo-900 transition-colors"
                      title="상세보기"
                    >
                      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    <button
                      v-if="canDeleteTransaction(transaction)"
                      @click="deleteTransaction(transaction)"
                      class="text-red-600 hover:text-red-900 transition-colors"
                      title="삭제"
                    >
                      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <!-- 페이지네이션 -->
        <div v-if="pagination.totalPages > 1" class="px-6 py-4 border-t border-gray-200">
          <div class="flex items-center justify-between">
            <div class="text-sm text-gray-700">
              {{ (pagination.page - 1) * pagination.limit + 1 }}-{{ Math.min(pagination.page * pagination.limit, pagination.total) }} / {{ pagination.total }}건
            </div>
            <div class="flex space-x-2">
              <button
                @click="changePage(pagination.page - 1)"
                :disabled="pagination.page <= 1"
                class="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                이전
              </button>
              <button
                v-for="page in getPageNumbers()"
                :key="page"
                @click="changePage(page)"
                :class="[
                  'px-3 py-1 border text-sm rounded',
                  page === pagination.page
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'border-gray-300 hover:bg-gray-50'
                ]"
              >
                {{ page }}
              </button>
              <button
                @click="changePage(pagination.page + 1)"
                :disabled="pagination.page >= pagination.totalPages"
                class="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                다음
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- 거래 상세 모달 -->
    <div v-if="showDetailModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div class="mt-3">
          <h3 class="text-lg font-medium text-gray-900 mb-4">거래 상세 정보</h3>
          <div v-if="selectedTransaction" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700">거래 ID</label>
                <p class="text-sm text-gray-900">{{ selectedTransaction.id }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">거래 유형</label>
                <span :class="getTransactionTypeClass(selectedTransaction.type)">
                  {{ selectedTransaction.type === 'in' ? '입고' : '출고' }}
                </span>
              </div>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700">상품 정보</label>
              <p class="text-sm text-gray-900">{{ selectedTransaction.inventory_name }}</p>
              <p class="text-xs text-gray-500">SKU: {{ selectedTransaction.inventory_sku }}</p>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700">수량</label>
                <p class="text-sm text-gray-900">{{ selectedTransaction.quantity.toLocaleString() }}개</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">처리자</label>
                <p class="text-sm text-gray-900">{{ selectedTransaction.user_name }}</p>
              </div>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700">처리 일시</label>
              <p class="text-sm text-gray-900">{{ formatDateTime(selectedTransaction.created_at) }}</p>
            </div>
            
            <div v-if="selectedTransaction.notes">
              <label class="block text-sm font-medium text-gray-700">메모</label>
              <p class="text-sm text-gray-900">{{ selectedTransaction.notes }}</p>
            </div>
          </div>
          
          <div class="flex justify-end pt-4">
            <button
              @click="closeDetailModal"
              class="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '../composables/useAuth';
import type { Transaction, TransactionType } from '../../shared/types';

const router = useRouter();
const { logout, authenticatedFetch, user } = useAuth();

// 상태
const transactions = ref<Transaction[]>([]);
const isLoading = ref(true);
const showDetailModal = ref(false);
const selectedTransaction = ref<Transaction | null>(null);

// 통계
const stats = ref({
  todayIn: 0,
  todayOut: 0,
  weekTotal: 0,
  monthTotal: 0
});

// 필터 및 페이지네이션
const filters = ref({
  search: '',
  type: '',
  startDate: '',
  endDate: '',
  sortBy: 'created_at'
});

const pagination = ref({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0
});

// 디바운스된 검색
let searchTimeout: NodeJS.Timeout;
const debouncedSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    pagination.value.page = 1;
    loadTransactions();
  }, 300);
};

/**
 * 로그아웃 처리
 */
const handleLogout = async () => {
  await logout();
  router.push('/login');
};

/**
 * 거래 유형 클래스 반환
 */
const getTransactionTypeClass = (type: TransactionType) => {
  return type === 'in'
    ? 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800'
    : 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800';
};

/**
 * 날짜 포맷팅
 */
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

/**
 * 날짜시간 포맷팅
 */
const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * 거래 삭제 권한 확인
 */
const canDeleteTransaction = (transaction: Transaction) => {
  // 관리자이거나 본인이 생성한 거래만 삭제 가능
  return user.value?.role === 'admin' || transaction.user_id === user.value?.id;
};

/**
 * 페이지 번호 배열 생성
 */
const getPageNumbers = () => {
  const pages = [];
  const start = Math.max(1, pagination.value.page - 2);
  const end = Math.min(pagination.value.totalPages, pagination.value.page + 2);
  
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  
  return pages;
};

/**
 * 페이지 변경
 */
const changePage = (page: number) => {
  if (page >= 1 && page <= pagination.value.totalPages) {
    pagination.value.page = page;
    loadTransactions();
  }
};

/**
 * 통계 데이터 로드
 */
const loadStats = async () => {
  try {
    const response = await authenticatedFetch('/api/transactions/stats');
    const data = await response.json();
    
    if (data.success) {
      stats.value = data.data;
    }
  } catch (error) {
    console.error('Error loading stats:', error);
  }
};

/**
 * 거래 목록 로드
 */
const loadTransactions = async () => {
  try {
    isLoading.value = true;
    
    const params = new URLSearchParams({
      page: pagination.value.page.toString(),
      limit: pagination.value.limit.toString(),
      sort: filters.value.sortBy
    });
    
    if (filters.value.search) {
      params.append('search', filters.value.search);
    }
    
    if (filters.value.type) {
      params.append('type', filters.value.type);
    }
    
    if (filters.value.startDate) {
      params.append('start_date', filters.value.startDate);
    }
    
    if (filters.value.endDate) {
      params.append('end_date', filters.value.endDate);
    }
    
    const response = await authenticatedFetch(`/api/transactions?${params}`);
    const data = await response.json();
    
    if (data.success) {
      transactions.value = data.data;
      pagination.value = data.pagination;
    }
  } catch (error) {
    console.error('Error loading transactions:', error);
  } finally {
    isLoading.value = false;
  }
};

/**
 * 거래 상세보기
 */
const viewTransaction = (transaction: Transaction) => {
  selectedTransaction.value = transaction;
  showDetailModal.value = true;
};

/**
 * 거래 삭제
 */
const deleteTransaction = async (transaction: Transaction) => {
  if (!confirm(`거래 ID ${transaction.id}를 삭제하시겠습니까?\n\n주의: 이 작업은 되돌릴 수 없으며, 재고 수량도 원래대로 복원됩니다.`)) {
    return;
  }
  
  try {
    const response = await authenticatedFetch(`/api/transactions/${transaction.id}`, {
      method: 'DELETE'
    });
    
    const data = await response.json();
    
    if (data.success) {
      loadTransactions();
      loadStats();
    } else {
      alert(data.message || '삭제에 실패했습니다.');
    }
  } catch (error) {
    console.error('Error deleting transaction:', error);
    alert('삭제 중 오류가 발생했습니다.');
  }
};

/**
 * 상세 모달 닫기
 */
const closeDetailModal = () => {
  showDetailModal.value = false;
  selectedTransaction.value = null;
};

/**
 * 컴포넌트 마운트 시 데이터 로드
 */
onMounted(async () => {
  // 기본 날짜 범위 설정 (최근 30일)
  const today = new Date();
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  filters.value.endDate = today.toISOString().split('T')[0];
  filters.value.startDate = thirtyDaysAgo.toISOString().split('T')[0];
  
  await Promise.all([
    loadStats(),
    loadTransactions()
  ]);
});
</script>