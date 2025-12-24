import ImageEditingTool from '../../components/ImageEditingTool/ImageEditingTool';
import HowToUse from '../../components/common/HowToUse';
import './FeaturePage.css';

export default function ImageEditingPage() {
  return (
    <div style={{ padding: '1rem', background: 'var(--bg-primary)', minHeight: '100vh' }}>
      <HowToUse
        title="Image Editing"
        subtitle="Transform existing images with precision using AI-powered editing prompts"
        instructions="Upload an image you want to edit. Use the structured prompt builder with three sections: Modification Instruction (what to change), Change Target (what to modify), and Preservation Requirements (what must stay the same). You can use category templates for common editing tasks, or write custom prompts. The tool supports adding/removing objects, modifying elements, editing text, changing backgrounds, adjusting camera perspectives, and multi-step edits. Click 'Edit Image' to process your edit."
      />
      <ImageEditingTool />
    </div>
  );
}









