import { useState } from 'react';
import { useRequireAuth } from '../../../hooks/useRequireAuth';
import { getAccessToken } from '../../../lib/api';
import axios from 'axios';
import type { OnboardingData, PromotionType, Platform, AdStyle } from '../../../types/videoAds';

// Use environment variable for API URL, defaulting to port 5000
// This ensures the backend URL can be configured via environment variables
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

import './Steps.css';

interface OnboardingStepProps {
  data: OnboardingData;
  onUpdate: (data: Partial<OnboardingData>) => void;
  onNext: () => void;
}

export default function OnboardingStep({ data, onUpdate, onNext }: OnboardingStepProps) {
  const { requireAuth } = useRequireAuth();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [imagePreviews, setImagePreviews] = useState<Array<{ url: string; file?: File }>>(data.referenceImages || []);
  const [isGenerating, setIsGenerating] = useState(false);
  const [processingTime, setProcessingTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);

  const promotionTypeOptions = [
    { value: 'product', label: 'Product', icon: '📦' },
    { value: 'service', label: 'Service', icon: '🔧' },
    { value: 'app', label: 'App', icon: '📱' },
    { value: 'event', label: 'Event', icon: '🎉' },
    { value: 'brand', label: 'Brand', icon: '🏷️' },
    { value: 'course', label: 'Course / Education', icon: '📚' },
    { value: 'podcast', label: 'Podcast', icon: '🎙️' },
    { value: 'book', label: 'Book', icon: '📖' },
    { value: 'restaurant', label: 'Restaurant / Food', icon: '🍽️' },
    { value: 'real-estate', label: 'Real Estate', icon: '🏠' },
    { value: 'fitness', label: 'Fitness / Health', icon: '💪' },
    { value: 'beauty', label: 'Beauty / Cosmetics', icon: '💄' },
    { value: 'fashion', label: 'Fashion / Clothing', icon: '👗' },
    { value: 'technology', label: 'Technology', icon: '💻' },
    { value: 'other', label: 'Other', icon: '✨' },
  ];

  const platformOptions = [
    { value: 'facebook', label: 'Facebook / Instagram', icon: '📘' },
    { value: 'tiktok', label: 'TikTok', icon: '🎵' },
    { value: 'youtube', label: 'YouTube', icon: '📺' },
    { value: 'tv', label: 'TV / Other', icon: '📡' },
  ];

  const getPlatformSizes = (platform: Platform): Array<{ value: string; label: string }> => {
    switch (platform) {
      case 'facebook':
      case 'instagram':
        return [
          { value: '16:9', label: '16:9 Aspect Ratio' },
          { value: '4:3', label: '4:3 Aspect Ratio' },
          { value: '1080x1080', label: 'Square (1080x1080)' },
          { value: '1080x1350', label: 'Portrait (1080x1350)' },
          { value: '1080x566', label: 'Landscape (1080x566)' },
          { value: '1080x1920', label: 'Stories/Reels (1080x1920)' },
          { value: 'custom', label: 'Custom' },
        ];
      case 'tiktok':
        return [
          { value: '16:9', label: '16:9 Aspect Ratio' },
          { value: '4:3', label: '4:3 Aspect Ratio' },
          { value: '1080x1920', label: 'Vertical (1080x1920)' },
          { value: '1080x1080', label: 'Square (1080x1080)' },
          { value: '1920x1080', label: 'Horizontal (1920x1080)' },
          { value: 'custom', label: 'Custom' },
        ];
      case 'youtube':
        return [
          { value: '16:9', label: '16:9 Aspect Ratio' },
          { value: '4:3', label: '4:3 Aspect Ratio' },
          { value: '1920x1080', label: '16:9 (1920x1080)' },
          { value: '1280x720', label: 'HD (1280x720)' },
          { value: '2560x1440', label: '2K (2560x1440)' },
          { value: '3840x2160', label: '4K (3840x2160)' },
          { value: 'custom', label: 'Custom' },
        ];
      case 'tv':
        return [
          { value: '16:9', label: '16:9 Aspect Ratio' },
          { value: '4:3', label: '4:3 Aspect Ratio' },
          { value: '1920x1080', label: 'Full HD (1920x1080)' },
          { value: '3840x2160', label: '4K UHD (3840x2160)' },
          { value: 'custom', label: 'Custom' },
        ];
      default:
        return [
          { value: '16:9', label: '16:9 Aspect Ratio' },
          { value: '4:3', label: '4:3 Aspect Ratio' },
          { value: '1920x1080', label: 'Standard (1920x1080)' },
          { value: 'custom', label: 'Custom' },
        ];
    }
  };

  const questions = [
    {
      id: 'promotionType',
      title: 'What are you promoting?',
      type: 'promotionType',
    },
    {
      id: 'platform',
      title: 'Target platform?',
      type: 'platform',
    },
    {
      id: 'language',
      title: 'Language(s)?',
      type: 'text',
      placeholder: 'e.g., English, Spanish',
    },
    {
      id: 'targetAudience',
      title: 'Target audience?',
      type: 'audience',
    },
    {
      id: 'referenceImage',
      title: 'Reference Image (Optional)',
      type: 'referenceImage',
    },
    {
      id: 'videoInstructions',
      title: 'Additional Video Generation Instructions (Optional)',
      type: 'videoInstructions',
    },
  ];

  const handleOptionSelect = (questionId: string, value: any) => {
    if (questionId === 'promotionType') {
      const updates: Partial<OnboardingData> = { promotionType: value as PromotionType };
      if (value !== 'other') {
        updates.customPromotionType = undefined;
      }
      onUpdate(updates);
    } else if (questionId === 'platform') {
      onUpdate({ platform: value as Platform });
    }
    
    if (currentQuestion < questions.length - 1) {
      setTimeout(() => setCurrentQuestion(currentQuestion + 1), 300);
    } else {
      setTimeout(onNext, 300);
    }
  };

  const handlePromotionTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as PromotionType;
    const updates: Partial<OnboardingData> = { promotionType: value };
    if (value !== 'other') {
      updates.customPromotionType = '';
    }
    onUpdate(updates);
  };

  const handlePromotionTypeCardClick = (value: PromotionType) => {
    const updates: Partial<OnboardingData> = { promotionType: value };
    if (value !== 'other') {
      updates.customPromotionType = '';
    }
    onUpdate(updates);
    
    // Automatically advance to next question after a short delay
    if (currentQuestion < questions.length - 1) {
      setTimeout(() => setCurrentQuestion(currentQuestion + 1), 300);
    } else {
      setTimeout(onNext, 300);
    }
  };

  const handleCustomPromotionTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.trim()) {
      // If user types something, set to 'other' and store custom value
      onUpdate({ 
        promotionType: 'other',
        customPromotionType: value 
      });
    } else {
      // If input is cleared, clear custom value but keep 'other' selected
      onUpdate({ customPromotionType: '' });
    }
  };

  const handleFreeFormInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.trim()) {
      // If user types something in free-form input, set to 'other' and store custom value
      onUpdate({ 
        promotionType: 'other',
        customPromotionType: value 
      });
    } else {
      // If input is cleared, clear custom value
      onUpdate({ customPromotionType: '' });
    }
  };

  const handlePromotionTypeContinue = () => {
    // Allow proceeding if a predefined option is selected OR if custom input has a value
    const hasValidSelection = data.promotionType && 
      (data.promotionType !== 'other' || data.customPromotionType?.trim());
    
    if (!hasValidSelection) {
      return; // Don't proceed if no valid selection
    }
    if (currentQuestion < questions.length - 1) {
      setTimeout(() => setCurrentQuestion(currentQuestion + 1), 300);
    } else {
      setTimeout(onNext, 300);
    }
  };


  const handlePlatformChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as Platform;
    onUpdate({ 
      platform: value,
      platformSize: undefined, // Reset size when platform changes
    });
  };

  const handlePlatformCardClick = (value: Platform) => {
    onUpdate({ 
      platform: value,
      platformSize: undefined, // Reset size when platform changes
    });
  };

  const handlePlatformSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onUpdate({ platformSize: e.target.value });
  };

  const handlePlatformDetailsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ platformDetails: e.target.value });
  };

  const handlePlatformContinue = () => {
    if (!data.platform) {
      return;
    }
    if (currentQuestion < questions.length - 1) {
      setTimeout(() => setCurrentQuestion(currentQuestion + 1), 300);
    } else {
      setTimeout(onNext, 300);
    }
  };


  const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
    { value: 'it', label: 'Italian' },
    { value: 'pt', label: 'Portuguese' },
    { value: 'ru', label: 'Russian' },
    { value: 'ja', label: 'Japanese' },
    { value: 'ko', label: 'Korean' },
    { value: 'zh', label: 'Chinese' },
    { value: 'ar', label: 'Arabic' },
    { value: 'hi', label: 'Hindi' },
    { value: 'nl', label: 'Dutch' },
    { value: 'pl', label: 'Polish' },
    { value: 'tr', label: 'Turkish' },
    { value: 'vi', label: 'Vietnamese' },
    { value: 'th', label: 'Thai' },
    { value: 'id', label: 'Indonesian' },
    { value: 'sv', label: 'Swedish' },
    { value: 'da', label: 'Danish' },
    { value: 'no', label: 'Norwegian' },
    { value: 'fi', label: 'Finnish' },
    { value: 'cs', label: 'Czech' },
    { value: 'hu', label: 'Hungarian' },
    { value: 'ro', label: 'Romanian' },
    { value: 'el', label: 'Greek' },
    { value: 'he', label: 'Hebrew' },
    { value: 'uk', label: 'Ukrainian' },
  ];

  const handleLanguageSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedLanguage = e.target.value;
    if (selectedLanguage && !data.languages.includes(selectedLanguage)) {
      onUpdate({ languages: [...data.languages, selectedLanguage] });
      e.target.value = ''; // Reset dropdown
    }
  };

  const handleLanguageRemove = (languageToRemove: string) => {
    onUpdate({ languages: data.languages.filter(lang => lang !== languageToRemove) });
  };


  const handleAudienceSubmit = () => {
    if (currentQuestion < questions.length - 1) {
      setTimeout(() => setCurrentQuestion(currentQuestion + 1), 300);
    } else {
      setTimeout(onNext, 300);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      const validFiles: File[] = [];
      
      // Validate all files first
      fileArray.forEach((file) => {
        if (!file.type.startsWith('image/')) {
          alert(`${file.name} is not an image file`);
          return;
        }
        
        if (file.size > 10 * 1024 * 1024) {
          alert(`${file.name} size should be less than 10MB`);
          return;
        }
        
        validFiles.push(file);
      });

      if (validFiles.length === 0) {
        e.target.value = '';
        return;
      }

      // Process all valid files
      const promises = validFiles.map((file) => {
        return new Promise<{ url: string; file: File }>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64String = reader.result as string;
            resolve({ url: base64String, file });
          };
          reader.readAsDataURL(file);
        });
      });

      Promise.all(promises).then((newImages) => {
        const updatedImages = [...imagePreviews, ...newImages];
        setImagePreviews(updatedImages);
        onUpdate({ 
          referenceImages: updatedImages,
        });
      });
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const handleImageRemove = (index: number) => {
    const updatedImages = imagePreviews.filter((_, i) => i !== index);
    setImagePreviews(updatedImages);
    onUpdate({ 
      referenceImages: updatedImages.length > 0 ? updatedImages : undefined,
    });
  };

  const handleReferenceImageContinue = () => {
    if (currentQuestion < questions.length - 1) {
      setTimeout(() => setCurrentQuestion(currentQuestion + 1), 300);
    } else {
      setTimeout(onNext, 300);
    }
  };

  const handleReferenceImageBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const adStyleOptions = [
    { value: 'cartoon', label: 'Cartoon Style', icon: '🎨' },
    { value: 'happy', label: 'Happy Mood', icon: '😊' },
    { value: 'sad', label: 'Sad Mood', icon: '😢' },
    { value: 'professional', label: 'Professional', icon: '💼' },
    { value: 'cinematic', label: 'Cinematic', icon: '🎬' },
    { value: 'playful', label: 'Playful', icon: '🎮' },
    { value: 'dramatic', label: 'Dramatic', icon: '🎭' },
    { value: 'minimalist', label: 'Minimalist', icon: '⚪' },
    { value: 'vibrant', label: 'Vibrant', icon: '🌈' },
    { value: 'elegant', label: 'Elegant', icon: '✨' },
    { value: 'energetic', label: 'Energetic', icon: '⚡' },
    { value: 'calm', label: 'Calm', icon: '🌊' },
    { value: 'funny', label: 'Funny', icon: '😂' },
    { value: 'serious', label: 'Serious', icon: '🎯' },
    { value: 'inspiring', label: 'Inspiring', icon: '🌟' },
  ];

  const handleAdStyleToggle = (style: AdStyle) => {
    const currentStyles = data.adStyle || [];
    if (currentStyles.includes(style)) {
      onUpdate({ adStyle: currentStyles.filter(s => s !== style) });
    } else {
      onUpdate({ adStyle: [...currentStyles, style] });
    }
  };

  const handleVideoInstructionsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdate({ videoGenerationInstructions: e.target.value });
  };

  const handleVideoInstructionsContinue = () => {
    if (currentQuestion < questions.length - 1) {
      setTimeout(() => setCurrentQuestion(currentQuestion + 1), 300);
    } else {
      // This is the last step, show generate button instead
      // Don't auto-advance
    }
  };

  const handleGenerateAd = async () => {
    // Check authentication before generating
    if (!requireAuth()) {
      return;
    }
    
    setIsGenerating(true);
    setProcessingTime(0);
    setError(null);
    setJobId(null);
    
    // Start processing timer
    const timer = setInterval(() => {
      setProcessingTime((prev) => prev + 1);
    }, 1000);

    try {
      // Build comprehensive prompt from onboarding data
      const prompt = buildAdGenerationPrompt(data);
      
      // Show alert after a short delay
      setTimeout(() => {
        alert('Stay tuned! Ad is generating...');
      }, 500);

      // Build user message with all onboarding data
      const userMessageContent = `${prompt}\n\n**Raw Data (JSON):**\n\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\``;

      // Build context object with all onboarding data
      const context = {
        onboardingData: data,
        promotionType: data.promotionType,
        customPromotionType: data.customPromotionType,
        platform: data.platform,
        platformSize: data.platformSize,
        platformDetails: data.platformDetails,
        languages: data.languages,
        targetAudience: data.targetAudience,
        adStyle: data.adStyle,
        videoGenerationInstructions: data.videoGenerationInstructions,
        referenceImagesCount: data.referenceImages?.length || 0,
        productName: data.productName,
        productDescription: data.productDescription,
        differentiator: data.differentiator,
      };

      // Build message content - this will be validated for non-empty
      const messageContent = `You are an expert video ad generation assistant. Generate creative, engaging video ad concepts based on user requirements.\n\n${userMessageContent}`;
      
      // Validate message is non-empty - throw error if empty to prevent 400 BAD REQUEST
      // Backend requires a non-empty message field, so we validate before sending
      if (!messageContent || messageContent.trim().length === 0) {
        const errorMsg = 'Message cannot be empty. Please provide valid input.';
        setError(errorMsg);
        setIsGenerating(false);
        clearInterval(timer);
        throw new Error(errorMsg);
      }

      // Get authorization token
      const token = getAccessToken();
      
      // Build request body with all required fields
      // Always include message, context, and model to ensure valid JSON structure
      // Using defaults prevents undefined/null values that cause 400 errors
      const requestBody = {
        message: messageContent.trim(), // Non-empty, validated above
        context: context || {}, // Default to empty object if not provided - prevents undefined/null
        model: undefined, // Will be omitted if undefined, backend uses default
      };

      // Remove undefined fields to ensure clean JSON serialization
      // This prevents sending "model": null or "model": undefined which can cause parsing errors
      const cleanRequestBody: {
        message: string;
        context: Record<string, any>;
        model?: string;
      } = {
        message: requestBody.message,
        context: requestBody.context,
      };
      
      // Only include model if it has a value (not undefined/null)
      // Backend will use its default model if not provided
      
      console.log('Sending GPT-5 request:', {
        message: cleanRequestBody.message.substring(0, 200) + '...',
        context: cleanRequestBody.context,
        hasToken: !!token,
      });

      // Build headers - always set Content-Type to application/json
      // This ensures Axios serializes the body as JSON and backend parses it correctly
      // Without explicit Content-Type, backend may not recognize the request as JSON, causing 400 errors
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Only include Authorization header if token is provided
      // Sending empty Bearer token can cause authentication errors
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Make Axios POST request with proper JSON handling
      // Why these changes prevent 400 errors:
      // 1. Non-empty message validation prevents backend rejection of empty messages
      // 2. Default context (empty object) prevents undefined/null which backend can't parse
      // 3. Explicit Content-Type ensures backend knows to parse as JSON
      // 4. Clean request body (no undefined fields) ensures valid JSON serialization
      // 5. Proper Authorization header format prevents malformed auth errors
      // 6. Using environment variable ensures correct backend URL configuration
      const response = await axios.post(
        `${API_URL}/api/gpt5/chat`,
        cleanRequestBody,
        {
          headers,
        }
      );

      // Backend returns { success, response, model } format
      if (response.data && response.data.success) {
        const responseText = response.data.response || 'Ad concept generated successfully';
        const modelUsed = response.data.model || 'unknown';
        
        clearInterval(timer);
        
        // Store the response for display
        console.log('GPT-5 Response:', responseText);
        console.log('Model used:', modelUsed);
        
        // Show success message with response preview
        const preview = responseText.substring(0, 200) + (responseText.length > 200 ? '...' : '');
        alert(`Ad generation completed!\n\nModel: ${modelUsed}\n\nResponse preview:\n${preview}`);
        
        // Proceed to next step after a short delay
        setTimeout(() => {
          setIsGenerating(false);
          onNext();
        }, 1000);
      } else {
        throw new Error(response.data?.error || response.data?.message || 'Failed to generate ad');
      }
    } catch (err: any) {
      clearInterval(timer);
      setIsGenerating(false);
      const errorMessage = err.message || 'Failed to generate ad. Please try again.';
      setError(errorMessage);
      console.error('Ad generation error:', err);
      alert(`Error: ${errorMessage}`);
    }
  };

  // Helper function to build comprehensive prompt from onboarding data
  const buildAdGenerationPrompt = (data: OnboardingData): string => {
    const parts: string[] = [];

    // Promotion type
    const promotionType = data.customPromotionType || data.promotionType;
    parts.push(`**Promotion Type:** ${promotionType}`);

    // Platform and dimensions
    parts.push(`**Target Platform:** ${data.platform}`);
    if (data.platformSize) {
      parts.push(`**Platform Size/Dimensions:** ${data.platformSize}`);
    }
    if (data.platformDetails) {
      parts.push(`**Platform Details:** ${data.platformDetails}`);
    }

    // Languages
    if (data.languages && data.languages.length > 0) {
      parts.push(`**Target Languages:** ${data.languages.join(', ')}`);
    }

    // Target audience
    if (data.targetAudience) {
      const audienceParts: string[] = [];
      if (data.targetAudience.ageRange) {
        audienceParts.push(`Age: ${data.targetAudience.ageRange.min}-${data.targetAudience.ageRange.max}`);
      }
      if (data.targetAudience.location) {
        audienceParts.push(`Location: ${data.targetAudience.location}`);
      }
      if (data.targetAudience.gender) {
        audienceParts.push(`Gender: ${data.targetAudience.gender}`);
      }
      if (audienceParts.length > 0) {
        parts.push(`**Target Audience:** ${audienceParts.join(', ')}`);
      }
    }

    // Ad style/tone
    if (data.adStyle && data.adStyle.length > 0) {
      parts.push(`**Ad Style/Tone:** ${data.adStyle.join(', ')}`);
    }

    // Video generation instructions
    if (data.videoGenerationInstructions) {
      parts.push(`**Video Generation Instructions:**\n${data.videoGenerationInstructions}`);
    }

    // Reference images info
    if (data.referenceImages && data.referenceImages.length > 0) {
      parts.push(`**Reference Images:** ${data.referenceImages.length} image(s) provided for visual reference`);
    }

    // Product details if available
    if (data.productName) {
      parts.push(`**Product Name:** ${data.productName}`);
    }
    if (data.productDescription) {
      parts.push(`**Product Description:** ${data.productDescription}`);
    }
    if (data.differentiator) {
      parts.push(`**Key Differentiator:** ${data.differentiator}`);
    }

    const fullPrompt = `Generate a comprehensive video ad concept with the following requirements:\n\n${parts.join('\n\n')}\n\nPlease provide:\n1. A compelling ad script with hook, problem, solution, and call-to-action\n2. Visual descriptions for each scene\n3. Recommended camera angles and transitions\n4. Voiceover style recommendations\n5. Music and sound effect suggestions\n6. Platform-specific optimizations`;

    return fullPrompt;
  };

  const handleVideoInstructionsBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const currentQ = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;
  
  // Find the index of referenceImage question
  const referenceImageIndex = questions.findIndex(q => q.id === 'referenceImage');
  const showUploadedImages = referenceImageIndex !== -1 && currentQuestion > referenceImageIndex && data.referenceImages && data.referenceImages.length > 0;

  return (
    <div className="onboarding-step">
      <div className="question-container">
        <h2 className="question-title">{currentQ.title}</h2>

        {showUploadedImages && (
          <div className="uploaded-images-display">
            <label className="uploaded-images-label">Uploaded Reference Images:</label>
            <div className="uploaded-images-grid">
              {data.referenceImages!.map((image, index) => (
                <div key={index} className="uploaded-image-item">
                  <img src={image.url} alt={`Reference ${index + 1}`} className="uploaded-image-preview" />
                  <span className="uploaded-image-number">{index + 1}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentQ.type === 'promotionType' ? (
          <div className="promotion-type-container">
            <select
              className="promotion-type-select"
              value={data.promotionType || ''}
              onChange={handlePromotionTypeChange}
            >
              <option value="">Select an option...</option>
              {promotionTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="promotion-type-cards-grid">
              {promotionTypeOptions.map((option) => (
                <button
                  key={option.value}
                  className={`promotion-type-card ${
                    data.promotionType === option.value ? 'selected' : ''
                  }`}
                  onClick={() => handlePromotionTypeCardClick(option.value as PromotionType)}
                >
                  <span className="promotion-type-icon">{option.icon}</span>
                  <span className="promotion-type-label">{option.label}</span>
                </button>
              ))}
            </div>
            <div className="free-form-input-container">
              <label className="free-form-input-label">Or type your own:</label>
            <input
              type="text"
                className="text-input free-form-input"
                placeholder="Type what you're promoting..."
                value={data.customPromotionType || ''}
                onChange={handleFreeFormInputChange}
              onKeyPress={(e) => {
                  if (e.key === 'Enter' && data.customPromotionType?.trim()) {
                    handlePromotionTypeContinue();
                }
              }}
            />
            </div>
            {data.promotionType === 'other' && data.customPromotionType && (
              <div className="custom-promotion-display">
                <span className="custom-promotion-badge">
                  Custom: {data.customPromotionType}
                </span>
              </div>
            )}
            <div className="promotion-type-navigation">
              {currentQuestion > 0 && (
                <button
                  className="back-button"
                  onClick={() => setCurrentQuestion(currentQuestion - 1)}
                >
                  ← Back
                </button>
              )}
              <button
                className="next-button"
                onClick={handlePromotionTypeContinue}
                disabled={!data.promotionType || (data.promotionType === 'other' && !data.customPromotionType?.trim())}
                style={{
                  opacity: (!data.promotionType || (data.promotionType === 'other' && !data.customPromotionType?.trim())) ? 0.5 : 1,
                  cursor: (!data.promotionType || (data.promotionType === 'other' && !data.customPromotionType?.trim())) ? 'not-allowed' : 'pointer',
                }}
              >
                Next →
              </button>
            </div>
          </div>
        ) : currentQ.type === 'text' && currentQ.id === 'language' ? (
          <div className="language-container">
            <div className="language-select-container">
              <label className="language-select-label">Select Language(s)</label>
              <select
                className="language-select"
                onChange={handleLanguageSelect}
                defaultValue=""
              >
                <option value="">Choose a language...</option>
                {languageOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            {data.languages.length > 0 && (
              <div className="selected-languages">
                <label className="selected-languages-label">Selected Languages:</label>
                <div className="language-tags">
                  {data.languages.map((langCode) => {
                    const lang = languageOptions.find(opt => opt.value === langCode);
                    return (
                      <span key={langCode} className="language-tag">
                        {lang ? lang.label : langCode}
                        <button
                          type="button"
                          className="language-tag-remove"
                          onClick={() => handleLanguageRemove(langCode)}
                          aria-label={`Remove ${lang ? lang.label : langCode}`}
                        >
                          ×
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="language-navigation">
              {currentQuestion > 0 && (
                <button
                  className="back-button"
                  onClick={() => setCurrentQuestion(currentQuestion - 1)}
                >
                  ← Back
                </button>
              )}
            <button className="next-button" onClick={handleAudienceSubmit}>
                Next →
              </button>
            </div>
          </div>
        ) : currentQ.type === 'referenceImage' ? (
          <div className="reference-image-container">
            <div className="reference-image-upload">
              <label className="reference-image-label">Upload Reference Images (Optional)</label>
              <p className="reference-image-description">
                Upload one or more images to guide the video generation style, composition, or visual elements.
              </p>
              <div className="image-upload-area">
                <input
                  type="file"
                  id="reference-image-input"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="image-input"
                  style={{ display: 'none' }}
                  multiple
                />
                {imagePreviews.length > 0 ? (
                  <div className="images-preview-grid">
                    {imagePreviews.map((image, index) => (
                      <div key={index} className="image-preview-item">
                        <img src={image.url} alt={`Reference ${index + 1}`} className="image-preview" />
                        <button
                          type="button"
                          className="image-remove-button"
                          onClick={() => handleImageRemove(index)}
                          aria-label={`Remove image ${index + 1}`}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <label htmlFor="reference-image-input" className="image-add-more">
                      <div className="image-add-icon">+</div>
                      <span className="image-add-text">Add More</span>
                    </label>
                  </div>
                ) : (
                  <label htmlFor="reference-image-input" className="image-upload-label">
                    <div className="image-upload-icon">📷</div>
                    <div className="image-upload-text">
                      <span className="image-upload-main-text">Click to upload</span>
                      <span className="image-upload-sub-text">or drag and drop</span>
                      <span className="image-upload-hint">PNG, JPG, GIF up to 10MB each</span>
                    </div>
                  </label>
                )}
              </div>
            </div>
            <div className="reference-image-navigation">
              {currentQuestion > 0 && (
                <button
                  className="back-button"
                  onClick={handleReferenceImageBack}
                >
                  ← Back
                </button>
              )}
              <button
                className="next-button"
                onClick={handleReferenceImageContinue}
              >
                Next →
            </button>
            </div>
          </div>
        ) : currentQ.type === 'videoInstructions' ? (
          <div className="video-instructions-container">
            <div className="ad-style-section">
              <label className="ad-style-label">Ad Style / Tone / Theme</label>
              <p className="ad-style-description">
                Select the style, tone, or theme for your ad. You can select multiple options.
              </p>
              <div className="ad-style-grid">
                {adStyleOptions.map((option) => {
                  const isSelected = data.adStyle?.includes(option.value as AdStyle) || false;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      className={`ad-style-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleAdStyleToggle(option.value as AdStyle)}
                    >
                      <span className="ad-style-icon">{option.icon}</span>
                      <span className="ad-style-name">{option.label}</span>
                    </button>
                  );
                })}
              </div>
              {data.adStyle && data.adStyle.length > 0 && (
                <div className="selected-ad-styles">
                  <span className="selected-ad-styles-label">Selected: </span>
                  <div className="selected-ad-styles-tags">
                    {data.adStyle.map((style) => {
                      const option = adStyleOptions.find(opt => opt.value === style);
                      return (
                        <span key={style} className="selected-ad-style-tag">
                          {option?.icon} {option?.label}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            <div className="video-instructions-input">
              <label className="video-instructions-label">Additional Instructions (Optional)</label>
              <p className="video-instructions-description">
                Clearly describe how the ad should be generated. Include details about logo placement, camera angles, visual composition, transitions, and any specific requirements or preferences for the video.
              </p>
              <textarea
                className="video-instructions-textarea"
                placeholder="Example: Include the company logo in the top-right corner throughout the video. Use close-up shots of the product from a 45-degree angle. Add smooth transitions between scenes. Include wide-angle establishing shots. Place the logo prominently in the final frame..."
                value={data.videoGenerationInstructions || ''}
                onChange={handleVideoInstructionsChange}
                rows={8}
              />
              <div className="video-instructions-char-count">
                {(data.videoGenerationInstructions || '').length} characters
              </div>
            </div>
            <div className="video-instructions-navigation">
              {currentQuestion > 0 && (
                <button
                  className="back-button"
                  onClick={handleVideoInstructionsBack}
                  disabled={isGenerating}
                >
                  ← Back
                </button>
              )}
              {currentQuestion === questions.length - 1 ? (
                <div className="generate-ad-section">
                  {error && (
                    <div className="error-message" style={{ 
                      color: '#f44336', 
                      marginBottom: '1rem', 
                      padding: '0.75rem', 
                      backgroundColor: 'rgba(244, 67, 54, 0.1)', 
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem'
                    }}>
                      {error}
                    </div>
                  )}
                  {jobId && (
                    <div className="job-id-message" style={{ 
                      color: '#00c6ff', 
                      marginBottom: '1rem', 
                      padding: '0.75rem', 
                      backgroundColor: 'rgba(0, 198, 255, 0.1)', 
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem'
                    }}>
                      Job ID: {jobId}
                    </div>
                  )}
                  <button
                    className="generate-ad-button"
                    onClick={handleGenerateAd}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <span className="generating-spinner">⏳</span>
                        Generating Ad... ({processingTime}s)
                      </>
                    ) : (
                      'Generate Ad'
                    )}
                  </button>
                </div>
              ) : (
                <button
                  className="next-button"
                  onClick={handleVideoInstructionsContinue}
                >
                  Next →
                </button>
              )}
            </div>
            {isGenerating && (
              <div className="processing-alert">
                <div className="processing-alert-content">
                  <div className="processing-alert-icon">⏳</div>
                  <div className="processing-alert-text">
                    <div className="processing-alert-title">Stay tuned!</div>
                    <div className="processing-alert-message">Ad is generating...</div>
                    <div className="processing-alert-time">Processing time: {processingTime} seconds</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : currentQ.type === 'audience' ? (
          <div className="audience-input-container">
            <div className="input-group">
              <label>Age Range (optional)</label>
              <div className="age-range-inputs">
                <input
                  type="number"
                  placeholder="Min"
                  value={data.targetAudience.ageRange?.min || ''}
                  onChange={(e) =>
                    onUpdate({
                      targetAudience: {
                        ...data.targetAudience,
                        ageRange: {
                          min: parseInt(e.target.value) || undefined,
                          max: data.targetAudience.ageRange?.max,
                        },
                      },
                    })
                  }
                />
                <span>-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={data.targetAudience.ageRange?.max || ''}
                  onChange={(e) =>
                    onUpdate({
                      targetAudience: {
                        ...data.targetAudience,
                        ageRange: {
                          min: data.targetAudience.ageRange?.min,
                          max: parseInt(e.target.value) || undefined,
                        },
                      },
                    })
                  }
                />
              </div>
            </div>
            <div className="input-group">
              <label>Location (optional)</label>
              <input
                type="text"
                placeholder="e.g., United States"
                value={data.targetAudience.location || ''}
                onChange={(e) =>
                  onUpdate({
                    targetAudience: {
                      ...data.targetAudience,
                      location: e.target.value || undefined,
                    },
                  })
                }
              />
            </div>
            <div className="audience-navigation">
              {currentQuestion > 0 && (
                <button
                  className="back-button"
                  onClick={() => setCurrentQuestion(currentQuestion - 1)}
                >
                  ← Back
                </button>
              )}
            <button className="next-button" onClick={handleAudienceSubmit}>
                Next →
              </button>
            </div>
          </div>
        ) : currentQ.type === 'referenceImage' ? (
          <div className="reference-image-container">
            <div className="reference-image-upload">
              <label className="reference-image-label">Upload Reference Images (Optional)</label>
              <p className="reference-image-description">
                Upload one or more images to guide the video generation style, composition, or visual elements.
              </p>
              <div className="image-upload-area">
                <input
                  type="file"
                  id="reference-image-input"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="image-input"
                  style={{ display: 'none' }}
                  multiple
                />
                {imagePreviews.length > 0 ? (
                  <div className="images-preview-grid">
                    {imagePreviews.map((image, index) => (
                      <div key={index} className="image-preview-item">
                        <img src={image.url} alt={`Reference ${index + 1}`} className="image-preview" />
                        <button
                          type="button"
                          className="image-remove-button"
                          onClick={() => handleImageRemove(index)}
                          aria-label={`Remove image ${index + 1}`}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <label htmlFor="reference-image-input" className="image-add-more">
                      <div className="image-add-icon">+</div>
                      <span className="image-add-text">Add More</span>
                    </label>
                  </div>
                ) : (
                  <label htmlFor="reference-image-input" className="image-upload-label">
                    <div className="image-upload-icon">📷</div>
                    <div className="image-upload-text">
                      <span className="image-upload-main-text">Click to upload</span>
                      <span className="image-upload-sub-text">or drag and drop</span>
                      <span className="image-upload-hint">PNG, JPG, GIF up to 10MB each</span>
                    </div>
                  </label>
                )}
              </div>
            </div>
            <div className="reference-image-navigation">
              {currentQuestion > 0 && (
                <button
                  className="back-button"
                  onClick={handleReferenceImageBack}
                >
                  ← Back
                </button>
              )}
              <button
                className="next-button"
                onClick={handleReferenceImageContinue}
              >
                Next →
              </button>
            </div>
          </div>
        ) : currentQ.type === 'platform' ? (
          <div className="platform-container">
            <select
              className="platform-select"
              value={data.platform || ''}
              onChange={handlePlatformChange}
            >
              <option value="">Select a platform...</option>
              {platformOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="platform-cards-grid">
              {platformOptions.map((option) => (
                <button
                  key={option.value}
                  className={`platform-card ${
                    data.platform === option.value ? 'selected' : ''
                  }`}
                  onClick={() => handlePlatformCardClick(option.value as Platform)}
                >
                  <span className="platform-icon">{option.icon}</span>
                  <span className="platform-label">{option.label}</span>
                </button>
              ))}
            </div>
            {data.platform && (
              <>
                <div className="platform-size-container">
                  <label className="platform-size-label">Video Size / Dimensions</label>
                  <select
                    className="platform-size-select"
                    value={data.platformSize || ''}
                    onChange={handlePlatformSizeChange}
                  >
                    <option value="">Select size...</option>
                    {getPlatformSizes(data.platform).map((size) => (
                      <option key={size.value} value={size.value}>
                        {size.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="platform-details-container">
                  <label className="platform-details-label">Additional Details (Optional)</label>
                  <input
                    type="text"
                    className="text-input platform-details-input"
                    placeholder="Enter any specific requirements or details..."
                    value={data.platformDetails || ''}
                    onChange={handlePlatformDetailsChange}
                  />
                </div>
              </>
            )}
            <div className="platform-navigation">
              {currentQuestion > 0 && (
                <button
                  className="back-button"
                  onClick={() => setCurrentQuestion(currentQuestion - 1)}
                >
                  ← Back
                </button>
              )}
              <button
                className="next-button"
                onClick={handlePlatformContinue}
                disabled={!data.platform}
                style={{
                  opacity: !data.platform ? 0.5 : 1,
                  cursor: !data.platform ? 'not-allowed' : 'pointer',
                }}
              >
                Next →
            </button>
            </div>
          </div>
        ) : (
          <div className="options-grid">
            {currentQ.options?.map((option) => (
              <button
                key={option.value}
                className={`option-button ${
                  (currentQ.id === 'promotionType' && data.promotionType === option.value) ||
                  (currentQ.id === 'platform' && data.platform === option.value)
                  ? 'selected'
                  : ''
                }`}
                onClick={() => handleOptionSelect(currentQ.id, option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="pagination-dots">
        {questions.map((_, index) => (
          <button
            key={index}
            className={`pagination-dot ${index === currentQuestion ? 'active' : ''}`}
            onClick={() => setCurrentQuestion(index)}
            aria-label={`Go to question ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}















