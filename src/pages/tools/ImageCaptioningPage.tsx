import ImageCaptioningTool from '../../components/ImageCaptioningTool/ImageCaptioningTool';
import HowToUse from '../../components/common/HowToUse';
import '../../components/common/HowToUse.css';
import '../../pages/Dashboard.css';

export default function ImageCaptioningPage() {
  return (
    <>
      <div className="tool-sticky-title">
        <h1>
          <span>Image Captioning Tool</span>
          <span className="title-subtitle"> - Upload images and generate detailed captions automatically</span>
        </h1>
      </div>
      <HowToUse
        title=""
        subtitle=""
        instructions="Upload images using drag & drop, paste from clipboard, or click to browse. Then click 'Generate All Captions' to caption all images, or generate captions individually. Once captions are generated, you can view, edit, or download them. You can also export all captioned images as a ZIP file."
      />
      <ImageCaptioningTool />
    </>
  );
}

