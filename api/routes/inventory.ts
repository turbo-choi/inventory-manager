import express from 'express';
import type { Request, Response } from 'express';
const { Router } = express;
import dbManager from '../database/database';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import type { Inventory, Category, ApiResponse, PaginatedResponse, CreateInventoryRequest, UpdateInventoryRequest } from '../../shared/types.js';

const router = Router();

/**
 * 재고 목록 조회 API
 * GET /api/inventory
 */
router.get('/', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string || '';
    const categoryId = req.query.category_id ? parseInt(req.query.category_id as string) : undefined;
    const lowStock = req.query.low_stock === 'true';

    const offset = (page - 1) * limit;

    // 모든 재고 아이템과 카테고리 조회
    let allInventory = dbManager.getAllInventoryItems();
    const allCategories = dbManager.getAllCategories();

    // 카테고리 정보를 맵으로 변환
    const categoryMap = new Map(allCategories.map(cat => [cat.id, cat.name]));

    // 검색 조건 적용
    if (search) {
      const searchLower = search.toLowerCase();
      allInventory = allInventory.filter(item => 
        item.name.toLowerCase().includes(searchLower) ||
        (item.description && item.description.toLowerCase().includes(searchLower)) ||
        item.sku.toLowerCase().includes(searchLower)
      );
    }

    if (categoryId) {
      allInventory = allInventory.filter(item => item.category_id === categoryId);
    }

    if (lowStock) {
      allInventory = allInventory.filter(item => item.quantity <= item.minimum_quantity);
    }

    // 총 개수
    const total = allInventory.length;

    // 정렬 및 페이지네이션
    const inventory = allInventory
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(offset, offset + limit)
      .map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        sku: item.sku,
        category_id: item.category_id,
        category_name: categoryMap.get(item.category_id) || '',
        current_quantity: item.quantity,
        minimum_quantity: item.minimum_quantity,
        unit_price: item.unit_price,
        location: item.location,
        created_at: item.created_at,
        updated_at: item.updated_at
      }));

    const response: PaginatedResponse<Inventory> = {
      success: true,
      data: inventory,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };

    res.json(response);

  } catch (error) {
    console.error('재고 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다'
    } as ApiResponse);
  }
});

/**
 * 재고 상세 조회 API
 * GET /api/inventory/:id
 */
router.get('/:id(\\d+)', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const inventoryId = parseInt(req.params.id);

    // 재고 아이템과 카테고리 조회
    const allInventory = dbManager.getAllInventoryItems();
    const allCategories = dbManager.getAllCategories();
    const categoryMap = new Map(allCategories.map(cat => [cat.id, cat.name]));
    
    const inventoryItem = allInventory.find(item => item.id === inventoryId);
    
    if (!inventoryItem) {
      res.status(404).json({
        success: false,
        message: '재고 항목을 찾을 수 없습니다'
      } as ApiResponse);
      return;
    }
    
    const inventory = {
      id: inventoryItem.id,
      name: inventoryItem.name,
      description: inventoryItem.description,
      sku: inventoryItem.sku,
      category_id: inventoryItem.category_id,
      category_name: categoryMap.get(inventoryItem.category_id) || '',
      current_quantity: inventoryItem.quantity,
      minimum_quantity: inventoryItem.minimum_quantity,
      unit_price: inventoryItem.unit_price,
      location: inventoryItem.location,
      created_at: inventoryItem.created_at,
      updated_at: inventoryItem.updated_at
    };

    res.json({
      success: true,
      data: inventory
    } as ApiResponse<Inventory>);

  } catch (error) {
    console.error('재고 상세 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다'
    } as ApiResponse);
  }
});

/**
 * 재고 생성 API (관리자만 접근 가능)
 * POST /api/inventory
 */
router.post('/', authenticateToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      name, 
      description, 
      sku, 
      categoryId, 
      currentQuantity, 
      minimumQuantity, 
      unitPrice, 
      location 
    }: CreateInventoryRequest = req.body;

    // 입력 검증
    if (!name || !sku || categoryId === undefined || currentQuantity === undefined || minimumQuantity === undefined || unitPrice === undefined) {
      res.status(400).json({
        success: false,
        message: '필수 필드를 모두 입력해주세요'
      } as ApiResponse);
      return;
    }

    if (currentQuantity < 0 || minimumQuantity < 0 || unitPrice < 0) {
      res.status(400).json({
        success: false,
        message: '수량과 가격은 0 이상이어야 합니다'
      } as ApiResponse);
      return;
    }

    // 중복 SKU 확인
    const allInventory = dbManager.getAllInventoryItems();
    const existingSku = allInventory.find(item => item.sku === sku);
    
    if (existingSku) {
      res.status(409).json({
        success: false,
        message: '이미 존재하는 SKU입니다'
      } as ApiResponse);
      return;
    }

    // 카테고리 존재 확인
    const allCategories = dbManager.getAllCategories();
    const category = allCategories.find(cat => cat.id === categoryId);
    
    if (!category) {
      res.status(400).json({
        success: false,
        message: '존재하지 않는 카테고리입니다'
      } as ApiResponse);
      return;
    }

    // 재고 생성
    const newInventoryItem = dbManager.createInventoryItem({
      name,
      description,
      sku,
      category_id: categoryId,
      quantity: currentQuantity,
      minimum_quantity: minimumQuantity,
      unit_price: unitPrice,
      location
    });
    
    // 응답용 데이터 구성
    const newInventory = {
      id: newInventoryItem.id,
      name: newInventoryItem.name,
      description: newInventoryItem.description,
      sku: newInventoryItem.sku,
      category_id: newInventoryItem.category_id,
      category_name: category.name,
      current_quantity: newInventoryItem.quantity,
      minimum_quantity: newInventoryItem.minimum_quantity,
      unit_price: newInventoryItem.unit_price,
      location: newInventoryItem.location,
      created_at: newInventoryItem.created_at,
      updated_at: newInventoryItem.updated_at
    };

    res.status(201).json({
      success: true,
      data: newInventory,
      message: '재고가 성공적으로 생성되었습니다'
    } as ApiResponse<Inventory>);

  } catch (error) {
    console.error('재고 생성 오류:', error);
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다'
    } as ApiResponse);
  }
});

/**
 * 재고 정보 수정 API (관리자만 접근 가능)
 * PUT /api/inventory/:id
 */
router.put('/:id(\\d+)', authenticateToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const inventoryId = parseInt(req.params.id);
    const { 
      name, 
      description, 
      sku, 
      categoryId, 
      minimumQuantity, 
      unitPrice, 
      location 
    }: UpdateInventoryRequest = req.body;

    // 기존 재고 확인
    const allInventory = dbManager.getAllInventoryItems();
    const existingInventory = allInventory.find(item => item.id === inventoryId);
    
    if (!existingInventory) {
      res.status(404).json({
        success: false,
        message: '재고 항목을 찾을 수 없습니다'
      } as ApiResponse);
      return;
    }

    // SKU 중복 확인 (자기 자신 제외)
    if (sku) {
      const duplicateSku = allInventory.find(item => item.sku === sku && item.id !== inventoryId);
      
      if (duplicateSku) {
        res.status(409).json({
          success: false,
          message: '이미 존재하는 SKU입니다'
        } as ApiResponse);
        return;
      }
    }

    // 카테고리 존재 확인
    if (categoryId) {
      const allCategories = dbManager.getAllCategories();
      const category = allCategories.find(cat => cat.id === categoryId);
      
      if (!category) {
        res.status(400).json({
          success: false,
          message: '존재하지 않는 카테고리입니다'
        } as ApiResponse);
        return;
      }
    }

    // 업데이트할 필드 구성
    const updateData: any = {};
    let hasUpdates = false;

    if (name !== undefined) {
      updateData.name = name;
      hasUpdates = true;
    }

    if (description !== undefined) {
      updateData.description = description;
      hasUpdates = true;
    }

    if (sku !== undefined) {
      updateData.sku = sku;
      hasUpdates = true;
    }

    if (categoryId !== undefined) {
      updateData.category_id = categoryId;
      hasUpdates = true;
    }

    if (minimumQuantity !== undefined) {
      if (minimumQuantity < 0) {
        res.status(400).json({
          success: false,
          message: '최소 수량은 0 이상이어야 합니다'
        } as ApiResponse);
        return;
      }
      updateData.minimum_quantity = minimumQuantity;
      hasUpdates = true;
    }

    if (unitPrice !== undefined) {
      if (unitPrice < 0) {
        res.status(400).json({
          success: false,
          message: '단가는 0 이상이어야 합니다'
        } as ApiResponse);
        return;
      }
      updateData.unit_price = unitPrice;
      hasUpdates = true;
    }

    if (location !== undefined) {
      updateData.location = location;
      hasUpdates = true;
    }

    if (!hasUpdates) {
      res.status(400).json({
        success: false,
        message: '업데이트할 정보가 없습니다'
      } as ApiResponse);
      return;
    }

    // 재고 정보 업데이트
    dbManager.updateInventoryItem(inventoryId, updateData);
    
    // 업데이트된 재고 정보 조회
    const updatedAllInventory = dbManager.getAllInventoryItems();
    const updatedInventoryItem = updatedAllInventory.find(item => item.id === inventoryId);
    const allCategories = dbManager.getAllCategories();
    const category = allCategories.find(cat => cat.id === updatedInventoryItem?.category_id);
    
    const updatedInventory = {
      id: updatedInventoryItem!.id,
      name: updatedInventoryItem!.name,
      description: updatedInventoryItem!.description,
      sku: updatedInventoryItem!.sku,
      category_id: updatedInventoryItem!.category_id,
      category_name: category?.name || '',
      current_quantity: updatedInventoryItem!.quantity,
      minimum_quantity: updatedInventoryItem!.minimum_quantity,
      unit_price: updatedInventoryItem!.unit_price,
      location: updatedInventoryItem!.location,
      created_at: updatedInventoryItem!.created_at,
      updated_at: updatedInventoryItem!.updated_at
    };

    res.json({
      success: true,
      data: updatedInventory,
      message: '재고 정보가 성공적으로 수정되었습니다'
    } as ApiResponse<Inventory>);

  } catch (error) {
    console.error('재고 정보 수정 오류:', error);
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다'
    } as ApiResponse);
  }
});

/**
 * 재고 삭제 API (관리자만 접근 가능)
 * DELETE /api/inventory/:id
 */
router.delete('/:id(\\d+)', authenticateToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const inventoryId = parseInt(req.params.id);

    // 재고 존재 확인
    const allInventory = dbManager.getAllInventoryItems();
    const existingInventory = allInventory.find(item => item.id === inventoryId);
    
    if (!existingInventory) {
      res.status(404).json({
        success: false,
        message: '재고 항목을 찾을 수 없습니다'
      } as ApiResponse);
      return;
    }

    // 관련 거래 내역 확인
    const allTransactions = dbManager.getAllTransactions();
    const relatedTransactions = allTransactions.filter(transaction => transaction.inventory_id === inventoryId);
    
    if (relatedTransactions.length > 0) {
      res.status(400).json({
        success: false,
        message: '거래 내역이 있는 재고는 삭제할 수 없습니다'
      } as ApiResponse);
      return;
    }

    // 재고 삭제
    dbManager.deleteInventoryItem(inventoryId);

    res.json({
      success: true,
      message: '재고가 성공적으로 삭제되었습니다'
    } as ApiResponse);

  } catch (error) {
    console.error('재고 삭제 오류:', error);
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다'
    } as ApiResponse);
  }
});

/**
 * 카테고리 목록 조회 API (경로 일치: /api/inventory/categories)
 * GET /api/inventory/categories
 */
router.get('/categories', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = dbManager.getAllCategories().sort((a, b) => a.name.localeCompare(b.name));

    res.json({
      success: true,
      data: categories
    } as ApiResponse<Category[]>);

  } catch (error) {
    console.error('카테고리 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다'
    } as ApiResponse);
  }
});

/**
 * 카테고리 생성 (관리자)
 * POST /api/inventory/categories
 */
router.post('/categories', authenticateToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description } = req.body as { name?: string; description?: string };

    if (!name || !name.trim()) {
      res.status(400).json({ success: false, message: '카테고리 이름은 필수입니다' } as ApiResponse);
      return;
    }

    const all = dbManager.getAllCategories();
    const exists = all.some(c => c.name.toLowerCase() === name.trim().toLowerCase());
    if (exists) {
      res.status(409).json({ success: false, message: '이미 존재하는 카테고리 이름입니다' } as ApiResponse);
      return;
    }

    const created = dbManager.createCategory({ name: name.trim(), description: description?.trim() });
    res.status(201).json({ success: true, data: created, message: '카테고리가 생성되었습니다' } as ApiResponse<Category>);
  } catch (error) {
    console.error('카테고리 생성 오류:', error);
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다' } as ApiResponse);
  }
});

/**
 * 카테고리 수정 (관리자)
 * PUT /api/inventory/categories/:id
 */
router.put('/categories/:id', authenticateToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ success: false, message: '유효하지 않은 ID' } as ApiResponse);
      return;
    }

    const { name, description } = req.body as { name?: string; description?: string };

    // 존재 확인
    const all = dbManager.getAllCategories();
    const current = all.find(c => c.id === id);
    if (!current) {
      res.status(404).json({ success: false, message: '카테고리를 찾을 수 없습니다' } as ApiResponse);
      return;
    }

    // 중복 이름 체크(자기 자신 제외)
    if (name && name.trim()) {
      const dup = all.some(c => c.id !== id && c.name.toLowerCase() === name.trim().toLowerCase());
      if (dup) {
        res.status(409).json({ success: false, message: '이미 존재하는 카테고리 이름입니다' } as ApiResponse);
        return;
      }
    }

    const updated = dbManager.updateCategory(id, {
      name: name?.trim(),
      description: description?.trim()
    });

    res.json({ success: true, data: updated, message: '카테고리가 수정되었습니다' } as ApiResponse<Category>);
  } catch (error) {
    console.error('카테고리 수정 오류:', error);
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다' } as ApiResponse);
  }
});

/**
 * 카테고리 삭제 (관리자)
 * DELETE /api/inventory/categories/:id
 */
router.delete('/categories/:id', authenticateToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ success: false, message: '유효하지 않은 ID' } as ApiResponse);
      return;
    }

    // 참조 무결성 체크: 해당 카테고리를 참조하는 재고가 있으면 삭제 금지
    const allInventory = dbManager.getAllInventoryItems();
    const referenced = allInventory.some(item => item.category_id === id);
    if (referenced) {
      res.status(400).json({ success: false, message: '해당 카테고리를 사용하는 재고가 있어 삭제할 수 없습니다' } as ApiResponse);
      return;
    }

    const ok = dbManager.deleteCategory(id);
    if (!ok) {
      res.status(404).json({ success: false, message: '카테고리를 찾을 수 없습니다' } as ApiResponse);
      return;
    }

    res.json({ success: true, message: '카테고리가 삭제되었습니다' } as ApiResponse);
  } catch (error) {
    console.error('카테고리 삭제 오류:', error);
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다' } as ApiResponse);
  }
});

/**
 * 재고 부족 알림 조회 API
 * GET /api/inventory/low-stock
 */
router.get('/alerts/low-stock', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const allInventory = dbManager.getAllInventoryItems();
    const allCategories = dbManager.getAllCategories();
    
    const lowStockItems = allInventory
      .filter(item => item.quantity <= item.minimum_quantity)
      .map(item => {
        const category = allCategories.find(cat => cat.id === item.category_id);
        return {
          id: item.id,
          name: item.name,
          sku: item.sku,
          category_name: category?.name || '',
          current_quantity: item.quantity,
          minimum_quantity: item.minimum_quantity,
          location: item.location
        };
      })
      .sort((a, b) => (a.current_quantity - a.minimum_quantity) - (b.current_quantity - b.minimum_quantity));

    res.json({
      success: true,
      data: lowStockItems
    } as ApiResponse<Inventory[]>);

  } catch (error) {
    console.error('재고 부족 알림 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다'
    } as ApiResponse);
  }
});

export default router;