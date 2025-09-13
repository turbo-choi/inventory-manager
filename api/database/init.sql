-- 재고관리 시스템 데이터베이스 초기화 스크립트

-- 사용자 테이블 생성
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    role VARCHAR(20) DEFAULT 'employee' CHECK (role IN ('admin', 'employee')),
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 사용자 테이블 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 카테고리 테이블 생성
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 재고 테이블 생성
CREATE TABLE IF NOT EXISTS inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    sku VARCHAR(100) UNIQUE NOT NULL,
    category_id INTEGER,
    current_stock INTEGER DEFAULT 0,
    min_stock_level INTEGER DEFAULT 0,
    unit_price DECIMAL(10,2),
    unit VARCHAR(20) DEFAULT '개',
    image_url VARCHAR(500),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- 재고 테이블 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_inventory_sku ON inventory(sku);
CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory(category_id);
CREATE INDEX IF NOT EXISTS idx_inventory_stock ON inventory(current_stock);

-- 입출고 거래 테이블 생성
CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    inventory_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('in', 'out')),
    quantity INTEGER NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (inventory_id) REFERENCES inventory(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 거래 테이블 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_transactions_inventory ON transactions(inventory_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(created_at DESC);

-- 입출고 시 재고 자동 업데이트 트리거
CREATE TRIGGER IF NOT EXISTS update_inventory_stock 
AFTER INSERT ON transactions
BEGIN
    UPDATE inventory 
    SET current_stock = current_stock + 
        CASE 
            WHEN NEW.type = 'in' THEN NEW.quantity
            WHEN NEW.type = 'out' THEN -NEW.quantity
        END,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.inventory_id;
END;

-- 기본 카테고리 데이터 삽입
INSERT OR IGNORE INTO categories (name, description) VALUES 
('전자제품', '컴퓨터, 스마트폰 등 전자기기'),
('사무용품', '펜, 종이, 파일 등 사무용품'),
('기타', '기타 분류되지 않은 물품');

-- 초기 관리자 계정 생성 (비밀번호: admin123)
-- 실제 해시값은 bcrypt로 생성된 값으로 대체해야 함
INSERT OR IGNORE INTO users (username, password_hash, full_name, role) 
VALUES ('admin', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '시스템 관리자', 'admin');