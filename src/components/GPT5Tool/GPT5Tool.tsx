import { useState } from 'react';
import TextGenerationTool from './TextGenerationTool';
import ChatCompletionTool from './ChatCompletionTool';
import './GPT5Tool.css';

type TabType = 'text-generation' | 'chat';

export default function GPT5Tool() {
  const [activeTab, setActiveTab] = useState<TabType>('text-generation');

  return (
    <div className="gpt5-tool">
      <div className="gpt5-tabs">
        <button
          className={`gpt5-tab ${activeTab === 'text-generation' ? 'active' : ''}`}
          onClick={() => setActiveTab('text-generation')}
        >
          Text Generation
        </button>
        <button
          className={`gpt5-tab ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          Chat Completion
        </button>
      </div>

      <div className="gpt5-tab-content">
        {activeTab === 'text-generation' && <TextGenerationTool />}
        {activeTab === 'chat' && <ChatCompletionTool />}
      </div>
    </div>
  );
}











