import React, { useState } from 'react';
import { FiFileText, FiHash, FiGlobe } from 'react-icons/fi';

import { Card, CardContent, CardHeader } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Spinner } from '../../../components/ui/Spinner';
import {
  aiFashionService,
  ProductContentRequest,
  ProductContentResult,
} from '../../../services/api/aiFashionService';

const ProductContentPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ProductContentResult | null>(null);
  const [embellishmentInput, setEmbellishmentInput] = useState('zari, gota patti, sequins');
  const [languageInput, setLanguageInput] = useState('English, Hindi');
  const [form, setForm] = useState<ProductContentRequest>({
    product_name: 'Noor Festive Anarkali Set',
    category: 'anarkali_set',
    fabric: 'georgette',
    color: 'wine',
    target_audience: 'women festive shoppers',
    tone: 'premium',
  });

  const parseList = (value: string) => value.split(',').map((item) => item.trim()).filter(Boolean);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await aiFashionService.getProductContentBundle({
        ...form,
        embellishments: parseList(embellishmentInput),
        languages: parseList(languageInput),
      });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate product content');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <Card variant="elevated">
          <CardHeader title="AI Product Content Generator" subtitle="Create catalog copy, SEO, social captions, and multilingual variants" />
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader title="Product Inputs" />
            <CardContent>
              <form onSubmit={onSubmit} className="space-y-4">
                <Input label="Product Name" value={form.product_name} onChange={(e) => setForm({ ...form, product_name: e.target.value })} />
                <Input label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
                <Input label="Fabric" value={form.fabric} onChange={(e) => setForm({ ...form, fabric: e.target.value })} />
                <Input label="Color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
                <Input label="Embellishments" value={embellishmentInput} onChange={(e) => setEmbellishmentInput(e.target.value)} />
                <Input label="Target Audience" value={form.target_audience} onChange={(e) => setForm({ ...form, target_audience: e.target.value })} />
                <Input label="Tone" value={form.tone} onChange={(e) => setForm({ ...form, tone: e.target.value })} />
                <Input label="Languages" value={languageInput} onChange={(e) => setLanguageInput(e.target.value)} />
                <Button type="submit" fullWidth disabled={loading}>
                  {loading ? <Spinner size="sm" className="text-white" /> : 'Generate Content Bundle'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="lg:col-span-2 space-y-6">
            {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
            {!result && !error && !loading && <Card><CardContent><div className="text-sm text-gray-600">Generate product copy for catalog onboarding, SEO, and social publishing.</div></CardContent></Card>}
            {result && (
              <>
                <Card>
                  <CardHeader title={result.product_title} subtitle={result.short_description} />
                  <CardContent>
                    <p className="text-sm text-gray-700">{result.long_description}</p>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader title="SEO & Marketplace" />
                    <CardContent>
                      <p className="text-xs uppercase font-semibold text-gray-500 mb-2">SEO Keywords</p>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {(result.seo_keywords || []).map((item, idx) => (
                          <span key={idx} className="rounded-full bg-primary/10 px-2 py-1 text-xs text-primary">{item}</span>
                        ))}
                      </div>
                      <p className="text-xs uppercase font-semibold text-gray-500 mb-2">Marketplace Title Variants</p>
                      <ul className="space-y-2">
                        {(result.marketplace_title_variants || []).map((item, idx) => (
                          <li key={idx} className="text-sm text-gray-700 flex items-start gap-2"><FiHash className="mt-0.5 text-primary" />{item}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader title="Social & Features" />
                    <CardContent>
                      <p className="text-xs uppercase font-semibold text-gray-500 mb-2">Social Caption</p>
                      <p className="text-sm text-gray-700 mb-4">{result.social_caption}</p>
                      <p className="text-xs uppercase font-semibold text-gray-500 mb-2">Bullet Features</p>
                      <ul className="space-y-2">
                        {(result.bullet_features || []).map((item, idx) => (
                          <li key={idx} className="text-sm text-gray-700 flex items-start gap-2"><FiFileText className="mt-0.5 text-primary" />{item}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader title="Multilingual Copy" />
                  <CardContent>
                    <div className="space-y-4">
                      {(result.multilingual_copy || []).map((item, idx) => (
                        <div key={idx} className="rounded-lg border border-gray-200 p-4">
                          <p className="text-sm font-semibold text-gray-900 flex items-center gap-2"><FiGlobe className="text-primary" />{item.language}</p>
                          <p className="text-sm text-gray-700 mt-2"><span className="font-medium">Title:</span> {item.title}</p>
                          <p className="text-sm text-gray-700 mt-1"><span className="font-medium">Description:</span> {item.description}</p>
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

export default ProductContentPage;