import ImageEditingTool from '../../components/ImageEditingTool/ImageEditingTool';
import HowToUse from '../../components/common/HowToUse';
import '../../components/common/HowToUse.css';
import '../../pages/Dashboard.css';

export default function ImageEditingPage() {
  return (
    <>
      <div className="tool-sticky-title">
        <h1>
          <span>Image Editing</span>
          <span className="title-subtitle"> - Transform existing images with precision using AI-powered editing prompts</span>
        </h1>
      </div>
      <HowToUse
        title=""
        subtitle=""
        instructions="Upload an image you want to edit. Use the structured prompt builder with three sections: Modification Instruction (what to change), Change Target (what to modify), and Preservation Requirements (what must stay the same). You can use category templates for common editing tasks, or write custom prompts. The tool supports adding/removing objects, modifying elements, editing text, changing backgrounds, adjusting camera perspectives, and multi-step edits. Click 'Edit Image' to process your edit."
      />
      <ImageEditingTool />
    </>
  );
}












