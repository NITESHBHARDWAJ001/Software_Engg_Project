import React, { useState } from 'react';
import { FiCheckCircle, FiAlertCircle, FiInfo } from 'react-icons/fi';

import { Card, CardContent, CardHeader } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Spinner } from '../../../components/ui/Spinner';
import {
  aiFashionService,
  SizeFitRequest,
  SizeFitResult,
} from '../../../services/api/aiFashionService';

const GARMENT_OPTIONS: Record<'female' | 'male', string[]> = {
  female: [
    'Saree Blouse',
    'Lehenga Choli',
    'Anarkali Suit',
    'Salwar Kameez',
    'Churidar Suit',
    'Sharara Suit',
    'Ghagra Choli',
    'Kurti',
  ],
  male: [
    'Kurta',
    'Sherwani',
    'Kurta Pajama',
    'Bandhgala',
    'Nehru Jacket',
    'Pathani Suit',
    'Dhoti Kurta',
  ],
};

const CONFIDENCE_STYLES: Record<string, { color: string; icon: React.ReactNode }> = {
  high: { color: 'text-green-700 bg-green-50 border-green-200', icon: <FiCheckCircle /> },
  medium: { color: 'text-yellow-700 bg-yellow-50 border-yellow-200', icon: <FiAlertCircle /> },
  low: { color: 'text-red-700 bg-red-50 border-red-200', icon: <FiAlertCircle /> },
};

const SizeFitPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SizeFitResult | null>(null);

  const [gender, setGender] = useState<'female' | 'male'>('female');
  const [garmentType, setGarmentType] = useState('Saree Blouse');
  const [fitPreference, setFitPreference] = useState<'fitted' | 'relaxed' | 'loose'>('relaxed');
  const [brandRegion, setBrandRegion] = useState('');
  const [measurements, setMeasurements] = useState({
    bust_chest_cm: '',
    waist_cm: '',
    hip_cm: '',
    height_cm: '',
    shoulder_cm: '',
    sleeve_cm: '',
  });

  const setMeasure = (key: keyof typeof measurements, value: string) =>
    setMeasurements((prev) => ({ ...prev, [key]: value }));

  const onGenderChange = (g: 'female' | 'male') => {
    setGender(g);
    setGarmentType(GARMENT_OPTIONS[g][0]);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    const cleanMeasurements: Record<string, number> = {};
    Object.entries(measurements).forEach(([k, v]) => {
      if (v !== '') cleanMeasurements[k] = Number(v);
    });

    if (Object.keys(cleanMeasurements).length < 2) {
      setError('Please enter at least 2 measurements.');
      setLoading(false);
      return;
    }

    try {
      const payload: SizeFitRequest = {
        measurements: cleanMeasurements,
        garment_type: garmentType,
        gender,
        fit_preference: fitPreference,
        brand_region: brandRegion || undefined,
      };
      const data = await aiFashionService.predictSizeAndFit(payload);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Size prediction failed');
    } finally {
      setLoading(false);
    }
  };

  const confidence = result?.sizing_confidence ?? 'medium';
  const confStyle = CONFIDENCE_STYLES[confidence] ?? CONFIDENCE_STYLES.medium;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <Card variant="elevated">
          <CardHeader
            title="Smart Size & Fit Predictor"
            subtitle="Feature 2: Enter your measurements to get the perfect ethnic wear size"
          />
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FiInfo className="text-primary" />
              Sizes vary by garment type and brand. Enter measurements in centimetres (cm).
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Form */}
          <Card>
            <CardHeader title="Your Measurements" />
            <CardContent>
              <form onSubmit={onSubmit} className="space-y-4">

                {/* Gender toggle */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                  <div className="flex gap-3">
                    {(['female', 'male'] as const).map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => onGenderChange(g)}
                        className={`flex-1 py-2 rounded-lg border text-sm font-medium capitalize transition-colors ${
                          gender === g
                            ? 'bg-primary text-white border-primary'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-primary'
                        }`}
                      >
                        {g === 'female' ? '♀ Female' : '♂ Male'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Garment type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Garment Type</label>
                  <select
                    className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm"
                    value={garmentType}
                    onChange={(e) => setGarmentType(e.target.value)}
                  >
                    {GARMENT_OPTIONS[gender].map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                {/* Fit preference */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Desired Fit</label>
                  <div className="flex gap-2">
                    {(['fitted', 'relaxed', 'loose'] as const).map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setFitPreference(f)}
                        className={`flex-1 py-2 rounded-lg border text-sm font-medium capitalize transition-colors ${
                          fitPreference === f
                            ? 'bg-primary text-white border-primary'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-primary'
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Body measurements */}
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label={gender === 'female' ? 'Bust (cm)' : 'Chest (cm)'}
                    type="number"
                    min={50}
                    max={200}
                    placeholder="e.g. 86"
                    value={measurements.bust_chest_cm}
                    onChange={(e) => setMeasure('bust_chest_cm', e.target.value)}
                  />
                  <Input
                    label="Waist (cm)"
                    type="number"
                    min={50}
                    max={200}
                    placeholder="e.g. 72"
                    value={measurements.waist_cm}
                    onChange={(e) => setMeasure('waist_cm', e.target.value)}
                  />
                  <Input
                    label="Hip (cm)"
                    type="number"
                    min={50}
                    max={200}
                    placeholder="e.g. 96"
                    value={measurements.hip_cm}
                    onChange={(e) => setMeasure('hip_cm', e.target.value)}
                  />
                  <Input
                    label="Height (cm)"
                    type="number"
                    min={100}
                    max={220}
                    placeholder="e.g. 162"
                    value={measurements.height_cm}
                    onChange={(e) => setMeasure('height_cm', e.target.value)}
                  />
                  <Input
                    label="Shoulder Width (cm)"
                    type="number"
                    min={20}
                    max={80}
                    placeholder="e.g. 38"
                    value={measurements.shoulder_cm}
                    onChange={(e) => setMeasure('shoulder_cm', e.target.value)}
                  />
                  <Input
                    label="Sleeve Length (cm)"
                    type="number"
                    min={10}
                    max={80}
                    placeholder="e.g. 58"
                    value={measurements.sleeve_cm}
                    onChange={(e) => setMeasure('sleeve_cm', e.target.value)}
                  />
                </div>

                <Input
                  label="Brand / Region (optional)"
                  placeholder="e.g. Fabindia, Manyavar, local boutique"
                  value={brandRegion}
                  onChange={(e) => setBrandRegion(e.target.value)}
                />

                <Button type="submit" fullWidth disabled={loading}>
                  {loading ? <Spinner size="sm" className="text-white" /> : 'Predict My Size'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Result */}
          <Card>
            <CardHeader title="Size Recommendation" />
            <CardContent>
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 mb-4">
                  {error}
                </div>
              )}

              {!result && !error && !loading && (
                <div className="text-sm text-gray-500 flex items-center gap-2">
                  <FiInfo />
                  Enter your measurements and click Predict to get your size.
                </div>
              )}

              {result && (
                <div className="space-y-4">

                  {/* Size badge */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-20 h-20 rounded-full bg-primary text-white text-3xl font-bold shadow">
                      {result.recommended_size}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide">Recommended Size</p>
                      <p className="text-lg font-semibold text-gray-900">{garmentType}</p>
                      <span className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full border text-xs font-medium ${confStyle.color}`}>
                        {confStyle.icon}
                        {confidence} confidence
                      </span>
                    </div>
                  </div>

                  {/* Explanation */}
                  <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                    <p className="text-xs font-semibold text-blue-700 uppercase mb-1">Why this size</p>
                    <p className="text-sm text-blue-900">{result.size_explanation}</p>
                  </div>

                  {/* Fit notes */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Fit Notes</p>
                    <p className="text-sm text-gray-700">{result.fit_notes}</p>
                  </div>

                  {/* Alteration suggestions */}
                  {result.alteration_suggestions?.length > 0 && (
                    <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3">
                      <p className="text-xs font-semibold text-yellow-700 uppercase mb-1">Alteration Suggestions</p>
                      <ul className="list-disc list-inside space-y-1">
                        {result.alteration_suggestions.map((s, i) => (
                          <li key={i} className="text-sm text-yellow-900">{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Fit tips */}
                  {result.fit_tips?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Wearing Tips</p>
                      <ul className="list-disc list-inside space-y-1">
                        {result.fit_tips.map((t, i) => (
                          <li key={i} className="text-sm text-gray-700">{t}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Size chart */}
                  {result.size_chart?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Size Chart (cm)</p>
                      <div className="overflow-x-auto rounded-lg border border-gray-200">
                        <table className="w-full text-xs text-center">
                          <thead className="bg-gray-50 text-gray-600 uppercase">
                            <tr>
                              <th className="px-3 py-2">Size</th>
                              <th className="px-3 py-2">{gender === 'female' ? 'Bust' : 'Chest'}</th>
                              <th className="px-3 py-2">Waist</th>
                              <th className="px-3 py-2">Hip</th>
                            </tr>
                          </thead>
                          <tbody>
                            {result.size_chart.map((row) => (
                              <tr
                                key={row.size}
                                className={row.size === result.recommended_size
                                  ? 'bg-primary/10 font-bold text-primary'
                                  : 'odd:bg-white even:bg-gray-50 text-gray-700'
                                }
                              >
                                <td className="px-3 py-2">{row.size}</td>
                                <td className="px-3 py-2">{row.bust_cm}</td>
                                <td className="px-3 py-2">{row.waist_cm}</td>
                                <td className="px-3 py-2">{row.hip_cm}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SizeFitPage;
