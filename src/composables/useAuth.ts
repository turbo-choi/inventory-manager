import { ref, computed } from 'vue';
import type { User } from '../../shared/types';

// 전역 상태
const token = ref<string | null>(localStorage.getItem('token'));
const user = ref<User | null>(null);
const isLoading = ref(false);

/**
 * 인증 관련 기능을 제공하는 composable
 */
export function useAuth() {
  // 로그인 상태 확인
  const isAuthenticated = computed(() => !!token.value);
  
  // 관리자 권한 확인
  const isAdmin = computed(() => user.value?.role === 'admin');
  
  // 활성 사용자 확인
  const isActiveUser = computed(() => user.value?.status === 'active');

  /**
   * 로그인 함수
   * @param username 사용자명
   * @param password 비밀번호
   * @returns Promise<{success: boolean, message?: string}>
   */
  const login = async (username: string, password: string) => {
    try {
      isLoading.value = true;
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.success) {
        token.value = data.token;
        user.value = data.user;
        localStorage.setItem('token', data.token);
        return { success: true };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: '로그인 중 오류가 발생했습니다.' };
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * 로그아웃 함수
   */
  const logout = async () => {
    try {
      if (token.value) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token.value}`,
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      token.value = null;
      user.value = null;
      localStorage.removeItem('token');
    }
  };

  /**
   * 현재 사용자 정보 가져오기
   */
  const fetchCurrentUser = async () => {
    if (!token.value) return;

    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token.value}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        user.value = data.data;
      } else {
        // 토큰이 유효하지 않은 경우 로그아웃
        await logout();
      }
    } catch (error) {
      console.error('Fetch user error:', error);
      await logout();
    }
  };

  /**
   * 비밀번호 변경
   * @param currentPassword 현재 비밀번호
   * @param newPassword 새 비밀번호
   * @returns Promise<{success: boolean, message?: string}>
   */
  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      isLoading.value = true;
      
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token.value}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();
      return { success: data.success, message: data.message };
    } catch (error) {
      console.error('Change password error:', error);
      return { success: false, message: '비밀번호 변경 중 오류가 발생했습니다.' };
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * API 요청을 위한 헤더 생성
   */
  const getAuthHeaders = () => {
    return {
      'Content-Type': 'application/json',
      ...(token.value && { 'Authorization': `Bearer ${token.value}` }),
    };
  };

  /**
   * 인증이 필요한 API 요청
   * @param url 요청 URL
   * @param options fetch 옵션
   * @returns Promise<Response>
   */
  const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...options.headers,
      },
    });

    // 401 에러 시 자동 로그아웃
    if (response.status === 401) {
      await logout();
      throw new Error('인증이 만료되었습니다. 다시 로그인해주세요.');
    }

    return response;
  };

  return {
    // 상태
    token: computed(() => token.value),
    user: computed(() => user.value),
    isLoading: computed(() => isLoading.value),
    isAuthenticated,
    isAdmin,
    isActiveUser,
    
    // 메서드
    login,
    logout,
    fetchCurrentUser,
    changePassword,
    getAuthHeaders,
    authenticatedFetch,
  };
}