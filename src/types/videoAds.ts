/**
 * Video Ads Generation Agent Types
 */

export type PromotionType = 'product' | 'service' | 'app' | 'event' | 'brand' | 'course' | 'podcast' | 'book' | 'restaurant' | 'real-estate' | 'fitness' | 'beauty' | 'fashion' | 'technology' | 'other';
export type Platform = 'facebook' | 'instagram' | 'tiktok' | 'youtube' | 'tv' | 'other';
export type AdLength = 6 | 15 | 30;
export type AdTone = 'emotional' | 'trust-based' | 'high-energy' | 'luxury' | 'informative' | 'bold';
export type VisualStyle = 'clean-modern' | 'bold-vibrant' | 'minimalist' | 'cinematic' | 'playful' | 'professional';
export type AdStyle = 'cartoon' | 'happy' | 'sad' | 'professional' | 'cinematic' | 'playful' | 'dramatic' | 'minimalist' | 'vibrant' | 'elegant' | 'energetic' | 'calm' | 'funny' | 'serious' | 'inspiring';

export interface TargetAudience {
  ageRange?: {
    min: number;
    max: number;
  };
  location?: string;
  gender?: 'male' | 'female' | 'all';
}

export interface OnboardingData {
  promotionType: PromotionType;
  customPromotionType?: string;
  platform: Platform;
  platformSize?: string;
  platformDetails?: string;
  languages: string[];
  targetAudience: TargetAudience;
  referenceImages?: Array<{ url: string; file?: File }>; // Array of base64 URLs and files
  adStyle?: AdStyle[]; // Selected ad styles/themes
  videoGenerationInstructions?: string; // Additional instructions for video generation
  productName?: string;
  productDescription?: string;
  differentiator?: string;
  hasProductPhotos?: boolean;
  hasBrandLogo?: boolean;
  hasExistingVideos?: boolean;
}

export interface AdStrategy {
  adLength: AdLength;
  tone: AdTone;
  visualStyle: VisualStyle;
  cta: string;
  hookStyle: string;
  structure: string;
  platformOptimizations: Record<string, any>;
}

export interface ScriptScene {
  id: string;
  startTime: number;
  endTime: number;
  duration: number;
  text: string;
  visualDescription: string;
  caption?: string;
  voiceStyle?: string;
}

export interface AdScript {
  scenes: ScriptScene[];
  totalDuration: number;
  hook: string;
  problem: string;
  solution: string;
  proof?: string;
  cta: string;
  fullText: string;
}

export interface AdConfiguration {
  onboarding: OnboardingData;
  strategy: AdStrategy;
  script: AdScript;
  voice?: string;
  musicStyle?: string;
  brandColors?: string[];
  logoUrl?: string;
}

export interface SceneGenerationJob {
  sceneId: string;
  imageJobId?: string;
  videoJobId?: string;
  status: 'pending' | 'generating-image' | 'generating-video' | 'completed' | 'error';
  imageUrl?: string;
  videoUrl?: string;
  error?: string;
}

export interface VoiceoverJob {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  audioUrl?: string;
  error?: string;
}

export interface AdGenerationPipeline {
  status: 'idle' | 'generating-images' | 'generating-videos' | 'generating-voiceover' | 'assembling' | 'completed' | 'error';
  progress: number;
  sceneJobs: SceneGenerationJob[];
  voiceoverJob?: VoiceoverJob;
  finalVideoUrl?: string;
  error?: string;
  message?: string;
}

export interface PaymentInfo {
  cost: number; // Energy points cost
  userBalance: number;
  canAfford: boolean;
}

export interface AdResult {
  id: string;
  videoUrl: string;
  script: AdScript;
  configuration: AdConfiguration;
  createdAt: string;
  subtitlesUrl?: string;
  thumbnailUrl?: string;
}



