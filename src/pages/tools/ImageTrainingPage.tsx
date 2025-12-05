import ImageTrainingTool from '../../components/ImageTrainingTool/ImageTrainingTool';
import HowToUse from '../../components/common/HowToUse';
import './FeaturePage.css';

export default function ImageTrainingPage() {
  return (
    <div style={{ padding: '1rem', background: '#121212', minHeight: '100vh' }}>
      <HowToUse
        title="Image Training (LoRA)"
        subtitle="Train custom AI models using your own images for personalized image generation"
        instructions="Upload images using drag & drop, paste from clipboard, or click to browse. For subject training, use 5-10 high-quality images of the same subject. For style training, use 20-100 images in the same artistic style. Enter a trigger word that will activate your trained model. Click 'Generate All Captions' to caption all images, or generate captions individually. Then click 'Start Training' to begin."
      />
      <ImageTrainingTool />
    </div>
  );
}





