import React, { useState } from 'react';
import { FiLayers, FiEdit3, FiTag, FiScissors } from 'react-icons/fi';

import { Card, CardContent, CardHeader } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Spinner } from '../../../components/ui/Spinner';
import {
  aiFashionService,
  DesignCopilotRequest,
  DesignCopilotResult,
} from '../../../services/api/aiFashionService';

const DesignCopilotPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DesignCopilotResult | null>(null);

  const [form, setForm] = useState<DesignCopilotRequest>({
    collection_name: 'Royal Bloom',
    season: 'festive_2026',
    region: 'north_india',
    target_gender: 'female',
    product_category: 'occasion_wear',
    inspiration_keywords: ['floral', 'zardozi', 'regal'],
  });

  const [keywordsInput, setKeywordsInput] = useState('floral, zardozi, regal');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const keywords = keywordsInput
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean);

      const payload: DesignCopilotRequest = {
        ...form,
        inspiration_keywords: keywords,
      };

      const data = await aiFashionService.getDesignCopilotConcepts(payload);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate design concepts');
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
            title="AI Design Copilot for Merchandising"
            subtitle="Generate collection themes, product concepts, embroidery ideas, and merchandising directions"
          />
          <CardContent>
            <div className="text-sm text-gray-600 flex items-center gap-2">
              <FiLayers className="text-primary" />
              Business value: faster ideation cycles and better collection planning across teams.
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader title="Design Inputs" />
            <CardContent>
              <form onSubmit={onSubmit} className="space-y-4">
                <Input
                  label="Collection Name"
                  value={form.collection_name}
                  onChange={(e) => setForm({ ...form, collection_name: e.target.value })}
                  placeholder="Royal Bloom"
                />
                <Input
                  label="Season"
                  value={form.season}
                  onChange={(e) => setForm({ ...form, season: e.target.value })}
                  placeholder="festive_2026"
                />
                <Input
                  label="Region Influence"
                  value={form.region}
                  onChange={(e) => setForm({ ...form, region: e.target.value })}
                  placeholder="north_india"
                />
                <Input
                  label="Product Category"
                  value={form.product_category}
                  onChange={(e) => setForm({ ...form, product_category: e.target.value })}
                  placeholder="occasion_wear"
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

                <Input
                  label="Inspiration Keywords (comma separated)"
                  value={keywordsInput}
                  onChange={(e) => setKeywordsInput(e.target.value)}
                  placeholder="floral, heritage, metallic accents"
                />

                <Button type="submit" fullWidth disabled={loading}>
                  {loading ? <Spinner size="sm" className="text-white" /> : 'Generate Design Concepts'}
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
                    Submit collection inputs to generate themes, silhouettes, embroidery directions, and capsule products.
                  </div>
                </CardContent>
              </Card>
            )}

            {result && (
              <>
                <Card>
                  <CardHeader title={result.collection_theme || 'Collection Theme'} subtitle={result.storyline} />
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-semibold text-gray-700 mb-1">Color Palette</p>
                        <p className="text-gray-600">{(result.color_palette || []).join(', ')}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-700 mb-1">Visual Mood Keywords</p>
                        <p className="text-gray-600">{(result.visual_mood_keywords || []).join(', ')}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-700 mb-1">Fabric Directions</p>
                        <p className="text-gray-600">{(result.fabric_directions || []).join(', ')}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-700 mb-1">Silhouette Directions</p>
                        <p className="text-gray-600">{(result.silhouette_directions || []).join(', ')}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader title="Embroidery & Surface Ideas" />
                  <CardContent>
                    <ul className="space-y-2">
                      {(result.embroidery_surface_ideas || []).map((idea, i) => (
                        <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                          <FiEdit3 className="mt-0.5 text-primary" />
                          {idea}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader title="Capsule Products" subtitle="Commercially viable concepts for the collection" />
                  <CardContent>
                    <div className="space-y-3">
                      {(result.capsule_products || []).map((p, idx) => (
                        <div key={idx} className="rounded-lg border border-gray-200 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <h4 className="font-semibold text-gray-900">{p.product_name}</h4>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold uppercase">
                              {p.price_positioning}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 mt-1">{p.design_concept}</p>
                          <p className="text-xs text-gray-500 uppercase font-semibold mt-3 mb-1">Key Details</p>
                          <ul className="space-y-1">
                            {(p.key_details || []).map((detail, i) => (
                              <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                                <FiTag className="mt-0.5 text-primary" />
                                {detail}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader title="Merchandising Tips" />
                    <CardContent>
                      <ul className="space-y-2">
                        {(result.merchandising_tips || []).map((tip, i) => (
                          <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                            <FiLayers className="mt-0.5 text-primary" />
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader title="Manufacturing Notes" />
                    <CardContent>
                      <ul className="space-y-2">
                        {(result.manufacturing_notes || []).map((note, i) => (
                          <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                            <FiScissors className="mt-0.5 text-primary" />
                            {note}
                          </li>
                        ))}
                      </ul>
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

export default DesignCopilotPage;
