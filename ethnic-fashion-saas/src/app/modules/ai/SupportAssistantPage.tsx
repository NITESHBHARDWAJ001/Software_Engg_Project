import React, { useState } from 'react';
import { FiHelpCircle, FiCornerDownRight, FiAlertCircle, FiFileText, FiTag } from 'react-icons/fi';

import { Card, CardContent, CardHeader } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Spinner } from '../../../components/ui/Spinner';
import {
  aiFashionService,
  SupportAssistantRequest,
  SupportAssistantResult,
} from '../../../services/api/aiFashionService';

const SupportAssistantPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SupportAssistantResult | null>(null);
  const [question, setQuestion] = useState('Will this lehenga fit someone with 38 inch bust and can it be delivered before next Friday?');
  const [productName, setProductName] = useState('Noor Bridal Lehenga');
  const [productCategory, setProductCategory] = useState('Lehenga');
  const [availableSizes, setAvailableSizes] = useState('S, M, L, XL');
  const [productFabric, setProductFabric] = useState('silk blend');
  const [leadTimeDays, setLeadTimeDays] = useState('3');
  const [deliveryCity, setDeliveryCity] = useState('Jaipur');
  const [customerBustInch, setCustomerBustInch] = useState('38');
  const [recommendedSize, setRecommendedSize] = useState('L');
  const [fitNote, setFitNote] = useState('structured waist, semi-fitted bust');
  const [shippingPolicy, setShippingPolicy] = useState('Standard delivery 4-6 business days. Express delivery 2-3 business days in metro cities.');
  const [returnPolicy, setReturnPolicy] = useState('Returns accepted within 7 days for unworn items. Custom stitched items are exchange only.');

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
      const productContext = {
        name: productName,
        category: productCategory,
        sizes: parseList(availableSizes),
        fabric: productFabric,
        lead_time: leadTimeDays ? `${leadTimeDays} days` : undefined,
        city: deliveryCity,
      };

      const sizeContext = {
        bust_inch: customerBustInch ? Number(customerBustInch) : undefined,
        recommended_size: recommendedSize || undefined,
        fit_note: fitNote || undefined,
      };

      const payload: SupportAssistantRequest = {
        customer_question: question,
        product_context: productContext,
        size_context: sizeContext,
        shipping_policy: shippingPolicy,
        return_policy: returnPolicy,
      };
      const data = await aiFashionService.getSupportAssistantResponse(payload);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate support response');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <Card variant="elevated">
          <CardHeader title="AI Customer Support Assistant" subtitle="Answer product, size, shipping, returns, and styling questions with catalog-aware context" />
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader title="Support Context" />
            <CardContent>
              <form onSubmit={onSubmit} className="space-y-4">
                <Input label="Customer Question" value={question} onChange={(e) => setQuestion(e.target.value)} />
                <Input label="Product Name" value={productName} onChange={(e) => setProductName(e.target.value)} />
                <Input label="Product Category" value={productCategory} onChange={(e) => setProductCategory(e.target.value)} />
                <Input label="Available Sizes (comma separated)" value={availableSizes} onChange={(e) => setAvailableSizes(e.target.value)} />
                <Input label="Fabric" value={productFabric} onChange={(e) => setProductFabric(e.target.value)} />
                <Input label="Lead Time (days)" type="number" min={0} value={leadTimeDays} onChange={(e) => setLeadTimeDays(e.target.value)} />
                <Input label="Delivery City" value={deliveryCity} onChange={(e) => setDeliveryCity(e.target.value)} />
                <Input label="Customer Bust (inch, optional)" type="number" min={20} value={customerBustInch} onChange={(e) => setCustomerBustInch(e.target.value)} />
                <Input label="Recommended Size (optional)" value={recommendedSize} onChange={(e) => setRecommendedSize(e.target.value)} />
                <Input label="Fit Note (optional)" value={fitNote} onChange={(e) => setFitNote(e.target.value)} />
                <Input label="Shipping Policy" value={shippingPolicy} onChange={(e) => setShippingPolicy(e.target.value)} />
                <Input label="Return Policy" value={returnPolicy} onChange={(e) => setReturnPolicy(e.target.value)} />
                <Button type="submit" fullWidth disabled={loading}>
                  {loading ? <Spinner size="sm" className="text-white" /> : 'Generate Support Answer'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="lg:col-span-2 space-y-6">
            {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
            {!result && !error && !loading && <Card><CardContent><div className="text-sm text-gray-600">Provide a customer question and available product/policy context to draft a response.</div></CardContent></Card>}
            {result && (
              <>
                <Card>
                  <CardHeader title="Customer Reply" subtitle={`${result.answer_type} • ${result.confidence} confidence`} />
                  <CardContent>
                    <p className="text-sm text-gray-700 whitespace-pre-line">{result.customer_reply || result.answer}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader title="Internal Agent Note" />
                  <CardContent>
                    <p className="text-sm text-gray-700">{result.internal_summary || 'No internal summary provided.'}</p>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader title="Follow-up Questions" />
                    <CardContent>
                      <ul className="space-y-2">
                        {(result.follow_up_questions || []).map((item, idx) => (
                          <li key={idx} className="text-sm text-gray-700 flex items-start gap-2"><FiHelpCircle className="mt-0.5 text-primary" />{item}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader title="Recommended Actions" />
                    <CardContent>
                      <ul className="space-y-2">
                        {(result.recommended_actions || []).map((item, idx) => (
                          <li key={idx} className="text-sm text-gray-700 flex items-start gap-2"><FiCornerDownRight className="mt-0.5 text-primary" />{item}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader title="Policy Guidance" />
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs uppercase font-semibold text-gray-500 mb-1">Size Guidance</p>
                          <p className="text-sm text-gray-700">{result.size_guidance || 'No size-specific guidance.'}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase font-semibold text-gray-500 mb-1">Shipping Guidance</p>
                          <p className="text-sm text-gray-700">{result.shipping_guidance || 'No shipping-specific guidance.'}</p>
                        </div>
                        {!!result.policy_used?.length && (
                          <div>
                            <p className="text-xs uppercase font-semibold text-gray-500 mb-1">Policy Used</p>
                            <ul className="space-y-1">
                              {result.policy_used.map((item, idx) => (
                                <li key={idx} className="text-sm text-gray-700 flex items-start gap-2"><FiFileText className="mt-0.5 text-primary" />{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader title="Missing Info & Cross-sell" />
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs uppercase font-semibold text-gray-500 mb-1">Missing Information</p>
                          <ul className="space-y-1">
                            {(result.missing_information || []).map((item, idx) => (
                              <li key={idx} className="text-sm text-gray-700 flex items-start gap-2"><FiHelpCircle className="mt-0.5 text-primary" />{item}</li>
                            ))}
                            {!result.missing_information?.length && <li className="text-sm text-gray-500">No missing information flagged.</li>}
                          </ul>
                        </div>
                        <div>
                          <p className="text-xs uppercase font-semibold text-gray-500 mb-1">Cross-sell Suggestions</p>
                          <ul className="space-y-1">
                            {(result.cross_sell_suggestions || []).map((item, idx) => (
                              <li key={idx} className="text-sm text-gray-700 flex items-start gap-2"><FiTag className="mt-0.5 text-primary" />{item}</li>
                            ))}
                            {!result.cross_sell_suggestions?.length && <li className="text-sm text-gray-500">No cross-sell suggestions.</li>}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader title="Escalation Check" />
                  <CardContent>
                    <div className="flex items-start gap-2 text-sm text-gray-700">
                      <FiAlertCircle className={result.escalation_needed ? 'text-red-600 mt-0.5' : 'text-green-600 mt-0.5'} />
                      <div>
                        <p className="font-semibold">{result.escalation_needed ? 'Escalation needed' : 'No escalation needed'}</p>
                        <p>{result.escalation_reason}</p>
                      </div>
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

export default SupportAssistantPage;