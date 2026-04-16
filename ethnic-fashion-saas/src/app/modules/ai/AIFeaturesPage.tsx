import React, { useState } from 'react';
import { FiStar, FiUser } from 'react-icons/fi';

import { Card, CardContent, CardHeader } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Spinner } from '../../../components/ui/Spinner';
import {
  aiFashionService,
  OutfitRecommendation,
  UserProfile,
} from '../../../services/api/aiFashionService';

const AIFeaturesPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<OutfitRecommendation[]>([]);

  const [form, setForm] = useState({
    gender: 'female',
    body_type: 'average',
    skin_tone: 'medium',
    age_group: '25-35',
    region: 'north_india',
    occasion: 'wedding',
    budget: 5000,
    preferences: 'traditional, elegant',
  });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const userProfile: UserProfile = {
        gender: form.gender,
        body_type: form.body_type,
        skin_tone: form.skin_tone,
        age_group: form.age_group,
        region: form.region,
      };

      const prefs = form.preferences
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean);

      const result = await aiFashionService.getPersonalizedOutfitRecommendations(
        userProfile,
        form.occasion,
        Number(form.budget),
        prefs.length ? prefs : undefined
      );

      setRecommendations(result.recommendations || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get recommendations';
      setError(message);
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto space-y-6">
        <Card variant="elevated">
          <CardHeader
            title="AI Personal Stylist"
            subtitle="Feature 1: Get personalized ethnic outfit recommendations"
          />
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FiStar className="text-primary" />
              Personalized by body type, skin tone, region, occasion, budget, and style preferences.
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader title="Your Style Profile" />
            <CardContent>
              <form onSubmit={onSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                  <div className="flex gap-3">
                    {(['female', 'male'] as const).map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setForm({ ...form, gender: g })}
                        className={`flex-1 py-2 rounded-lg border text-sm font-medium capitalize transition-colors ${
                          form.gender === g
                            ? 'bg-primary text-white border-primary'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-primary'
                        }`}
                      >
                        {g === 'female' ? '♀ Female' : '♂ Male'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Body Type</label>
                  <select
                    className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm"
                    value={form.body_type}
                    onChange={(e) => setForm({ ...form, body_type: e.target.value })}
                  >
                    <option value="slim">Slim</option>
                    <option value="average">Average</option>
                    <option value="athletic">Athletic</option>
                    {form.gender === 'female' ? (
                      <option value="curvy">Curvy</option>
                    ) : (
                      <option value="broad_shoulders">Broad Shoulders</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Skin Tone</label>
                  <select
                    className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm"
                    value={form.skin_tone}
                    onChange={(e) => setForm({ ...form, skin_tone: e.target.value })}
                  >
                    <option value="fair">Fair</option>
                    <option value="medium">Medium</option>
                    <option value="wheatish">Wheatish</option>
                    <option value="dusky">Dusky</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Age Group</label>
                    <select
                      className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm"
                      value={form.age_group}
                      onChange={(e) => setForm({ ...form, age_group: e.target.value })}
                    >
                      <option value="18-25">18-25</option>
                      <option value="25-35">25-35</option>
                      <option value="35-45">35-45</option>
                      <option value="45+">45+</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                    <select
                      className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm"
                      value={form.region}
                      onChange={(e) => setForm({ ...form, region: e.target.value })}
                    >
                      <option value="north_india">North India</option>
                      <option value="south_india">South India</option>
                      <option value="west_india">West India</option>
                      <option value="east_india">East India</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Occasion</label>
                    <select
                      className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm"
                      value={form.occasion}
                      onChange={(e) => setForm({ ...form, occasion: e.target.value })}
                    >
                      <option value="wedding">Wedding</option>
                      <option value="festival">Festival</option>
                      <option value="office">Office</option>
                      <option value="party">Party</option>
                      <option value="casual">Casual</option>
                    </select>
                  </div>

                  <Input
                    label="Budget (INR)"
                    type="number"
                    min={500}
                    value={form.budget}
                    onChange={(e) => setForm({ ...form, budget: Number(e.target.value) })}
                  />
                </div>

                <Input
                  label="Preferences (comma separated)"
                  value={form.preferences}
                  onChange={(e) => setForm({ ...form, preferences: e.target.value })}
                  placeholder="traditional, festive, minimal"
                />

                <Button type="submit" fullWidth disabled={loading}>
                  {loading ? <Spinner size="sm" className="text-white" /> : 'Get AI Recommendations'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Recommended Outfits" />
            <CardContent>
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 mb-3">
                  {error}
                </div>
              )}

              {!error && !loading && recommendations.length === 0 && (
                <div className="text-sm text-gray-600 flex items-center gap-2">
                  <FiUser className="text-gray-500" />
                  Submit your style profile to see recommendations.
                </div>
              )}

              <div className="space-y-3">
                {recommendations.map((item, idx) => {
                  return (
                  <div key={`${item.outfit_name}-${idx}`} className="rounded-lg border border-gray-200 overflow-hidden">
                    <div className="p-4">
                    <h3 className="font-semibold text-gray-900">{item.outfit_name}</h3>
                    <p className="text-sm text-gray-700 mt-1">
                      <span className="font-medium">Main Garment:</span> {item.main_garment}
                    </p>
                    <p className="text-sm text-gray-700 mt-1">
                      <span className="font-medium">Color Scheme:</span> {item.color_scheme}
                    </p>
                    <p className="text-sm text-gray-700 mt-1">
                      <span className="font-medium">Price Range:</span> {item.price_range}
                    </p>
                    <p className="text-sm text-gray-700 mt-2">{item.reasoning}</p>
                    {!!item.complementary_items?.length && (
                      <p className="text-sm text-gray-700 mt-2">
                        <span className="font-medium">Complements:</span> {item.complementary_items.join(', ')}
                      </p>
                    )}
                    </div>
                  </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AIFeaturesPage;
