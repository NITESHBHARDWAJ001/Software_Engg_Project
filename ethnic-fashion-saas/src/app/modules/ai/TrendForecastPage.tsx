import React, { useState } from 'react';
import { FiTrendingUp, FiAlertTriangle, FiCalendar, FiPackage } from 'react-icons/fi';

import { Card, CardContent, CardHeader } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Spinner } from '../../../components/ui/Spinner';
import {
  aiFashionService,
  TrendForecastRequest,
  TrendForecastResult,
} from '../../../services/api/aiFashionService';

const TrendForecastPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TrendForecastResult | null>(null);

  const [form, setForm] = useState<TrendForecastRequest>({
    season: 'festive_2026',
    region: 'north_india',
    product_category: 'women_ethnic_sets',
    target_gender: 'female',
    price_segment: 'mid',
  });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = await aiFashionService.getTrendForecast(form);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate trend forecast');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <Card variant="elevated">
          <CardHeader
            title="Trend Forecasting Engine"
            subtitle="Predict colors, fabrics, silhouettes, motifs, and demand signals for better buying decisions"
          />
          <CardContent>
            <div className="text-sm text-gray-600 flex items-center gap-2">
              <FiTrendingUp className="text-primary" />
              Business value: improved inventory mix planning and reduced dead stock risk.
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader title="Forecast Inputs" />
            <CardContent>
              <form onSubmit={onSubmit} className="space-y-4">
                <Input
                  label="Season"
                  value={form.season}
                  onChange={(e) => setForm({ ...form, season: e.target.value })}
                  placeholder="festive_2026"
                />
                <Input
                  label="Region"
                  value={form.region}
                  onChange={(e) => setForm({ ...form, region: e.target.value })}
                  placeholder="north_india"
                />
                <Input
                  label="Product Category"
                  value={form.product_category}
                  onChange={(e) => setForm({ ...form, product_category: e.target.value })}
                  placeholder="women_ethnic_sets"
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Gender</label>
                  <select
                    className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm"
                    value={form.target_gender}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        target_gender: e.target.value as 'male' | 'female' | 'unisex',
                      })
                    }
                  >
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="unisex">Unisex</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price Segment</label>
                  <select
                    className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm"
                    value={form.price_segment}
                    onChange={(e) => setForm({ ...form, price_segment: e.target.value })}
                  >
                    <option value="entry">Entry</option>
                    <option value="mid">Mid</option>
                    <option value="premium">Premium</option>
                  </select>
                </div>

                <Button type="submit" fullWidth disabled={loading}>
                  {loading ? <Spinner size="sm" className="text-white" /> : 'Generate Forecast'}
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
                    Submit forecast inputs to view trend direction, hero products, inventory mix and buying calendar.
                  </div>
                </CardContent>
              </Card>
            )}

            {result && (
              <>
                <Card>
                  <CardHeader title="Forecast Summary" subtitle={result.forecast_window} />
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="rounded-lg border border-gray-200 p-4">
                        <p className="text-xs uppercase text-gray-500 font-semibold">Trend Direction</p>
                        <p className="text-xl font-semibold text-gray-900 mt-1 capitalize">{result.trend_direction}</p>
                        <p className="text-sm text-gray-600 mt-2">{result.business_summary}</p>
                      </div>
                      <div className="rounded-lg border border-gray-200 p-4">
                        <p className="text-xs uppercase text-gray-500 font-semibold">Hero Products</p>
                        <ul className="mt-2 space-y-2">
                          {result.hero_products?.slice(0, 3).map((p, i) => (
                            <li key={i} className="text-sm text-gray-700">
                              <span className="font-medium">{p.name}</span> ({p.expected_demand})
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader title="Trend Signals" />
                    <CardContent>
                      <div className="space-y-3 text-sm">
                        <div>
                          <p className="font-semibold text-gray-700">Top Colors</p>
                          <p className="text-gray-600">{(result.top_colors || []).join(', ')}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-700">Top Fabrics</p>
                          <p className="text-gray-600">{(result.top_fabrics || []).join(', ')}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-700">Cuts & Silhouettes</p>
                          <p className="text-gray-600">{(result.top_cuts_silhouettes || []).join(', ')}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-700">Motifs & Embellishments</p>
                          <p className="text-gray-600">{(result.top_motifs_embellishments || []).join(', ')}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader title="Inventory Mix Recommendation" />
                    <CardContent>
                      <div className="space-y-3">
                        {(result.inventory_mix_recommendation || []).map((item, idx) => (
                          <div key={idx}>
                            <div className="flex justify-between text-sm text-gray-700 mb-1">
                              <span className="capitalize">{item.bucket}</span>
                              <span>{item.percentage}%</span>
                            </div>
                            <div className="h-2 rounded bg-gray-200 overflow-hidden">
                              <div className="h-full bg-primary" style={{ width: `${item.percentage}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader title="Buying Calendar" />
                    <CardContent>
                      <ul className="space-y-2">
                        {(result.buying_calendar || []).map((entry, i) => (
                          <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                            <FiCalendar className="mt-0.5 text-primary" />
                            <span><span className="font-medium">{entry.month}:</span> {entry.action}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader title="Risk Alerts" />
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs uppercase font-semibold text-gray-500">High Markdown Risk</p>
                          <ul className="mt-1 space-y-1">
                            {(result.markdown_risk_items || []).map((risk, i) => (
                              <li key={i} className="text-sm text-red-700 flex items-start gap-2">
                                <FiAlertTriangle className="mt-0.5" />
                                {risk}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-xs uppercase font-semibold text-gray-500">Regional Notes</p>
                          <ul className="mt-1 space-y-1">
                            {(result.regional_notes || []).map((note, i) => (
                              <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                                <FiPackage className="mt-0.5 text-primary" />
                                {note}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrendForecastPage;
