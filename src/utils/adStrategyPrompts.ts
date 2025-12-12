/**
 * Prompt templates for ad strategy generation
 */

export function getStrategySystemPrompt(): string {
  return `You are an expert marketing strategist specializing in creating high-converting video ads. 
Your role is to analyze user input and create an optimal ad strategy that maximizes conversion rates.

Consider:
- Platform-specific best practices
- Target audience psychology
- Industry standards for ad length
- Emotional triggers that drive action
- Visual styles that resonate with the audience

Always respond with a valid JSON object matching the strategy format.`;
}

export function getStrategyUserPrompt(onboarding: {
  promotionType: string;
  platform: string;
  languages: string[];
  targetAudience: any;
  productName?: string;
  productDescription?: string;
  differentiator?: string;
}): string {
  const platformGuidance: Record<string, string> = {
    facebook: 'Facebook ads perform best with emotional hooks and social proof. Use 15s or 30s formats.',
    instagram: 'Instagram Reels work best with high-energy, visually striking content. Prefer 6s or 15s.',
    tiktok: 'TikTok requires fast-paced, attention-grabbing hooks. Use 6s or 15s with bold visuals.',
    youtube: 'YouTube allows longer formats. Use 15s or 30s with clear problem-solution structure.',
    tv: 'TV ads need strong branding and clear CTA. Use 15s or 30s formats.',
  };

  const toneGuidance: Record<string, string[]> = {
    product: ['emotional', 'trust-based', 'high-energy'],
    service: ['trust-based', 'professional', 'informative'],
    app: ['high-energy', 'playful', 'bold'],
    event: ['high-energy', 'emotional', 'bold'],
  };

  return `Create an ad strategy for:
- Promotion Type: ${onboarding.promotionType}
- Platform: ${onboarding.platform}
- Languages: ${onboarding.languages.join(', ')}
- Target Audience: ${JSON.stringify(onboarding.targetAudience)}
${onboarding.productName ? `- Product Name: ${onboarding.productName}` : ''}
${onboarding.productDescription ? `- Product Description: ${onboarding.productDescription}` : ''}
${onboarding.differentiator ? `- Key Differentiator: ${onboarding.differentiator}` : ''}

Platform Guidance: ${platformGuidance[onboarding.platform] || 'Use best practices for the platform.'}
Recommended Tones: ${toneGuidance[onboarding.promotionType]?.join(', ') || 'emotional, trust-based'}

Generate a strategy that includes:
1. Optimal ad length (6s, 15s, or 30s)
2. Best tone for this audience and platform
3. Visual style that will resonate
4. Strong call-to-action
5. Hook style that grabs attention

Respond ONLY with valid JSON in this exact format:
{
  "adLength": 15,
  "tone": "emotional",
  "visualStyle": "clean-modern",
  "cta": "Order Now",
  "hookStyle": "Problem-focused hook that creates urgency",
  "structure": "Hook → Problem → Solution → Proof → CTA",
  "platformOptimizations": {
    "aspectRatio": "9:16",
    "captionStyle": "bold",
    "hookDuration": 3
  }
}`;
}

export function parseStrategyResponse(response: string): {
  adLength: 6 | 15 | 30;
  tone: string;
  visualStyle: string;
  cta: string;
  hookStyle: string;
  structure: string;
  platformOptimizations: Record<string, any>;
} {
  try {
    // Try to extract JSON from markdown code blocks if present
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || response.match(/```\s*([\s\S]*?)\s*```/);
    const jsonStr = jsonMatch ? jsonMatch[1] : response;
    
    const parsed = JSON.parse(jsonStr.trim());
    
    return {
      adLength: parsed.adLength || 15,
      tone: parsed.tone || 'emotional',
      visualStyle: parsed.visualStyle || 'clean-modern',
      cta: parsed.cta || 'Get Started',
      hookStyle: parsed.hookStyle || 'Problem-focused hook',
      structure: parsed.structure || 'Hook → Problem → Solution → CTA',
      platformOptimizations: parsed.platformOptimizations || {},
    };
  } catch (error) {
    console.error('Failed to parse strategy response:', error);
    // Return default strategy
    return {
      adLength: 15,
      tone: 'emotional',
      visualStyle: 'clean-modern',
      cta: 'Get Started',
      hookStyle: 'Problem-focused hook',
      structure: 'Hook → Problem → Solution → CTA',
      platformOptimizations: {},
    };
  }
}



