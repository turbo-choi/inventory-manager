import express from 'express';
import type { Request, Response } from 'express';
const { Router } = express;
import bcrypt from 'bcryptjs';
import dbManager from '../database/database';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import type { User, UserRole, UserStatus, ApiResponse, PaginatedResponse, CreateUserRequest, UpdateUserRequest } from '../../shared/types.js';

const router = Router();

/**
 * 사용자 통계 조회 API (관리자만 접근 가능)
 * GET /api/users/stats
 */
router.get('/stats', authenticateToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const allUsers = dbManager.getAllUsers();
    
    const stats = {
      total: allUsers.length,
      // is_active가 명시적으로 false인 경우만 비활성으로 간주하고, 없는 경우 기본 활성 처리
      active: allUsers.filter(u => (u as any).is_active !== false).length,
      admins: allUsers.filter(user => user.role === 'admin').length,
      todayLogins: 0 // 로그인 기록이 없으므로 0
    };

    res.json({
      success: true,
      data: stats
    } as ApiResponse);

  } catch (error) {
    console.error('사용자 통계 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다'
    } as ApiResponse);
  }
});

/**
 * 사용자 목록 조회 API (관리자만 접근 가능)
 * GET /api/users
 */
router.get('/', authenticateToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string || '';
    const role = req.query.role as UserRole;
    // 기존 쿼리 파라미터 유지(미사용)
    const isActive = req.query.is_active;
    // 프론트에서 사용하는 status(active|inactive) 필터 지원
    const statusFilter = req.query.status as string | undefined;

    // 모든 사용자 조회
    let allUsers = dbManager.getAllUsers();
    
    // 검색 필터링
    if (search) {
      const searchLower = search.toLowerCase();
      allUsers = allUsers.filter(user => 
        user.username.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower)
      );
    }
    
    if (role) {
      allUsers = allUsers.filter(user => user.role === role);
    }

    // 상태 필터링(active|inactive)
    if (statusFilter === 'active' || statusFilter === 'inactive') {
      const wantActive = statusFilter === 'active';
      allUsers = allUsers.filter(u => (((u as any).is_active !== false) === wantActive));
    }
    
    // 총 개수
    const total = allUsers.length;
    
    // 페이지네이션
    const offset = (page - 1) * limit;
    const users = allUsers
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(offset, offset + limit)
      .map(user => ({
        id: user.id,
        name: user.username,
        email: user.email,
        role: user.role,
        status: (((user as any).is_active === false) ? 'inactive' : 'active') as UserStatus,
        created_at: user.created_at,
        updated_at: user.updated_at,
        last_login: null
      })) as User[];

    const response: PaginatedResponse<User> = {
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };

    res.json(response);

  } catch (error) {
    console.error('사용자 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다'
    } as ApiResponse);
  }
});

/**
 * 사용자 상세 조회 API
 * GET /api/users/:id
 */
router.get('/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = parseInt(req.params.id);
    
    // 관리자가 아닌 경우 자신의 정보만 조회 가능
    if (req.user!.role !== 'admin' && req.user!.id !== userId) {
      res.status(403).json({
        success: false,
        message: '접근 권한이 없습니다'
      } as ApiResponse);
      return;
    }

    const allUsers = dbManager.getAllUsers();
    const user = allUsers.find(u => u.id === userId);
    
    if (!user) {
      res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다'
      } as ApiResponse);
      return;
    }
    
    // 새로운 User 인터페이스에 맞게 변환
    const userResponse: User = {
      id: user.id,
      name: user.username,
      email: user.email,
      role: user.role,
      status: (((user as any).is_active === false) ? 'inactive' : 'active') as UserStatus,
      created_at: user.created_at,
      updated_at: user.updated_at,
      last_login: null
    };

    res.json({
      success: true,
      data: userResponse
    } as ApiResponse<User>);

  } catch (error) {
    console.error('사용자 상세 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다'
    } as ApiResponse);
  }
});

/**
 * 사용자 생성 API (관리자만 접근 가능)
 * POST /api/users
 */
router.post('/', authenticateToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password, fullName, email, role }: CreateUserRequest = req.body;

    // 입력 검증
    if (!username || !password || !fullName || !email || !role) {
      res.status(400).json({
        success: false,
        message: '모든 필드를 입력해주세요'
      } as ApiResponse);
      return;
    }

    if (password.length < 6) {
      res.status(400).json({
        success: false,
        message: '비밀번호는 최소 6자 이상이어야 합니다'
      } as ApiResponse);
      return;
    }

    if (!['admin', 'employee'].includes(role)) {
      res.status(400).json({
        success: false,
        message: '올바른 역할을 선택해주세요'
      } as ApiResponse);
      return;
    }

    // 중복 사용자명 확인
    const existingUser = dbManager.getUser(username);
    
    if (existingUser) {
      res.status(409).json({
        success: false,
        message: '이미 존재하는 사용자명입니다'
      } as ApiResponse);
      return;
    }

    // 비밀번호 해시화
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // 사용자 생성
    const newUser = dbManager.createUser({
      username,
      password_hash: hashedPassword,
      email,
      role
    });

    // 새로운 User 인터페이스에 맞게 변환
    const userResponse: User = {
      id: newUser.id,
      name: newUser.username,
      email: newUser.email,
      role: newUser.role,
      status: 'active' as UserStatus,
      created_at: newUser.created_at,
      updated_at: newUser.updated_at,
      last_login: null
    };

    res.status(201).json({
      success: true,
      data: userResponse,
      message: '사용자가 성공적으로 생성되었습니다'
    } as ApiResponse<User>);

  } catch (error) {
    console.error('사용자 생성 오류:', error);
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다'
    } as ApiResponse);
  }
});

/**
 * 사용자 정보 수정 API
 * PUT /api/users/:id
 */
router.put('/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = parseInt(req.params.id);
    const { fullName, email, role, isActive }: UpdateUserRequest = req.body;
    
    // 관리자가 아닌 경우 자신의 정보만 수정 가능 (역할과 활성화 상태 제외)
    if (req.user!.role !== 'admin' && req.user!.id !== userId) {
      res.status(403).json({
        success: false,
        message: '접근 권한이 없습니다'
      } as ApiResponse);
      return;
    }

    // 일반 사용자는 역할과 활성화 상태 변경 불가
    if (req.user!.role !== 'admin' && (role !== undefined || isActive !== undefined)) {
      res.status(403).json({
        success: false,
        message: '역할과 활성화 상태는 관리자만 변경할 수 있습니다'
      } as ApiResponse);
      return;
    }

    // 기존 사용자 확인
    const allUsers = dbManager.getAllUsers();
    const existingUser = allUsers.find(user => user.id === userId);
    
    if (!existingUser) {
      res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다'
      } as ApiResponse);
      return;
    }

    // 업데이트할 필드 구성
    const updateData: any = {};

    if (fullName !== undefined) {
      updateData.full_name = fullName;
    }

    if (email !== undefined) {
      updateData.email = email;
    }

    if (role !== undefined && req.user!.role === 'admin') {
      if (!['admin', 'employee'].includes(role)) {
        res.status(400).json({
          success: false,
          message: '올바른 역할을 선택해주세요'
        } as ApiResponse);
        return;
      }
      updateData.role = role;
    }

    if (isActive !== undefined && req.user!.role === 'admin') {
      updateData.is_active = isActive;
    }

    if (Object.keys(updateData).length === 0) {
      res.status(400).json({
        success: false,
        message: '업데이트할 정보가 없습니다'
      } as ApiResponse);
      return;
    }

    // 사용자 정보 업데이트
    const updatedUser = dbManager.updateUser(userId, updateData);
    
    if (!updatedUser) {
      res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다'
      } as ApiResponse);
      return;
    }

    // 새로운 User 인터페이스에 맞게 변환
    const userResponse: User = {
      id: updatedUser.id,
      name: updatedUser.username,
      email: updatedUser.email,
      role: updatedUser.role,
      status: (((updatedUser as any).is_active === false) ? 'inactive' : 'active') as UserStatus,
      created_at: updatedUser.created_at,
      updated_at: updatedUser.updated_at,
      last_login: null
    };

    res.json({
      success: true,
      data: userResponse,
      message: '사용자 정보가 성공적으로 업데이트되었습니다'
    } as ApiResponse<User>);

  } catch (error) {
    console.error('사용자 정보 수정 오류:', error);
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다'
    } as ApiResponse);
  }
});

/**
 * 사용자 삭제 API (관리자만 접근 가능)
 * DELETE /api/users/:id
 */
router.delete('/:id', authenticateToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = parseInt(req.params.id);
    
    // 자기 자신은 삭제할 수 없음
    if (req.user!.id === userId) {
      res.status(400).json({
        success: false,
        message: '자기 자신은 삭제할 수 없습니다'
      } as ApiResponse);
      return;
    }

    // 사용자 존재 확인
    const allUsers = dbManager.getAllUsers();
    const existingUser = allUsers.find(user => user.id === userId);
    
    if (!existingUser) {
      res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다'
      } as ApiResponse);
      return;
    }

    // 유일한 관리자 계정이면 삭제 금지
    if (existingUser.role === 'admin') {
      const adminCount = allUsers.filter(u => u.role === 'admin').length;
      if (adminCount <= 1) {
        res.status(400).json({
          success: false,
          message: '유일한 관리자 계정은 삭제할 수 없습니다. 다른 관리자 계정을 먼저 생성하세요.'
        } as ApiResponse);
        return;
      }
    }

    // 사용자 하드 삭제
    const deleted = dbManager.deleteUser(userId);
    if (!deleted) {
      res.status(500).json({
        success: false,
        message: '삭제 처리 중 오류가 발생했습니다'
      } as ApiResponse);
      return;
    }

    res.json({
      success: true,
      message: '사용자가 성공적으로 삭제되었습니다'
    } as ApiResponse);

  } catch (error) {
    console.error('사용자 삭제 오류:', error);
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다'
    } as ApiResponse);
  }
});

export default router;