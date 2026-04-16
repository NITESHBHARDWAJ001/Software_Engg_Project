import React, { useState } from 'react';
import { FiTrendingUp, FiTrendingDown, FiMinusCircle, FiAlertTriangle } from 'react-icons/fi';

import { Card, CardContent, CardHeader } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Spinner } from '../../../components/ui/Spinner';
import {
  aiFashionService,
  DynamicPricingRequest,
  DynamicPricingResult,
} from '../../../services/api/aiFashionService';

const DynamicPricingPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DynamicPricingResult | null>(null);
  const [competitorInput, setCompetitorInput] = useState('4299, 4599, 4799');
  const [form, setForm] = useState<DynamicPricingRequest>({
    product_name: 'Festive Zari Kurta Set',
    category: 'women_ethnic_sets',
    current_price: 4499,
    cost_price: 2200,
    stock_units: 64,
    demand_signal: 'high traffic, medium conversion',
    season: 'festive_2026',
    competitor_prices: [4299, 4599, 4799],
  });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const competitor_prices = competitorInput
        .split(',')
        .map((value) => Number(value.trim()))
        .filter((value) => !Number.isNaN(value) && value > 0);

      const data = await aiFashionService.getDynamicPricingRecommendation({
        ...form,
        competitor_prices,
      });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate pricing recommendation');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const directionIcon = {
    increase: <FiTrendingUp className="text-green-600" />,
    maintain: <FiMinusCircle className="text-yellow-600" />,
    decrease: <FiTrendingDown className="text-red-600" />,
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <Card variant="elevated">
          <CardHeader
            title="Dynamic Pricing Intelligence"
            subtitle="Recommend price moves using demand, seasonality, competitor pricing, and stock pressure"
          />
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader title="Pricing Inputs" />
            <CardContent>
              <form onSubmit={onSubmit} className="space-y-4">
                <Input label="Product Name" value={form.product_name} onChange={(e) => setForm({ ...form, product_name: e.target.value })} />
                <Input label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
                <Input label="Current Price (INR)" type="number" value={form.current_price} onChange={(e) => setForm({ ...form, current_price: Number(e.target.value) })} />
                <Input label="Cost Price (INR)" type="number" value={form.cost_price} onChange={(e) => setForm({ ...form, cost_price: Number(e.target.value) })} />
                <Input label="Stock Units" type="number" value={form.stock_units} onChange={(e) => setForm({ ...form, stock_units: Number(e.target.value) })} />
                <Input label="Demand Signal" value={form.demand_signal} onChange={(e) => setForm({ ...form, demand_signal: e.target.value })} />
                <Input label="Season" value={form.season} onChange={(e) => setForm({ ...form, season: e.target.value })} />
                <Input label="Competitor Prices (comma separated)" value={competitorInput} onChange={(e) => setCompetitorInput(e.target.value)} />
                <Button type="submit" fullWidth disabled={loading}>
                  {loading ? <Spinner size="sm" className="text-white" /> : 'Get Pricing Recommendation'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="lg:col-span-2 space-y-6">
            {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
            {!result && !error && !loading && <Card><CardContent><div className="text-sm text-gray-600">Enter product and pricing signals to generate a recommendation.</div></CardContent></Card>}
            {result && (
              <>
                <Card>
                  <CardHeader title="Recommendation" />
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-2xl">
                        {directionIcon[result.price_direction]}
                      </div>
                      <div>
                        <p className="text-xs uppercase font-semibold text-gray-500">Recommended Price</p>
                        <p className="text-2xl font-semibold text-gray-900">INR {result.recommended_price}</p>
                        <p className="text-sm text-gray-600 capitalize">{result.price_direction} by {result.price_change_percent}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader title="Business Impact" />
                    <CardContent>
                      <div className="space-y-3 text-sm text-gray-700">
                        <p><span className="font-semibold">Margin Impact:</span> {result.margin_impact}</p>
                        <p><span className="font-semibold">Sell-through Outlook:</span> {result.sell_through_outlook}</p>
                        <p><span className="font-semibold">Competitor Positioning:</span> {result.competitor_positioning}</p>
                        <p><span className="font-semibold">Markdown Strategy:</span> {result.markdown_strategy}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader title="Risk & Guardrails" />
                    <CardContent>
                      <p className="text-sm text-gray-700 mb-3"><span className="font-semibold">Urgency:</span> {result.urgency}</p>
                      <ul className="space-y-2">
                        {(result.guardrails || []).map((item, idx) => (
                          <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                            <FiAlertTriangle className="mt-0.5 text-yellow-600" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader title="Reasoning" />
                  <CardContent>
                    <ul className="space-y-2">
                      {(result.pricing_reasoning || []).map((item, idx) => (
                        <li key={idx} className="text-sm text-gray-700">{item}</li>
                      ))}
                    </ul>
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

export default DynamicPricingPage;