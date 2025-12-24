import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Drawer, useMediaQuery, IconButton } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useTheme } from '../contexts/ThemeContext';
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
    id: 'audio-to-text', 
    label: 'Audio Tools', 
    icon: '🎵', 
    path: '/voice/transcribe',
    isExpandable: true,
    subItems: [
      { id: 'transcribe', label: 'Transcribe (Single & Batch)', path: '/voice/transcribe' },
      { id: 'live', label: 'Live Mic VAD', path: '/voice/live' },
      { id: 'tts', label: 'Text-to-Speech', path: '/voice/tts' },
      { id: 'audio-translator', label: 'Audio Translator', path: '/voice/translator' },
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
      { id: 'ads', label: 'Video Ads Generator', path: '/video/ads' },
      { id: 'to-text', label: 'Video to Text', path: '/video/to-text' },
      { id: 'dubber', label: 'Video Dubber', path: '/video/dubber' },
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

// Bottom menu items (History and Settings)
const bottomMenuItems: MenuItem[] = [
  { id: 'history', label: 'History', icon: '📜', path: '/voice/history' },
  { id: 'settings', label: 'Settings', icon: '⚙️', path: '/voice/settings' },
];

interface SidebarProps {
  onRealTimeExpand?: (expanded: boolean) => void;
  open?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ onRealTimeExpand, open, onClose }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [activeItem, setActiveItem] = useState<string>('');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set()); // Default: all collapsed
  const [userCollapsedItems, setUserCollapsedItems] = useState<Set<string>>(new Set());
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isManuallyTogglingRef = useRef<string | null>(null);
  
  // Get sidebar state from window (set by Header component) if open/onClose not provided
  const [sidebarOpen, setSidebarOpen] = useState(open ?? false);
  
  // Listen for custom events for immediate updates (primary method)
  useEffect(() => {
    const handleSidebarToggle = (event: CustomEvent) => {
      if (open === undefined && event.detail?.open !== undefined) {
        // Use functional update to avoid dependency issues
        setSidebarOpen(event.detail.open);
      }
    };
    
    window.addEventListener('sidebarToggle' as any, handleSidebarToggle as EventListener);
    
    // Also check initial state
    const state = (window as any).__sidebarState;
    if (state && open === undefined) {
      setSidebarOpen(state.open);
    }
    
    return () => {
      window.removeEventListener('sidebarToggle' as any, handleSidebarToggle as EventListener);
    };
  }, [open]);

  // Fallback: Listen for sidebar state changes from Header via window state
  useEffect(() => {
    if (open !== undefined) return; // Don't sync if prop is provided
    
    const checkSidebarState = () => {
      const state = (window as any).__sidebarState;
      if (state) {
        // Use functional update to get latest state
        setSidebarOpen(prev => {
          if (state.open !== prev) {
            return state.open;
          }
          return prev;
        });
      }
    };
    
    // Check immediately
    checkSidebarState();
    
    // Set up interval for state sync (fallback method)
    const interval = setInterval(checkSidebarState, 100);
    
    return () => {
      clearInterval(interval);
    };
  }, [open]);
  
  // Use open prop if provided, otherwise use local sidebarOpen state
  // The sidebarOpen state is kept in sync via useEffect hooks above
  const isOpen = open !== undefined ? open : sidebarOpen;
  
  const handleClose = onClose || (() => {
    const state = (window as any).__sidebarState;
    if (state) {
      state.setOpen(false); // This will trigger the Header's state update
    }
    setSidebarOpen(false);
  });

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


  const handleSubItemClick = (subItem: SubMenuItem, parentId: string) => {
    setActiveItem(parentId);
    navigate(subItem.path);
    // Close drawer on mobile when item is selected
    if (isMobile) {
      handleClose();
    }
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
      // Close drawer on mobile when item is selected
      if (isMobile) {
        handleClose();
      }
    }
  };

  // Auto-scroll to show expanded submenu items
  useEffect(() => {
    const sidebar = sidebarRef.current;
    if (!sidebar) return;

    // Find the last expanded item and scroll it into view
    const expandedArray = Array.from(expandedItems);
    if (expandedArray.length > 0) {
      const lastExpandedId = expandedArray[expandedArray.length - 1];
      const menuItemElement = sidebar.querySelector(`[data-menu-id="${lastExpandedId}"]`);
      if (menuItemElement) {
        // Use setTimeout to ensure DOM has updated with submenu
        setTimeout(() => {
          menuItemElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
      }
    }
  }, [expandedItems]);

  // Handle scroll events to prevent propagation to parent
  useEffect(() => {
    const sidebar = sidebarRef.current;
    if (!sidebar) return;

    const handleWheel = (e: WheelEvent) => {
      const { scrollTop, scrollHeight, clientHeight } = sidebar;
      const deltaY = e.deltaY;
      
      // Calculate if sidebar can scroll
      const canScrollUp = scrollTop > 0;
      const canScrollDown = scrollTop < scrollHeight - clientHeight - 1;
      
      // If scrolling down and can scroll down, or scrolling up and can scroll up
      if ((deltaY > 0 && canScrollDown) || (deltaY < 0 && canScrollUp)) {
        // Sidebar can scroll - prevent page from scrolling but allow sidebar to scroll
      e.stopPropagation();
        // Don't prevent default - let browser handle sidebar scrolling naturally
      }
      // If at boundaries, allow event to propagate (page can scroll)
    };

    // Use capture phase to catch the event early
    // Non-passive allows us to prevent default
    sidebar.addEventListener('wheel', handleWheel, { passive: false, capture: true });

    return () => {
      sidebar.removeEventListener('wheel', handleWheel, { capture: true });
    };
  }, []);

  const sidebarContent = (
    <div className="sidebar" ref={sidebarRef}>
      <div className="sidebar-content">
        {menuItems.map((item) => (
          <div key={item.id} data-menu-id={item.id}>
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

  // Mobile: Render as Drawer
  if (isMobile) {
    return (
      <Drawer
        anchor="left"
        open={isOpen}
        onClose={handleClose}
        ModalProps={{
          keepMounted: true, // Better mobile performance
        }}
        sx={{
          display: { xs: 'block', sm: 'block', md: 'none' }, // Show on mobile and tablet, hide on desktop
          zIndex: 1200, // Below header (zIndex: 1000-2000)
          '& .MuiBackdrop-root': {
            top: 'var(--header-height, 64px)', // Position below header
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          },
          '& .MuiDrawer-paper': {
            width: { xs: 280, sm: 300 },
            maxWidth: { xs: '85vw', sm: '90vw' },
            boxSizing: 'border-box',
            zIndex: 1201,
            backgroundColor: theme.palette.mode === 'dark' ? '#121212' : '#ffffff',
            borderRight: `1px solid ${theme.palette.divider}`,
            top: 'var(--header-height, 64px)', // Position below header
            height: 'calc(100% - var(--header-height, 64px))',
            display: 'flex',
            flexDirection: 'column',
            transition: 'transform 0.3s ease-in-out', // Smooth slide animation
          },
        }}
      >
        <div style={{ 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {sidebarContent}
        </div>
      </Drawer>
    );
  }

  // Desktop: Render as fixed sidebar (always visible)
  return sidebarContent;
}

