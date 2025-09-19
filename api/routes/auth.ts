import express from 'express';
import type { Request, Response } from 'express';
const { Router } = express;
import bcrypt from 'bcryptjs';
import dbManager from '../database/database';
import { generateToken, authenticateToken } from '../middleware/auth';
import type { LoginRequest, LoginResponse, User, ApiResponse } from '../../shared/types.js';

const router = Router();

/**
 * 로그인 API
 * POST /api/auth/login
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password }: LoginRequest = req.body;

    if (!username || !password) {
      res.status(400).json({
        success: false,
        message: '사용자명과 비밀번호를 입력해주세요'
      } as LoginResponse);
      return;
    }

    const user = dbManager.getUser(username);

    if (!user) {
      res.status(401).json({
        success: false,
        message: '사용자명 또는 비밀번호가 올바르지 않습니다'
      } as LoginResponse);
      return;
    }

    const storedHash = (user as any).password_hash ?? (user as any).password;
    const isPasswordValid = storedHash ? await bcrypt.compare(password, storedHash) : false;
    
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: '사용자명 또는 비밀번호가 올바르지 않습니다'
      } as LoginResponse);
      return;
    }

    // 사용하지 않는 비밀번호 필드를 제거하려던 이전 코드 삭제
    // const { password_hash, ...userWithoutPassword } = user as any;

    const token = generateToken({ id: user.id, username: user.username, role: user.role });

    const mappedUser: User = {
      id: user.id,
      name: user.username,
      email: user.email,
      role: user.role,
      status: 'active',
      created_at: user.created_at,
      updated_at: user.updated_at,
      last_login: null
    };

    res.json({
      success: true,
      token,
      user: mappedUser
    } as LoginResponse);

  } catch (error) {
    console.error('로그인 오류:', error);
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다'
    } as LoginResponse);
  }
});

/**
 * 현재 사용자 정보 조회 API
 * GET /api/auth/me
 */
router.get('/me', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: '인증이 필요합니다'
      } as ApiResponse);
      return;
    }

    const allUsers = dbManager.getAllUsers();
    const user = allUsers.find(u => u.id === req.user!.id);

    if (!user) {
      res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다'
      } as ApiResponse);
      return;
    }

    const mappedUser: User = {
      id: user.id,
      name: user.username,
      email: user.email,
      role: user.role,
      status: 'active',
      created_at: user.created_at,
      updated_at: user.updated_at,
      last_login: null
    };

    res.json({
      success: true,
      data: mappedUser
    } as ApiResponse<User>);

  } catch (error) {
    console.error('사용자 정보 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다'
    } as ApiResponse);
  }
});

/**
 * 비밀번호 변경 API
 * PUT /api/auth/change-password
 */
router.put('/change-password', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({
        success: false,
        message: '현재 비밀번호와 새 비밀번호를 입력해주세요'
      } as ApiResponse);
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({
        success: false,
        message: '새 비밀번호는 최소 6자 이상이어야 합니다'
      } as ApiResponse);
      return;
    }

    const allUsers = dbManager.getAllUsers();
    const user = allUsers.find(u => u.id === req.user!.id);
    
    if (!user) {
      res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다'
      } as ApiResponse);
      return;
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
    
    if (!isCurrentPasswordValid) {
      res.status(400).json({
        success: false,
        message: '현재 비밀번호가 올바르지 않습니다'
      } as ApiResponse);
      return;
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    
    dbManager.updateUser(req.user!.id, { password_hash: hashedNewPassword });

    res.json({
      success: true,
      message: '비밀번호가 성공적으로 변경되었습니다'
    } as ApiResponse);

  } catch (error) {
    console.error('비밀번호 변경 오류:', error);
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다'
    } as ApiResponse);
  }
});

/**
 * 로그아웃 API (클라이언트에서 토큰 삭제)
 * POST /api/auth/logout
 */
router.post('/logout', (req: Request, res: Response): void => {
  res.json({
    success: true,
    message: '로그아웃되었습니다'
  } as ApiResponse);
});

export default router;
