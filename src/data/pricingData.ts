/**
 * Pricing data structure for all VoiceScribe services
 */

export type ServiceType = 'transcription' | 'subtitle' | 'voiceover' | 'realtime' | 'video';

export type BillingPeriod = 'monthly' | 'yearly';

export interface PricingTier {
  id: string;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  credits?: number; // For Pay As You Go
  minutes?: number; // Minutes per month
  features: string[];
  popular?: boolean;
  ctaText: string;
}

export interface ServicePricing {
  service: ServiceType;
  accentColor: string;
  tiers: PricingTier[];
}

export const pricingData: Record<ServiceType, ServicePricing> = {
  transcription: {
    service: 'transcription',
    accentColor: '#00c6ff',
    tiers: [
      {
        id: 'pay-as-you-go',
        name: 'Pay As You Go',
        monthlyPrice: 12,
        yearlyPrice: 12,
        credits: 60,
        features: [
          'Transcription in 125+ languages',
          '60 mins',
        ],
        ctaText: 'Pay As You Go',
      },
      {
        id: 'lite',
        name: 'Lite',
        monthlyPrice: 29,
        yearlyPrice: 23,
        minutes: 180,
        features: [
          'Transcription in 125+ languages',
          '180 mins/mo',
        ],
        ctaText: 'Subscribe Now',
      },
      {
        id: 'basic',
        name: 'Basic',
        monthlyPrice: 49,
        yearlyPrice: 39,
        minutes: 360,
        features: [
          'Transcription in 125+ languages',
          '360 mins/mo',
          'AI summary',
          'Custom dictionary',
          'File sharing',
        ],
        ctaText: 'Subscribe Now',
      },
      {
        id: 'premium',
        name: 'Premium',
        monthlyPrice: 99,
        yearlyPrice: 79,
        minutes: 900,
        popular: true,
        features: [
          'Transcription in 125+ languages',
          '900 mins/mo',
          'Everything in Basic, plus:',
          'Teams & centralized billing',
          '1 additional team member',
          'API access',
          'Priority support',
        ],
        ctaText: 'Subscribe Now',
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        monthlyPrice: 0,
        yearlyPrice: 0,
        features: [
          'Custom Pricing',
          'Custom Development',
          'Live Event Captioning',
          'Custom MSA',
          'SCORM Import/Export',
          'and more...',
        ],
        ctaText: 'Contact Us!',
      },
    ],
  },
  subtitle: {
    service: 'subtitle',
    accentColor: '#10b981',
    tiers: [
      {
        id: 'pay-as-you-go',
        name: 'Pay As You Go',
        monthlyPrice: 12,
        yearlyPrice: 12,
        credits: 60,
        features: [
          'Subtitles: 60 mins',
          'OR',
          'Subtitles into another language: 30 mins',
        ],
        ctaText: 'Pay As You Go',
      },
      {
        id: 'basic',
        name: 'Basic',
        monthlyPrice: 49,
        yearlyPrice: 39,
        minutes: 360,
        features: [
          'Subtitles: 360 mins/mo',
          'OR',
          'Subtitles into another language: 180 mins/mo',
          'AI summary',
          'Custom dictionary',
          'Subtitle import',
        ],
        ctaText: 'Subscribe Now',
      },
      {
        id: 'premium',
        name: 'Premium',
        monthlyPrice: 99,
        yearlyPrice: 79,
        minutes: 900,
        popular: true,
        features: [
          'Subtitles: 900 mins/mo',
          'OR',
          'Subtitles into another language: 450 mins/mo',
          'Everything in Basic, plus:',
          'Teams & centralized billing',
          '1 additional team member',
          'AI rewriting',
          'API access',
          'OpenAI translation with prompts',
          'Priority support',
        ],
        ctaText: 'Subscribe Now',
      },
      {
        id: 'business',
        name: 'Business',
        monthlyPrice: 199,
        yearlyPrice: 159,
        minutes: 1800,
        features: [
          'Subtitles: 1800 mins/mo',
          'OR',
          'Subtitles into another language: 900 mins/mo',
          'Everything in Premium, plus:',
          '2 additional team members',
          'DeepL translation',
          'Translation glossary',
          'Embed player',
        ],
        ctaText: 'Subscribe Now',
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        monthlyPrice: 0,
        yearlyPrice: 0,
        features: [
          'Custom Pricing',
          'Custom Development',
          'Live Event Captioning',
          'Custom MSA',
          'SCORM Import/Export',
          'and more...',
        ],
        ctaText: 'Contact Us!',
      },
    ],
  },
  voiceover: {
    service: 'voiceover',
    accentColor: '#f59e0b',
    tiers: [
      {
        id: 'basic',
        name: 'Basic',
        monthlyPrice: 49,
        yearlyPrice: 39,
        minutes: 120,
        features: [
          'Voiceover into another language: 120 mins/mo',
          'AI summary',
          'Custom dictionary',
          'Subtitle import',
        ],
        ctaText: 'Subscribe Now',
      },
      {
        id: 'premium',
        name: 'Premium',
        monthlyPrice: 99,
        yearlyPrice: 79,
        minutes: 300,
        popular: true,
        features: [
          'Voiceover into another language: 300 mins/mo',
          'OR',
          'Pro voices & voice cloning: 100 mins/mo',
          'Everything in Basic, plus:',
          'Teams & centralized billing',
          '1 additional team member',
          'AI rewriting',
          'API access',
          'OpenAI translation with prompts',
          'Priority support',
        ],
        ctaText: 'Subscribe Now',
      },
      {
        id: 'business',
        name: 'Business',
        monthlyPrice: 199,
        yearlyPrice: 159,
        minutes: 600,
        features: [
          'Voiceover into another language: 600 mins/mo',
          'OR',
          'Pro voices & voice cloning: 200 mins/mo',
          'Everything in Premium, plus:',
          '2 additional team members',
          'Unlock lip-sync ($2/min)',
          'DeepL translation',
          'Translation glossary',
        ],
        ctaText: 'Subscribe Now',
      },
      {
        id: 'business-plus',
        name: 'Business Plus',
        monthlyPrice: 449,
        yearlyPrice: 359,
        minutes: 1500,
        features: [
          'Voiceover into another language: 1500 mins/mo',
          'OR',
          'Pro voices & voice cloning: 500 mins/mo',
          'Everything in Business, plus:',
          '4 additional team members',
        ],
        ctaText: 'Subscribe Now',
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        monthlyPrice: 0,
        yearlyPrice: 0,
        features: [
          'Custom Pricing',
          'Custom Development',
          'Live Event Captioning',
          'Custom MSA',
          'SCORM Import/Export',
          'and more...',
        ],
        ctaText: 'Contact Us!',
      },
    ],
  },
  realtime: {
    service: 'realtime',
    accentColor: '#9b5de5',
    tiers: [
      {
        id: 'basic',
        name: 'Basic',
        monthlyPrice: 49,
        yearlyPrice: 39,
        minutes: 360,
        features: [
          'Real-time captions: 360 mins/mo',
          'VMix, OBS, WebHooks, Zoom integration',
          'Google Chrome extension',
          'AI summary',
          'Custom styling',
          'No duration/recording limit',
          'Save and export transcript',
        ],
        ctaText: 'Subscribe Now',
      },
      {
        id: 'premium',
        name: 'Premium',
        monthlyPrice: 99,
        yearlyPrice: 79,
        minutes: 900,
        popular: true,
        features: [
          'Real-time captions: 900 mins/mo',
          'OR Real-time translation (per language): 180 mins/mo',
          'Everything in Basic, plus:',
          'Teams & centralized billing',
          '1 additional team member',
          'Real-time translation (per language)',
          'OpenAI translation with prompts',
          'Priority support',
        ],
        ctaText: 'Subscribe Now',
      },
      {
        id: 'business',
        name: 'Business',
        monthlyPrice: 199,
        yearlyPrice: 159,
        minutes: 1800,
        features: [
          'Real-time captions: 1800 mins/mo',
          'OR Real-time translation (per language): 360 mins/mo',
          'OR Real-time dubbing: 180 mins/mo',
          'Everything in Premium, plus:',
          '2 additional team members',
          'Session sharing',
          'DeepL translation',
          'Translation glossary',
        ],
        ctaText: 'Subscribe Now',
      },
      {
        id: 'business-plus',
        name: 'Business Plus',
        monthlyPrice: 449,
        yearlyPrice: 359,
        minutes: 4500,
        features: [
          'Real-time captions: 4500 mins/mo',
          'OR Real-time translation (per language): 900 mins/mo',
          'OR Real-time dubbing: 450 mins/mo',
          'Everything in Business, plus:',
          '4 additional team members',
        ],
        ctaText: 'Subscribe Now',
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        monthlyPrice: 0,
        yearlyPrice: 0,
        features: [
          'Live Event Captioning',
          'Live Support for Events',
          'Custom Pricing',
          'Custom Development',
          'API access',
          'Custom MSA',
          'and more...',
        ],
        ctaText: 'Book a Demo',
      },
    ],
  },
  video: {
    service: 'video',
    accentColor: '#ec4899',
    tiers: [
      {
        id: 'pay-as-you-go',
        name: 'Pay As You Go',
        monthlyPrice: 25,
        yearlyPrice: 25,
        credits: 10,
        features: [
          'Video generation: 10 videos',
          'Up to 8 seconds per video',
          '1080p resolution',
          'Reference images support',
        ],
        ctaText: 'Pay As You Go',
      },
      {
        id: 'basic',
        name: 'Basic',
        monthlyPrice: 79,
        yearlyPrice: 63,
        minutes: 20,
        features: [
          'Video generation: 20 videos/mo',
          'Up to 8 seconds per video',
          '1080p resolution',
          'Reference images support',
          'Audio generation',
        ],
        ctaText: 'Subscribe Now',
      },
      {
        id: 'premium',
        name: 'Premium',
        monthlyPrice: 149,
        yearlyPrice: 119,
        minutes: 50,
        popular: true,
        features: [
          'Video generation: 50 videos/mo',
          'Up to 8 seconds per video',
          '1080p & 4K resolution',
          'Reference images support',
          'Audio generation',
          'API access',
          'Priority processing',
          'Priority support',
        ],
        ctaText: 'Subscribe Now',
      },
      {
        id: 'business',
        name: 'Business',
        monthlyPrice: 299,
        yearlyPrice: 239,
        minutes: 120,
        features: [
          'Video generation: 120 videos/mo',
          'Up to 8 seconds per video',
          '1080p & 4K resolution',
          'Reference images support',
          'Audio generation',
          'Everything in Premium, plus:',
          'Teams & centralized billing',
          '2 additional team members',
          'Custom model training',
        ],
        ctaText: 'Subscribe Now',
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        monthlyPrice: 0,
        yearlyPrice: 0,
        features: [
          'Custom Pricing',
          'Custom Development',
          'Unlimited videos',
          'Custom resolutions',
          'Dedicated support',
          'Custom MSA',
          'and more...',
        ],
        ctaText: 'Contact Us!',
      },
    ],
  },
};

export function getSavings(monthlyPrice: number, yearlyPrice: number): number {
  if (yearlyPrice === 0 || monthlyPrice === 0) return 0;
  const yearlyEquivalent = monthlyPrice * 12;
  return Math.round(((yearlyEquivalent - yearlyPrice * 12) / yearlyEquivalent) * 100);
}

export function calculateYearlySavings(monthlyPrice: number, yearlyPrice: number): number {
  if (yearlyPrice === 0 || monthlyPrice === 0) return 0;
  return (monthlyPrice * 12) - (yearlyPrice * 12);
}

