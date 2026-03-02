export enum InventoryStatus {
  IN_STOCK = 'IN_STOCK',
  LOW_STOCK = 'LOW_STOCK',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  CRITICAL = 'CRITICAL',
  DISCONTINUED = 'DISCONTINUED',
}

export enum InventoryCategory {
  SAREES = 'SAREES',
  SALWAR_KAMEEZ = 'SALWAR_KAMEEZ',
  LEHENGA = 'LEHENGA',
  KURTA = 'KURTA',
  DUPATTA = 'DUPATTA',
  FABRIC = 'FABRIC',
  BLOUSE = 'BLOUSE',
  ACCESSORIES = 'ACCESSORIES',
}

export interface InventoryItem {
  id: string;
  organizationId: string;
  sku: string;
  name: string;
  description?: string;
  category: string;
  categoryName?: string;
  currentStock: number;
  minStockLevel: number;
  reorderLevel: number;
  unit: string;
  costPrice: number;
  unitPrice: number;
  sellingPrice: number;
  status: InventoryStatus;
  supplier?: string;
  location?: string;
  images?: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  lastRestocked?: string;
  tags?: string[];
}

export interface StockTransaction {
  id: string;
  itemId: string;
  organizationId: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  reason?: string;
  reference?: string;
  performedBy: string;
  performedByName: string;
  createdAt: string;
}

export interface InventoryStats {
  totalItems: number;
  totalValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  categoriesCount: number;
  recentTransactions: number;
}
