/**
 * Prompt templates for ad script generation
 */

export function getScriptSystemPrompt(): string {
  return `You are an expert copywriter specializing in creating compelling video ad scripts that convert.
Your scripts must be:
- Concise and punchy
- Emotionally engaging
- Clear in structure
- Optimized for the specified duration
- Platform-appropriate

Break down the script into timed scenes with:
- Exact timing (start and end times)
- Visual descriptions for each scene
- Caption text (if needed)
- Voice style guidance

Always respond with valid JSON matching the script format.`;
}

export function getScriptUserPrompt(
  onboarding: any,
  strategy: {
    adLength: number;
    tone: string;
    visualStyle: string;
    cta: string;
    hookStyle: string;
    structure: string;
  }
): string {
  return `Create a ${strategy.adLength}-second video ad script with the following requirements:

STRATEGY:
- Tone: ${strategy.tone}
- Visual Style: ${strategy.visualStyle}
- CTA: ${strategy.cta}
- Hook Style: ${strategy.hookStyle}
- Structure: ${strategy.structure}

PRODUCT INFO:
- Type: ${onboarding.promotionType}
- Platform: ${onboarding.platform}
${onboarding.productName ? `- Name: ${onboarding.productName}` : ''}
${onboarding.productDescription ? `- Description: ${onboarding.productDescription}` : ''}
${onboarding.differentiator ? `- Key Differentiator: ${onboarding.differentiator}` : ''}

TARGET AUDIENCE:
${JSON.stringify(onboarding.targetAudience, null, 2)}

REQUIREMENTS:
1. Break script into ${strategy.adLength <= 6 ? '2-3' : strategy.adLength <= 15 ? '3-4' : '4-5'} scenes
2. Each scene must have:
   - Exact start and end times (in seconds)
   - Spoken text (concise, natural)
   - Visual description (what should appear on screen)
   - Caption text (for silent viewing)
3. Total duration must be exactly ${strategy.adLength} seconds
4. Hook must grab attention in first 3 seconds
5. Include clear CTA in final 3 seconds
${onboarding.hasProductPhotos ? '6. Reference product visuals in scenes' : ''}
${onboarding.hasBrandLogo ? '7. Include logo reveal in final scene' : ''}

Respond ONLY with valid JSON in this exact format:
{
  "scenes": [
    {
      "id": "scene-1",
      "startTime": 0,
      "endTime": 3,
      "duration": 3,
      "text": "Spoken text for this scene",
      "visualDescription": "What appears on screen",
      "caption": "Caption text for silent viewing",
      "voiceStyle": "energetic"
    }
  ],
  "totalDuration": ${strategy.adLength},
  "hook": "The attention-grabbing opening line",
  "problem": "The problem being addressed",
  "solution": "How the product solves it",
  "proof": "Social proof or credibility statement",
  "cta": "${strategy.cta}",
  "fullText": "Complete script text"
}`;
}

export function parseScriptResponse(response: string, targetDuration: number): {
  scenes: Array<{
    id: string;
    startTime: number;
    endTime: number;
    duration: number;
    text: string;
    visualDescription: string;
    caption?: string;
    voiceStyle?: string;
  }>;
  totalDuration: number;
  hook: string;
  problem: string;
  solution: string;
  proof?: string;
  cta: string;
  fullText: string;
} {
  try {
    // Try to extract JSON from markdown code blocks if present
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || response.match(/```\s*([\s\S]*?)\s*```/);
    const jsonStr = jsonMatch ? jsonMatch[1] : response;
    
    const parsed = JSON.parse(jsonStr.trim());
    
    // Validate and normalize scenes
    const scenes = (parsed.scenes || []).map((scene: any, index: number) => ({
      id: scene.id || `scene-${index + 1}`,
      startTime: scene.startTime || 0,
      endTime: scene.endTime || targetDuration,
      duration: scene.duration || (scene.endTime - scene.startTime) || 3,
      text: scene.text || '',
      visualDescription: scene.visualDescription || scene.visual || '',
      caption: scene.caption || scene.text,
      voiceStyle: scene.voiceStyle || 'natural',
    }));

    // Ensure scenes cover the full duration
    let currentTime = 0;
    const normalizedScenes = scenes.map((scene: any, index: number) => {
      const normalized = {
        ...scene,
        startTime: currentTime,
        endTime: index === scenes.length - 1 ? targetDuration : currentTime + scene.duration,
      };
      currentTime = normalized.endTime;
      normalized.duration = normalized.endTime - normalized.startTime;
      return normalized;
    });

    return {
      scenes: normalizedScenes,
      totalDuration: parsed.totalDuration || targetDuration,
      hook: parsed.hook || scenes[0]?.text || '',
      problem: parsed.problem || '',
      solution: parsed.solution || '',
      proof: parsed.proof,
      cta: parsed.cta || 'Get Started',
      fullText: parsed.fullText || normalizedScenes.map((s: any) => s.text).join(' '),
    };
  } catch (error) {
    console.error('Failed to parse script response:', error);
    // Return default script structure
    return {
      scenes: [
        {
          id: 'scene-1',
          startTime: 0,
          endTime: targetDuration / 2,
          duration: targetDuration / 2,
          text: 'Introducing our amazing product',
          visualDescription: 'Product showcase',
          caption: 'Introducing our amazing product',
          voiceStyle: 'energetic',
        },
        {
          id: 'scene-2',
          startTime: targetDuration / 2,
          endTime: targetDuration,
          duration: targetDuration / 2,
          text: 'Get started today!',
          visualDescription: 'CTA screen',
          caption: 'Get started today!',
          voiceStyle: 'confident',
        },
      ],
      totalDuration: targetDuration,
      hook: 'Introducing our amazing product',
      problem: 'You need a solution',
      solution: 'Our product solves it',
      cta: 'Get Started',
      fullText: 'Introducing our amazing product. Get started today!',
    };
  }
}








