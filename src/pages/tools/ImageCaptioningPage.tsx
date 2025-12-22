import ImageCaptioningTool from '../../components/ImageCaptioningTool/ImageCaptioningTool';
import HowToUse from '../../components/common/HowToUse';
import './FeaturePage.css';

export default function ImageCaptioningPage() {
  return (
    <div style={{ padding: '1rem', background: 'var(--bg-primary)', minHeight: '100vh' }}>
      <HowToUse
        title="Image Captioning Tool"
        subtitle="Upload images and generate detailed captions automatically"
        instructions="Upload images using drag & drop, paste from clipboard, or click to browse. Then click 'Generate All Captions' to caption all images, or generate captions individually. Once captions are generated, you can view, edit, or download them. You can also export all captioned images as a ZIP file."
      />
      <ImageCaptioningTool />
    </div>
  );
}

