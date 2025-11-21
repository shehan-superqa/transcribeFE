import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Sidebar.css';

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  isExpandable?: boolean;
}

const menuItems: MenuItem[] = [
  { id: 'audio-to-text', label: 'Audio to Text', icon: '🎵', path: '/dashboard/voice/transcribe' },
  { id: 'video-to-text', label: 'Video to Text', icon: '🎬', path: '/dashboard/voice/transcribe' },
  { id: 'video-generation', label: 'Video Generation', icon: '🎥', path: '/tools/video-generation' },
  { id: 'video-dubber', label: 'Video Dubber', icon: '🎤', path: '/tools/video-dubber' },
  { id: 'video-translator', label: 'Video Translator', icon: '🌐', path: '/tools/video-translator' },
  { id: 'audio-translator', label: 'Audio Translator', icon: '🔊', path: '/tools/audio-translator' },
  { id: 'subtitle-generator', label: 'Subtitle Generator', icon: '📝', path: '/tools/subtitle-generator' },
  { id: 'free-tools', label: 'Free Tools', icon: '🎁', path: '/tools/free-tools' },
  { id: 'real-time', label: 'Real-Time', icon: '⚡', path: '/tools/real-time', isExpandable: true },
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
    const isRealTimeSubPage = path.includes('/tools/live-transcribe') || 
                              path.includes('/tools/web-captioner') || 
                              path.includes('/tools/real-time-translator') || 
                              path.includes('/tools/live-voice-translator');
    
    // If on /tools or real-time sub-page, show Real-Time as active and expanded
    if (path === '/tools' || path === '/tools/' || isRealTimeSubPage) {
      setActiveItem('real-time');
      setExpandedItems(prev => {
        if (!prev.has('real-time')) {
          const newExpanded = new Set(prev);
          newExpanded.add('real-time');
          onRealTimeExpand?.(true);
          return newExpanded;
        }
        return prev;
      });
    } else {
      const currentItem = menuItems.find(item => 
        path === item.path || 
        path.startsWith(item.path + '/')
      );
      if (currentItem && !currentItem.isExpandable) {
        setActiveItem(currentItem.id);
        // Close Real-Time if another item is selected
        setExpandedItems(prev => {
          if (prev.has('real-time')) {
            const newExpanded = new Set(prev);
            newExpanded.delete('real-time');
            onRealTimeExpand?.(false);
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
      onRealTimeExpand?.(newExpanded.has(item.id));
    } else {
      // Navigate for regular items
      setActiveItem(item.id);
      navigate(item.path);
      // Close Real-Time if another item is selected
      if (expandedItems.has('real-time')) {
        const newExpanded = new Set(expandedItems);
        newExpanded.delete('real-time');
        setExpandedItems(newExpanded);
        onRealTimeExpand?.(false);
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
          </div>
        ))}
      </div>
    </div>
  );
}

