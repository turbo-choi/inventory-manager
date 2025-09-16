import express from 'express';
// 기존 DatabaseManager 클래스 사용을 제거하고 단일 인스턴스 import 방식으로 통일
import dbManager from '../database/database';
import { authenticateToken, requireActiveUser } from '../middleware/auth';
import type { Transaction, TransactionType, ApiResponse, PaginatedResponse } from '../../shared/types.js';

const router = express.Router();

/**
 * 입출고 거래 목록 조회 (페이지네이션 지원)
 * GET /api/transactions
 * Query params: page, limit, type, inventory_id, start_date, end_date
 */
router.get('/', authenticateToken, requireActiveUser, (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;
    const type = req.query.type as TransactionType;
    const inventoryId = req.query.inventory_id as string;
    const startDate = req.query.start_date as string;
    const endDate = req.query.end_date as string;
    const search = (req.query.search as string)?.toLowerCase()?.trim();

    const allTransactions = dbManager.getAllTransactions();
    const allInventory = dbManager.getAllInventoryItems();
    const allUsers = dbManager.getAllUsers();

    let filteredTransactions = allTransactions.filter(transaction => {
      if (type && transaction.type !== type) return false;
      if (inventoryId && transaction.item_id !== parseInt(inventoryId)) return false;

      const createdAt = new Date(transaction.created_at);
      if (startDate && createdAt < new Date(startDate)) return false;
      if (endDate) {
        const end = new Date(endDate);
        const endNext = new Date(end);
        endNext.setDate(end.getDate() + 1);
        if (createdAt >= endNext) return false;
      }

      if (search) {
        const inv = allInventory.find(item => item.id === transaction.item_id);
        const name = (inv?.name || '').toLowerCase();
        const sku = (inv as any)?.sku ? String((inv as any).sku).toLowerCase() : '';
        if (!name.includes(search) && !sku.includes(search)) return false;
      }

      return true;
    });

    filteredTransactions = filteredTransactions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const total = filteredTransactions.length;
    const paginated = filteredTransactions.slice(offset, offset + limit);

    const transactions = paginated.map(transaction => {
      const inventory = allInventory.find(item => item.id === transaction.item_id);
      const user = allUsers.find(u => u.id === transaction.user_id);
      
      return {
        id: transaction.id,
        inventory_id: transaction.item_id,
        user_id: transaction.user_id,
        type: transaction.type,
        quantity: transaction.quantity,
        notes: transaction.notes,
        created_at: transaction.created_at,
        inventory_name: inventory?.name || '',
        inventory_sku: (inventory as any)?.sku || '',
        user_name: user?.username || ''
      };
    });

    const response: PaginatedResponse<Transaction> = {
      success: true,
      data: transactions as unknown as Transaction[],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({
      success: false,
      message: '거래 목록을 가져오는 중 오류가 발생했습니다.'
    });
  }
});

/**
 * 특정 거래 상세 조회
 * GET /api/transactions/:id
 */
router.get('/:id(\\d+)', authenticateToken, requireActiveUser, (req, res) => {
  try {
    const { id } = req.params;

    const allTransactions = dbManager.getAllTransactions();
    const allInventory = dbManager.getAllInventoryItems();
    const allUsers = dbManager.getAllUsers();

    const foundTransaction = allTransactions.find(t => t.id === parseInt(id));

    if (!foundTransaction) {
      return res.status(404).json({
        success: false,
        message: '거래를 찾을 수 없습니다.'
      });
    }

    const inventory = allInventory.find(item => item.id === foundTransaction.item_id);
    const user = allUsers.find(u => u.id === foundTransaction.user_id);

    const transaction = {
      id: foundTransaction.id,
      inventory_id: foundTransaction.item_id,
      user_id: foundTransaction.user_id,
      type: foundTransaction.type,
      quantity: foundTransaction.quantity,
      notes: foundTransaction.notes,
      created_at: foundTransaction.created_at,
      inventory_name: inventory?.name || '',
      inventory_sku: (inventory as any)?.sku || '',
      user_name: user?.username || ''
    };

    const response: ApiResponse<Transaction> = {
      success: true,
      data: transaction as unknown as Transaction
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching transaction:', error);
    res.status(500).json({
      success: false,
      message: '거래 정보를 가져오는 중 오류가 발생했습니다.'
    });
  }
});

/**
 * 새로운 입출고 거래 생성
 * POST /api/transactions
 * Body: { inventory_id, type, quantity, notes? }
 */
router.post('/', authenticateToken, requireActiveUser, (req, res) => {
  try {
    const { inventory_id, type, quantity, notes } = req.body;
    const userId = req.user!.id;

    if (!inventory_id || !type || !quantity) {
      return res.status(400).json({
        success: false,
        message: '재고 ID, 거래 유형, 수량은 필수입니다.'
      });
    }

    if (!['in', 'out'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: '거래 유형은 in 또는 out이어야 합니다.'
      });
    }

    if (quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: '수량은 0보다 커야 합니다.'
      });
    }

    const allInventory = dbManager.getAllInventoryItems();
    const inventory = allInventory.find(item => item.id === parseInt(inventory_id));
    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: '재고를 찾을 수 없습니다.'
      });
    }

    const isIn = type === 'in';
    const qty = parseInt(quantity);
    const updatedQuantity = isIn ? inventory.quantity + qty : inventory.quantity - qty;
    if (updatedQuantity < 0) {
      return res.status(400).json({
        success: false,
        message: '출고 수량이 현재 재고보다 많을 수 없습니다.'
      });
    }

    dbManager.updateInventoryItem(inventory.id, { quantity: updatedQuantity });

    const unitPrice = (inventory as any).unit_price ?? 0;
    const newTransaction = dbManager.createTransaction({
      item_id: inventory.id,
      user_id: userId,
      type,
      quantity: qty,
      unit_price: unitPrice,
      total_price: unitPrice * qty,
      notes: notes || undefined
    });

    const createdTransaction = newTransaction;

    const response: ApiResponse<Transaction> = {
      success: true,
      data: {
        id: createdTransaction.id,
        inventory_id: createdTransaction.item_id,
        user_id: createdTransaction.user_id,
        type: createdTransaction.type,
        quantity: createdTransaction.quantity,
        notes: createdTransaction.notes,
        created_at: createdTransaction.created_at,
      } as unknown as Transaction,
      message: '거래가 성공적으로 생성되었습니다.'
    } as ApiResponse<Transaction>;

    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({
      success: false,
      message: '거래 생성 중 오류가 발생했습니다.'
    });
  }
});

/**
 * 거래 수정
 * PUT /api/transactions/:id
 * Body: { notes? }
 * 참고: 거래의 핵심 정보(재고, 유형, 수량)는 수정할 수 없고, 메모만 수정 가능
 */
router.put('/:id(\\d+)', authenticateToken, requireActiveUser, (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const allTransactions = dbManager.getAllTransactions();
    const existingTransaction = allTransactions.find(t => t.id === parseInt(id));
    if (!existingTransaction) {
      return res.status(404).json({
        success: false,
        message: '거래를 찾을 수 없습니다.'
      });
    }

    dbManager.updateTransaction(parseInt(id), { notes: notes || undefined });

    const allInventory = dbManager.getAllInventoryItems();
    const allUsers = dbManager.getAllUsers();
    const updatedTransactions = dbManager.getAllTransactions();
    const updatedTransaction = updatedTransactions.find(t => t.id === parseInt(id));
    const inventory = allInventory.find(item => item.id === updatedTransaction!.item_id);
    const user = allUsers.find(u => u.id === updatedTransaction!.user_id);

    const transactionData = {
      id: updatedTransaction!.id,
      inventory_id: updatedTransaction!.item_id,
      user_id: updatedTransaction!.user_id,
      type: updatedTransaction!.type,
      quantity: updatedTransaction!.quantity,
      notes: updatedTransaction!.notes,
      created_at: updatedTransaction!.created_at,
      inventory_name: inventory?.name || '',
      sku: (inventory as any)?.sku || '',
      created_by_username: user?.username || ''
    };

    const response: ApiResponse<Transaction> = {
      success: true,
      data: transactionData as unknown as Transaction,
      message: '거래가 성공적으로 수정되었습니다.'
    };

    res.json(response);
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).json({
      success: false,
      message: '거래 수정 중 오류가 발생했습니다.'
    });
  }
});

/**
 * 거래 삭제
 * DELETE /api/transactions/:id
 * 참고: 거래 삭제 시 재고 수량도 원복됩니다.
 */
router.delete('/:id(\\d+)', authenticateToken, requireActiveUser, (req, res) => {
  try {
    const { id } = req.params;

    const allTransactions = dbManager.getAllTransactions();
    const transaction = allTransactions.find(t => t.id === parseInt(id));
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: '거래를 찾을 수 없습니다.'
      });
    }

    const allInventory = dbManager.getAllInventoryItems();
    const inventory = allInventory.find(item => item.id === transaction.item_id);
    if (inventory) {
      const restoredQuantity = transaction.type === 'in' ? inventory.quantity - transaction.quantity : inventory.quantity + transaction.quantity;
      dbManager.updateInventoryItem(inventory.id, { quantity: restoredQuantity });
    }

    dbManager.deleteTransaction(parseInt(id));

    res.json({
      success: true,
      message: '거래가 성공적으로 삭제되었습니다.'
    });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({
      success: false,
      message: '거래 삭제 중 오류가 발생했습니다.'
    });
  }
});

/**
 * 특정 재고의 거래 이력 조회 (페이지네이션)
 * GET /api/transactions/inventory/:inventoryId
 */
router.get('/inventory/:inventoryId', authenticateToken, requireActiveUser, (req, res) => {
  try {
    const { inventoryId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    const allTransactions = dbManager.getAllTransactions();
    const allUsers = dbManager.getAllUsers();

    const inventoryTransactions = allTransactions
      .filter(t => t.item_id === parseInt(inventoryId))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const total = inventoryTransactions.length;
    const paginated = inventoryTransactions.slice(offset, offset + limit);

    const transactions = paginated.map(transaction => {
      const user = allUsers.find(u => u.id === transaction.user_id);
      return {
        id: transaction.id,
        inventory_id: transaction.item_id,
        user_id: transaction.user_id,
        type: transaction.type,
        quantity: transaction.quantity,
        notes: transaction.notes,
        created_at: transaction.created_at,
        user_name: user?.username || ''
      };
    });

    const response: PaginatedResponse<Transaction> = {
      success: true,
      data: transactions as unknown as Transaction[],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching inventory transactions:', error);
    res.status(500).json({
      success: false,
      message: '재고 거래 이력을 가져오는 중 오류가 발생했습니다.'
    });
  }
});

/**
 * 거래 통계 조회
 * GET /api/transactions/stats
 */
router.get('/stats', authenticateToken, requireActiveUser, (req, res) => {
  try {
    const allTransactions = dbManager.getAllTransactions();
    const now = new Date();
    
    // 오늘 시작과 끝
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    
    // 이번 주 시작 (월요일부터)
    const weekStart = new Date(today);
    const dayOfWeek = today.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    weekStart.setDate(today.getDate() - daysToMonday);
    
    // 이번 달 시작
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const todayTransactions = allTransactions.filter(t => {
      const createdAt = new Date(t.created_at);
      return createdAt >= today && createdAt < todayEnd;
    });
    
    const weekTransactions = allTransactions.filter(t => {
      const createdAt = new Date(t.created_at);
      return createdAt >= weekStart;
    });
    
    const monthTransactions = allTransactions.filter(t => {
      const createdAt = new Date(t.created_at);
      return createdAt >= monthStart;
    });
    
    const todayIn = todayTransactions.filter(t => t.type === 'in').reduce((sum, t) => sum + t.quantity, 0);
    const todayOut = todayTransactions.filter(t => t.type === 'out').reduce((sum, t) => sum + t.quantity, 0);
    const weekTotal = weekTransactions.length;
    const monthTotal = monthTransactions.length;
    
    res.json({
      success: true,
      data: {
        todayIn,
        todayOut,
        weekTotal,
        monthTotal
      }
    });
  } catch (error) {
    console.error('Error loading transaction stats:', error);
    res.status(500).json({
      success: false,
      message: '통계 데이터를 가져오는 중 오류가 발생했습니다.'
    });
  }
});

export default router;