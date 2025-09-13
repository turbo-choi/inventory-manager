/**
 * 공통 타입 정의 파일
 * 프론트엔드와 백엔드에서 공통으로 사용되는 타입들을 정의
 */

// 사용자 역할 타입
export type UserRole = 'admin' | 'employee';

// 사용자 상태 타입
export type UserStatus = 'active' | 'inactive';

// 입출고 거래 타입
export type TransactionType = 'in' | 'out';

// 사용자 인터페이스
export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  created_at: string;
  updated_at: string;
  last_login?: string | null;
}

// 사용자 생성 요청 인터페이스
export interface CreateUserRequest {
  username: string;
  password: string;
  full_name: string;
  email?: string;
  role: UserRole;
}

// 사용자 업데이트 요청 인터페이스
export interface UpdateUserRequest {
  full_name?: string;
  email?: string;
  role?: UserRole;
  is_active?: boolean;
  password?: string;
}

// 카테고리 인터페이스
export interface Category {
  id: number;
  name: string;
  description?: string;
  created_at: string;
}

// 카테고리 생성/업데이트 요청 인터페이스
export interface CategoryRequest {
  name: string;
  description?: string;
}

// 재고 인터페이스
export interface Inventory {
  id: number;
  name: string;
  description?: string;
  sku: string;
  category_id?: number;
  current_stock: number;
  min_stock_level: number;
  unit_price?: number;
  unit: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
  // 조인된 카테고리 정보
  category_name?: string;
}

// 재고 생성 요청 인터페이스
export interface CreateInventoryRequest {
  name: string;
  description?: string;
  sku: string;
  category_id?: number;
  current_stock?: number;
  min_stock_level?: number;
  unit_price?: number;
  unit?: string;
  image_url?: string;
}

// 재고 업데이트 요청 인터페이스
export interface UpdateInventoryRequest {
  name?: string;
  description?: string;
  sku?: string;
  category_id?: number;
  min_stock_level?: number;
  unit_price?: number;
  unit?: string;
  image_url?: string;
}

// 입출고 거래 인터페이스
export interface Transaction {
  id: number;
  inventory_id: number;
  user_id: number;
  type: TransactionType;
  quantity: number;
  notes?: string;
  created_at: string;
  // 조인된 정보
  inventory_name?: string;
  inventory_sku?: string;
  user_name?: string;
}

// 입출고 거래 생성 요청 인터페이스
export interface CreateTransactionRequest {
  inventory_id: number;
  type: TransactionType;
  quantity: number;
  notes?: string;
}

// 로그인 요청 인터페이스
export interface LoginRequest {
  username: string;
  password: string;
}

// 로그인 응답 인터페이스
export interface LoginResponse {
  success: boolean;
  token?: string;
  user?: User;
  message?: string;
}

// API 응답 기본 인터페이스
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// 페이지네이션 인터페이스
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// 페이지네이션된 응답 인터페이스
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: Pagination;
}

// 대시보드 통계 인터페이스
export interface DashboardStats {
  totalItems: number;
  lowStockItems: number;
  totalCategories: number;
  recentTransactions: number;
  totalValue: number;
}

// 검색 및 필터 옵션 인터페이스
export interface SearchFilters {
  search?: string;
  category_id?: number;
  min_stock?: number;
  max_stock?: number;
  sort_by?: 'name' | 'sku' | 'current_stock' | 'created_at';
  sort_order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}