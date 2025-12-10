import { useState, useEffect, useRef } from 'react';
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
    ]
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

// Bottom menu items (History and Settings)
const bottomMenuItems: MenuItem[] = [
  { id: 'history', label: 'History', icon: '📜', path: '/voice/history' },
  { id: 'settings', label: 'Settings', icon: '⚙️', path: '/voice/settings' },
];

interface SidebarProps {
  onRealTimeExpand?: (expanded: boolean) => void;
}

export default function Sidebar({ onRealTimeExpand }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeItem, setActiveItem] = useState<string>('');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set(['real-time']));
  const [userCollapsedItems, setUserCollapsedItems] = useState<Set<string>>(new Set());
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isManuallyTogglingRef = useRef<string | null>(null);

  useEffect(() => {
    const path = location.pathname;
    
    // Skip auto-expansion if we're in the middle of a manual toggle
    if (isManuallyTogglingRef.current) {
      // Clear the flag after a short delay to allow state updates to complete
      setTimeout(() => {
        isManuallyTogglingRef.current = null;
      }, 100);
      return;
    }
    
    // Check if path matches any sub-item or bottom menu item
    let parentItem: MenuItem | undefined;
    let activeSubItem: string | undefined;
    
    // First check bottom menu items
    for (const item of bottomMenuItems) {
      if (path === item.path || path.startsWith(item.path + '/')) {
        parentItem = item;
        break;
      }
    }
    
    // Then check main menu items
    if (!parentItem) {
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
    }
    
    if (parentItem) {
      setActiveItem(parentItem.id);
      if (parentItem.isExpandable) {
        // Only auto-expand if user hasn't explicitly collapsed it
        setExpandedItems(prev => {
          if (!prev.has(parentItem!.id) && !userCollapsedItems.has(parentItem!.id)) {
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
  }, [location.pathname, onRealTimeExpand, userCollapsedItems]);

  const handleItemClick = (item: MenuItem) => {
    if (item.isExpandable) {
      // Set flag to prevent auto-expansion during manual toggle
      isManuallyTogglingRef.current = item.id;
      
      // Toggle expansion for expandable items
      const newExpanded = new Set(expandedItems);
      const wasExpanded = newExpanded.has(item.id);
      
      if (wasExpanded) {
        // User is closing the dropdown
        newExpanded.delete(item.id);
        setUserCollapsedItems(prev => {
          const newCollapsed = new Set(prev);
          newCollapsed.add(item.id);
          return newCollapsed;
        });
      } else {
        // User is opening the dropdown
        newExpanded.add(item.id);
        setUserCollapsedItems(prev => {
          const newCollapsed = new Set(prev);
          newCollapsed.delete(item.id);
          return newCollapsed;
        });
      }
      
      setExpandedItems(newExpanded);
      setActiveItem(item.id);
      if (item.id === 'real-time') {
        onRealTimeExpand?.(newExpanded.has(item.id));
      }
      // Navigate to default path if collapsing
      if (!newExpanded.has(item.id) && item.path) {
        // Use setTimeout to ensure state updates complete before navigation
        setTimeout(() => {
          navigate(item.path);
        }, 0);
      } else {
        // Clear the flag after state updates if not navigating
        setTimeout(() => {
          isManuallyTogglingRef.current = null;
        }, 100);
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
    // Ensure parent is expanded and remove from collapsed items
    if (!expandedItems.has(parentId)) {
      const newExpanded = new Set(expandedItems);
      newExpanded.add(parentId);
      setExpandedItems(newExpanded);
      // Remove from userCollapsedItems since user is navigating to a sub-item
      setUserCollapsedItems(prev => {
        const newCollapsed = new Set(prev);
        newCollapsed.delete(parentId);
        return newCollapsed;
      });
      if (parentId === 'real-time') {
        onRealTimeExpand?.(true);
      }
    } else {
      // Even if already expanded, ensure it's not in collapsed items
      setUserCollapsedItems(prev => {
        if (prev.has(parentId)) {
          const newCollapsed = new Set(prev);
          newCollapsed.delete(parentId);
          return newCollapsed;
        }
        return prev;
      });
    }
  };

  // Handle scroll events to prevent propagation to parent
  useEffect(() => {
    const sidebar = sidebarRef.current;
    if (!sidebar) return;

    const handleWheel = (e: WheelEvent) => {
      const { scrollTop, scrollHeight, clientHeight } = sidebar;
      const isScrollingUp = e.deltaY < 0;
      const isScrollingDown = e.deltaY > 0;
      
      // Check if we're at the top and trying to scroll up
      const isAtTop = scrollTop <= 0 && isScrollingUp;
      // Check if we're at the bottom and trying to scroll down
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1 && isScrollingDown;
      
      // Always stop propagation to prevent parent scrolling
      e.stopPropagation();
      
      // If we're at the boundaries, prevent default to stop the scroll
      if (isAtTop || isAtBottom) {
        e.preventDefault();
      }
    };

    // Use capture phase to catch the event early
    sidebar.addEventListener('wheel', handleWheel, { passive: false, capture: true });

    return () => {
      sidebar.removeEventListener('wheel', handleWheel, { capture: true });
    };
  }, []);

  return (
    <div className="sidebar" ref={sidebarRef}>
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
        
        {/* Bottom menu items (History and Settings) */}
        <div className="sidebar-bottom">
          {bottomMenuItems.map((item) => {
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            return (
              <button
                key={item.id}
                className={`sidebar-item ${activeItem === item.id || isActive ? 'active' : ''}`}
                onClick={() => handleItemClick(item)}
              >
                <span className="sidebar-icon">{item.icon}</span>
                <span className="sidebar-label">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

