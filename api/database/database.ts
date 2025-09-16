import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

// ES 모듈에서 __dirname 대체
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 데이터베이스 전용 인터페이스 정의
interface DatabaseUser {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  role: 'admin' | 'employee';
  created_at: string;
  updated_at: string;
}

interface Category {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

interface InventoryItem {
  id: number;
  name: string;
  description?: string;
  sku: string;
  category_id: number;
  quantity: number;
  minimum_quantity: number;
  unit_price: number;
  unit: string;
  supplier?: string;
  location?: string;
  created_at: string;
  updated_at: string;
}

interface Transaction {
  id: number;
  item_id: number;
  user_id: number;
  type: 'in' | 'out';
  quantity: number;
  unit_price: number;
  total_price: number;
  notes?: string;
  created_at: string;
}

interface DatabaseData {
  users: DatabaseUser[];
  categories: Category[];
  inventory: InventoryItem[];
  transactions: Transaction[];
  lastIds: {
    users: number;
    categories: number;
    inventory: number;
    transactions: number;
  };
}

/**
 * JSON 파일 기반 데이터베이스 관리 클래스
 */
export class DatabaseManager {
  private dbPath: string;
  private data: DatabaseData;
  private isInitialized: boolean = false;

  constructor() {
    // 데이터베이스 파일 경로 설정
    this.dbPath = join(__dirname, '../../data/inventory.json');
    
    // 데이터 디렉토리가 없으면 생성
    const dataDir = dirname(this.dbPath);
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true });
    }

    // 데이터베이스 초기화
    this.initializeDatabase();
    console.log('JSON 데이터베이스가 초기화되었습니다.');
  }

  /**
   * 데이터베이스 초기화 - JSON 파일 로드 또는 생성
   */
  private initializeDatabase(): void {
    if (this.isInitialized) return;
    
    try {
      if (existsSync(this.dbPath)) {
        // 기존 데이터 로드
        const fileContent = readFileSync(this.dbPath, 'utf8');
        this.data = JSON.parse(fileContent);
        console.log('기존 데이터베이스 파일을 로드했습니다.');
      } else {
        // 새 데이터베이스 생성
        this.data = this.createInitialData();
        this.saveData();
        console.log('새 데이터베이스 파일을 생성했습니다.');
      }
      
      // 레거시 사용자 레코드 마이그레이션(password -> password_hash 등)
      this.migrateLegacyUsers();
      
      // 관리자 계정의 비밀번호 해시 업데이트
      this.updateAdminPassword();
      this.isInitialized = true;
      
    } catch (error) {
      console.error('데이터베이스 초기화 실패:', error);
      throw error;
    }
  }

  /**
   * 초기 데이터 생성
   */
  private createInitialData(): DatabaseData {
    const now = new Date().toISOString();
    
    return {
      users: [
        {
          id: 1,
          username: 'admin',
          email: 'admin@company.com',
          password_hash: 'temp_hash', // 나중에 업데이트됨
          role: 'admin',
          created_at: now,
          updated_at: now
        }
      ],
      categories: [
        {
          id: 1,
          name: '전자제품',
          description: '전자제품 카테고리',
          created_at: now,
          updated_at: now
        },
        {
          id: 2,
          name: '사무용품',
          description: '사무용품 카테고리',
          created_at: now,
          updated_at: now
        }
      ],
      inventory: [
        {
          id: 1,
          name: '노트북',
          description: '업무용 노트북',
          category_id: 1,
          sku: 'NB-001',
          quantity: 10,
          minimum_quantity: 2,
          unit_price: 1500000,
          unit: 'pcs',
          supplier: 'Tech Corp',
          location: '창고 A-1',
          created_at: now,
          updated_at: now
        },
        {
          id: 2,
          name: '볼펜',
          description: '검정 볼펜',
          category_id: 2,
          sku: 'PEN-001',
          quantity: 100,
          minimum_quantity: 20,
          unit_price: 1000,
          unit: 'pcs',
          supplier: 'Office Supply',
          location: '창고 B-1',
          created_at: now,
          updated_at: now
        }
      ],
      transactions: [],
      lastIds: {
        users: 1,
        categories: 2,
        inventory: 2,
        transactions: 0
      }
    };
  }

  /**
   * 데이터를 파일에 저장
   */
  private saveData(): void {
    try {
      writeFileSync(this.dbPath, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (error) {
      console.error('데이터 저장 실패:', error);
      throw error;
    }
  }

  /**
   * 관리자 계정의 비밀번호를 실제 해시값으로 업데이트
   */
  private updateAdminPassword(): void {
    try {
      const hashedPassword = bcrypt.hashSync('admin123', 10);
      const adminUser = this.data.users.find(user => user.username === 'admin');
      if (adminUser) {
        adminUser.password_hash = hashedPassword;
        adminUser.updated_at = new Date().toISOString();
        this.saveData();
        console.log('관리자 비밀번호가 업데이트되었습니다.');
      }
    } catch (error) {
      console.error('관리자 비밀번호 업데이트 실패:', error);
    }
  }

  /**
   * 레거시 사용자 레코드 마이그레이션
   * - password(평문) 필드가 있으면 bcrypt 해시로 password_hash에 저장 후 password 제거
   * - password_hash가 bcrypt 형식이 아니면 해시로 재생성
   */
  private migrateLegacyUsers(): void {
    if (!this.data || !Array.isArray(this.data.users)) return;

    let changedCount = 0;
    const nowISO = new Date().toISOString();

    for (const u of this.data.users) {
      const userAny = u as any;
      const hasPlainPassword = typeof userAny.password === 'string' && userAny.password.length > 0;
      const hasHash = typeof u.password_hash === 'string' && u.password_hash.length > 0;
      const isBcryptHash = hasHash && /^\$2[aby]\$\d+\$/.test(u.password_hash);

      // 1) password 평문 -> password_hash(bcrypt)
      if (hasPlainPassword) {
        const source = String(userAny.password);
        const newHash = bcrypt.hashSync(source, 10);
        u.password_hash = newHash;
        delete userAny.password;
        u.updated_at = nowISO;
        changedCount++;
        continue; // 다음 사용자로
      }

      // 2) password_hash가 존재하나 bcrypt 형식이 아닌 경우 -> 해시 재생성
      if (hasHash && !isBcryptHash) {
        const newHash = bcrypt.hashSync(u.password_hash, 10);
        u.password_hash = newHash;
        u.updated_at = nowISO;
        changedCount++;
      }
    }

    if (changedCount > 0) {
      this.saveData();
      console.log(`레거시 사용자 레코드 마이그레이션 완료: ${changedCount}건 수정됨`);
    } else {
      console.log('레거시 사용자 레코드 마이그레이션: 변경 사항 없음');
    }
  }

  /**
   * 데이터베이스 데이터 반환
   */
  getData(): DatabaseData {
    return this.data;
  }

  /**
   * 사용자 조회
   */
  getUser(username: string): DatabaseUser | undefined {
    return this.data.users.find(user => user.username === username);
  }

  /**
   * 사용자 생성
   */
  createUser(userData: Omit<DatabaseUser, 'id' | 'created_at' | 'updated_at'>): DatabaseUser {
    const now = new Date().toISOString();
    const newUser: DatabaseUser = {
      id: ++this.data.lastIds.users,
      ...userData,
      created_at: now,
      updated_at: now
    };
    this.data.users.push(newUser);
    this.saveData();
    return newUser;
  }

  /**
   * 모든 사용자 조회
   */
  getAllUsers(): DatabaseUser[] {
    return this.data.users;
  }

  /**
   * 사용자 업데이트
   */
  updateUser(id: number, updates: Partial<Omit<DatabaseUser, 'id' | 'created_at'>>): DatabaseUser | null {
    const user = this.data.users.find(user => user.id === id);
    if (user) {
      Object.assign(user, updates, { updated_at: new Date().toISOString() });
      this.saveData();
      return user;
    }
    return null;
  }

  /**
   * 사용자 삭제 (하드 삭제)
   * - 지정된 ID의 사용자를 데이터베이스에서 완전히 제거합니다.
   * - 관련 트랜잭션 등 참조 무결성은 단순 JSON DB 특성상 별도 처리하지 않습니다.
   */
  deleteUser(id: number): boolean {
    const index = this.data.users.findIndex(u => u.id === id);
    if (index !== -1) {
      this.data.users.splice(index, 1);
      this.saveData();
      return true;
    }
    return false;
  }

  /**
   * 카테고리 조회
   */
  getAllCategories(): Category[] {
    return this.data.categories;
  }

  /**
   * 카테고리 생성
   */
  createCategory(categoryData: Omit<Category, 'id' | 'created_at' | 'updated_at'>): Category {
    const now = new Date().toISOString();
    const newCategory: Category = {
      id: ++this.data.lastIds.categories,
      ...categoryData,
      created_at: now,
      updated_at: now
    };
    this.data.categories.push(newCategory);
    this.saveData();
    return newCategory;
  }

  /**
   * 카테고리 업데이트
   * - 이름/설명 변경을 지원합니다.
   */
  updateCategory(id: number, updates: Partial<Pick<Category, 'name' | 'description'>>): Category | null {
    const category = this.data.categories.find(c => c.id === id);
    if (!category) return null;

    Object.assign(category, updates, { updated_at: new Date().toISOString() });
    this.saveData();
    return category;
  }

  /**
   * 카테고리 삭제 (하드 삭제)
   * - 단순 JSON DB 특성상 참조 무결성은 라우트 레벨에서 검증합니다.
   */
  deleteCategory(id: number): boolean {
    const index = this.data.categories.findIndex(c => c.id === id);
    if (index === -1) return false;

    this.data.categories.splice(index, 1);
    this.saveData();
    return true;
  }

  /**
   * 재고 아이템 조회
   */
  getAllInventoryItems(): InventoryItem[] {
    return this.data.inventory;
  }

  /**
   * 재고 아이템 생성
   */
  createInventoryItem(itemData: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at'>): InventoryItem {
    const now = new Date().toISOString();
    const newItem: InventoryItem = {
      id: ++this.data.lastIds.inventory,
      ...itemData,
      created_at: now,
      updated_at: now
    };
    this.data.inventory.push(newItem);
    this.saveData();
    return newItem;
  }

  updateInventoryItem(id: number, updates: Partial<Omit<InventoryItem, 'id' | 'created_at'>>): InventoryItem | null {
    const idx = this.data.inventory.findIndex(item => item.id === id);
    if (idx === -1) return null;

    const current = this.data.inventory[idx];
    const updated: InventoryItem = { ...current, ...updates, updated_at: new Date().toISOString() };
    this.data.inventory[idx] = updated;
    this.saveData();
    return updated;
  }

  deleteInventoryItem(id: number): boolean {
    const idx = this.data.inventory.findIndex(item => item.id === id);
    if (idx === -1) return false;
    this.data.inventory.splice(idx, 1);
    this.saveData();
    return true;
  }

  /**
   * 거래 내역 조회
   */
  getAllTransactions(): Transaction[] {
    return this.data.transactions;
  }

  /**
   * 거래 내역 생성
   */
  createTransaction(transactionData: Omit<Transaction, 'id' | 'created_at'>): Transaction {
    const now = new Date().toISOString();
    const newTransaction: Transaction = {
      id: ++this.data.lastIds.transactions,
      ...transactionData,
      created_at: now
    };
    this.data.transactions.push(newTransaction);
    this.saveData();
    return newTransaction;
  }

  /**
   * 거래 내역 수정 (메모만 수정 가능)
   */
  updateTransaction(id: number, updates: Partial<Pick<Transaction, 'notes'>>): Transaction | null {
    const idx = this.data.transactions.findIndex(t => t.id === id);
    if (idx === -1) return null;

    const current = this.data.transactions[idx];
    const updated: Transaction = {
      ...current,
      ...(updates.hasOwnProperty('notes') ? { notes: updates.notes } : {})
    };

    this.data.transactions[idx] = updated;
    this.saveData();
    return updated;
  }

  /**
   * 거래 내역 삭제
   */
  deleteTransaction(id: number): boolean {
    const idx = this.data.transactions.findIndex(t => t.id === id);
    if (idx === -1) return false;

    this.data.transactions.splice(idx, 1);
    this.saveData();
    return true;
  }

  /**
   * 데이터베이스 연결 종료 (JSON 기반에서는 불필요)
   */
  close(): void {
    console.log('JSON 데이터베이스 연결이 종료되었습니다.');
  }
}

// 싱글톤 인스턴스 생성
const dbManager = new DatabaseManager();

export default dbManager;

// deleteInventoryItem(id: number): boolean {
//   const idx = this.data.inventory.findIndex(item => item.id === id);
//   if (idx === -1) return false;
//   this.data.inventory.splice(idx, 1);
//   this.saveData();
//   return true;
// }