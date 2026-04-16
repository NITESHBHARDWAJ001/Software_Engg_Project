import { useEffect, useMemo, useState } from 'react';
import { FiAlertTriangle, FiEdit2, FiPackage, FiPlus, FiRefreshCw, FiSearch } from 'react-icons/fi';
import { toast } from 'sonner';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Spinner } from '../../../components/ui/Spinner';
import {
  inventoryApiService,
  type InventoryMovementRecord,
  type InventoryRecord,
  type InventoryStats,
} from '../../../services/api/inventoryService';
import { formatCurrency, formatDate } from '../../../utils/helpers';

type InventoryForm = {
  name: string;
  sku: string;
  category: string;
  currentStock: string;
  reorderLevel: string;
  minStockLevel: string;
  unitPrice: string;
  sellingPrice: string;
  unit: string;
};

type StockAdjustForm = {
  quantity: string;
  changeType: 'IN' | 'OUT' | 'ADJUSTMENT';
  note: string;
};

const initialInventoryForm: InventoryForm = {
  name: '',
  sku: '',
  category: '',
  currentStock: '0',
  reorderLevel: '10',
  minStockLevel: '5',
  unitPrice: '0',
  sellingPrice: '0',
  unit: 'pcs',
};

const initialAdjustForm: StockAdjustForm = {
  quantity: '0',
  changeType: 'ADJUSTMENT',
  note: '',
};

const toNumber = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const InventoryPage = () => {
  const [items, setItems] = useState<InventoryRecord[]>([]);
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [lowStockItems, setLowStockItems] = useState<InventoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [soldSearch, setSoldSearch] = useState('');
  const [selectedSoldItemId, setSelectedSoldItemId] = useState<string>('');
  const [soldQuantity, setSoldQuantity] = useState('1');
  const [soldNote, setSoldNote] = useState('Sold from counter');
  const [recentSoldMovements, setRecentSoldMovements] = useState<InventoryMovementRecord[]>([]);

  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [itemForm, setItemForm] = useState<InventoryForm>(initialInventoryForm);

  const [adjustingItemId, setAdjustingItemId] = useState<string | null>(null);
  const [adjustForm, setAdjustForm] = useState<StockAdjustForm>(initialAdjustForm);

  const loadData = async () => {
    setLoading(true);
    try {
      const [list, statsData, alerts] = await Promise.all([
        inventoryApiService.list(),
        inventoryApiService.stats(),
        inventoryApiService.lowStockAlerts(),
      ]);

      const soldMovements = await inventoryApiService.listMovements({
        changeType: 'OUT',
        pageSize: 50,
      });

      setItems(list);
      setStats(statsData);
      setLowStockItems(alerts);
      setRecentSoldMovements(soldMovements);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter((item) =>
      [item.name, item.sku, item.category, item.status].join(' ').toLowerCase().includes(q),
    );
  }, [items, search]);

  const soldItemOptions = useMemo(() => {
    const query = soldSearch.trim().toLowerCase();
    if (!query) return items.slice(0, 50);
    return items.filter((item) =>
      [item.name, item.sku, item.category].join(' ').toLowerCase().includes(query),
    ).slice(0, 50);
  }, [items, soldSearch]);

  const selectedSoldItem = useMemo(
    () => items.find((item) => item.id === selectedSoldItemId) || null,
    [items, selectedSoldItemId],
  );

  const updateItemField = (field: keyof InventoryForm, value: string) => {
    setItemForm((prev) => ({ ...prev, [field]: value }));
  };

  const startCreate = () => {
    setEditingItemId(null);
    setItemForm(initialInventoryForm);
    setShowItemForm(true);
  };

  const startEdit = (item: InventoryRecord) => {
    setEditingItemId(item.id);
    setItemForm({
      name: item.name,
      sku: item.sku,
      category: item.category,
      currentStock: String(item.currentStock),
      reorderLevel: String(item.reorderLevel),
      minStockLevel: String(item.minStockLevel),
      unitPrice: String(item.unitPrice),
      sellingPrice: String(item.sellingPrice),
      unit: item.unit,
    });
    setShowItemForm(true);
  };

  const cancelItemForm = () => {
    setShowItemForm(false);
    setEditingItemId(null);
    setItemForm(initialInventoryForm);
  };

  const submitItem = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!itemForm.name.trim() || !itemForm.sku.trim() || !itemForm.category.trim()) {
      toast.error('Name, SKU, and category are required');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: itemForm.name.trim(),
        sku: itemForm.sku.trim(),
        category: itemForm.category.trim(),
        currentStock: toNumber(itemForm.currentStock),
        reorderLevel: toNumber(itemForm.reorderLevel),
        minStockLevel: toNumber(itemForm.minStockLevel),
        unitPrice: toNumber(itemForm.unitPrice),
        sellingPrice: toNumber(itemForm.sellingPrice),
        unit: itemForm.unit.trim() || 'pcs',
      };

      if (editingItemId) {
        const updated = await inventoryApiService.update(editingItemId, payload);
        setItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
        toast.success('Inventory item updated');
      } else {
        const created = await inventoryApiService.create(payload);
        setItems((prev) => [created, ...prev]);
        toast.success('Inventory item created');
      }

      cancelItemForm();
      const [statsData, alerts] = await Promise.all([
        inventoryApiService.stats(),
        inventoryApiService.lowStockAlerts(),
      ]);
      setStats(statsData);
      setLowStockItems(alerts);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save item');
    } finally {
      setSaving(false);
    }
  };

  const openAdjustStock = (itemId: string) => {
    setAdjustingItemId(itemId);
    setAdjustForm(initialAdjustForm);
  };

  const submitAdjustStock = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!adjustingItemId) return;

    setSaving(true);
    try {
      const updated = await inventoryApiService.adjustStock(adjustingItemId, {
        quantity: toNumber(adjustForm.quantity),
        changeType: adjustForm.changeType,
        note: adjustForm.note.trim() || undefined,
      });
      setItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setAdjustingItemId(null);
      setAdjustForm(initialAdjustForm);
      const [statsData, alerts] = await Promise.all([
        inventoryApiService.stats(),
        inventoryApiService.lowStockAlerts(),
      ]);
      setStats(statsData);
      setLowStockItems(alerts);
      toast.success('Stock adjusted');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to adjust stock');
    } finally {
      setSaving(false);
    }
  };

  const submitSoldStock = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedSoldItemId) {
      toast.error('Please select an item to update sold stock');
      return;
    }

    const quantity = toNumber(soldQuantity);
    if (quantity <= 0) {
      toast.error('Sold quantity must be greater than zero');
      return;
    }

    if (selectedSoldItem && quantity > selectedSoldItem.currentStock) {
      toast.error('Sold quantity is greater than available stock');
      return;
    }

    setSaving(true);
    try {
      await inventoryApiService.adjustStock(selectedSoldItemId, {
        quantity,
        changeType: 'OUT',
        note: soldNote.trim() || 'Sold',
      });

      toast.success('Sold stock updated');
      setSoldQuantity('1');
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update sold stock');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600 mt-1">Track stock levels and adjust inventory in real-time</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData}>
            <FiRefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Button onClick={startCreate}>
            <FiPlus className="w-4 h-4" />
            New Item
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardBody><div className="text-sm text-gray-600">Total Items</div><div className="text-2xl font-bold">{stats?.totalItems ?? 0}</div></CardBody></Card>
        <Card><CardBody><div className="text-sm text-gray-600">Total Value</div><div className="text-2xl font-bold">{formatCurrency(stats?.totalValue ?? 0)}</div></CardBody></Card>
        <Card><CardBody><div className="text-sm text-gray-600">Low Stock</div><div className="text-2xl font-bold text-warning-600">{stats?.lowStockItems ?? 0}</div></CardBody></Card>
        <Card><CardBody><div className="text-sm text-gray-600">Out Of Stock</div><div className="text-2xl font-bold text-danger-600">{stats?.outOfStockItems ?? 0}</div></CardBody></Card>
      </div>

      {lowStockItems.length > 0 && (
        <Card variant="outlined" className="border-warning-300 bg-warning-50">
          <CardHeader title="Low Stock Alerts" subtitle={`${lowStockItems.length} item(s) need attention`} />
          <CardBody>
            <div className="flex flex-wrap gap-2">
              {lowStockItems.slice(0, 8).map((item) => (
                <Badge key={item.id} variant="warning">
                  <FiAlertTriangle className="w-3 h-3" /> {item.name} ({item.currentStock})
                </Badge>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {showItemForm && (
        <Card>
          <CardHeader title={editingItemId ? 'Edit Inventory Item' : 'Create Inventory Item'} />
          <CardBody>
            <form onSubmit={submitItem} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input label="Name" value={itemForm.name} onChange={(e) => updateItemField('name', e.target.value)} required />
              <Input label="SKU" value={itemForm.sku} onChange={(e) => updateItemField('sku', e.target.value)} required />
              <Input label="Category" value={itemForm.category} onChange={(e) => updateItemField('category', e.target.value)} required />
              <Input label="Current Stock" type="number" value={itemForm.currentStock} onChange={(e) => updateItemField('currentStock', e.target.value)} />
              <Input label="Reorder Level" type="number" value={itemForm.reorderLevel} onChange={(e) => updateItemField('reorderLevel', e.target.value)} />
              <Input label="Min Stock Level" type="number" value={itemForm.minStockLevel} onChange={(e) => updateItemField('minStockLevel', e.target.value)} />
              <Input label="Unit Price" type="number" value={itemForm.unitPrice} onChange={(e) => updateItemField('unitPrice', e.target.value)} />
              <Input label="Selling Price" type="number" value={itemForm.sellingPrice} onChange={(e) => updateItemField('sellingPrice', e.target.value)} />
              <Input label="Unit" value={itemForm.unit} onChange={(e) => updateItemField('unit', e.target.value)} />
              <div className="md:col-span-3 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={cancelItemForm}>Cancel</Button>
                <Button type="submit" isLoading={saving}>{editingItemId ? 'Update Item' : 'Create Item'}</Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader
          title="Sold Stock Update"
          subtitle="Use searchable selection to decrease stock when an item is sold"
        />
        <CardBody>
          <form onSubmit={submitSoldStock} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              label="Search Item"
              value={soldSearch}
              onChange={(e) => setSoldSearch(e.target.value)}
              placeholder="Search by item name, SKU, category"
              leftIcon={<FiSearch className="w-4 h-4" />}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Item</label>
              <select
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
                value={selectedSoldItemId}
                onChange={(e) => setSelectedSoldItemId(e.target.value)}
                required
              >
                <option value="">Select item</option>
                {soldItemOptions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.sku}) - Stock: {item.currentStock}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Sold Quantity"
              type="number"
              min="1"
              value={soldQuantity}
              onChange={(e) => setSoldQuantity(e.target.value)}
              required
            />
            <Input
              label="Remarks"
              value={soldNote}
              onChange={(e) => setSoldNote(e.target.value)}
              placeholder="Sale note or invoice reference"
            />
            <div className="md:col-span-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 rounded-lg bg-gray-50 p-4">
              <div className="text-sm text-gray-700">
                {selectedSoldItem ? (
                  <>
                    <div className="font-medium text-gray-900">{selectedSoldItem.name} ({selectedSoldItem.sku})</div>
                    <div>
                      Available: {selectedSoldItem.currentStock} {selectedSoldItem.unit} | Selling Price: {formatCurrency(selectedSoldItem.sellingPrice)}
                    </div>
                  </>
                ) : (
                  'Select an item to preview stock and pricing details'
                )}
              </div>
              <Button type="submit" isLoading={saving}>Apply Sold Update</Button>
            </div>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Recent Sold Movements" subtitle="Latest stock deductions from sales" />
        <CardBody>
          {recentSoldMovements.length === 0 ? (
            <div className="text-sm text-gray-500">No sold movements recorded yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Item</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">SKU</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Quantity</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSoldMovements.slice(0, 12).map((movement) => (
                    <tr key={movement.id} className="border-b border-gray-100">
                      <td className="py-3 px-4 text-sm text-gray-900">{movement.item?.name || 'Unknown item'}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{movement.item?.sku || '-'}</td>
                      <td className="py-3 px-4 text-sm font-medium text-danger-600">{Math.abs(movement.quantity)}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{formatDate(movement.createdAt)}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{movement.note || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {adjustingItemId && (
        <Card>
          <CardHeader title="Adjust Stock" />
          <CardBody>
            <form onSubmit={submitAdjustStock} className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input
                label="Quantity"
                type="number"
                value={adjustForm.quantity}
                onChange={(e) => setAdjustForm((prev) => ({ ...prev, quantity: e.target.value }))}
                required
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Change Type</label>
                <select
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  value={adjustForm.changeType}
                  onChange={(e) => setAdjustForm((prev) => ({ ...prev, changeType: e.target.value as StockAdjustForm['changeType'] }))}
                >
                  <option value="IN">IN</option>
                  <option value="OUT">OUT</option>
                  <option value="ADJUSTMENT">ADJUSTMENT</option>
                </select>
              </div>
              <Input
                label="Note"
                value={adjustForm.note}
                onChange={(e) => setAdjustForm((prev) => ({ ...prev, note: e.target.value }))}
                placeholder="Reason for stock update"
              />
              <div className="flex items-end gap-2">
                <Button type="button" variant="outline" onClick={() => setAdjustingItemId(null)}>Cancel</Button>
                <Button type="submit" isLoading={saving}>Apply</Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader
          title="Inventory Items"
          subtitle={`${filteredItems.length} items`}
          action={
            <div className="w-80">
              <Input
                placeholder="Search by name, SKU, category"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                leftIcon={<FiSearch className="w-4 h-4" />}
              />
            </div>
          }
        />
        <CardBody>
          {filteredItems.length === 0 ? (
            <div className="text-center text-gray-500 py-8">No inventory items found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Item</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Category</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Stock</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Prices</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Updated</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => (
                    <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900 flex items-center gap-2"><FiPackage className="w-4 h-4 text-primary" />{item.name}</div>
                        <div className="text-xs text-gray-500">{item.sku}</div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700">{item.category}</td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-gray-900">{item.currentStock} {item.unit}</div>
                        <div className="text-xs text-gray-500">Reorder at {item.reorderLevel}</div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700">
                        <div>Cost: {formatCurrency(item.unitPrice)}</div>
                        <div>Sell: {formatCurrency(item.sellingPrice)}</div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{formatDate(item.updatedAt)}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Badge variant={item.status === 'IN_STOCK' ? 'success' : item.status === 'LOW_STOCK' ? 'warning' : 'danger'}>
                            {item.status}
                          </Badge>
                          <Button variant="ghost" size="sm" onClick={() => startEdit(item)}><FiEdit2 className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => openAdjustStock(item.id)}>Adjust</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default InventoryPage;
