import React, { useState } from 'react';
import { FiSearch, FiImage, FiFilter, FiTag } from 'react-icons/fi';

import { Card, CardContent, CardHeader } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Spinner } from '../../../components/ui/Spinner';
import {
  aiFashionService,
  VisualSearchRequest,
  VisualSearchResult,
} from '../../../services/api/aiFashionService';

const VisualSearchPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VisualSearchResult | null>(null);
  const [stylePrefInput, setStylePrefInput] = useState('mirror work, festive, vibrant');

  const [form, setForm] = useState<VisualSearchRequest>({
    image_description: 'A deep red bridal lehenga with heavy zari embroidery and broad dupatta border',
    image_url: '',
    target_category: 'lehenga',
    occasion: 'wedding',
    budget: 6500,
    region: 'north_india',
  });

  const parseList = (value: string) =>
    value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = await aiFashionService.getVisualSearchMatches({
        ...form,
        style_preferences: parseList(stylePrefInput),
      });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate visual matches');
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
            title="Visual Search & Similarity Match"
            subtitle="Find similar styles by visual cues for faster product discovery"
          />
          <CardContent>
            <div className="text-sm text-gray-600 flex items-center gap-2">
              <FiImage className="text-primary" />
              Business value: improves product discovery and conversion by matching customer visual intent.
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader title="Visual Inputs" />
            <CardContent>
              <form onSubmit={onSubmit} className="space-y-4">
                <Input
                  label="Image Description"
                  value={form.image_description || ''}
                  onChange={(e) => setForm({ ...form, image_description: e.target.value })}
                  placeholder="Describe the outfit seen by customer"
                />
                <Input
                  label="Image URL (optional)"
                  value={form.image_url || ''}
                  onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                  placeholder="https://..."
                />
                <Input
                  label="Target Category"
                  value={form.target_category || ''}
                  onChange={(e) => setForm({ ...form, target_category: e.target.value })}
                  placeholder="lehenga, saree, kurta set"
                />
                <Input
                  label="Occasion"
                  value={form.occasion || ''}
                  onChange={(e) => setForm({ ...form, occasion: e.target.value })}
                  placeholder="wedding, festival"
                />
                <Input
                  label="Budget (INR)"
                  type="number"
                  min={500}
                  value={form.budget ?? ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      budget: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                />
                <Input
                  label="Region"
                  value={form.region || ''}
                  onChange={(e) => setForm({ ...form, region: e.target.value })}
                  placeholder="north_india"
                />
                <Input
                  label="Style Preferences"
                  value={stylePrefInput}
                  onChange={(e) => setStylePrefInput(e.target.value)}
                  placeholder="mirror work, festive, vibrant"
                />
                <Button type="submit" fullWidth disabled={loading}>
                  {loading ? <Spinner size="sm" className="text-white" /> : 'Find Similar Styles'}
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
                    Submit visual cues to get similar catalog match directions.
                  </div>
                </CardContent>
              </Card>
            )}

            {result && (
              <>
                <Card>
                  <CardHeader title="Visual Signature" subtitle={`${result.confidence} confidence`} />
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {(result.visual_signature || []).map((sig, idx) => (
                        <span key={idx} className="rounded-full bg-primary/10 px-2 py-1 text-xs text-primary">
                          {sig}
                        </span>
                      ))}
                    </div>
                    <p className="text-sm text-gray-700 mt-4">
                      <span className="font-semibold">Inventory Recommendation:</span> {result.inventory_recommendation}
                    </p>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader title="Search Queries" />
                    <CardContent>
                      <ul className="space-y-2">
                        {(result.search_queries || []).map((query, idx) => (
                          <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                            <FiSearch className="mt-0.5 text-primary" />
                            {query}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader title="Merchandising Filters" />
                    <CardContent>
                      <ul className="space-y-2">
                        {(result.merchandising_filters || []).map((filter, idx) => (
                          <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                            <FiFilter className="mt-0.5 text-primary" />
                            {filter}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader title="Similar Matches" />
                  <CardContent>
                    <div className="space-y-3">
                      {(result.similar_matches || []).map((item, idx) => (
                        <div key={idx} className="rounded-lg border border-gray-200 p-4">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="font-semibold text-gray-900">{item.match_name}</h4>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                              {item.category}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 mt-1">
                            <span className="font-medium">Price Band:</span> {item.price_band}
                          </p>
                          <p className="text-sm text-gray-700 mt-1">{item.similarity_reason}</p>
                          <p className="text-sm text-gray-700 mt-1">
                            <span className="font-medium">Styling Tip:</span> {item.styling_tip}
                          </p>
                          <ul className="mt-2 space-y-1">
                            {(item.key_attributes || []).map((attr, attrIdx) => (
                              <li key={attrIdx} className="text-sm text-gray-700 flex items-start gap-2">
                                <FiTag className="mt-0.5 text-primary" />
                                {attr}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
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

export default VisualSearchPage;
