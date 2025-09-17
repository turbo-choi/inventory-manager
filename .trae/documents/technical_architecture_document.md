# 재고관리 시스템 기술 아키텍처 문서

## 1. Architecture design

```mermaid
graph TD
    A[User Browser] --> B[Vue 3 Frontend (Vite)]
    B --> C[Express.js Backend API]
    C --> E[JWT Authentication Middleware]
    C --> D[JSON File DB (Default): data/inventory.json]
    C -. optional .-> F[(SQLite Database - Optional)]

    subgraph "Frontend Layer"
        B
    end

    subgraph "Backend Layer"
        C
        E
    end

    subgraph "Data Layer"
        D
        F
    end
```

## 2. Technology Description

* **Frontend**: Vue.js\@3 + TypeScript + Vite + Tailwind CSS + Pinia

* **Backend**: Express.js\@4 + TypeScript + JWT + bcrypt

* **Database**: JSON 파일 기반 저장소(기본, data/inventory.json) + SQLite3(옵션, init.sql 기반)

* **Development**: ESLint + Nodemon + TSX + Concurrently

## 3. Route definitions

| Route         | Purpose                       |
| ------------- | ----------------------------- |
| /login        | 로그인 페이지, 사용자 인증 처리            |
| /dashboard    | 대시보드, 재고 현황 요약 및 빠른 액션        |
| /inventory    | 재고 목록 페이지, 전체 재고 조회 및 검색      |
| /transactions | 입출고 관리 페이지, 입출고 등록 및 이력 조회    |
| /users        | 사용자 관리 페이지, 직원 계정 관리 (관리자 전용) |
| /settings     | 설정 페이지, 시스템 설정 및 프로필 관리       |
| /home         | 홈 페이지                         |

## 4. API definitions

### 4.1 Core API

**사용자 인증 관련**

```
POST /api/auth/login
GET /api/auth/me
```

Request:

| Param Name | Param Type | isRequired | Description |
| ---------- | ---------- | ---------- | ----------- |
| username   | string     | true       | 사용자명        |
| password   | string     | true       | 비밀번호 (평문)   |

Response:

| Param Name | Param Type | Description |
| ---------- | ---------- | ----------- |
| success    | boolean    | 로그인 성공 여부   |
| token      | string     | JWT 토큰      |
| user       | object     | 사용자 정보      |

Example:

```json
{
  "username": "admin",
  "password": "password123"
}
```

**재고 관리 관련**

```
GET /api/inventory
GET /api/inventory/:id
POST /api/inventory
PUT /api/inventory/:id
DELETE /api/inventory/:id

GET /api/inventory/categories
POST /api/inventory/categories
PUT /api/inventory/categories/:id
DELETE /api/inventory/categories/:id
```

**입출고 관리 관련**

```
GET /api/transactions
POST /api/transactions
GET /api/transactions/inventory/:id
GET /api/transactions/stats
```

**사용자 관리 관련 (관리자 전용)**

```
GET /api/users
POST /api/users
PUT /api/users/:id
DELETE /api/users/:id
GET /api/users/stats
```

## 5. Server architecture diagram

```mermaid
graph TD
    A[Client Request] --> B[Express Router]
    B --> C[Auth (JWT) Middleware]
    C --> D[Route Handlers]
    D --> E[(JSON DB Manager)]
    E -. optional .-> F[(SQLite Adapter - Optional)]
    D --> G[Error Handler]

    subgraph "Express.js Server"
        B
        C
        D
        G
    end

    subgraph "Data Layer"
        E
        F
    end
```

## 6. Data model

> 참고: 아래 스키마는 SQLite(옵션) 기준이며, 실제 런타임은 JSON 파일 저장소(data/inventory.json)를 기본으로 사용합니다. 타입 구조는 <mcfile name="types.ts" path="c:\\workspaces\\workspace-trae\\inventory-manager\\shared\\types.ts"></mcfile>와 동일한 형태를 따릅니다.

### 6.1 Data model definition

```mermaid
-- 사용자 테이블 생성
CREATE TABLE users (
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

-- 인덱스 생성
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);

-- 초기 관리자 계정 생성
INSERT INTO users (username, password_hash, full_name, role) 
VALUES ('admin', '$2b$10$hash_here', '시스템 관리자', 'admin');
```

### 6.2 Data Definition Language

**사용자 테이블 (users)**

```sql
erDiagram
    USERS ||--o{ TRANSACTIONS : creates
    INVENTORY ||--o{ TRANSACTIONS : involves
    CATEGORIES ||--o{ INVENTORY : contains

    USERS {
        integer id PK
        string username UK
        string password_hash
        string full_name
        string email
        string role
        boolean is_active
        datetime created_at
        datetime updated_at
    }

    CATEGORIES {
        integer id PK
        string name UK
        string description
        datetime created_at
    }

    INVENTORY {
        integer id PK
        string name
        string description
        string sku UK
        integer category_id FK
        integer current_stock
        integer min_stock_level
        decimal unit_price
        string unit
        string image_url
        datetime created_at
        datetime updated_at
    }

    TRANSACTIONS {
        integer id PK
        integer inventory_id FK
        integer user_id FK
        string type
        integer quantity
        string notes
        datetime created_at
    }
```

**카테고리 테이블 (categories)**

```sql
-- 카테고리 테이블 생성
CREATE TABLE categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 기본 카테고리 데이터
INSERT INTO categories (name, description) VALUES 
('전자제품', '컴퓨터, 스마트폰 등 전자기기'),
('사무용품', '펜, 종이, 파일 등 사무용품'),
('기타', '기타 분류되지 않은 물품');
```

**재고 테이블 (inventory)**

```sql
-- 재고 테이블 생성
CREATE TABLE inventory (
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

-- 인덱스 생성
CREATE INDEX idx_inventory_sku ON inventory(sku);
CREATE INDEX idx_inventory_category ON inventory(category_id);
CREATE INDEX idx_inventory_stock ON inventory(current_stock);
```

**입출고 거래 테이블 (transactions)**

```sql
-- 거래 테이블 생성
CREATE TABLE transactions (
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

-- 인덱스 생성
CREATE INDEX idx_transactions_inventory ON transactions(inventory_id);
CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_date ON transactions(created_at DESC);
```

**트리거 생성 (재고 자동 업데이트)**

```sql
-- 입출고 시 재고 자동 업데이트 트리거
CREATE TRIGGER update_inventory_stock 
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
```

## 7. Sequence diagrams

> 아래 시퀀스는 현재 구현(Express 라우트, 미들웨어, dbManager 호출, 프런트 useAuth 및 페이지 흐름)을 기준으로 작성되었습니다. 보호 라우트 접근 전 토큰 검사와 관리자 전용 분기 등을 포함합니다.

### 7.1 로그인 플로우

```mermaid
sequenceDiagram
  participant U as User
  participant FE as Frontend (LoginPage.vue / useAuth.ts)
  participant API as Backend /api/auth
  participant DB as dbManager (JSON/SQLite)

  U->>FE: 사용자명/비밀번호 입력, 로그인 버튼 클릭
  FE->>API: POST /api/auth/login { username, password }
  API->>DB: getUser(username)
  DB-->>API: User { password_hash }
  API->>API: bcrypt.compare(password, password_hash)
  alt 유효한 자격 증명
    API->>API: generateToken(user)
    API-->>FE: 200 { success, token, user }
    FE->>FE: localStorage.setItem('token') + Authorization 헤더 설정
    opt 프로필 동기화
      FE->>API: GET /api/auth/me
      API->>DB: getAllUsers() -> find by id
      API-->>FE: 200 { success, data: user }
    end
    FE->>FE: /dashboard 등 보호 페이지로 라우팅
  else 인증 실패
    API-->>FE: 400/401 { success:false, message }
    FE->>FE: 오류 메시지 표시
  end

  U-->>FE: 로그아웃 클릭
  FE->>FE: localStorage.removeItem('token')
  FE->>API: POST /api/auth/logout
  API-->>FE: 200 { success:true, message }
```

### 7.2 입출고 등록(트랜잭션 생성)

```mermaid
sequenceDiagram
  participant U as User
  participant FE as Frontend (Transactions Form)
  participant API as Backend /api/transactions
  participant MW as Middleware (authenticateToken, requireActiveUser)
  participant DB as dbManager

  U->>FE: 유형(in|out), 수량, 메모 입력
  FE->>API: POST /api/transactions (Authorization: Bearer ...)
  API->>MW: 토큰 인증 + 활성 사용자 확인
  alt 인증/권한 통과
    API->>DB: getAllInventoryItems().find(inventoryId)
    alt 재고 없음
      API-->>FE: 404 재고 없음
    else 재고 있음
      API->>API: updated = in ? qty+ : qty-
      alt updated < 0 (출고 수량 초과)
        API-->>FE: 400 출고 수량이 현재 재고보다 많음
      else 가능
        API->>DB: updateInventoryItem(id, { quantity: updated })
        API->>DB: createTransaction({ inventory_id, type, quantity, notes, created_by })
        API-->>FE: 201 { success:true, data: transaction }
        FE->>FE: 목록/재고/통계 갱신
      end
    end
  else 인증 실패
    API-->>FE: 401/403
    FE->>FE: 로그인 페이지로 이동
  end
```

### 7.3 카테고리 CRUD

```mermaid
sequenceDiagram
  participant Admin as Admin User
  participant FE as Frontend (Categories UI)
  participant API as Backend /api/inventory/categories
  participant MW as Middleware (authenticateToken, requireAdmin)
  participant DB as dbManager

  Admin->>FE: 카테고리 화면 진입
  FE->>API: GET /categories (Authorization)
  API->>MW: authenticateToken
  API->>DB: getAllCategories().sort(name)
  API-->>FE: 200 Category[]

  par 생성(POST)
    Admin->>FE: 새 카테고리 입력
    FE->>API: POST /categories { name, description }
    API->>MW: authenticateToken + requireAdmin
    API->>DB: getAllCategories() 중복 검사
    alt 이름 중복
      API-->>FE: 409 이미 존재하는 이름
    else 유효
      API->>DB: createCategory({ name, description })
      API-->>FE: 201 { success:true, data }
    end
  and 수정(PUT)
    Admin->>FE: 카테고리 수정
    FE->>API: PUT /categories/:id { name?, description? }
    API->>MW: authenticateToken + requireAdmin
    API->>DB: getAllCategories().find(id)
    alt 대상 없음
      API-->>FE: 404 카테고리 없음
    else 대상 있음
      API->>DB: 중복 이름 체크(자기 자신 제외)
      alt 중복 발생
        API-->>FE: 409 이름 중복
      else 통과
        API->>DB: updateCategory(id, {...})
        API-->>FE: 200 { success:true, data }
      end
    end
  and 삭제(DELETE)
    Admin->>FE: 카테고리 삭제
    FE->>API: DELETE /categories/:id
    API->>MW: authenticateToken + requireAdmin
    API->>DB: getAllInventoryItems() 참조 검사
    alt 참조됨(재고가 사용중)
      API-->>FE: 400 참조 중이라 삭제 불가
    else 미참조
      API->>DB: deleteCategory(id)
      alt 삭제 성공
        API-->>FE: 200 삭제 완료
      else 대상 없음
        API-->>FE: 404 카테고리 없음
      end
    end
  end
```


