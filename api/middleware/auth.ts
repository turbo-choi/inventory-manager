// ... existing code ...
import jwt, { type SignOptions, type JwtPayload } from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import type { UserRole } from '../../shared/types.js';

const JWT_SECRET: string = process.env.JWT_SECRET || 'inventory-management-secret-key';
const JWT_EXPIRES_IN: SignOptions['expiresIn'] = (process.env.JWT_EXPIRES_IN ?? '24h') as SignOptions['expiresIn'];

// 인증 컨텍스트용 최소 사용자 타입
type AuthUser = {
  id: number;
  username: string;
  role: UserRole;
};

// Request 인터페이스 확장 (사용자 정보 추가)
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/**
 * JWT 토큰 생성 함수
 * @param user 사용자 정보
 * @returns JWT 토큰
 */
export const generateToken = (user: AuthUser): string => {
  const payload: JwtPayload = {
    id: user.id,
    username: user.username,
    role: user.role
  } as unknown as JwtPayload;

  const options: SignOptions = { expiresIn: JWT_EXPIRES_IN };
  return jwt.sign(payload, JWT_SECRET, options);
};

/**
 * JWT 토큰 검증 함수
 * @param token JWT 토큰
 * @returns 디코딩된 사용자 정보
 */
export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (_error) {
    throw new Error('Invalid token');
  }
};

/**
 * 인증 미들웨어
 * Authorization 헤더에서 JWT 토큰을 확인하고 사용자 정보를 추출
 */
export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        message: '액세스 토큰이 필요합니다'
      });
      return;
    }

    const decoded = verifyToken(token) as JwtPayload & { id: number; username: string; role: UserRole };

    // 사용자 정보를 request 객체에 추가
    req.user = {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role
    };

    next();
  } catch (_error) {
    res.status(403).json({
      success: false,
      message: '유효하지 않은 토큰입니다'
    });
  }
};

/**
 * 관리자 권한 확인 미들웨어
 * 인증된 사용자가 관리자 권한을 가지고 있는지 확인
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: '인증이 필요합니다'
    });
    return;
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({
      success: false,
      message: '관리자 권한이 필요합니다'
    });
    return;
  }

  next();
};

/**
 * 활성 사용자 확인 미들웨어
 * 사용자 계정이 활성 상태인지 확인 (데이터베이스 조회 필요)
 */
export const requireActiveUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: '인증이 필요합니다'
      });
      return;
    }

    // 실제 구현에서는 데이터베이스에서 사용자 상태를 확인해야 함
    // 여기서는 토큰에 포함된 정보만 사용
    next();
  } catch (_error) {
     res.status(500).json({
       success: false,
       message: '사용자 상태 확인 중 오류가 발생했습니다'
     });
   }
 };

/**
 * 선택적 인증 미들웨어
 * 토큰이 있으면 검증하지만, 없어도 다음 미들웨어로 진행
 */
export const optionalAuth = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = verifyToken(token) as JwtPayload & { id: number; username: string; role: UserRole };
      req.user = {
        id: decoded.id,
        username: decoded.username,
        role: decoded.role
      };
    }

    next();
  } catch (_error) {
     // 토큰이 유효하지 않아도 계속 진행
     next();
   }
 };

export { JWT_SECRET, JWT_EXPIRES_IN };