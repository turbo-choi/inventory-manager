<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
    <div class="max-w-md w-full space-y-8">
      <!-- 로고 및 제목 -->
      <div class="text-center">
        <div class="mx-auto h-12 w-12 bg-indigo-600 rounded-lg flex items-center justify-center mb-4">
          <svg class="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <h2 class="text-3xl font-bold text-gray-900">재고 관리 시스템</h2>
        <p class="mt-2 text-sm text-gray-600">계정에 로그인하세요</p>
      </div>

      <!-- 로그인 폼 -->
      <div class="bg-white rounded-xl shadow-lg p-8">
        <form @submit.prevent="handleLogin" class="space-y-6">
          <!-- 사용자명 입력 -->
          <div>
            <label for="username" class="block text-sm font-medium text-gray-700 mb-2">
              사용자명
            </label>
            <input
              id="username"
              v-model="form.username"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
              placeholder="사용자명을 입력하세요"
              :disabled="isLoading"
            />
          </div>

          <!-- 비밀번호 입력 -->
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
              비밀번호
            </label>
            <div class="relative">
              <input
                id="password"
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                required
                class="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                placeholder="비밀번호를 입력하세요"
                :disabled="isLoading"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                :disabled="isLoading"
              >
                <svg v-if="showPassword" class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <svg v-else class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                </svg>
              </button>
            </div>
          </div>

          <!-- 에러 메시지 -->
          <div v-if="errorMessage" class="bg-red-50 border border-red-200 rounded-lg p-3">
            <div class="flex">
              <svg class="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p class="ml-2 text-sm text-red-600">{{ errorMessage }}</p>
            </div>
          </div>

          <!-- 로그인 버튼 -->
          <button
            type="submit"
            :disabled="isLoading || !form.username || !form.password"
            class="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg v-if="isLoading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ isLoading ? '로그인 중...' : '로그인' }}
          </button>
        </form>

        <!-- 기본 계정 정보 -->
        <div class="mt-6 pt-6 border-t border-gray-200">
          <h3 class="text-sm font-medium text-gray-700 mb-3">기본 계정 정보</h3>
          <div class="space-y-2 text-xs text-gray-600">
            <div class="flex justify-between">
              <span>관리자:</span>
              <span class="font-mono">admin / admin123</span>
            </div>
            <div class="flex justify-between">
              <span>직원:</span>
              <span class="font-mono">employee / emp123</span>
            </div>
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

const router = useRouter();
const { login, isLoading, isAuthenticated } = useAuth();

// 폼 데이터
const form = ref({
  username: '',
  password: ''
});

// UI 상태
const showPassword = ref(false);
const errorMessage = ref('');

/**
 * 로그인 처리 함수
 */
const handleLogin = async () => {
  errorMessage.value = '';
  
  const result = await login(form.value.username, form.value.password);
  
  if (result.success) {
    // 로그인 성공 시 대시보드로 이동
    router.push('/dashboard');
  } else {
    // 로그인 실패 시 에러 메시지 표시
    errorMessage.value = result.message || '로그인에 실패했습니다.';
  }
};

/**
 * 컴포넌트 마운트 시 이미 로그인된 경우 대시보드로 리다이렉트
 */
onMounted(() => {
  if (isAuthenticated.value) {
    router.push('/dashboard');
  }
});
</script>