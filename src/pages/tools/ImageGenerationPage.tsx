import ImageGenerationTool from '../../components/ImageGenerationTool/ImageGenerationTool';
import HowToUse from '../../components/common/HowToUse';
import './FeaturePage.css';

export default function ImageGenerationPage() {
  return (
    <div style={{ padding: '1rem', background: '#121212', minHeight: '100vh' }}>
      <HowToUse
        title="Image Generation"
        subtitle="Generate stunning images from text prompts using advanced AI models"
        instructions="Enter a detailed text prompt describing the image you want to generate. Optionally add a negative prompt to exclude unwanted elements. Adjust settings like dimensions, number of outputs, and model selection. You can also upload a reference image for style transfer. Click 'Generate' to create your images."
      />
      <ImageGenerationTool />
    </div>
  );
}

