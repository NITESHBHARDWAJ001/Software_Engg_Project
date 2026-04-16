import { API_BASE_URL } from '../../utils/constants';

export interface UserProfile {
  gender: string;
  body_type: string;
  skin_tone: string;
  age_group: string;
  region: string;
}

export interface OutfitRecommendation {
  outfit_name: string;
  main_garment: string;
  complementary_items: string[];
  color_scheme: string;
  reasoning: string;
  price_range: string;
  image_query?: string;
}

export interface SizeFitRequest {
  measurements: {
    bust_chest_cm?: number;
    waist_cm?: number;
    hip_cm?: number;
    height_cm?: number;
    shoulder_cm?: number;
    sleeve_cm?: number;
  };
  garment_type: string;
  gender: 'male' | 'female';
  fit_preference: 'fitted' | 'relaxed' | 'loose';
  brand_region?: string;
}

export interface SizeChartEntry {
  size: string;
  bust_cm: string;
  waist_cm: string;
  hip_cm: string;
}

export interface SizeFitResult {
  recommended_size: string;
  size_explanation: string;
  fit_notes: string;
  measurements_used: string[];
  alteration_suggestions: string[];
  sizing_confidence: 'high' | 'medium' | 'low';
  fit_tips: string[];
  size_chart: SizeChartEntry[];
}

export interface TrendForecastRequest {
  season: string;
  region: string;
  product_category: string;
  target_gender: 'male' | 'female' | 'unisex';
  price_segment: string;
}

export interface TrendHeroProduct {
  name: string;
  why: string;
  expected_demand: 'high' | 'medium' | 'low';
}

export interface InventoryMixItem {
  bucket: string;
  percentage: number;
}

export interface BuyingCalendarItem {
  month: string;
  action: string;
}

export interface TrendForecastResult {
  forecast_window: string;
  trend_direction: 'rising' | 'stable' | 'declining';
  top_colors: string[];
  top_fabrics: string[];
  top_cuts_silhouettes: string[];
  top_motifs_embellishments: string[];
  hero_products: TrendHeroProduct[];
  inventory_mix_recommendation: InventoryMixItem[];
  buying_calendar: BuyingCalendarItem[];
  regional_notes: string[];
  risk_alerts: string[];
  markdown_risk_items: string[];
  business_summary: string;
}

export interface DesignCopilotRequest {
  collection_name: string;
  season: string;
  region: string;
  target_gender: 'male' | 'female' | 'unisex';
  product_category: string;
  inspiration_keywords?: string[];
}

export interface CapsuleProduct {
  product_name: string;
  design_concept: string;
  key_details: string[];
  price_positioning: 'entry' | 'mid' | 'premium';
}

export interface DesignCopilotResult {
  collection_theme: string;
  storyline: string;
  color_palette: string[];
  fabric_directions: string[];
  embroidery_surface_ideas: string[];
  silhouette_directions: string[];
  capsule_products: CapsuleProduct[];
  visual_mood_keywords: string[];
  merchandising_tips: string[];
  manufacturing_notes: string[];
}

export interface DynamicPricingRequest {
  product_name: string;
  category: string;
  current_price: number;
  cost_price: number;
  stock_units: number;
  demand_signal: string;
  season: string;
  competitor_prices?: number[];
}

export interface DynamicPricingResult {
  recommended_price: number;
  price_direction: 'increase' | 'maintain' | 'decrease';
  price_change_percent: number;
  margin_impact: string;
  sell_through_outlook: string;
  pricing_reasoning: string[];
  competitor_positioning: string;
  markdown_strategy: string;
  urgency: 'high' | 'medium' | 'low';
  guardrails: string[];
}

export interface DiscoveryFeedModule {
  title: string;
  module_type: 'hero' | 'recommendations' | 'occasion_edit' | 'restock_alert' | 'regional_pick';
  items: string[];
  reason: string;
  cta: string;
}

export interface DiscoveryFeedRequest {
  customer_name: string;
  location: string;
  browsing_history?: string[];
  purchase_history?: string[];
  upcoming_occasions?: string[];
  preferred_categories?: string[];
}

export interface DiscoveryFeedResult {
  feed_strategy: string;
  hero_message: string;
  modules: DiscoveryFeedModule[];
  personalization_signals: string[];
  conversion_hooks: string[];
}

export interface ProductContentRequest {
  product_name: string;
  category: string;
  fabric: string;
  color: string;
  embellishments?: string[];
  target_audience: string;
  tone: string;
  languages?: string[];
}

export interface MultilingualCopyItem {
  language: string;
  title: string;
  description: string;
}

export interface ProductContentResult {
  product_title: string;
  short_description: string;
  long_description: string;
  seo_keywords: string[];
  social_caption: string;
  bullet_features: string[];
  marketplace_title_variants: string[];
  multilingual_copy: MultilingualCopyItem[];
}

export interface SupportAssistantRequest {
  customer_question: string;
  product_context?: Record<string, unknown>;
  size_context?: Record<string, unknown>;
  shipping_policy?: string;
  return_policy?: string;
}

export interface SupportAssistantResult {
  answer: string;
  customer_reply: string;
  internal_summary: string;
  answer_type: 'product' | 'size' | 'shipping' | 'returns' | 'styling' | 'mixed';
  confidence: 'high' | 'medium' | 'low';
  missing_information: string[];
  policy_used: string[];
  follow_up_questions: string[];
  recommended_actions: string[];
  cross_sell_suggestions: string[];
  size_guidance: string;
  shipping_guidance: string;
  escalation_needed: boolean;
  escalation_reason: string;
}

export interface VisualSearchRequest {
  image_description?: string;
  image_url?: string;
  target_category?: string;
  occasion?: string;
  budget?: number;
  region?: string;
  style_preferences?: string[];
}

export interface VisualSearchMatch {
  match_name: string;
  category: string;
  key_attributes: string[];
  price_band: string;
  similarity_reason: string;
  styling_tip: string;
}

export interface VisualSearchResult {
  visual_signature: string[];
  search_queries: string[];
  similar_matches: VisualSearchMatch[];
  merchandising_filters: string[];
  inventory_recommendation: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface InventoryReplenishmentRequest {
  sku: string;
  product_name: string;
  category: string;
  current_stock: number;
  avg_weekly_sales: number;
  lead_time_days: number;
  season: string;
  region: string;
  current_open_po_units?: number;
  service_level?: 'low' | 'medium' | 'high';
}

export interface WeeklyDemandPoint {
  week: string;
  units: number;
}

export interface InventoryReplenishmentResult {
  forecast_horizon: string;
  predicted_weekly_demand: WeeklyDemandPoint[];
  total_predicted_demand: number;
  safety_stock_units: number;
  reorder_point_units: number;
  recommended_purchase_units: number;
  recommended_order_timing: string;
  stockout_risk: 'high' | 'medium' | 'low';
  overstock_risk: 'high' | 'medium' | 'low';
  reasoning: string[];
  scenario_notes: string[];
  actions: string[];
}

class AIFashionService {
  private async request<T>(endpoint: string, data: unknown): Promise<T> {
    const token = localStorage.getItem('auth_token');

    const response = await fetch(`${API_BASE_URL}/v1${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(error.detail || `Request failed: ${response.status}`);
    }

    const result = await response.json();
    return result.data as T;
  }

  async getPersonalizedOutfitRecommendations(
    userProfile: UserProfile,
    occasion: string,
    budget: number,
    preferences?: string[]
  ): Promise<{ recommendations: OutfitRecommendation[] }> {
    return this.request('/ai/stylist', {
      user_profile: userProfile,
      occasion,
      budget,
      preferences,
    });
  }

  async predictSizeAndFit(request: SizeFitRequest): Promise<SizeFitResult> {
    return this.request('/ai/size-fit', request);
  }

  async getTrendForecast(request: TrendForecastRequest): Promise<TrendForecastResult> {
    return this.request('/ai/trend-forecast', request);
  }

  async getDesignCopilotConcepts(request: DesignCopilotRequest): Promise<DesignCopilotResult> {
    return this.request('/ai/design-copilot', request);
  }

  async getDynamicPricingRecommendation(request: DynamicPricingRequest): Promise<DynamicPricingResult> {
    return this.request('/ai/dynamic-pricing', request);
  }

  async getDiscoveryFeed(request: DiscoveryFeedRequest): Promise<DiscoveryFeedResult> {
    return this.request('/ai/discovery-feed', request);
  }

  async getProductContentBundle(request: ProductContentRequest): Promise<ProductContentResult> {
    return this.request('/ai/product-content', request);
  }

  async getSupportAssistantResponse(request: SupportAssistantRequest): Promise<SupportAssistantResult> {
    return this.request('/ai/support-assistant', request);
  }

  async getVisualSearchMatches(request: VisualSearchRequest): Promise<VisualSearchResult> {
    return this.request('/ai/visual-search', request);
  }

  async getInventoryReplenishmentPlan(
    request: InventoryReplenishmentRequest
  ): Promise<InventoryReplenishmentResult> {
    return this.request('/ai/inventory-replenishment', request);
  }
}

export const aiFashionService = new AIFashionService();
