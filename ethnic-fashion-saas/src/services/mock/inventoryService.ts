// Mock data service for Inventory Management
import { InventoryItem, InventoryCategory, InventoryStatus } from '../../types';
import { generateId } from '../../utils/helpers';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const mockInventory: InventoryItem[] = [
  {
    id: 'inv-1',
    organizationId: 'org-1',
    name: 'Banarasi Silk Saree - Red',
    sku: 'BSS-RED-001',
    category: InventoryCategory.SAREES,
    currentStock: 5,
    minStockLevel: 10,
    reorderLevel: 10,
    unit: 'piece',
    unitPrice: 8500,
    costPrice: 5500,
    sellingPrice: 8500,
    supplier: 'Varanasi Silk House',
    location: 'Warehouse A - Shelf 12',
    status: InventoryStatus.LOW_STOCK,
    lastRestocked: new Date('2026-01-15').toISOString(),
    createdBy: 'user-1',
    createdAt: new Date('2025-06-10').toISOString(),
    updatedAt: new Date('2026-02-20').toISOString(),
  },
  {
    id: 'inv-2',
    organizationId: 'org-1',
    name: 'Chanderi Cotton Saree - Blue',
    sku: 'CCS-BLU-001',
    category: InventoryCategory.SAREES,
    currentStock: 45,
    minStockLevel: 15,
    reorderLevel: 15,
    unit: 'piece',
    unitPrice: 4500,
    costPrice: 2800,
    sellingPrice: 4500,
    supplier: 'Chanderi Weavers Cooperative',
    location: 'Warehouse A - Shelf 8',
    status: InventoryStatus.IN_STOCK,
    lastRestocked: new Date('2026-02-10').toISOString(),
    createdBy: 'user-1',
    createdAt: new Date('2025-07-20').toISOString(),
    updatedAt: new Date('2026-02-10').toISOString(),
  },
  {
    id: 'inv-3',
    organizationId: 'org-1',
    name: 'Anarkali Suit Set - Pink',
    sku: 'ANK-PNK-001',
    category: InventoryCategory.SALWAR_KAMEEZ,
    currentStock: 28,
    minStockLevel: 12,
    reorderLevel: 12,
    unit: 'piece',
    unitPrice: 6500,
    costPrice: 4200,
    sellingPrice: 6500,
    supplier: 'Delhi Fashion Hub',
    location: 'Store Display - Section B',
    status: InventoryStatus.IN_STOCK,
    lastRestocked: new Date('2026-02-25').toISOString(),
    createdBy: 'user-1',
    createdAt: new Date('2025-08-10').toISOString(),
    updatedAt: new Date('2026-02-25').toISOString(),
  },
  {
    id: 'inv-4',
    organizationId: 'org-1',
    name: 'Designer Lehenga - Golden',
    sku: 'LEH-GLD-001',
    category: InventoryCategory.LEHENGA,
    currentStock: 3,
    minStockLevel: 5,
    reorderLevel: 5,
    unit: 'piece',
    unitPrice: 35000,
    costPrice: 22000,
    sellingPrice: 35000,
    supplier: 'Premium Bridal Collection',
    location: 'Vault - VIP Section',
    status: InventoryStatus.LOW_STOCK,
    lastRestocked: new Date('2026-01-05').toISOString(),
    createdBy: 'user-1',
    createdAt: new Date('2025-09-15').toISOString(),
    updatedAt: new Date('2026-02-15').toISOString(),
  },
  {
    id: 'inv-5',
    organizationId: 'org-1',
    name: 'Pure Silk Fabric - Maroon',
    sku: 'SILK-MAR-001',
    category: InventoryCategory.FABRIC,
    currentStock: 120,
    minStockLevel: 50,
    reorderLevel: 50,
    unit: 'meter',
    unitPrice: 1200,
    costPrice: 800,
    sellingPrice: 1200,
    supplier: 'Karnataka Silk Mills',
    location: 'Warehouse B - Roll Section',
    status: InventoryStatus.IN_STOCK,
    lastRestocked: new Date('2026-02-20').toISOString(),
    createdBy: 'user-1',
    createdAt: new Date('2025-05-20').toISOString(),
    updatedAt: new Date('2026-02-20').toISOString(),
  },
  {
    id: 'inv-6',
    organizationId: 'org-1',
    name: 'Cotton Bandhani Dupatta - Green',
    sku: 'DUP-GRN-001',
    category: InventoryCategory.DUPATTA,
    currentStock: 65,
    minStockLevel: 20,
    reorderLevel: 20,
    unit: 'piece',
    unitPrice: 850,
    costPrice: 500,
    sellingPrice: 850,
    supplier: 'Gujarat Handicrafts',
    location: 'Store Display - Section A',
    status: InventoryStatus.IN_STOCK,
    lastRestocked: new Date('2026-02-18').toISOString(),
    createdBy: 'user-1',
    createdAt: new Date('2025-10-05').toISOString(),
    updatedAt: new Date('2026-02-18').toISOString(),
  },
  {
    id: 'inv-7',
    organizationId: 'org-1',
    name: 'Kanjivaram Silk Saree - Purple',
    sku: 'KSS-PUR-001',
    category: InventoryCategory.SAREES,
    currentStock: 2,
    minStockLevel: 8,
    reorderLevel: 8,
    unit: 'piece',
    unitPrice: 15000,
    costPrice: 10000,
    sellingPrice: 15000,
    supplier: 'Kanchipuram Weavers',
    location: 'Vault - Premium Section',
    status: InventoryStatus.CRITICAL,
    lastRestocked: new Date('2025-12-20').toISOString(),
    createdBy: 'user-1',
    createdAt: new Date('2025-04-10').toISOString(),
    updatedAt: new Date('2026-02-25').toISOString(),
  },
  {
    id: 'inv-8',
    organizationId: 'org-1',
    name: 'Cotton Kurti Set - White',
    sku: 'KUR-WHT-001',
    category: InventoryCategory.KURTA,
    currentStock: 0,
    minStockLevel: 15,
    reorderLevel: 15,
    unit: 'piece',
    unitPrice: 1800,
    costPrice: 1100,
    sellingPrice: 1800,
    supplier: 'Jaipur Cotton Exports',
    location: 'Warehouse A - Shelf 5',
    status: InventoryStatus.OUT_OF_STOCK,
    lastRestocked: new Date('2025-11-10').toISOString(),
    createdBy: 'user-1',
    createdAt: new Date('2025-07-15').toISOString(),
    updatedAt: new Date('2026-01-30').toISOString(),
  },
];

export interface InventoryStats {
  totalItems: number;
  inStock: number;
  lowStock: number;
  outOfStock: number;
  totalValue: number;
  categoryCounts: { category: string; count: number; value: number }[];
}

export interface StockTransaction {
  id: string;
  inventoryId: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  date: string;
  notes: string;
  performedBy: string;
}

const mockTransactions: StockTransaction[] = [
  {
    id: 'txn-1',
    inventoryId: 'inv-1',
    type: 'OUT',
    quantity: -3,
    date: new Date('2026-02-20').toISOString(),
    notes: 'Sold to customer - Order #ORD-1234',
    performedBy: 'Staff Member',
  },
  {
    id: 'txn-2',
    inventoryId: 'inv-2',
    type: 'IN',
    quantity: 30,
    date: new Date('2026-02-10').toISOString(),
    notes: 'Restocked from supplier',
    performedBy: 'Manager',
  },
];

export const inventoryService = {
  async getAllInventory(organizationId: string): Promise<InventoryItem[]> {
    await delay(600);
    return mockInventory.filter(item => item.organizationId === organizationId);
  },

  async getInventoryById(itemId: string): Promise<InventoryItem | null> {
    await delay(400);
    return mockInventory.find(item => item.id === itemId) || null;
  },

  async getInventoryByCategory(
    organizationId: string,
    category: InventoryCategory
  ): Promise<InventoryItem[]> {
    await delay(500);
    return mockInventory.filter(
      item => item.organizationId === organizationId && item.category === category
    );
  },

  async getInventoryByStatus(
    organizationId: string,
    status: InventoryStatus
  ): Promise<InventoryItem[]> {
    await delay(500);
    return mockInventory.filter(
      item => item.organizationId === organizationId && item.status === status
    );
  },

  async getLowStockItems(organizationId: string): Promise<InventoryItem[]> {
    await delay(500);
    return mockInventory.filter(
      item =>
        item.organizationId === organizationId &&
        (item.status === InventoryStatus.LOW_STOCK ||
          item.status === InventoryStatus.CRITICAL ||
          item.status === InventoryStatus.OUT_OF_STOCK)
    );
  },

  async getInventoryStats(organizationId: string): Promise<InventoryStats> {
    await delay(600);
    const items = mockInventory.filter(item => item.organizationId === organizationId);

    const categoryCounts = items.reduce((acc, item) => {
      const existing = acc.find(c => c.category === item.category);
      if (existing) {
        existing.count += 1;
        existing.value += item.currentStock * item.unitPrice;
      } else {
        acc.push({
          category: item.category,
          count: 1,
          value: item.currentStock * item.unitPrice,
        });
      }
      return acc;
    }, [] as { category: string; count: number; value: number }[]);

    return {
      totalItems: items.length,
      inStock: items.filter(i => i.status === InventoryStatus.IN_STOCK).length,
      lowStock: items.filter(i => i.status === InventoryStatus.LOW_STOCK).length,
      outOfStock: items.filter(i => i.status === InventoryStatus.OUT_OF_STOCK).length,
      totalValue: items.reduce((sum, i) => sum + i.currentStock * i.unitPrice, 0),
      categoryCounts,
    };
  },

  async getStockTransactions(itemId: string): Promise<StockTransaction[]> {
    await delay(500);
    return mockTransactions.filter(t => t.inventoryId === itemId);
  },

  async createInventoryItem(
    itemData: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<InventoryItem> {
    await delay(700);
    const newItem: InventoryItem = {
      ...itemData,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockInventory.push(newItem);
    return newItem;
  },

  async updateInventoryItem(itemId: string, updates: Partial<InventoryItem>): Promise<InventoryItem> {
    await delay(500);
    const itemIndex = mockInventory.findIndex(i => i.id === itemId);
    if (itemIndex === -1) {
      throw new Error('Inventory item not found');
    }

    mockInventory[itemIndex] = {
      ...mockInventory[itemIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    return mockInventory[itemIndex];
  },

  async adjustStock(
    itemId: string,
    quantity: number,
    notes: string,
    performedBy: string
  ): Promise<InventoryItem> {
    await delay(500);
    const itemIndex = mockInventory.findIndex(i => i.id === itemId);
    if (itemIndex === -1) {
      throw new Error('Inventory item not found');
    }

    const item = mockInventory[itemIndex];
    const newStock = item.currentStock + quantity;

    // Determine new status based on stock level
    let newStatus = InventoryStatus.IN_STOCK;
    if (newStock === 0) {
      newStatus = InventoryStatus.OUT_OF_STOCK;
    } else if (newStock < item.reorderLevel * 0.5) {
      newStatus = InventoryStatus.CRITICAL;
    } else if (newStock < item.reorderLevel) {
      newStatus = InventoryStatus.LOW_STOCK;
    }

    mockInventory[itemIndex] = {
      ...item,
      currentStock: newStock,
      status: newStatus,
      lastRestocked: quantity > 0 ? new Date().toISOString() : item.lastRestocked,
      updatedAt: new Date().toISOString(),
    };

    // Add transaction record
    const transaction: StockTransaction = {
      id: generateId(),
      inventoryId: itemId,
      type: quantity > 0 ? 'IN' : 'OUT',
      quantity,
      date: new Date().toISOString(),
      notes,
      performedBy,
    };
    mockTransactions.push(transaction);

    return mockInventory[itemIndex];
  },
};
