import ImageGenerationTab from '../../components/image/ImageGenerationTab';
import HowToUse from '../../components/common/HowToUse';
import '../../css/components/common/HowToUse.css';
import '../../css/pages/Dashboard.css';

export default function ImageGenerationPage() {
  return (
    <>
      <div className="tool-sticky-title">
        <h1>
          <span>Image Generation</span>
          <span className="title-subtitle"> - Generate stunning images from text prompts using advanced AI models</span>
        </h1>
      </div>
      <HowToUse
        title=""
        subtitle=""
        instructions="Enter a detailed text prompt describing the image you want to generate. Optionally add a negative prompt to exclude unwanted elements. Adjust settings like dimensions, number of outputs, and model selection. You can also upload a reference image for style transfer. Click 'Generate' to create your images."
      />
      <ImageGenerationTab />
    </>
  );
}

