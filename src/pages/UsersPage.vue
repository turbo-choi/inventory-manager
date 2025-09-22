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
            <h1 class="text-xl font-semibold text-gray-900">사용자 관리</h1>
          </div>
          
          <div class="flex items-center space-x-4">
            <button
              @click="showCreateModal = true"
              class="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              새 사용자 추가
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
              placeholder="이름 또는 이메일 검색"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              @input="debouncedSearch"
            />
          </div>
          
          <!-- 역할 필터 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">역할</label>
            <select
              v-model="filters.role"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              @change="loadUsers"
            >
              <option value="">모든 역할</option>
              <option value="admin">관리자</option>
              <option value="employee">직원</option>
            </select>
          </div>
          
          <!-- 상태 필터 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">상태</label>
            <select
              v-model="filters.status"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              @change="loadUsers"
            >
              <option value="">모든 상태</option>
              <option value="active">활성</option>
              <option value="inactive">비활성</option>
            </select>
          </div>
          
          <!-- 정렬 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">정렬</label>
            <select
              v-model="filters.sortBy"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              @change="loadUsers"
            >
              <option value="name">이름순</option>
              <option value="email">이메일순</option>
              <option value="created_at">등록일순</option>
              <option value="last_login">최근 로그인순</option>
            </select>
          </div>
        </div>
      </div>

      <!-- 통계 카드 -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500">전체 사용자</p>
              <p class="text-2xl font-semibold text-gray-900">{{ stats.total }}</p>
            </div>
          </div>
        </div>
        
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500">활성 사용자</p>
              <p class="text-2xl font-semibold text-gray-900">{{ stats.active }}</p>
            </div>
          </div>
        </div>
        
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <svg class="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500">관리자</p>
              <p class="text-2xl font-semibold text-gray-900">{{ stats.admins }}</p>
            </div>
          </div>
        </div>
        
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg class="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500">오늘 로그인</p>
              <p class="text-2xl font-semibold text-gray-900">{{ stats.todayLogins }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 사용자 목록 -->
      <div class="bg-white rounded-lg shadow">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-medium text-gray-900">
            사용자 목록 ({{ pagination.total }}명)
          </h3>
        </div>
        
        <!-- 로딩 상태 -->
        <div v-if="isLoading" class="p-8 text-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p class="mt-2 text-sm text-gray-500">로딩 중...</p>
        </div>
        
        <!-- 빈 상태 -->
        <div v-else-if="users.length === 0" class="p-8 text-center">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
          <p class="mt-2 text-sm text-gray-500">사용자가 없습니다</p>
        </div>
        
        <!-- 사용자 테이블 -->
        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  사용자 정보
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  역할
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  등록일
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  최근 로그인
                </th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  액션
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="u in users" :key="u.id" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="flex-shrink-0 h-10 w-10">
                      <div class="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                        <span class="text-sm font-medium text-gray-700">
                          {{ u.name.charAt(0).toUpperCase() }}
                        </span>
                      </div>
                    </div>
                    <div class="ml-4">
                      <div class="text-sm font-medium text-gray-900">{{ u.name }}</div>
                      <div class="text-sm text-gray-500">{{ u.email }}</div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span :class="getRoleClass(u.role)">
                    {{ u.role === 'admin' ? '관리자' : '직원' }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span :class="getStatusClass(u.status)">
                    {{ u.status === 'active' ? '활성' : '비활성' }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ formatDate(u.created_at) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ u.last_login ? formatDateTime(u.last_login) : '로그인 기록 없음' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div class="flex justify-end space-x-2">
                    <button
                      @click="editUser(u)"
                      class="text-indigo-600 hover:text-indigo-900 transition-colors"
                      title="수정"
                    >
                      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      v-if="isAdmin"
                      @click="toggleUserStatus(u)"
                      :class="u.status === 'active' ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'"
                      :title="u.status === 'active' ? '비활성화' : '활성화'"
                    >
                      <svg v-if="u.status === 'active'" class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                      </svg>
                      <svg v-else class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                    <button
                      v-if="canDeleteUser(u)"
                      @click="deleteUser(u)"
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
              {{ (pagination.page - 1) * pagination.limit + 1 }}-{{ Math.min(pagination.page * pagination.limit, pagination.total) }} / {{ pagination.total }}명
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

    <!-- 사용자 생성/수정 모달 -->
    <div v-if="showCreateModal || showEditModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div class="mt-3">
          <h3 class="text-lg font-medium text-gray-900 mb-4">
            {{ showCreateModal ? '새 사용자 추가' : '사용자 수정' }}
          </h3>
          <form @submit.prevent="saveUser" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label for="name" class="block text-sm font-medium text-gray-700 mb-1">이름</label>
                <input
                  id="name"
                  v-model="userForm.name"
                  type="text"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="이름을 입력하세요"
                />
              </div>
              <div>
                <label for="email" class="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                <input
                  id="email"
                  v-model="userForm.email"
                  type="email"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="이메일을 입력하세요"
                />
              </div>
            </div>
            <div v-if="showCreateModal">
              <label class="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
              <input
                v-model="userForm.password"
                type="password"
                required
                minlength="6"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">역할</label>
                <select
                  v-model="userForm.role"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="employee">직원</option>
                  <option value="admin">관리자</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">상태</label>
                <select
                  v-model="userForm.status"
                  required
                  :disabled="!isAdmin"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="active">활성</option>
                  <option value="inactive">비활성</option>
                </select>
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '../composables/useAuth';
import type { User, UserRole, UserStatus } from '../../shared/types';

const router = useRouter();
const { logout, authenticatedFetch, user, isAdmin } = useAuth();

const users = ref<User[]>([]);
const isLoading = ref(true);
const isSubmitting = ref(false);

// 모달 상태
const showCreateModal = ref(false);
const showEditModal = ref(false);

// 통계
const stats = ref({
  total: 0,
  active: 0,
  admins: 0,
  todayLogins: 0
});

// 필터 및 페이지네이션
const filters = ref({
  search: '',
  role: '',
  status: '',
  sortBy: 'name'
});

const pagination = ref({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0
});

// 폼 데이터
const userForm = ref({
  id: null as number | null,
  name: '',
  email: '',
  password: '',
  role: 'employee' as UserRole,
  status: 'active' as UserStatus
});

// 디바운스된 검색
let searchTimeout: NodeJS.Timeout;
const debouncedSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    pagination.value.page = 1;
    loadUsers();
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
 * 역할 클래스 반환
 */
const getRoleClass = (role: UserRole) => {
  return role === 'admin'
    ? 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800'
    : 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800';
};

/**
 * 상태 클래스 반환
 */
const getStatusClass = (status: UserStatus) => {
  return status === 'active'
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
 * 사용자 삭제 권한 확인
 */
const canDeleteUser = (userItem: User) => {
  // 자기 자신은 삭제할 수 없음
  return userItem.id !== user.value?.id;
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
    loadUsers();
  }
};

/**
 * 통계 데이터 로드
 */
const loadStats = async () => {
  try {
    const response = await authenticatedFetch('/api/users/stats');
    const data = await response.json();
    
    if (data.success) {
      stats.value = data.data;
    }
  } catch (error) {
    console.error('Error loading stats:', error);
  }
};

/**
 * 사용자 목록 로드
 */
const loadUsers = async () => {
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
    
    if (filters.value.role) {
      params.append('role', filters.value.role);
    }
    
    if (filters.value.status) {
      params.append('status', filters.value.status);
    }
    
    const response = await authenticatedFetch(`/api/users?${params}`);
    const data = await response.json();
    
    if (data.success) {
      users.value = data.data;
      pagination.value = data.pagination;
    }
  } catch (error) {
    console.error('Error loading users:', error);
  } finally {
    isLoading.value = false;
  }
};

/**
 * 사용자 저장
 */
const saveUser = async () => {
  try {
    isSubmitting.value = true;
    
    const url = showEditModal.value ? `/api/users/${userForm.value.id}` : '/api/users';
    const method = showEditModal.value ? 'PUT' : 'POST';
    
    // 백엔드 스펙에 맞는 페이로드 매핑
    let payload: any;
    if (showEditModal.value) {
      // 수정 시: 일반 사용자는 fullName, email만 수정 가능
      payload = {
        fullName: userForm.value.name.trim(),
        email: userForm.value.email.trim()
      };
      // 관리자일 때만 역할/활성화 상태 변경 가능
      if (user.value?.role === 'admin') {
        payload.role = userForm.value.role;
        payload.isActive = userForm.value.status === 'active';
      }
    } else {
      // 생성 시: username, fullName, password, email, role 사용
      payload = {
        username: userForm.value.name.trim(),
        fullName: userForm.value.name.trim(),
        password: userForm.value.password,
        email: userForm.value.email.trim(),
        role: userForm.value.role
      };
    }
    
    const response = await authenticatedFetch(url, {
      method,
      body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    
    if (data.success) {
      closeModals();
      loadUsers();
      loadStats();
    } else {
      alert(data.message || '저장에 실패했습니다.');
    }
  } catch (error) {
    console.error('Error saving user:', error);
    alert('저장 중 오류가 발생했습니다.');
  } finally {
    isSubmitting.value = false;
  }
};

/**
 * 사용자 수정
 */
const editUser = (userItem: User) => {
  userForm.value = {
    id: userItem.id,
    name: userItem.name,
    email: userItem.email,
    password: '',
    role: userItem.role,
    status: userItem.status
  };
  showEditModal.value = true;
};

/**
 * 사용자 상태 토글
 */
const toggleUserStatus = async (userItem: User) => {
  const newStatus = userItem.status === 'active' ? 'inactive' : 'active';
  const action = newStatus === 'active' ? '활성화' : '비활성화';
  
  if (!confirm(`"${userItem.name}"을(를) ${action}하시겠습니까?`)) {
    return;
  }
  
  try {
    const response = await authenticatedFetch(`/api/users/${userItem.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        isActive: newStatus === 'active'
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      loadUsers();
      loadStats();
    } else {
      alert(data.message || `${action}에 실패했습니다.`);
    }
  } catch (error) {
    console.error('Error toggling user status:', error);
    alert(`${action} 중 오류가 발생했습니다.`);
  }
};

/**
 * 사용자 삭제
 */
const deleteUser = async (userItem: User) => {
  if (!confirm(`"${userItem.name}"을(를) 삭제하시겠습니까?\n\n주의: 이 작업은 되돌릴 수 없습니다.`)) {
    return;
  }
  
  try {
    const response = await authenticatedFetch(`/api/users/${userItem.id}`, {
      method: 'DELETE'
    });
    
    const data = await response.json();
    
    if (data.success) {
      loadUsers();
      loadStats();
    } else {
      alert(data.message || '삭제에 실패했습니다.');
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    alert('삭제 중 오류가 발생했습니다.');
  }
};

/**
 * 모달 닫기
 */
const closeModals = () => {
  showCreateModal.value = false;
  showEditModal.value = false;
  userForm.value = {
    id: null,
    name: '',
    email: '',
    password: '',
    role: 'employee',
    status: 'active'
  };
};

/**
 * 컴포넌트 마운트 시 데이터 로드
 */
onMounted(async () => {
  await Promise.all([
    loadStats(),
    loadUsers()
  ]);
});
</script>