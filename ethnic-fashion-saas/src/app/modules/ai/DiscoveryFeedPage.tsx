import React, { useState } from 'react';
import { FiMapPin, FiCalendar, FiRefreshCw, FiArrowRight } from 'react-icons/fi';

import { Card, CardContent, CardHeader } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Spinner } from '../../../components/ui/Spinner';
import {
  aiFashionService,
  DiscoveryFeedRequest,
  DiscoveryFeedResult,
} from '../../../services/api/aiFashionService';

const DiscoveryFeedPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DiscoveryFeedResult | null>(null);
  const [browsingInput, setBrowsingInput] = useState('banarasi saree, wedding lehenga, pastel suit');
  const [purchaseInput, setPurchaseInput] = useState('festive kurta set, mirror-work dupatta');
  const [occasionInput, setOccasionInput] = useState('wedding, rakhi, diwali');
  const [categoryInput, setCategoryInput] = useState('sarees, lehengas, festive sets');
  const [form, setForm] = useState<DiscoveryFeedRequest>({
    customer_name: 'Aarohi',
    location: 'Jaipur',
  });

  const parseList = (value: string) => value.split(',').map((item) => item.trim()).filter(Boolean);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await aiFashionService.getDiscoveryFeed({
        ...form,
        browsing_history: parseList(browsingInput),
        purchase_history: parseList(purchaseInput),
        upcoming_occasions: parseList(occasionInput),
        preferred_categories: parseList(categoryInput),
      });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate discovery feed');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <Card variant="elevated">
          <CardHeader title="Personalized Discovery Feed" subtitle="Tailor the home feed using browsing, purchases, occasions, and location" />
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader title="Customer Signals" />
            <CardContent>
              <form onSubmit={onSubmit} className="space-y-4">
                <Input label="Customer Name" value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} />
                <Input label="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
                <Input label="Browsing History" value={browsingInput} onChange={(e) => setBrowsingInput(e.target.value)} />
                <Input label="Purchase History" value={purchaseInput} onChange={(e) => setPurchaseInput(e.target.value)} />
                <Input label="Upcoming Occasions" value={occasionInput} onChange={(e) => setOccasionInput(e.target.value)} />
                <Input label="Preferred Categories" value={categoryInput} onChange={(e) => setCategoryInput(e.target.value)} />
                <Button type="submit" fullWidth disabled={loading}>
                  {loading ? <Spinner size="sm" className="text-white" /> : 'Generate Discovery Feed'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="lg:col-span-2 space-y-6">
            {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
            {!result && !error && !loading && <Card><CardContent><div className="text-sm text-gray-600">Generate a personalized feed strategy to increase repeat visits and conversion.</div></CardContent></Card>}
            {result && (
              <>
                <Card>
                  <CardHeader title="Feed Strategy" subtitle={result.feed_strategy} />
                  <CardContent>
                    <p className="text-sm text-gray-700">{result.hero_message}</p>
                  </CardContent>
                </Card>

                <div className="space-y-4">
                  {(result.modules || []).map((module, idx) => (
                    <Card key={idx}>
                      <CardHeader title={module.title} subtitle={module.module_type} />
                      <CardContent>
                        <ul className="space-y-1 text-sm text-gray-700 mb-3">
                          {(module.items || []).map((item, itemIdx) => (
                            <li key={itemIdx}>• {item}</li>
                          ))}
                        </ul>
                        <p className="text-sm text-gray-600 mb-2">{module.reason}</p>
                        <div className="inline-flex items-center gap-2 text-sm font-medium text-primary">
                          {module.cta}
                          <FiArrowRight />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader title="Personalization Signals" />
                    <CardContent>
                      <ul className="space-y-2">
                        {(result.personalization_signals || []).map((item, idx) => (
                          <li key={idx} className="text-sm text-gray-700 flex items-start gap-2"><FiMapPin className="mt-0.5 text-primary" />{item}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader title="Conversion Hooks" />
                    <CardContent>
                      <ul className="space-y-2">
                        {(result.conversion_hooks || []).map((item, idx) => (
                          <li key={idx} className="text-sm text-gray-700 flex items-start gap-2"><FiCalendar className="mt-0.5 text-primary" />{item}</li>
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

export default DiscoveryFeedPage;