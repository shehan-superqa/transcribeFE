import ImageTrainingTool from '../../components/ImageTrainingTool/ImageTrainingTool';
import HowToUse from '../../components/common/HowToUse';
import '../../components/common/HowToUse.css';
import '../../pages/Dashboard.css';

export default function ImageTrainingPage() {
  return (
    <>
      <div className="tool-sticky-title">
        <h1>
          <span>Image Training (LoRA)</span>
          <span className="title-subtitle"> - Train custom AI models using your own images for personalized image generation</span>
        </h1>
      </div>
      <HowToUse
        title=""
        subtitle=""
        instructions="Upload images using drag & drop, paste from clipboard, or click to browse. For subject training, use 5-10 high-quality images of the same subject. For style training, use 20-100 images in the same artistic style. Enter a trigger word that will activate your trained model. Click 'Generate All Captions' to caption all images, or generate captions individually. Then click 'Start Training' to begin."
      />
      <ImageTrainingTool />
    </>
  );
}





















