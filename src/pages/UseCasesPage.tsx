import { useState, useRef } from 'react';
import { Box, Typography, Card, CardContent, CardActionArea, TextField, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import UseCaseDetail from '../components/common/UseCaseDetail';
import './UseCasesPage.css';

interface UseCase {
  id: string;
  title: string;
  description: string;
  color: string;
  category: string;
}

interface Category {
  id: string;
  title: string;
  icon?: string;
  subItems?: { 
    id: string; 
    title: string;
    subItems?: { id: string; title: string }[];
  }[];
}

const categories: Category[] = [
  { id: 'all', title: 'All Use Cases' },
  { 
    id: 'audio-transcription', 
    title: 'Audio & Transcription',
    subItems: [
      { 
        id: 'transcribe', 
        title: 'Transcribe (Single & Batch)',
        subItems: [
          { id: 'meeting-notes', title: 'Turn meeting recordings into written notes' },
          { id: 'conference-calls', title: 'Convert conference call recordings to text' },
          { id: 'team-discussions', title: 'Create records of team discussions' },
          { id: 'voice-memos', title: 'Turn voice memos into written notes' },
          { id: 'educational-audio', title: 'Create notes from educational audio' },
          { id: 'class-discussions', title: 'Turn class discussions into written records' },
          { id: 'lecture-recordings', title: 'Convert lecture recordings into study notes' },
          { id: 'important-conversations', title: 'Make written records of important conversations' },
          { id: 'batch-processing', title: 'Process multiple audio files at once' },
          { id: 'multiple-meetings', title: 'Transcribe multiple meeting recordings' },
        ]
      },
      { 
        id: 'live-mic-vad', 
        title: 'Live Mic VAD',
        subItems: [
          { id: 'live-study-notes', title: 'Create live study notes' },
          { id: 'instant-class-notes', title: 'Get instant class notes' },
          { id: 'live-lecture-notes', title: 'See lecture notes appear live' },
          { id: 'instant-discussion-notes', title: 'Get instant notes during discussions' },
          { id: 'real-time-speech', title: 'See what\'s being said in real time' },
          { id: 'live-speaker-notes', title: 'See live notes appear as people speak' },
          { id: 'real-time-lecture-transcripts', title: 'Get real-time lecture transcripts' },
        ]
      },
      { 
        id: 'text-to-speech', 
        title: 'Text-to-Speech',
        subItems: [
          { id: 'business-presentations', title: 'Make business presentations with voice' },
          { id: 'audio-training-materials', title: 'Create audio training materials' },
          { id: 'voice-messages-customers', title: 'Generate voice messages for customers' },
          { id: 'audio-announcements', title: 'Make audio announcements' },
          { id: 'professional-voiceovers-ads', title: 'Create professional voiceovers for ads' },
          { id: 'audio-guides-courses', title: 'Create audio guides for courses' },
          { id: 'listenable-study-materials', title: 'Make study materials you can listen to' },
          { id: 'video-voiceovers-no-recording', title: 'Create voiceovers for videos without recording' },
        ]
      },
      { 
        id: 'trainer', 
        title: 'Trainer',
        subItems: [
          { id: 'unsupported-languages', title: 'Train models for languages not well supported' },
          { id: 'local-dialects', title: 'Improve transcription for local dialects' },
          { id: 'regional-languages', title: 'Create better models for regional languages' },
        ]
      },
    ]
  },
  { 
    id: 'video-tools', 
    title: 'Video Tools',
    subItems: [
      { 
        id: 'text-to-video', 
        title: 'Text to Video',
        subItems: [
          { id: 'video-announcements', title: 'Make quick video announcements from text' },
          { id: 'explainer-videos', title: 'Create explainer videos from scripts' },
          { id: 'video-ads', title: 'Generate video ads' },
          { id: 'social-media-videos', title: 'Make social media videos from text posts' },
          { id: 'marketing-videos', title: 'Create marketing videos from product descriptions' },
        ]
      },
      { 
        id: 'video-to-text', 
        title: 'Video to Text',
        subItems: [
          { id: 'video-lectures-notes', title: 'Turn video lectures into study notes' },
          { id: 'video-interview-transcripts', title: 'Create transcripts of video interviews' },
          { id: 'video-meeting-notes', title: 'Get written notes from video meetings' },
        ]
      },
      { 
        id: 'video-dubber', 
        title: 'Video Dubber',
        subItems: [
          { id: 'multilingual-videos', title: 'Make videos in multiple languages' },
          { id: 'educational-dubbing', title: 'Dub educational videos for international students' },
          { id: 'marketing-localization', title: 'Localize marketing videos for global markets' },
          { id: 'entertainment-accessibility', title: 'Make entertainment content accessible worldwide' },
          { id: 'local-language-videos', title: 'Make videos understandable in local languages' },
        ]
      },
      { 
        id: 'video-translator', 
        title: 'Video Translator',
        subItems: [
          { id: 'translate-subtitles', title: 'Translate subtitles for international viewers' },
          { id: 'multilingual-videos-understandable', title: 'Make videos understandable in other languages' },
          { id: 'translate-video-descriptions', title: 'Translate video descriptions and titles' },
        ]
      },
      { 
        id: 'subtitle-generator', 
        title: 'Subtitle Generator',
        subItems: [
          { id: 'social-media-subtitles', title: 'Create subtitles for social media videos' },
          { id: 'educational-captions', title: 'Add captions to educational content' },
        ]
      },
    ]
  },
  { 
    id: 'image-tools', 
    title: 'Image Tools',
    subItems: [
      { 
        id: 'image-generation', 
        title: 'Image Generation',
        subItems: [
          { id: 'social-media-graphics', title: 'Design graphics for social media posts' },
          { id: 'product-images', title: 'Generate product images for websites' },
          { id: 'marketing-visuals', title: 'Create marketing visuals from descriptions' },
          { id: 'presentation-images', title: 'Make custom images for presentations' },
          { id: 'logos-branding', title: 'Design logos and branding materials' },
          { id: 'book-covers', title: 'Create book covers and illustrations' },
          { id: 'stock-photos', title: 'Generate stock photos without cameras' },
          { id: 'blog-post-images', title: 'Make unique images for blog posts' },
          { id: 'ad-visuals', title: 'Create visual content for ads' },
          { id: 'website-banners', title: 'Design website banners and headers' },
          { id: 'concept-art', title: 'Generate concept art and ideas' },
          { id: 'video-thumbnails', title: 'Create images for video thumbnails' },
          { id: 'newsletter-graphics', title: 'Make custom graphics for newsletters' },
        ]
      },
      { 
        id: 'image-captioning', 
        title: 'Image Captioning',
        subItems: [
          { id: 'accessibility-descriptions', title: 'Add descriptions to photos for accessibility' },
          { id: 'social-media-captions', title: 'Create captions for social media posts' },
          { id: 'product-photo-descriptions', title: 'Write descriptions for product photos' },
          { id: 'blog-image-descriptions', title: 'Create image descriptions for blogs' },
        ]
      },
      { 
        id: 'image-training', 
        title: 'Image Training (LoRA)',
        subItems: [
          { id: 'people-characters', title: 'Generate images of specific people or characters' },
          { id: 'brand-style', title: 'Train the AI to match your brand style' },
          { id: 'specific-subjects', title: 'Train models for specific subjects (pets, products, etc.)' },
          { id: 'personalized-avatars', title: 'Create personalized avatars and characters' },
          { id: 'photography-style', title: 'Generate images matching your photography style' },
          { id: 'architectural-styles', title: 'Train for specific architectural styles' },
          { id: 'character-designs', title: 'Create consistent character designs' },
          { id: 'special-occasions', title: 'Generate images for your special occasion(graduation,birthday)' },
        ]
      },
    ]
  },
  { id: 'real-time', title: 'Real-Time Tools' },
  { id: 'business', title: 'Business & Enterprise' },
  { id: 'content-creation', title: 'Content Creation' },
  { id: 'accessibility', title: 'Accessibility' },
];

const useCases: UseCase[] = [
  {
    id: 'contact-center',
    title: 'Contact Center Security',
    description: 'Protect customer PII and meet compliance standards with secure voice processing and data tokenization',
    color: '#4A90E2',
    category: 'business',
  },
  {
    id: 'remote-work',
    title: 'Remote Work Security',
    description: 'Secure virtual meetings and team collaborations with end-to-end encryption and voice biometrics',
    color: '#50E3C2',
    category: 'business',
  },
  {
    id: 'content-creation',
    title: 'Content Creation',
    description: 'Generate images, videos, and audio content from text prompts for marketing and creative projects',
    color: '#F5A623',
    category: 'content-creation',
  },
  {
    id: 'media-transcription',
    title: 'Media Transcription',
    description: 'Convert audio and video files to text transcriptions for accessibility and content indexing',
    color: '#9B59B6',
    category: 'audio-transcription',
  },
  {
    id: 'multilingual',
    title: 'Multilingual Content',
    description: 'Translate and dub videos and audio content to reach global audiences in multiple languages',
    color: '#E94B3C',
    category: 'video-tools',
  },
  {
    id: 'live-broadcasting',
    title: 'Live Broadcasting',
    description: 'Real-time transcription and captioning for live streams, webinars, and online events',
    color: '#3498DB',
    category: 'real-time',
  },
  {
    id: 'advertisement',
    title: 'Advertisement Generation',
    description: 'Create compelling ad content with AI-generated images, videos, and voiceovers for marketing campaigns',
    color: '#E67E22',
    category: 'content-creation',
  },
  {
    id: 'stock-footage',
    title: 'Stock Footage',
    description: 'Generate high-quality video content and images for stock footage libraries and creative projects',
    color: '#1ABC9C',
    category: 'image-tools',
  },
  {
    id: 'live-mic-vad',
    title: 'Live Mic VAD',
    description: 'Real-time voice activity detection and transcription for meetings, interviews, and voice recordings',
    color: '#E74C3C',
    category: 'real-time',
  },
  {
    id: 'podcast',
    title: 'Podcast Production',
    description: 'Transcribe podcast episodes, generate show notes, and create multilingual versions for global audiences',
    color: '#8E44AD',
    category: 'audio-transcription',
  },
  {
    id: 'e-learning',
    title: 'E-Learning Content',
    description: 'Create educational videos with automatic transcription, subtitles, and multilingual support for online courses',
    color: '#16A085',
    category: 'accessibility',
  },
  {
    id: 'social-media',
    title: 'Social Media Content',
    description: 'Generate engaging video content, captions, and audio for social media platforms and digital marketing',
    color: '#F39C12',
    category: 'content-creation',
  },
  {
    id: 'video-production',
    title: 'Video Production',
    description: 'Streamline video production workflows with automated transcription, dubbing, and subtitle generation',
    color: '#34495E',
    category: 'video-tools',
  },
];

export default function UseCasesPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
  const [selectedSubSubCategory, setSelectedSubSubCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['audio-transcription', 'video-tools', 'image-tools']));
  const [expandedSubCategories, setExpandedSubCategories] = useState<Set<string>>(new Set(['transcribe', 'live-mic-vad', 'text-to-speech', 'trainer', 'text-to-video', 'video-to-text', 'video-dubber', 'video-translator', 'subtitle-generator', 'image-generation', 'image-captioning', 'image-training']));
  const [selectedUseCaseId, setSelectedUseCaseId] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Map sub-categories to main categories for filtering
  const subCategoryToCategoryMap: Record<string, string> = {
    'transcribe': 'audio-transcription',
    'live-mic-vad': 'audio-transcription',
    'text-to-speech': 'audio-transcription',
    'trainer': 'audio-transcription',
  };

  const filteredUseCases = useCases.filter((useCase) => {
    let matchesCategory = false;
    
    if (selectedCategory === 'all') {
      matchesCategory = true;
    } else if (selectedSubCategory) {
      // If a sub-category is selected, filter by the parent category
      matchesCategory = useCase.category === subCategoryToCategoryMap[selectedSubCategory];
    } else {
      matchesCategory = useCase.category === selectedCategory;
    }
    
    const matchesSearch = searchQuery === '' || 
      useCase.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      useCase.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCategoryClick = (categoryId: string, hasSubItems: boolean) => {
    if (hasSubItems && categoryId !== 'all') {
      toggleCategory(categoryId);
    } else {
      setSelectedCategory(categoryId);
      setSelectedSubCategory(null);
      setSelectedSubSubCategory(null);
      if (contentRef.current) {
        contentRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const handleSubCategoryClick = (subCategoryId: string, categoryId: string, hasSubItems?: boolean) => {
    if (hasSubItems) {
      toggleSubCategory(subCategoryId);
    } else {
      setSelectedCategory(categoryId);
      setSelectedSubCategory(subCategoryId);
      setSelectedSubSubCategory(null);
      if (contentRef.current) {
        contentRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const handleSubSubCategoryClick = (subSubCategoryId: string, subCategoryId: string, categoryId: string) => {
    setSelectedCategory(categoryId);
    setSelectedSubCategory(subCategoryId);
    setSelectedSubSubCategory(subSubCategoryId);
    // Find the use case item by ID and show detail
    const useCaseItem = findUseCaseBySubSubId(subSubCategoryId);
    if (useCaseItem) {
      setSelectedUseCaseId(useCaseItem.id);
    } else {
      // If not found in useCases array, create a temporary one from the navigation item
      const navItem = findNavItemById(subSubCategoryId, subCategoryId, categoryId);
      if (navItem) {
        setSelectedUseCaseId(subSubCategoryId);
      }
    }
  };

  const handleUseCaseCardClick = (useCaseId: string) => {
    setSelectedUseCaseId(useCaseId);
  };

  const handleBackToList = () => {
    setSelectedUseCaseId(null);
  };

  // Helper function to find use case by sub-sub category ID
  const findUseCaseBySubSubId = (subSubId: string): UseCase | null => {
    // Try to find matching use case
    return useCases.find(uc => uc.id === subSubId) || null;
  };

  // Helper function to find navigation item
  const findNavItemById = (subSubId: string, subId: string, catId: string) => {
    // subId and catId are used to navigate the category structure
    const category = categories.find(cat => cat.id === catId);
    if (category?.subItems) {
      const subItem = category.subItems.find(sub => sub.id === subId);
      if (subItem?.subItems) {
        return subItem.subItems.find(subSub => subSub.id === subSubId);
      }
    }
    return null;
  };

  // Get the current use case detail to display
  const getCurrentUseCaseDetail = () => {
    if (!selectedUseCaseId) return null;

    let foundSubCategory: string | null = null;
    let foundCategory: string | null = null;

    // First try to find in useCases array
    const useCase = useCases.find(uc => uc.id === selectedUseCaseId);
    if (useCase) {
      foundCategory = useCase.category;
      // Find the sub-category from the navigation structure
      for (const category of categories) {
        if (category.id === useCase.category && category.subItems) {
          // Try to find which sub-category this use case belongs to
          for (const subItem of category.subItems) {
            if (subItem.subItems?.some(subSub => subSub.id === selectedUseCaseId)) {
              foundSubCategory = subItem.id;
              break;
            }
          }
        }
      }
      return {
        title: useCase.title,
        description: useCase.description,
        category: getCategoryName(useCase.category),
        howItWorks: getHowItWorks(selectedUseCaseId, foundSubCategory, foundCategory),
        benefits: getBenefits(selectedUseCaseId, foundSubCategory, foundCategory),
      };
    }

    // If not found, try to find in navigation structure
    for (const category of categories) {
      if (category.subItems) {
        for (const subItem of category.subItems) {
          if (subItem.subItems) {
            const subSubItem = subItem.subItems.find(item => item.id === selectedUseCaseId);
            if (subSubItem) {
              return {
                title: subSubItem.title,
                description: getDescriptionForNavItem(subSubItem.title),
                category: category.title,
                howItWorks: getHowItWorks(selectedUseCaseId, subItem.id, category.id),
                benefits: getBenefits(selectedUseCaseId, subItem.id, category.id),
              };
            }
          }
        }
      }
    }

    return null;
  };

  const getCategoryName = (categoryId: string): string => {
    const category = categories.find(cat => cat.id === categoryId);
    return category?.title || '';
  };

  const getDescriptionForNavItem = (title: string): string => {
    // Generate a description based on the title
    return `Learn how to ${title.toLowerCase()} using our AI-powered tools. This feature helps you streamline your workflow and improve productivity.`;
  };

  // Get "How It Works" steps based on use case ID or category
  const getHowItWorks = (_useCaseId: string, subCategoryId?: string | null, _categoryId?: string): string[] => {
    // Map based on sub-category first (more specific)
    if (subCategoryId) {
      switch (subCategoryId) {
        case 'transcribe':
          return [
            'Upload your audio or video file using drag & drop, paste from clipboard, or click to browse',
            'You can also paste a YouTube link or record audio directly',
            'Select your preferred transcription engine (Whisper, Google, etc.) and model',
            'Choose processing mode: Batch, Parallel Streaming, or Real-time Streaming',
            'Click "Transcribe" to start the process',
            'Monitor progress in real-time and view the transcription when complete',
            'Edit, copy, download, or save to your history'
          ];
        case 'live-mic-vad':
          return [
            'Click "Start Recording" and grant microphone permissions',
            'Speak clearly into your microphone',
            'See transcription appear in real-time as you speak',
            'Adjust VAD (Voice Activity Detection) threshold to control sensitivity',
            'Click "Stop Recording" when finished',
            'Copy the transcription or save it to your history'
          ];
        case 'text-to-speech':
          return [
            'Enter the text you want to convert to speech',
            'Select a voice from over 300 available voices',
            'Optionally adjust emotion, language, speed, pitch, and volume settings',
            'Click "Generate Speech" to create the audio',
            'Play, pause, or download the generated audio file'
          ];
        case 'trainer':
          return [
            'Select the language you want to train a model for',
            'Upload audio files either by selecting files directly or providing a directory path',
            'Upload a transcriptions file (JSON or text format) that matches your audio files',
            'Click "Start Training" to begin the training process',
            'Monitor the progress and logs in real-time',
            'Use your custom model for transcriptions once training is complete'
          ];
        case 'text-to-video':
          return [
            'Enter a detailed text prompt describing the video you want to generate',
            'Optionally upload reference images to guide the video style',
            'Adjust settings like aspect ratio, duration, and model selection',
            'Click "Generate Video" to create your video',
            'Wait for processing (may take several minutes)',
            'Preview and download your generated video'
          ];
        case 'video-to-text':
          return [
            'Upload your video file using drag & drop, paste from clipboard, or click to browse',
            'You can also paste a YouTube link',
            'Select your preferred transcription engine and model',
            'Click "Transcribe" to start extracting audio and transcribing',
            'View the transcription when complete',
            'Edit, copy, or download the transcription'
          ];
        case 'video-dubber':
          return [
            'Upload a video file using drag & drop, paste from clipboard, or click to browse',
            'You can also paste a video URL',
            'Select the target language for dubbing',
            'Click "Dub Video" to start the process',
            'The system will translate and dub your video with natural-sounding voice',
            'Download the dubbed video when complete'
          ];
        case 'video-translator':
          return [
            'Upload your video file or paste a video URL',
            'Select the source and target languages',
            'Click "Translate" to start the translation process',
            'The system will translate video content and subtitles',
            'Download translated subtitles or video with translated content'
          ];
        case 'subtitle-generator':
          return [
            'Upload a video file or paste a YouTube link',
            'The system will automatically generate synchronized captions',
            'Select your preferred language and caption style',
            'Captions will appear overlaid on your video',
            'Download the captions in SRT or VTT format'
          ];
        case 'image-generation':
          return [
            'Enter a detailed text prompt describing the image you want to generate',
            'Optionally add a negative prompt to exclude unwanted elements',
            'Adjust settings like dimensions, number of outputs, and model selection',
            'You can also upload a reference image for style transfer',
            'Click "Generate" to create your images',
            'Download or use the generated images'
          ];
        case 'image-captioning':
          return [
            'Upload images using drag & drop, paste from clipboard, or click to browse',
            'Click "Generate All Captions" to caption all images, or generate captions individually',
            'Review and edit the generated captions',
            'View, edit, or download captions',
            'Export all captioned images as a ZIP file'
          ];
        case 'image-training':
          return [
            'Upload images using drag & drop, paste from clipboard, or click to browse',
            'For subject training, use 5-10 high-quality images of the same subject',
            'For style training, use 20-100 images in the same artistic style',
            'Enter a trigger word that will activate your trained model',
            'Click "Generate All Captions" to caption all images',
            'Click "Start Training" to begin the training process',
            'Use your trained model for image generation'
          ];
      }
    }

    // Default steps if no specific mapping found
    return [
      'Upload your file or provide input using the available methods',
      'Configure your preferred settings and options',
      'Click the action button to start processing',
      'Monitor progress and wait for completion',
      'View, edit, and download your results'
    ];
  };

  // Get "Benefits" based on use case ID or category
  const getBenefits = (_useCaseId: string, subCategoryId?: string | null, _categoryId?: string): string[] => {
    // Map based on sub-category first (more specific)
    if (subCategoryId) {
      switch (subCategoryId) {
        case 'transcribe':
          return [
            'Save time by automatically converting audio to text',
            'Process multiple files simultaneously with batch processing',
            'Improve accessibility with written records',
            'Make content searchable and easy to reference',
            'Create professional documentation quickly',
            'Support for multiple languages and accents'
          ];
        case 'live-mic-vad':
          return [
            'Get instant transcription as you speak',
            'No need to record and process later',
            'Perfect for meetings, lectures, and interviews',
            'Real-time feedback helps ensure accuracy',
            'Adjustable sensitivity for different environments',
            'Immediate access to written notes'
          ];
        case 'text-to-speech':
          return [
            'Create professional voiceovers without recording',
            'Choose from 300+ natural-sounding voices',
            'Customize emotion, speed, pitch, and volume',
            'Generate audio in multiple languages',
            'Save time and money on voice actors',
            'Make content accessible to visually impaired users'
          ];
        case 'trainer':
          return [
            'Improve accuracy for specific languages or dialects',
            'Create custom models for your industry terminology',
            'Better transcription for specialized content',
            'Train models for rare or less-supported languages',
            'Optimize for your specific use case',
            'Continuous improvement with more training data'
          ];
        case 'text-to-video':
          return [
            'Create videos from text descriptions instantly',
            'No need for cameras, actors, or video editing skills',
            'Generate professional-quality content quickly',
            'Create multiple variations easily',
            'Perfect for marketing, social media, and presentations',
            'Save time and resources on video production'
          ];
        case 'video-to-text':
          return [
            'Extract text from video content automatically',
            'Create searchable transcripts of video lectures',
            'Generate meeting notes from video recordings',
            'Make video content accessible with text',
            'Improve SEO with video transcripts',
            'Create written documentation from video content'
          ];
        case 'video-dubber':
          return [
            'Make videos accessible in multiple languages',
            'Reach global audiences without re-recording',
            'Natural-sounding voice dubbing with AI',
            'Maintain original video quality',
            'Faster and more cost-effective than traditional dubbing',
            'Scale to multiple languages easily'
          ];
        case 'video-translator':
          return [
            'Translate video content for international viewers',
            'Make videos understandable in other languages',
            'Translate subtitles and descriptions automatically',
            'Reach global audiences',
            'Improve accessibility for non-native speakers',
            'Maintain original video while adding translations'
          ];
        case 'subtitle-generator':
          return [
            'Add captions automatically to any video',
            'Make videos accessible to deaf and hard-of-hearing viewers',
            'Improve video SEO with searchable text',
            'Make videos watchable without sound',
            'Support multiple languages',
            'Professional subtitle formatting'
          ];
        case 'image-generation':
          return [
            'Create images from text descriptions instantly',
            'No need for design skills or expensive software',
            'Generate unlimited variations',
            'Create professional graphics quickly',
            'Perfect for marketing, social media, and content creation',
            'Save time and money on design work'
          ];
        case 'image-captioning':
          return [
            'Add descriptions to photos for accessibility',
            'Improve SEO with image descriptions',
            'Make images searchable with text',
            'Create captions for social media automatically',
            'Generate alt text for websites',
            'Document and organize your image library'
          ];
        case 'image-training':
          return [
            'Create custom AI models for your specific needs',
            'Generate images in your unique style',
            'Train models for specific subjects or characters',
            'Maintain consistent brand style',
            'Create personalized content',
            'Improve generation quality for your use case'
          ];
      }
    }

    // Default benefits if no specific mapping found
    return [
      'Save time and improve productivity',
      'Automate repetitive tasks',
      'Improve accuracy and consistency',
      'Make content more accessible',
      'Scale your workflow efficiently'
    ];
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const toggleSubCategory = (subCategoryId: string) => {
    setExpandedSubCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(subCategoryId)) {
        newSet.delete(subCategoryId);
      } else {
        newSet.add(subCategoryId);
      }
      return newSet;
    });
  };

  // If a use case is selected, show detail view
  const useCaseDetail = getCurrentUseCaseDetail();
  if (useCaseDetail) {
    return (
      <Box className="use-cases-page">
        <Box className="use-cases-layout">
          {/* Left Sidebar - Keep it visible */}
          <Box className="use-cases-sidebar">
            <Box className="sidebar-search">
              <TextField
                fullWidth
                placeholder="Search use cases..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#94a3b8', fontSize: '1.2rem' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    color: '#f8fafc',
                    borderRadius: '8px',
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#00c6ff',
                    },
                  },
                  '& .MuiInputBase-input': {
                    color: '#f8fafc',
                    '&::placeholder': {
                      color: '#94a3b8',
                      opacity: 1,
                    },
                  },
                }}
              />
            </Box>
            {/* Navigation sidebar - same as before */}
            <Box className="sidebar-navigation">
              {categories.map((category) => (
                <Box key={category.id} className="sidebar-category">
                  <Box
                    className={`sidebar-category-header ${selectedCategory === category.id && !selectedSubCategory ? 'active' : ''}`}
                    onClick={() => handleCategoryClick(category.id, !!category.subItems)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <Typography variant="body2" sx={{ color: selectedCategory === category.id && !selectedSubCategory ? '#00c6ff' : '#cbd5e1', fontWeight: selectedCategory === category.id && !selectedSubCategory ? 600 : 400 }}>
                      {category.title}
                    </Typography>
                    {category.subItems && category.subItems.length > 0 && (
                      <Box sx={{ ml: 'auto' }}>
                        {expandedCategories.has(category.id) ? (
                          <ExpandLessIcon sx={{ color: '#94a3b8', fontSize: '1rem' }} />
                        ) : (
                          <ExpandMoreIcon sx={{ color: '#94a3b8', fontSize: '1rem' }} />
                        )}
                      </Box>
                    )}
                  </Box>
                  {category.subItems && category.subItems.length > 0 && expandedCategories.has(category.id) && (
                    <Box className="sidebar-submenu">
                      {category.subItems.map((subItem) => (
                        <Box key={subItem.id}>
                          <Box
                            className={`sidebar-subitem ${selectedSubCategory === subItem.id && !selectedSubSubCategory ? 'active' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSubCategoryClick(subItem.id, category.id, !!subItem.subItems && subItem.subItems.length > 0);
                            }}
                            sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                          >
                            <Typography variant="body2" sx={{ color: selectedSubCategory === subItem.id && !selectedSubSubCategory ? '#00c6ff' : '#94a3b8', fontWeight: selectedSubCategory === subItem.id && !selectedSubSubCategory ? 500 : 400, fontSize: '0.875rem' }}>
                              {subItem.title}
                            </Typography>
                            {subItem.subItems && subItem.subItems.length > 0 && (
                              <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center' }}>
                                {expandedSubCategories.has(subItem.id) ? (
                                  <ExpandLessIcon sx={{ color: '#94a3b8', fontSize: '0.875rem' }} />
                                ) : (
                                  <ExpandMoreIcon sx={{ color: '#94a3b8', fontSize: '0.875rem' }} />
                                )}
                              </Box>
                            )}
                          </Box>
                          {subItem.subItems && subItem.subItems.length > 0 && expandedSubCategories.has(subItem.id) && (
                            <Box className="sidebar-subsubmenu">
                              {subItem.subItems.map((subSubItem) => (
                                <Box
                                  key={subSubItem.id}
                                  className={`sidebar-subsubitem ${selectedSubSubCategory === subSubItem.id ? 'active' : ''}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSubSubCategoryClick(subSubItem.id, subItem.id, category.id);
                                  }}
                                  sx={{ cursor: 'pointer' }}
                                >
                                  <Typography variant="body2" sx={{ color: selectedSubSubCategory === subSubItem.id ? '#00c6ff' : '#94a3b8', fontWeight: selectedSubSubCategory === subSubItem.id ? 500 : 400, fontSize: '0.8125rem' }}>
                                    {subSubItem.title}
                                  </Typography>
                                </Box>
                              ))}
                            </Box>
                          )}
                        </Box>
                      ))}
                    </Box>
                  )}
                </Box>
              ))}
            </Box>
          </Box>

          {/* Detail Content */}
          <Box className="use-cases-content">
            <UseCaseDetail
              title={useCaseDetail.title}
              description={useCaseDetail.description}
              category={useCaseDetail.category}
              howItWorks={useCaseDetail.howItWorks}
              benefits={useCaseDetail.benefits}
              onBack={handleBackToList}
            />
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box className="use-cases-page">
      <Box className="use-cases-layout">
        {/* Left Sidebar */}
        <Box className="use-cases-sidebar">
          <Box className="sidebar-search">
            <TextField
              fullWidth
              placeholder="Search use cases..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#94a3b8', fontSize: '1.2rem' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  color: '#f8fafc',
                  borderRadius: '8px',
                  '& fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#00c6ff',
                  },
                },
                '& .MuiInputBase-input': {
                  color: '#f8fafc',
                  '&::placeholder': {
                    color: '#94a3b8',
                    opacity: 1,
                  },
                },
              }}
            />
          </Box>

          <Box className="sidebar-navigation">
            {categories.map((category) => (
              <Box key={category.id} className="sidebar-category">
                <Box
                  className={`sidebar-category-header ${selectedCategory === category.id && !selectedSubCategory ? 'active' : ''}`}
                  onClick={() => handleCategoryClick(category.id, !!category.subItems)}
                  sx={{ cursor: 'pointer' }}
                >
                  <Typography variant="body2" sx={{ color: selectedCategory === category.id && !selectedSubCategory ? '#00c6ff' : '#cbd5e1', fontWeight: selectedCategory === category.id && !selectedSubCategory ? 600 : 400 }}>
                    {category.title}
                  </Typography>
                  {category.subItems && category.subItems.length > 0 && (
                    <Box sx={{ ml: 'auto' }}>
                      {expandedCategories.has(category.id) ? (
                        <ExpandLessIcon sx={{ color: '#94a3b8', fontSize: '1rem' }} />
                      ) : (
                        <ExpandMoreIcon sx={{ color: '#94a3b8', fontSize: '1rem' }} />
                      )}
                    </Box>
                  )}
                </Box>
                {category.subItems && category.subItems.length > 0 && expandedCategories.has(category.id) && (
                  <Box className="sidebar-submenu">
                    {category.subItems.map((subItem) => (
                      <Box key={subItem.id}>
                        <Box
                          className={`sidebar-subitem ${selectedSubCategory === subItem.id && !selectedSubSubCategory ? 'active' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSubCategoryClick(subItem.id, category.id, !!subItem.subItems && subItem.subItems.length > 0);
                          }}
                          sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                        >
                          <Typography variant="body2" sx={{ color: selectedSubCategory === subItem.id && !selectedSubSubCategory ? '#00c6ff' : '#94a3b8', fontWeight: selectedSubCategory === subItem.id && !selectedSubSubCategory ? 500 : 400, fontSize: '0.875rem' }}>
                            {subItem.title}
                          </Typography>
                          {subItem.subItems && subItem.subItems.length > 0 && (
                            <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center' }}>
                              {expandedSubCategories.has(subItem.id) ? (
                                <ExpandLessIcon sx={{ color: '#94a3b8', fontSize: '0.875rem' }} />
                              ) : (
                                <ExpandMoreIcon sx={{ color: '#94a3b8', fontSize: '0.875rem' }} />
                              )}
                            </Box>
                          )}
                        </Box>
                        {subItem.subItems && subItem.subItems.length > 0 && expandedSubCategories.has(subItem.id) && (
                          <Box className="sidebar-subsubmenu">
                            {subItem.subItems.map((subSubItem) => (
                              <Box
                                key={subSubItem.id}
                                className={`sidebar-subsubitem ${selectedSubSubCategory === subSubItem.id ? 'active' : ''}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSubSubCategoryClick(subSubItem.id, subItem.id, category.id);
                                }}
                                sx={{ cursor: 'pointer' }}
                              >
                                <Typography variant="body2" sx={{ color: selectedSubSubCategory === subSubItem.id ? '#00c6ff' : '#94a3b8', fontWeight: selectedSubSubCategory === subSubItem.id ? 500 : 400, fontSize: '0.8125rem' }}>
                                  {subSubItem.title}
                                </Typography>
                              </Box>
                            ))}
                          </Box>
                        )}
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            ))}
          </Box>
        </Box>

        {/* Main Content */}
        <Box className="use-cases-content" ref={contentRef}>
        <Box className="use-cases-header">
          <Typography variant="h2" className="use-cases-title">
            Use Cases
          </Typography>
          <Typography variant="body1" className="use-cases-subtitle">
            Discover how our AI-powered tools can transform your workflow
          </Typography>
        </Box>

          {filteredUseCases.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" sx={{ color: '#94a3b8', mb: 2 }}>
                No use cases found
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                Try adjusting your search or category filter
              </Typography>
            </Box>
          ) : (
        <Box className="use-cases-grid">
              {filteredUseCases.map((useCase) => (
            <Card
              key={useCase.id}
              className="use-case-card"
              sx={{
                background: 'linear-gradient(135deg, #000000 0%, #1a1a2e 50%,rgb(61, 66, 75) 100%)',
                border: '1px solid rgba(74, 144, 226, 0.3)',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 24px rgba(74, 144, 226, 0.5)',
                  borderColor: 'rgba(74, 144, 226, 0.6)',
                  background: 'linear-gradient(135deg, #0a0a0a 0%, #1e2a3e 50%, #5a6578 100%)',
                },
              }}
            >
              <CardActionArea
                onClick={() => handleUseCaseCardClick(useCase.id)}
                sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}
              >
                <CardContent sx={{ width: '100%', p: 2 }}>
                  <Typography variant="h6" className="use-case-title" sx={{ color: '#e0e0e0', mb: 1, fontWeight: 600, fontSize: '1.1rem', textAlign: 'center' }}>
                    {useCase.title}
                  </Typography>
                  <Typography variant="body2" className="use-case-description" sx={{ color: '#a0a0a0', lineHeight: 1.5, fontSize: '0.875rem' }}>
                    {useCase.description}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}
