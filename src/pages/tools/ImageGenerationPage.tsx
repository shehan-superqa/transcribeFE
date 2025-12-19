import ImageGenerationTab from '../../components/image/ImageGenerationTab';
import HowToUse from '../../components/common/HowToUse';
import '../../components/common/HowToUse.css';
import '../../pages/Dashboard.css';

export default function ImageGenerationPage() {
  return (
    <>
      <div className="tool-sticky-title">
        <h1>Image Generation</h1>
      </div>
      <HowToUse
        title=""
        subtitle="Generate stunning images from text prompts using advanced AI models"
        instructions="Enter a detailed text prompt describing the image you want to generate. Optionally add a negative prompt to exclude unwanted elements. Adjust settings like dimensions, number of outputs, and model selection. You can also upload a reference image for style transfer. Click 'Generate' to create your images."
      />
      <ImageGenerationTab />
    </>
  );
}

