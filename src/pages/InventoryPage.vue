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
            <h1 class="text-xl font-semibold text-gray-900">재고 관리</h1>
          </div>
          
          <div class="flex items-center space-x-4">
            <button
              @click="showCreateModal = true"
              class="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              새 재고 추가
            </button>
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
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
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
          
          <!-- 카테고리 필터 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">카테고리</label>
            <select
              v-model="filters.category"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              @change="loadInventory"
            >
              <option value="">모든 카테고리</option>
              <option v-for="category in categories" :key="category.id" :value="category.id">
                {{ category.name }}
              </option>
            </select>
          </div>
          
          <!-- 재고 상태 필터 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">재고 상태</label>
            <select
              v-model="filters.stockStatus"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              @change="loadInventory"
            >
              <option value="">모든 상태</option>
              <option value="in-stock">재고 있음</option>
              <option value="low-stock">재고 부족</option>
              <option value="out-of-stock">재고 없음</option>
            </select>
          </div>
          
          <!-- 정렬 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">정렬</label>
            <select
              v-model="filters.sortBy"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              @change="loadInventory"
            >
              <option value="name">상품명</option>
              <option value="sku">SKU</option>
              <option value="current_stock">재고 수량</option>
              <option value="created_at">등록일</option>
            </select>
          </div>
        </div>
      </div>

      <!-- 재고 목록 -->
      <div class="bg-white rounded-lg shadow">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-medium text-gray-900">
            재고 목록 ({{ pagination.total }}개)
          </h3>
        </div>
        
        <!-- 로딩 상태 -->
        <div v-if="isLoading" class="p-8 text-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p class="mt-2 text-sm text-gray-500">로딩 중...</p>
        </div>
        
        <!-- 빈 상태 -->
        <div v-else-if="inventory.length === 0" class="p-8 text-center">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <p class="mt-2 text-sm text-gray-500">재고가 없습니다</p>
          <button
            @click="showCreateModal = true"
            class="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            첫 번째 재고 추가
          </button>
        </div>
        
        <!-- 재고 테이블 -->
        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상품 정보
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  카테고리
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  현재 재고
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  최소 재고
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
                </th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  액션
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="item in inventory" :key="item.id" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div class="text-sm font-medium text-gray-900">{{ item.name }}</div>
                    <div class="text-sm text-gray-500">SKU: {{ item.sku }}</div>
                    <div v-if="item.description" class="text-xs text-gray-400 mt-1">
                      {{ item.description.substring(0, 50) }}{{ item.description.length > 50 ? '...' : '' }}
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {{ item.category_name }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900">{{ item.current_stock.toLocaleString() }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-500">{{ item.min_stock_level.toLocaleString() }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span :class="getStockStatusClass(item)">
                    {{ getStockStatusText(item) }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div class="flex justify-end space-x-2">
                    <button
                      @click="openTransactionModal(item, 'in')"
                      class="text-green-600 hover:text-green-900 transition-colors"
                      title="입고"
                    >
                      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </button>
                    <button
                      @click="openTransactionModal(item, 'out')"
                      class="text-red-600 hover:text-red-900 transition-colors"
                      title="출고"
                    >
                      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 12H6" />
                      </svg>
                    </button>
                    <button
                      @click="editItem(item)"
                      class="text-indigo-600 hover:text-indigo-900 transition-colors"
                      title="수정"
                    >
                      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      @click="deleteItem(item)"
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
              {{ (pagination.page - 1) * pagination.limit + 1 }}-{{ Math.min(pagination.page * pagination.limit, pagination.total) }} / {{ pagination.total }}개
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

    <!-- 재고 생성/수정 모달 -->
    <div v-if="showCreateModal || showEditModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div class="mt-3">
          <h3 class="text-lg font-medium text-gray-900 mb-4">
            {{ showCreateModal ? '새 재고 추가' : '재고 수정' }}
          </h3>
          <form @submit.prevent="saveItem" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">상품명</label>
              <input
                v-model="itemForm.name"
                type="text"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">SKU</label>
              <input
                v-model="itemForm.sku"
                type="text"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
              <select
                v-model="itemForm.category_id"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">카테고리 선택</option>
                <option v-for="category in categories" :key="category.id" :value="category.id">
                  {{ category.name }}
                </option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">설명</label>
              <textarea
                v-model="itemForm.description"
                rows="3"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              ></textarea>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">현재 재고</label>
                <input
                  v-model.number="itemForm.current_stock"
                  type="number"
                  min="0"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">최소 재고</label>
                <input
                  v-model.number="itemForm.min_stock"
                  type="number"
                  min="0"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <!-- 추가 필드: 단가 및 보관 위치 -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">단가</label>
                <input
                  v-model.number="itemForm.unit_price"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">보관 위치</label>
                <input
                  v-model="itemForm.location"
                  type="text"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div class="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                @click="closeModals"
                class="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                취소
              </button>
              <button
                type="submit"
                :disabled="isSubmitting"
                class="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
              >
                {{ isSubmitting ? '저장 중...' : '저장' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- 입출고 모달 -->
    <div v-if="showTransactionModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div class="mt-3">
          <h3 class="text-lg font-medium text-gray-900 mb-4">
            {{ transactionForm.type === 'in' ? '입고' : '출고' }} 처리
          </h3>
          <div class="mb-4 p-3 bg-gray-50 rounded-lg">
            <p class="text-sm font-medium text-gray-900">{{ selectedItem?.name }}</p>
            <p class="text-xs text-gray-500">현재 재고: {{ selectedItem?.current_stock }}개</p>
          </div>
          <form @submit.prevent="processTransaction" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">수량</label>
              <input
                v-model.number="transactionForm.quantity"
                type="number"
                min="1"
                :max="transactionForm.type === 'out' ? selectedItem?.current_stock : undefined"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">메모</label>
              <textarea
                v-model="transactionForm.notes"
                rows="3"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="선택사항"
              ></textarea>
            </div>
            <div class="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                @click="closeTransactionModal"
                class="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                취소
              </button>
              <button
                type="submit"
                :disabled="isSubmitting"
                :class="[
                  'px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50',
                  transactionForm.type === 'in'
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-red-600 text-white hover:bg-red-700'
                ]"
              >
                {{ isSubmitting ? '처리 중...' : (transactionForm.type === 'in' ? '입고 처리' : '출고 처리') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuth } from '../composables/useAuth';
import type { Inventory, Category, TransactionType } from '../../shared/types';

const router = useRouter();
const route = useRoute();
const { logout, authenticatedFetch } = useAuth();

// 상태
const inventory = ref<Inventory[]>([]);
const categories = ref<Category[]>([]);
const isLoading = ref(true);
const isSubmitting = ref(false);

// 모달 상태
const showCreateModal = ref(false);
const showEditModal = ref(false);
const showTransactionModal = ref(false);

// 필터 및 페이지네이션
const filters = ref({
  search: '',
  category: '',
  stockStatus: '',
  sortBy: 'name'
});

const pagination = ref({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0
});

// 폼 데이터
const itemForm = ref({
  id: null as number | null,
  name: '',
  sku: '',
  description: '',
  category_id: '',
  current_stock: 0,
  min_stock: 0,
  // 추가 필드: 단가와 보관 위치
  unit_price: 0,
  location: ''
});

const transactionForm = ref({
  type: 'in' as TransactionType,
  quantity: 1,
  notes: ''
});

const selectedItem = ref<Inventory | null>(null);

// 디바운스된 검색
let searchTimeout: NodeJS.Timeout;
const debouncedSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    pagination.value.page = 1;
    loadInventory();
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
 * 재고 상태 클래스 반환
 */
const getStockStatusClass = (item: Inventory) => {
  const current = item.current_stock || 0;
  const min = item.min_stock_level || 0;
  if (current === 0) {
    return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800';
  } else if (current <= min) {
    return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800';
  } else {
    return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800';
  }
};

/**
 * 재고 상태 텍스트 반환
 */
const getStockStatusText = (item: Inventory) => {
  const current = item.current_stock || 0;
  const min = item.min_stock_level || 0;
  if (current === 0) {
    return '재고 없음';
  } else if (current <= min) {
    return '재고 부족';
  } else {
    return '재고 있음';
  }
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
    loadInventory();
  }
};

/**
 * 카테고리 목록 로드
 */
const loadCategories = async () => {
  try {
    const response = await authenticatedFetch('/api/inventory/categories');
    const data = await response.json();
    
    if (data.success) {
      categories.value = data.data;
    }
  } catch (error) {
    console.error('Error loading categories:', error);
  }
};

/**
 * 재고 목록 로드
 */
const loadInventory = async () => {
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
    
    if (filters.value.category) {
      params.append('category_id', filters.value.category);
    }
    
    if (filters.value.stockStatus) {
      // 서버는 low_stock만 지원
      if (filters.value.stockStatus === 'low-stock') {
        params.append('low_stock', 'true');
      }
      params.append('stock_status', filters.value.stockStatus);
    }
    
    const response = await authenticatedFetch(`/api/inventory?${params}`);
    const data = await response.json();
    
    if (data.success) {
      // 백엔드 필드명을 프론트가 사용하는 필드로 매핑
      inventory.value = data.data.map((d: any) => ({
        ...d,
        current_stock: Number(d.current_stock ?? d.current_quantity ?? 0),
        min_stock_level: Number(d.min_stock_level ?? d.minimum_quantity ?? d.min_stock ?? 0),
        // 추가 매핑: 단가 (편집 시 사용)
        unit_price: Number(d.unit_price ?? 0)
      }));
      pagination.value = data.pagination;
    }
  } catch (error) {
    console.error('Error loading inventory:', error);
  } finally {
    isLoading.value = false;
  }
};

/**
 * 재고 아이템 저장
 */
const saveItem = async () => {
  try {
    isSubmitting.value = true;
    
    const url = showEditModal.value ? `/api/inventory/${itemForm.value.id}` : '/api/inventory';
    const method = showEditModal.value ? 'PUT' : 'POST';

    // 백엔드가 기대하는 키로 페이로드 매핑
    const basePayload = {
      name: itemForm.value.name?.trim(),
      description: itemForm.value.description?.trim() || '',
      sku: itemForm.value.sku?.trim(),
      category_id: itemForm.value.category_id ? Number(itemForm.value.category_id) : undefined,
      min_stock_level: Number(itemForm.value.min_stock),
      unit_price: Number(itemForm.value.unit_price)
    } as any;

    const payload = method === 'POST'
      ? {
          ...basePayload,
          current_stock: Number(itemForm.value.current_stock)
        }
      : basePayload;

    // 간단한 클라이언트 측 유효성 검사
    if (!payload.name || !payload.sku || !payload.category_id || Number.isNaN(payload.unit_price) || Number.isNaN(payload.min_stock_level) || (method === 'POST' && Number.isNaN(payload.current_stock))) {
      alert('필수값을 모두 입력해주세요.');
      return;
    }
    if (payload.unit_price < 0 || payload.min_stock_level < 0 || (method === 'POST' && payload.current_stock < 0)) {
      alert('수량과 단가는 0 이상이어야 합니다.');
      return;
    }

    const response = await authenticatedFetch(url, {
      method,
      body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    
    if (data.success) {
      closeModals();
      loadInventory();
    } else {
      alert(data.message || '저장에 실패했습니다.');
    }
  } catch (error) {
    console.error('Error saving item:', error);
    alert('저장 중 오류가 발생했습니다.');
  } finally {
    isSubmitting.value = false;
  }
};

/**
 * 재고 아이템 수정
 */
const editItem = (item: Inventory) => {
  itemForm.value = {
    id: item.id,
    name: item.name,
    sku: item.sku,
    description: item.description || '',
    category_id: String(item.category_id ?? ''),
    current_stock: item.current_stock ?? 0,
    min_stock: item.min_stock_level ?? 0,
    unit_price: item.unit_price ?? 0,
    location: (item as any).location || ''
  };
  showEditModal.value = true;
};

/**
 * 재고 아이템 삭제
 */
const deleteItem = async (item: Inventory) => {
  if (!confirm(`"${item.name}"을(를) 삭제하시겠습니까?`)) {
    return;
  }
  
  try {
    const response = await authenticatedFetch(`/api/inventory/${item.id}`, {
      method: 'DELETE'
    });
    
    const data = await response.json();
    
    if (data.success) {
      loadInventory();
    } else {
      alert(data.message || '삭제에 실패했습니다.');
    }
  } catch (error) {
    console.error('Error deleting item:', error);
    alert('삭제 중 오류가 발생했습니다.');
  }
};

/**
 * 입출고 모달 열기
 */
const openTransactionModal = (item: Inventory, type: TransactionType) => {
  selectedItem.value = item;
  transactionForm.value = {
    type,
    quantity: 1,
    notes: ''
  };
  showTransactionModal.value = true;
};

/**
 * 입출고 처리
 */
const processTransaction = async () => {
  try {
    isSubmitting.value = true;
    
    const response = await authenticatedFetch('/api/transactions', {
      method: 'POST',
      body: JSON.stringify({
        inventory_id: selectedItem.value!.id,
        type: transactionForm.value.type,
        quantity: transactionForm.value.quantity,
        notes: transactionForm.value.notes
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      closeTransactionModal();
      loadInventory();
    } else {
      alert(data.message || '처리에 실패했습니다.');
    }
  } catch (error) {
    console.error('Error processing transaction:', error);
    alert('처리 중 오류가 발생했습니다.');
  } finally {
    isSubmitting.value = false;
  }
};

/**
 * 모달 닫기
 */
const closeModals = () => {
  showCreateModal.value = false;
  showEditModal.value = false;
  itemForm.value = {
    id: null,
    name: '',
    sku: '',
    description: '',
    category_id: '',
    current_stock: 0,
    min_stock: 0,
    unit_price: 0,
    location: ''
  };
};

const closeTransactionModal = () => {
  showTransactionModal.value = false;
  selectedItem.value = null;
  transactionForm.value = {
    type: 'in',
    quantity: 1,
    notes: ''
  };
};

/**
 * 컴포넌트 마운트 시 데이터 로드
 */
onMounted(async () => {
  // URL 쿼리 파라미터에서 필터 설정
  if (route.query.filter === 'low-stock') {
    filters.value.stockStatus = 'low-stock';
  }
  
  await loadCategories();
  await loadInventory();
});
</script>