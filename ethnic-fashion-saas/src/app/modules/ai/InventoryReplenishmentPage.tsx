import React, { useState } from 'react';
import { FiPackage, FiAlertTriangle, FiTrendingUp, FiClock } from 'react-icons/fi';

import { Card, CardContent, CardHeader } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Spinner } from '../../../components/ui/Spinner';
import {
  aiFashionService,
  InventoryReplenishmentRequest,
  InventoryReplenishmentResult,
} from '../../../services/api/aiFashionService';

const InventoryReplenishmentPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<InventoryReplenishmentResult | null>(null);

  const [form, setForm] = useState<InventoryReplenishmentRequest>({
    sku: 'SKU-LHG-RED-001',
    product_name: 'Noor Bridal Lehenga - Ruby Red',
    category: 'lehenga',
    current_stock: 22,
    avg_weekly_sales: 11,
    lead_time_days: 18,
    season: 'wedding_2026',
    region: 'north_india',
    current_open_po_units: 10,
    service_level: 'high',
  });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = await aiFashionService.getInventoryReplenishmentPlan(form);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate replenishment plan');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const riskColor = (risk?: 'high' | 'medium' | 'low') => {
    if (risk === 'high') return 'text-red-700 bg-red-50 border-red-200';
    if (risk === 'medium') return 'text-yellow-700 bg-yellow-50 border-yellow-200';
    return 'text-green-700 bg-green-50 border-green-200';
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <Card variant="elevated">
          <CardHeader
            title="Inventory Replenishment Predictor"
            subtitle="Forecast SKU-level demand and recommend purchase quantities"
          />
          <CardContent>
            <div className="text-sm text-gray-600 flex items-center gap-2">
              <FiPackage className="text-primary" />
              Business value: fewer stockouts and lower overstock through smarter replenishment timing.
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader title="SKU Inputs" />
            <CardContent>
              <form onSubmit={onSubmit} className="space-y-4">
                <Input label="SKU" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
                <Input label="Product Name" value={form.product_name} onChange={(e) => setForm({ ...form, product_name: e.target.value })} />
                <Input label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
                <Input label="Current Stock" type="number" min={0} value={form.current_stock} onChange={(e) => setForm({ ...form, current_stock: Number(e.target.value) })} />
                <Input label="Avg Weekly Sales" type="number" min={0} value={form.avg_weekly_sales} onChange={(e) => setForm({ ...form, avg_weekly_sales: Number(e.target.value) })} />
                <Input label="Lead Time (days)" type="number" min={0} value={form.lead_time_days} onChange={(e) => setForm({ ...form, lead_time_days: Number(e.target.value) })} />
                <Input label="Season" value={form.season} onChange={(e) => setForm({ ...form, season: e.target.value })} />
                <Input label="Region" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} />
                <Input label="Open PO Units" type="number" min={0} value={form.current_open_po_units ?? 0} onChange={(e) => setForm({ ...form, current_open_po_units: Number(e.target.value) })} />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Service Level</label>
                  <select
                    className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm"
                    value={form.service_level}
                    onChange={(e) => setForm({ ...form, service_level: e.target.value as 'low' | 'medium' | 'high' })}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <Button type="submit" fullWidth disabled={loading}>
                  {loading ? <Spinner size="sm" className="text-white" /> : 'Predict Replenishment'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="lg:col-span-2 space-y-6">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {!result && !error && !loading && (
              <Card>
                <CardContent>
                  <div className="text-sm text-gray-600">
                    Enter SKU and demand signals to get a replenishment recommendation.
                  </div>
                </CardContent>
              </Card>
            )}

            {result && (
              <>
                <Card>
                  <CardHeader title="Replenishment Recommendation" subtitle={result.forecast_horizon} />
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="rounded-lg border border-gray-200 p-4">
                        <p className="text-xs uppercase text-gray-500 font-semibold">Recommended Purchase</p>
                        <p className="text-2xl font-semibold text-gray-900 mt-1">{result.recommended_purchase_units}</p>
                        <p className="text-sm text-gray-600 mt-1">units</p>
                      </div>
                      <div className="rounded-lg border border-gray-200 p-4">
                        <p className="text-xs uppercase text-gray-500 font-semibold">Reorder Point</p>
                        <p className="text-2xl font-semibold text-gray-900 mt-1">{result.reorder_point_units}</p>
                        <p className="text-sm text-gray-600 mt-1">units</p>
                      </div>
                      <div className="rounded-lg border border-gray-200 p-4">
                        <p className="text-xs uppercase text-gray-500 font-semibold">Safety Stock</p>
                        <p className="text-2xl font-semibold text-gray-900 mt-1">{result.safety_stock_units}</p>
                        <p className="text-sm text-gray-600 mt-1">units</p>
                      </div>
                    </div>

                    <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary">
                      <FiClock />
                      {result.recommended_order_timing}
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader title="Demand Forecast" />
                    <CardContent>
                      <p className="text-sm text-gray-700 mb-3">
                        <span className="font-semibold">Total Predicted Demand:</span> {result.total_predicted_demand} units
                      </p>
                      <div className="space-y-2">
                        {(result.predicted_weekly_demand || []).map((point, idx) => (
                          <div key={idx} className="flex items-center justify-between text-sm text-gray-700 rounded bg-gray-50 px-3 py-2">
                            <span>{point.week}</span>
                            <span className="font-semibold">{point.units} units</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader title="Risk View" />
                    <CardContent>
                      <div className="space-y-3">
                        <div className={`rounded-lg border px-3 py-2 text-sm font-medium ${riskColor(result.stockout_risk)}`}>
                          <span className="inline-flex items-center gap-2"><FiAlertTriangle />Stockout Risk: {result.stockout_risk}</span>
                        </div>
                        <div className={`rounded-lg border px-3 py-2 text-sm font-medium ${riskColor(result.overstock_risk)}`}>
                          <span className="inline-flex items-center gap-2"><FiAlertTriangle />Overstock Risk: {result.overstock_risk}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader title="Reasoning & Actions" />
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-xs uppercase font-semibold text-gray-500 mb-2">Reasoning</p>
                        <ul className="space-y-1">
                          {(result.reasoning || []).map((item, idx) => (
                            <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                              <FiTrendingUp className="mt-0.5 text-primary" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs uppercase font-semibold text-gray-500 mb-2">Actions</p>
                        <ul className="space-y-1">
                          {(result.actions || []).map((item, idx) => (
                            <li key={idx} className="text-sm text-gray-700">• {item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    {!!result.scenario_notes?.length && (
                      <div className="mt-4">
                        <p className="text-xs uppercase font-semibold text-gray-500 mb-2">Scenario Notes</p>
                        <ul className="space-y-1">
                          {result.scenario_notes.map((item, idx) => (
                            <li key={idx} className="text-sm text-gray-700">• {item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryReplenishmentPage;
