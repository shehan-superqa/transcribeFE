import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Sidebar.css';

interface SubMenuItem {
  id: string;
  label: string;
  path: string;
}

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  isExpandable?: boolean;
  subItems?: SubMenuItem[];
}

const menuItems: MenuItem[] = [
  { 
    id: 'audio', 
    label: 'Audio', 
    icon: '🔊', 
    path: '/voice/transcribe',
    isExpandable: true,
    subItems: [
      { id: 'audio-translator', label: 'Audio Translator', path: '/voice/translator' },
    ]
  },
  { 
    id: 'audio-to-text', 
    label: 'Audio to Text', 
    icon: '🎵', 
    path: '/voice/transcribe',
    isExpandable: true,
    subItems: [
      { id: 'transcribe', label: 'Transcribe (Single & Batch)', path: '/voice/transcribe' },
      { id: 'live', label: 'Live Mic VAD', path: '/voice/live' },
      { id: 'tts', label: 'Text-to-Speech', path: '/voice/tts' },
      { id: 'history', label: 'History', path: '/voice/history' },
      { id: 'settings', label: 'Settings', path: '/voice/settings' },
      { id: 'trainer', label: 'Trainer', path: '/voice/trainer' },
    ]
  },
  { 
    id: 'video-tools', 
    label: 'Video Tools', 
    icon: '🎬', 
    path: '/video/text-to-video',
    isExpandable: true,
    subItems: [
      { id: 'text-to-video', label: 'Text to Video', path: '/video/text-to-video' },
      { id: 'to-text', label: 'Video to Text', path: '/video/to-text' },
      { id: 'dubber', label: 'Video Dubber', path: '/video/dubber' },
      { id: 'translator', label: 'Video Translator', path: '/video/translator' },
      { id: 'subtitle-generator', label: 'Subtitle Generator', path: '/video/subtitle-generator' },
    ]
  },
  { 
    id: 'image-tools', 
    label: 'Image Tools', 
    icon: '🖼️', 
    path: '/images/generate',
    isExpandable: true,
    subItems: [
      { id: 'generate', label: 'Image Generation', path: '/images/generate' },
      { id: 'caption', label: 'Image Captioning', path: '/images/caption' },
      { id: 'train', label: 'Image Training (LoRA)', path: '/images/train' },
      { id: 'edit', label: 'Image Editing', path: '/images/edit' },
    ]
  },
  { 
    id: 'gpt5-tools', 
    label: 'GPT-5', 
    icon: '🤖', 
    path: '/gpt5',
    isExpandable: false,
  },
  { id: 'free-tools', label: 'Free Tools', icon: '🎁', path: '/voice/transcribe' },
  { 
    id: 'real-time', 
    label: 'Real-Time', 
    icon: '⚡', 
    path: '/voice/live', 
    isExpandable: true,
    subItems: [
      { id: 'live-transcribe', label: 'Live Transcribe', path: '/voice/live-transcribe' },
      { id: 'live-captioner', label: 'Web Captioner', path: '/voice/live-captioner' },
      { id: 'live-translator', label: 'Real-Time Translator', path: '/voice/live-translator' },
      { id: 'live-voice-translator', label: 'Live Voice Translator', path: '/voice/live-voice-translator' },
    ]
  },
];

interface SidebarProps {
  onRealTimeExpand?: (expanded: boolean) => void;
}

export default function Sidebar({ onRealTimeExpand }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeItem, setActiveItem] = useState<string>('');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set(['real-time']));

  useEffect(() => {
    const path = location.pathname;
    
    // Check if path matches any sub-item
    let parentItem: MenuItem | undefined;
    let activeSubItem: string | undefined;
    
    for (const item of menuItems) {
      if (item.subItems) {
        const matchingSubItem = item.subItems.find(sub => 
          path === sub.path || path.startsWith(sub.path + '/')
        );
        if (matchingSubItem) {
          parentItem = item;
          activeSubItem = matchingSubItem.id;
          break;
        }
      }
      // Also check if path matches the parent item directly
      if (path === item.path || path.startsWith(item.path + '/')) {
        if (!item.subItems) {
          parentItem = item;
          break;
        }
      }
    }
    
    if (parentItem) {
      setActiveItem(parentItem.id);
      if (parentItem.isExpandable) {
        setExpandedItems(prev => {
          if (!prev.has(parentItem!.id)) {
            const newExpanded = new Set(prev);
            newExpanded.add(parentItem!.id);
            if (parentItem!.id === 'real-time') {
              onRealTimeExpand?.(true);
            }
            return newExpanded;
          }
          return prev;
        });
      }
    }
  }, [location.pathname, onRealTimeExpand]);

  const handleItemClick = (item: MenuItem) => {
    if (item.isExpandable) {
      // Toggle expansion for expandable items
      const newExpanded = new Set(expandedItems);
      if (newExpanded.has(item.id)) {
        newExpanded.delete(item.id);
      } else {
        newExpanded.add(item.id);
      }
      setExpandedItems(newExpanded);
      setActiveItem(item.id);
      if (item.id === 'real-time') {
        onRealTimeExpand?.(newExpanded.has(item.id));
      }
      // Navigate to default path if collapsing
      if (!newExpanded.has(item.id) && item.path) {
        navigate(item.path);
      }
    } else {
      // Navigate for regular items
      setActiveItem(item.id);
      navigate(item.path);
    }
  };

  const handleSubItemClick = (subItem: SubMenuItem, parentId: string) => {
    setActiveItem(parentId);
    navigate(subItem.path);
    // Ensure parent is expanded
    if (!expandedItems.has(parentId)) {
      const newExpanded = new Set(expandedItems);
      newExpanded.add(parentId);
      setExpandedItems(newExpanded);
      if (parentId === 'real-time') {
        onRealTimeExpand?.(true);
      }
    }
  };

  return (
    <div className="sidebar">
      <div className="sidebar-content">
        {menuItems.map((item) => (
          <div key={item.id}>
            <button
              className={`sidebar-item ${activeItem === item.id ? 'active' : ''} ${expandedItems.has(item.id) ? 'expanded' : ''}`}
              onClick={() => handleItemClick(item)}
            >
              <span className="sidebar-icon">{item.icon}</span>
              <span className="sidebar-label">{item.label}</span>
              {item.isExpandable && (
                <span className="sidebar-chevron">
                  {expandedItems.has(item.id) ? '▼' : '▶'}
                </span>
              )}
            </button>
            {item.isExpandable && item.subItems && expandedItems.has(item.id) && (
              <div className="sidebar-submenu">
                {item.subItems.map((subItem) => {
                  const isActive = location.pathname === subItem.path || location.pathname.startsWith(subItem.path + '/');
                  return (
                    <button
                      key={subItem.id}
                      className={`sidebar-subitem ${isActive ? 'active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSubItemClick(subItem, item.id);
                      }}
                    >
                      {subItem.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

