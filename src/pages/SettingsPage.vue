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
            <h1 class="text-xl font-semibold text-gray-900">설정</h1>
          </div>
          
          <button
            @click="handleLogout"
            class="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            로그아웃
          </button>
        </div>
      </div>
    </header>

    <!-- 메인 컨텐츠 -->
    <main class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="space-y-6">
        <!-- 프로필 설정 -->
        <div class="bg-white rounded-lg shadow">
          <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-medium text-gray-900">프로필 설정</h3>
            <p class="mt-1 text-sm text-gray-500">개인 정보를 관리하세요.</p>
          </div>
          <div class="px-6 py-4">
            <form @submit.prevent="updateProfile" class="space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">이름</label>
                  <input
                    v-model="profileForm.name"
                    type="text"
                    required
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                  <input
                    v-model="profileForm.email"
                    type="email"
                    required
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div class="flex justify-end">
                <button
                  type="submit"
                  :disabled="isUpdatingProfile"
                  class="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                >
                  {{ isUpdatingProfile ? '저장 중...' : '프로필 저장' }}
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- 비밀번호 변경 -->
        <div class="bg-white rounded-lg shadow">
          <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-medium text-gray-900">비밀번호 변경</h3>
            <p class="mt-1 text-sm text-gray-500">보안을 위해 정기적으로 비밀번호를 변경하세요.</p>
          </div>
          <div class="px-6 py-4">
            <form @submit.prevent="changePassword" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">현재 비밀번호</label>
                <input
                  v-model="passwordForm.currentPassword"
                  type="password"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">새 비밀번호</label>
                  <input
                    v-model="passwordForm.newPassword"
                    type="password"
                    required
                    minlength="6"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">새 비밀번호 확인</label>
                  <input
                    v-model="passwordForm.confirmPassword"
                    type="password"
                    required
                    minlength="6"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div v-if="passwordError" class="text-sm text-red-600">
                {{ passwordError }}
              </div>
              <div class="flex justify-end">
                <button
                  type="submit"
                  :disabled="isChangingPassword"
                  class="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                >
                  {{ isChangingPassword ? '변경 중...' : '비밀번호 변경' }}
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- 시스템 설정 (관리자만) -->
        <div v-if="user?.role === 'admin'" class="bg-white rounded-lg shadow">
          <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-medium text-gray-900">시스템 설정</h3>
            <p class="mt-1 text-sm text-gray-500">시스템 전반의 설정을 관리하세요.</p>
          </div>
          <div class="px-6 py-4">
            <form @submit.prevent="updateSystemSettings" class="space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">회사명</label>
                  <input
                    v-model="systemForm.companyName"
                    type="text"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">연락처</label>
                  <input
                    v-model="systemForm.contactInfo"
                    type="text"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">주소</label>
                <textarea
                  v-model="systemForm.address"
                  rows="3"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                ></textarea>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">재고 부족 임계값</label>
                  <input
                    v-model.number="systemForm.lowStockThreshold"
                    type="number"
                    min="0"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">통화</label>
                  <select
                    v-model="systemForm.currency"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="KRW">원 (KRW)</option>
                    <option value="USD">달러 (USD)</option>
                    <option value="EUR">유로 (EUR)</option>
                    <option value="JPY">엔 (JPY)</option>
                  </select>
                </div>
              </div>
              <div class="flex items-center">
                <input
                  v-model="systemForm.enableNotifications"
                  type="checkbox"
                  id="notifications"
                  class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label for="notifications" class="ml-2 block text-sm text-gray-900">
                  재고 부족 알림 활성화
                </label>
              </div>
              <div class="flex justify-end">
                <button
                  type="submit"
                  :disabled="isUpdatingSystem"
                  class="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                >
                  {{ isUpdatingSystem ? '저장 중...' : '시스템 설정 저장' }}
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- 카테고리 관리 (관리자만) -->
        <div v-if="user?.role === 'admin'" class="bg-white rounded-lg shadow">
          <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-medium text-gray-900">카테고리 관리</h3>
            <p class="mt-1 text-sm text-gray-500">카테고리를 추가, 수정, 삭제할 수 있습니다.</p>
          </div>
          <div class="px-6 py-4 space-y-6">
            <!-- 새 카테고리 추가 -->
            <form @submit.prevent="createCategory" class="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div class="md:col-span-1">
                <label class="block text-sm font-medium text-gray-700 mb-1">이름</label>
                <input
                  v-model="newCategoryForm.name"
                  type="text"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div class="md:col-span-1">
                <label class="block text-sm font-medium text-gray-700 mb-1">설명</label>
                <input
                  v-model="newCategoryForm.description"
                  type="text"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div class="md:col-span-1 flex md:justify-end">
                <button
                  type="submit"
                  :disabled="isCreatingCategory || !newCategoryForm.name.trim()"
                  class="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                >
                  {{ isCreatingCategory ? '추가 중...' : '카테고리 추가' }}
                </button>
              </div>
            </form>

            <!-- 카테고리 목록 -->
            <div>
              <div v-if="isLoadingCategories" class="text-sm text-gray-500">카테고리를 불러오는 중...</div>
              <div v-else>
                <div v-if="categories.length === 0" class="text-sm text-gray-500">등록된 카테고리가 없습니다.</div>
                <div v-else class="overflow-x-auto">
                  <table class="min-w-full divide-y divide-gray-200 text-sm">
                    <thead class="bg-gray-50">
                      <tr>
                        <th class="px-4 py-3 text-left font-medium text-gray-700">이름</th>
                        <th class="px-4 py-3 text-left font-medium text-gray-700">설명</th>
                        <th class="px-4 py-3 text-right font-medium text-gray-700">작업</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200">
                      <tr v-for="cat in categories" :key="cat.id">
                        <template v-if="editingCategoryId === cat.id">
                          <td class="px-4 py-3">
                            <input
                              v-model="editCategoryForm.name"
                              type="text"
                              required
                              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </td>
                          <td class="px-4 py-3">
                            <input
                              v-model="editCategoryForm.description"
                              type="text"
                              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </td>
                          <td class="px-4 py-3 text-right space-x-2">
                            <button
                              @click="saveEditCategory(cat.id)"
                              :disabled="isUpdatingCategory || !editCategoryForm.name.trim()"
                              class="px-3 py-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
                            >
                              {{ isUpdatingCategory ? '저장 중...' : '저장' }}
                            </button>
                            <button
                              @click="cancelEditCategory"
                              :disabled="isUpdatingCategory"
                              class="px-3 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
                            >
                              취소
                            </button>
                          </td>
                        </template>
                        <template v-else>
                          <td class="px-4 py-3 text-gray-900">{{ cat.name }}</td>
                          <td class="px-4 py-3 text-gray-500">{{ cat.description || '-' }}</td>
                          <td class="px-4 py-3 text-right space-x-2">
                            <button
                              @click="startEditCategory(cat)"
                              class="px-3 py-1.5 bg-white text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
                            >
                              수정
                            </button>
                            <button
                              @click="deleteCategory(cat)"
                              :disabled="deletingCategoryId === cat.id"
                              class="px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                            >
                              {{ deletingCategoryId === cat.id ? '삭제 중...' : '삭제' }}
                            </button>
                          </td>
                        </template>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
        <!-- 데이터 관리 (관리자만) -->
        <div v-if="user?.role === 'admin'" class="bg-white rounded-lg shadow">
          <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-medium text-gray-900">데이터 관리</h3>
            <p class="mt-1 text-sm text-gray-500">시스템 데이터를 백업하거나 초기화하세요.</p>
          </div>
          <div class="px-6 py-4">
            <div class="space-y-4">
              <!-- 데이터 백업 -->
              <div class="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h4 class="text-sm font-medium text-gray-900">데이터 백업</h4>
                  <p class="text-sm text-gray-500">현재 시스템 데이터를 백업합니다.</p>
                </div>
                <button
                  @click="backupData"
                  :disabled="isBackingUp"
                  class="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                >
                  {{ isBackingUp ? '백업 중...' : '백업 실행' }}
                </button>
              </div>
              
              <!-- 데이터 초기화 -->
              <div class="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
                <div>
                  <h4 class="text-sm font-medium text-red-900">데이터 초기화</h4>
                  <p class="text-sm text-red-600">모든 재고 및 거래 데이터를 삭제합니다. (사용자 데이터는 유지)</p>
                </div>
                <button
                  @click="resetData"
                  :disabled="isResetting"
                  class="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                >
                  {{ isResetting ? '초기화 중...' : '데이터 초기화' }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 앱 정보 -->
        <div class="bg-white rounded-lg shadow">
          <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-medium text-gray-900">앱 정보</h3>
          </div>
          <div class="px-6 py-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span class="font-medium text-gray-700">앱 이름:</span>
                <span class="ml-2 text-gray-900">재고 관리 시스템</span>
              </div>
              <div>
                <span class="font-medium text-gray-700">버전:</span>
                <span class="ml-2 text-gray-900">1.0.0</span>
              </div>
              <div>
                <span class="font-medium text-gray-700">마지막 업데이트:</span>
                <span class="ml-2 text-gray-900">{{ formatDate(new Date().toISOString()) }}</span>
              </div>
              <div>
                <span class="font-medium text-gray-700">개발자:</span>
                <span class="ml-2 text-gray-900">SOLO Coding</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import type { Category } from '../../shared/types';

// 라우터/인증 composable
const router = useRouter()
const { logout, authenticatedFetch, user, changePassword: changePasswordAPI, fetchCurrentUser } = useAuth()

// 공통 유틸: 날짜 포맷터
function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

// 로그아웃 처리
async function handleLogout() {
  await logout()
  router.push('/login')
}

// 프로필 폼 상태
const profileForm = ref({
  name: '',
  email: ''
})
const isUpdatingProfile = ref(false)

// 비밀번호 변경 폼 상태
const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})
const passwordError = ref('')
const isChangingPassword = ref(false)

// 시스템 설정 폼 상태 (로컬 저장)
const systemForm = ref({
  companyName: '',
  contactInfo: '',
  address: '',
  lowStockThreshold: 0,
  currency: 'KRW',
  enableNotifications: false
})
const isUpdatingSystem = ref(false)

// 데이터 관리 상태
const isBackingUp = ref(false)
const isResetting = ref(false)

/**
 * 설정 데이터 로드 (프로필/시스템)
 * - 프로필: 현재 로그인 사용자 정보로 초기화
 * - 시스템: 로컬스토리지에 저장된 설정 불러오기
 */
async function loadSettings() {
  // 프로필 초기값
  if (user.value) {
    profileForm.value.name = user.value.name || ''
    profileForm.value.email = user.value.email || ''
  }
  // 시스템 설정 로드
  try {
    const saved = localStorage.getItem('app_system_settings')
    if (saved) {
      const parsed = JSON.parse(saved)
      systemForm.value = {
        companyName: parsed.companyName || '',
        contactInfo: parsed.contactInfo || '',
        address: parsed.address || '',
        lowStockThreshold: Number(parsed.lowStockThreshold) || 0,
        currency: parsed.currency || 'KRW',
        enableNotifications: !!parsed.enableNotifications
      }
    }
  } catch (e) {
    console.warn('설정 로드 중 오류:', e)
  }
}

/**
 * 프로필 업데이트
 * - 이름/이메일 업데이트 (본인만 가능)
 */
async function updateProfile() {
  if (!user.value) return
  if (!profileForm.value.name.trim()) {
    alert('이름을 입력해주세요.')
    return
  }
  try {
    isUpdatingProfile.value = true
    const res = await authenticatedFetch(`/api/users/${user.value.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        fullName: profileForm.value.name.trim(),
        email: profileForm.value.email.trim()
      })
    })
    const data = await res.json()
    if (data.success) {
      await fetchCurrentUser()
      alert('프로필이 업데이트되었습니다.')
    } else {
      alert(data.message || '프로필 업데이트에 실패했습니다.')
    }
  } catch (err) {
    console.error('프로필 업데이트 오류:', err)
    alert('프로필 업데이트 중 오류가 발생했습니다.')
  } finally {
    isUpdatingProfile.value = false
  }
}

/**
 * 비밀번호 변경
 * - 새 비밀번호 확인 일치 검사 후 서버 요청
 */
async function changePassword() {
  passwordError.value = ''
  if (passwordForm.value.newPassword.length < 6) {
    passwordError.value = '비밀번호는 최소 6자 이상이어야 합니다.'
    return
  }
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    passwordError.value = '새 비밀번호와 확인 비밀번호가 일치하지 않습니다.'
    return
  }
  try {
    isChangingPassword.value = true
    const result = await changePasswordAPI(passwordForm.value.currentPassword, passwordForm.value.newPassword)
    if (result.success) {
      alert('비밀번호가 변경되었습니다.')
      passwordForm.value = { currentPassword: '', newPassword: '', confirmPassword: '' }
    } else {
      alert(result.message || '비밀번호 변경에 실패했습니다.')
    }
  } catch (err) {
    console.error('비밀번호 변경 오류:', err)
    alert('비밀번호 변경 중 오류가 발생했습니다.')
  } finally {
    isChangingPassword.value = false
  }
}

/**
 * 시스템 설정 저장 (로컬스토리지)
 */
async function updateSystemSettings() {
  try {
    isUpdatingSystem.value = true
    localStorage.setItem('app_system_settings', JSON.stringify(systemForm.value))
    alert('시스템 설정이 저장되었습니다.')
  } catch (err) {
    console.error('시스템 설정 저장 오류:', err)
    alert('시스템 설정 저장 중 오류가 발생했습니다.')
  } finally {
    isUpdatingSystem.value = false
  }
}

/**
 * 데이터 백업
 * - 카테고리/재고 데이터를 조회하여 JSON 파일로 다운로드
 */
async function backupData() {
  if (user.value?.role !== 'admin') return
  try {
    isBackingUp.value = true
    const [catRes, invRes] = await Promise.all([
      authenticatedFetch('/api/inventory/categories'),
      authenticatedFetch('/api/inventory?limit=100000')
    ])
    const catData = await catRes.json()
    const invData = await invRes.json()

    const payload = {
      exportedAt: new Date().toISOString(),
      categories: catData.success ? catData.data : [],
      inventory: invData.success ? invData.data : []
    }

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `backup-${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  } catch (err) {
    console.error('데이터 백업 오류:', err)
    alert('데이터 백업 중 오류가 발생했습니다.')
  } finally {
    isBackingUp.value = false
  }
}

/**
 * 데이터 초기화 (경고)
 * - 백엔드 엔드포인트가 없으므로 경고만 표시
 */
async function resetData() {
  if (user.value?.role !== 'admin') return
  if (!confirm('모든 재고 및 거래 데이터를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return
  try {
    isResetting.value = true
    alert('데이터 초기화 기능은 아직 지원되지 않습니다.')
  } finally {
    isResetting.value = false
  }
}

/**
 * 카테고리 목록 로드
 */
const loadCategories = async () => {
  if (user.value?.role !== 'admin') return;
  try {
    isLoadingCategories.value = true;
    const response = await authenticatedFetch('/api/inventory/categories');
    const data = await response.json();
    if (data.success) {
      categories.value = data.data;
    }
  } catch (error) {
    console.error('Error loading categories:', error);
  } finally {
    isLoadingCategories.value = false;
  }
};

/**
 * 카테고리 생성
 */
const createCategory = async () => {
  if (!newCategoryForm.value.name.trim()) return;
  try {
    isCreatingCategory.value = true;
    const response = await authenticatedFetch('/api/inventory/categories', {
      method: 'POST',
      body: JSON.stringify({
        name: newCategoryForm.value.name.trim(),
        description: newCategoryForm.value.description?.trim() || undefined
      })
    });
    const data = await response.json();
    if (data.success) {
      await loadCategories();
      newCategoryForm.value = { name: '', description: '' };
      alert('카테고리가 생성되었습니다.');
    } else {
      alert(data.message || '카테고리 생성에 실패했습니다.');
    }
  } catch (error) {
    console.error('Error creating category:', error);
    alert('카테고리 생성 중 오류가 발생했습니다.');
  } finally {
    isCreatingCategory.value = false;
  }
};

/**
 * 편집 시작
 */
const startEditCategory = (cat: Category) => {
  editingCategoryId.value = cat.id;
  editCategoryForm.value = {
    name: cat.name,
    description: cat.description || ''
  };
};

/**
 * 편집 취소
 */
const cancelEditCategory = () => {
  editingCategoryId.value = null;
  editCategoryForm.value = { name: '', description: '' };
};

/**
 * 카테고리 수정 저장
 */
const saveEditCategory = async (id: number) => {
  if (!editCategoryForm.value.name.trim()) return;
  try {
    isUpdatingCategory.value = true;
    const response = await authenticatedFetch(`/api/inventory/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: editCategoryForm.value.name.trim(),
        description: editCategoryForm.value.description?.trim() || undefined
      })
    });
    const data = await response.json();
    if (data.success) {
      const idx = categories.value.findIndex(c => c.id === id);
      if (idx !== -1) {
        categories.value[idx] = { ...categories.value[idx], ...data.data };
      }
      cancelEditCategory();
      alert('카테고리가 수정되었습니다.');
    } else {
      alert(data.message || '카테고리 수정에 실패했습니다.');
    }
  } catch (error) {
    console.error('Error updating category:', error);
    alert('카테고리 수정 중 오류가 발생했습니다.');
  } finally {
    isUpdatingCategory.value = false;
  }
};

/**
 * 카테고리 삭제
 */
const deleteCategory = async (cat: Category) => {
  if (!confirm(`"${cat.name}" 카테고리를 삭제하시겠습니까?`)) {
    return;
  }
  try {
    deletingCategoryId.value = cat.id;
    const response = await authenticatedFetch(`/api/inventory/categories/${cat.id}`, {
      method: 'DELETE'
    });
    const data = await response.json();
    if (data.success) {
      categories.value = categories.value.filter(c => c.id !== cat.id);
      alert('카테고리가 삭제되었습니다.');
    } else {
      alert(data.message || '카테고리 삭제에 실패했습니다.');
    }
  } catch (error) {
    console.error('Error deleting category:', error);
    alert('카테고리 삭제 중 오류가 발생했습니다.');
  } finally {
    deletingCategoryId.value = null;
  }
};

/**
 * 컴포넌트 마운트 시 설정 로드 + 카테고리 로드(관리자)
 */
onMounted(async () => {
  await loadSettings();
  if (user.value?.role === 'admin') {
    await loadCategories();
  }
});
</script>