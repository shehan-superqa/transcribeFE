import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useTheme } from '../contexts/ThemeContext';
import { FiMenu, FiX, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { IconButton } from '@mui/material';
import { Brightness4, Brightness7 } from '@mui/icons-material';
import EnergyPointsBalance from './common/EnergyPointsBalance';

// -------------------------
// 1. NavLink Component
// -------------------------
const NavLink = ({ to, children, onClick, theme }: { to?: string; children: React.ReactNode; onClick?: () => void; theme?: any }) => {
  const [hover, setHover] = useState(false);
  const textColor = theme?.palette?.mode === 'dark' ? '#ffffff' : '#111827';
  const hoverBg = theme?.palette?.mode === 'dark' ? '#1a1a1a' : '#f3f4f6';

  const commonStyles = {
    fontFamily: "'Inter', sans-serif",
    fontWeight: 400,
    fontSize: 'clamp(0.75rem, 2vw, 0.8rem)',
    textDecoration: 'none',
    color: textColor,
    backgroundColor: hover ? hoverBg : 'transparent',
    padding: 'clamp(0.35rem, 1vw, 0.4rem) clamp(0.5rem, 1.5vw, 0.6rem)',
    borderRadius: '4px',
    transition: 'all 0.2s ease-in-out',
    display: 'flex',
    alignItems: 'center',
    whiteSpace: 'nowrap' as const,
    flexShrink: 0,
    lineHeight: '1.5',
  };

  if (to) {
    return (
      <Link
        to={to}
        style={commonStyles}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        {children}
      </Link>
    );
  }

  return (
    <span
      onClick={onClick}
      style={{ ...commonStyles, cursor: 'pointer' }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {children}
    </span>
  );
};

// -------------------------
// 2. PrimaryButton Component
// -------------------------
const PrimaryButton = ({ onClick, children }: { onClick?: () => void; children: React.ReactNode }) => {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: "'Inter', sans-serif",
        fontWeight: 500,
        fontSize: 'clamp(0.75rem, 2vw, 0.8rem)',
        padding: 'clamp(0.35rem, 1vw, 0.4rem) clamp(0.75rem, 2vw, 1rem)',
        height: 'auto',
        lineHeight: '1.5',
        touchAction: 'manipulation',
        backgroundColor: hover ? '#e0e0e0' : '#ffffff',
        color: '#000000',
        border: 'none',
        borderRadius: '9999px',
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        display: 'flex',
        alignItems: 'center',
        gap: '0.25rem',
        flexShrink: 0,
        whiteSpace: 'nowrap' as const,
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {children}
    </button>
  );
};

// -------------------------
// 3. Dropdown Components
// -------------------------
const SectionItem = ({ to, title, description, theme }: { to: string; title: string; description: string; theme?: any }) => {
  const [hover, setHover] = useState(false);
  const hoverBg = theme?.palette?.mode === 'dark' ? '#1a1a1a' : '#f3f4f6';
  const textColor = theme?.palette?.mode === 'dark' ? '#ffffff' : '#111827';
  const secondaryText = theme?.palette?.mode === 'dark' ? '#aaaaaa' : '#6b7280';
  
  return (
    <Link
      to={to}
      style={{
        textDecoration: 'none',
        padding: 'clamp(0.5rem, 1.5vw, 0.6rem) clamp(0.875rem, 2vw, 1rem)',
        minHeight: '44px',
        touchAction: 'manipulation',
        backgroundColor: hover ? hoverBg : 'transparent',
        transition: 'background-color 0.2s ease-in-out',
        display: 'block',
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <h4 style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: 'clamp(0.8rem, 2vw, 0.85rem)', color: textColor, margin: 0 }}>
        {title}
      </h4>
      <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: 'clamp(0.65rem, 1.8vw, 0.7rem)', color: secondaryText, margin: '0.2rem 0 0 0' }}>
        {description}
      </p>
    </Link>
  );
};

const DropdownSection = ({ title, children, theme }: { title: string; children: React.ReactNode; theme?: any }) => {
  const borderColor = theme?.palette?.mode === 'dark' ? '#1a1a1a' : '#e5e7eb';
  const textColor = theme?.palette?.mode === 'dark' ? '#aaaaaa' : '#6b7280';
  
  return (
    <div style={{ minWidth: 'clamp(180px, 25vw, 220px)', flexShrink: 0, borderLeft: `1px solid ${borderColor}`, padding: '0.5rem 0' }}>
      <h3 style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 'clamp(0.7rem, 1.8vw, 0.75rem)', color: textColor, textTransform: 'uppercase', padding: '0 clamp(0.75rem, 2vw, 1rem) 0.5rem clamp(0.75rem, 2vw, 1rem)', margin: 0 }}>
        {title}
      </h3>
      {children}
    </div>
  );
};

const HighlightedItem = ({ to, title, description }: { to: string; title: string; description: string }) => {
  const [hover, setHover] = useState(false);
  const MODERN_GRADIENT = 'linear-gradient(135deg, #0077B6 0%, #00B4D8 40%, #480CA8 100%)';
  const HOVER_GRADIENT = 'linear-gradient(135deg, #00B4D8 0%, #0077B6 40%, #5F0DFF 100%)';

  return (
    <Link
      to={to}
      style={{
        textDecoration: 'none',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        width: 'clamp(150px, 20vw, 180px)',
        minHeight: 'clamp(140px, 18vw, 180px)',
        padding: 'clamp(1rem, 2.5vw, 1.25rem)',
        borderRadius: '8px',
        background: hover ? HOVER_GRADIENT : MODERN_GRADIENT,
        boxShadow: hover ? '0 4px 20px rgba(0, 119, 182, 0.7)' : '0 4px 10px rgba(0,0,0,0.5)',
        transition: 'all 0.3s ease-in-out',
        flexShrink: 0,
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <h3 style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 'clamp(0.95rem, 2.5vw, 1.1rem)', color: '#ffffff', margin: '0 0 0.5rem 0' }}>{title}</h3>
      <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: 'clamp(0.7rem, 1.8vw, 0.75rem)', color: '#e0e0e0', margin: 0 }}>{description}</p>
    </Link>
  );
};

const ToolsDropdown = ({ isMobile, theme }: { isMobile: boolean; theme?: any }) => {
  const dropdownBg = theme?.palette?.mode === 'dark' ? '#0d0d0d' : '#ffffff';
  const scrollbarTrack = theme?.palette?.mode === 'dark' ? '#0d0d0d' : '#f3f4f6';
  const scrollbarThumb = theme?.palette?.mode === 'dark' ? '#333333' : '#d1d5db';
  const scrollbarThumbHover = theme?.palette?.mode === 'dark' ? '#444444' : '#9ca3af';
  
  if (isMobile) {
    return (
      <div style={{ backgroundColor: dropdownBg, borderRadius: '8px', boxShadow: theme?.palette?.mode === 'dark' ? '0 8px 20px rgba(0,0,0,0.5)' : '0 8px 20px rgba(0,0,0,0.1)', overflowY: 'auto', overflowX: 'hidden', padding: '0.5rem', width: '100%', maxHeight: 'calc(100vh - 250px)' }}>
        <HighlightedItem to="/voice/transcribe" title="Audio to Text" description="Convert audio files to accurate text transcriptions" />
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: '0.5rem' }}>
          <DropdownSection title="VOICE (AUDIO) TOOLS" theme={theme}>
            <SectionItem to="/voice/transcribe" title="Audio to Text" description="Convert audio files to text" theme={theme} />
            <SectionItem to="/voice/batch" title="Batch Processing" description="Process multiple audio files" theme={theme} />
            <SectionItem to="/voice/live" title="Live Transcription" description="Real-time speech-to-text" theme={theme} />
            <SectionItem to="/voice/tts" title="Text to Speech" description="Convert text to audio" theme={theme} />
            <SectionItem to="/voice/translator" title="Audio Translator" description="Translate audio content" theme={theme} />
            <SectionItem to="/voice/live-transcribe" title="Live Transcribe" description="Real-time transcription" theme={theme} />
            <SectionItem to="/voice/live-captioner" title="Web Captioner" description="Generate live captions" theme={theme} />
            <SectionItem to="/voice/live-translator" title="Real-Time Translator" description="Translate speech in real-time" theme={theme} />
            <SectionItem to="/voice/live-voice-translator" title="Live Voice Translator" description="Translate voice conversations" theme={theme} />
          </DropdownSection>
          <DropdownSection title="VIDEO TOOLS" theme={theme}>
            <SectionItem to="/video/text-to-video" title="Text to Video" description="Generate videos from text prompts" theme={theme} />
            <SectionItem to="/video/ads" title="Video Ads Generator" description="Create high-converting video ads with AI" theme={theme} />
            <SectionItem to="/video/to-text" title="Video to Text" description="Extract text from video files" theme={theme} />
            <SectionItem to="/video/dubber" title="Video Dubber" description="Dub videos with new audio" theme={theme} />
            <SectionItem to="/video/translator" title="Video Translator" description="Translate video content" theme={theme} />
            <SectionItem to="/video/subtitle-generator" title="Subtitle Generator" description="Create subtitles for videos" theme={theme} />
          </DropdownSection>
        </div>
      </div>
    );
  }
  
  return (
    <div className="tools-dropdown-scroll" style={{ display: 'flex', backgroundColor: dropdownBg, borderRadius: '8px', boxShadow: theme?.palette?.mode === 'dark' ? '0 8px 20px rgba(0,0,0,0.5)' : '0 8px 20px rgba(0,0,0,0.1)', overflowX: 'auto', overflowY: 'auto', minWidth: 'clamp(280px, 80vw, 600px)', maxWidth: 'clamp(90vw, 900px, 95vw)', maxHeight: 'calc(100vh - 150px)', padding: '0.5rem', scrollbarWidth: 'thin', scrollbarColor: `${scrollbarThumb} ${scrollbarTrack}` }}>
      <HighlightedItem to="/voice/transcribe" title="Audio to Text" description="Convert audio files to accurate text transcriptions instantly." />
      <div style={{ display: 'flex', flexShrink: 0 }}>
        <DropdownSection title="VOICE (AUDIO) TOOLS" theme={theme}>
          <SectionItem to="/voice/transcribe" title="Audio to Text" description="Convert audio files to text" />
          <SectionItem to="/voice/batch" title="Batch Processing" description="Process multiple audio files" />
          <SectionItem to="/voice/live" title="Live Transcription" description="Real-time speech-to-text" />
          <SectionItem to="/voice/tts" title="Text to Speech" description="Convert text to audio" />
          <SectionItem to="/voice/translator" title="Audio Translator" description="Translate audio content" />
          <SectionItem to="/voice/live-transcribe" title="Live Transcribe" description="Real-time transcription" />
          <SectionItem to="/voice/live-captioner" title="Web Captioner" description="Generate live captions" />
          <SectionItem to="/voice/live-translator" title="Real-Time Translator" description="Translate speech in real-time" />
          <SectionItem to="/voice/live-voice-translator" title="Live Voice Translator" description="Translate voice conversations" />
        </DropdownSection>
        <DropdownSection title="VIDEO TOOLS" theme={theme}>
          <SectionItem to="/video/text-to-video" title="Text to Video" description="Generate videos from text prompts" theme={theme} />
          <SectionItem to="/video/ads" title="Video Ads Generator" description="Create high-converting video ads with AI" theme={theme} />
          <SectionItem to="/video/to-text" title="Video to Text" description="Extract text from video files" theme={theme} />
          <SectionItem to="/video/dubber" title="Video Dubber" description="Dub videos with new audio" theme={theme} />
          <SectionItem to="/video/translator" title="Video Translator" description="Translate video content" theme={theme} />
          <SectionItem to="/video/subtitle-generator" title="Subtitle Generator" description="Create subtitles for videos" theme={theme} />
        </DropdownSection>
      </div>
    </div>
  );
};

const ComplexDropdown = ({ isMobile, theme }: { isMobile: boolean; theme?: any }) => {
  const dropdownBg = theme?.palette?.mode === 'dark' ? '#0d0d0d' : '#ffffff';
  const scrollbarTrack = theme?.palette?.mode === 'dark' ? '#0d0d0d' : '#f3f4f6';
  const scrollbarThumb = theme?.palette?.mode === 'dark' ? '#333333' : '#d1d5db';
  const textColor = theme?.palette?.mode === 'dark' ? '#aaaaaa' : '#6b7280';
  
  if (isMobile) {
    return (
      <div style={{ backgroundColor: dropdownBg, borderRadius: '8px', boxShadow: theme?.palette?.mode === 'dark' ? '0 8px 20px rgba(0,0,0,0.5)' : '0 8px 20px rgba(0,0,0,0.1)', overflowY: 'auto', overflowX: 'hidden', padding: '0.5rem', width: '100%', maxHeight: 'calc(100vh - 250px)' }}>
        <HighlightedItem to="/pricing" title="Secure Comm." description="End-to-end encryption for all voice and data streams." />
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: '0.5rem' }}>
          <DropdownSection title="CORE FEATURES" theme={theme}>
            <SectionItem to="/images/generate" title="Image Generation" description="Generate high-quality images from text prompts using AI" theme={theme} />
            <SectionItem to="/video-generation" title="Video Generation" description="Create videos from text descriptions with advanced AI models" theme={theme} />
            <SectionItem to="/audio-generation" title="Audio Generation" description="Convert text to speech and generate audio content" theme={theme} />
            <SectionItem to="/pricing" title="Voice Biometrics" description="Verify user identity using unique voice prints (IVR)" theme={theme} />
            <SectionItem to="/pricing" title="Data Tokenization" description="Anonymize sensitive data in real-time conversations" theme={theme} />
            <div style={{ padding: '0.5rem 1rem 0.25rem 1rem' }}>
              <h3 style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: '0.75rem', color: textColor, textTransform: 'uppercase', margin: '0.5rem 0 0.25rem 0' }}>
                USE CASES
              </h3>
            </div>
            <SectionItem to="/pricing" title="Contact Center Security" description="Protect customer PII and meet compliance standards" theme={theme} />
            <SectionItem to="/pricing" title="Remote Work Security" description="Secure virtual meetings and team collaborations" theme={theme} />
          </DropdownSection>
        </div>
      </div>
    );
  }
  
  return (
    <div className="tools-dropdown-scroll" style={{ display: 'flex', backgroundColor: dropdownBg, borderRadius: '8px', boxShadow: theme?.palette?.mode === 'dark' ? '0 8px 20px rgba(0,0,0,0.5)' : '0 8px 20px rgba(0,0,0,0.1)', overflowX: 'auto', overflowY: 'auto', minWidth: 'clamp(280px, 80vw, 600px)', maxWidth: 'clamp(90vw, 900px, 95vw)', maxHeight: 'calc(100vh - 150px)', padding: '0.5rem', scrollbarWidth: 'thin', scrollbarColor: `${scrollbarThumb} ${scrollbarTrack}` }}>
      <HighlightedItem to="/pricing" title="Secure Comm." description="End-to-end encryption for all voice and data streams." />
      <div style={{ display: 'flex', flexShrink: 0 }}>
        <DropdownSection title="CORE FEATURES" theme={theme}>
          <SectionItem to="/image-generation" title="Image Generation" description="Generate high-quality images from text prompts using AI" theme={theme} />
          <SectionItem to="/video-generation" title="Video Generation" description="Create videos from text descriptions with advanced AI models" theme={theme} />
          <SectionItem to="/audio-generation" title="Audio Generation" description="Convert text to speech and generate audio content" theme={theme} />
          <SectionItem to="/pricing" title="Voice Biometrics" description="Verify user identity using unique voice prints (IVR)" theme={theme} />
          <SectionItem to="/pricing" title="Data Tokenization" description="Anonymize sensitive data in real-time conversations" theme={theme} />
          <div style={{ padding: '0.5rem 1rem 0.25rem 1rem' }}>
            <h3 style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: '0.75rem', color: textColor, textTransform: 'uppercase', margin: '0.5rem 0 0.25rem 0' }}>
              USE CASES
            </h3>
          </div>
          <SectionItem to="/pricing" title="Contact Center Security" description="Protect customer PII and meet compliance standards" theme={theme} />
          <SectionItem to="/pricing" title="Remote Work Security" description="Secure virtual meetings and team collaborations" theme={theme} />
        </DropdownSection>
      </div>
    </div>
  );
};

// 4. Header Component
// -------------------------
export default function Header() {
  const { user, signOut, refreshUser } = useAuth();
  const { mode, toggleTheme, theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [productDropdownOpen, setProductDropdownOpen] = useState(false);
  const [toolsDropdownOpen, setToolsDropdownOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(typeof window !== 'undefined' && window.innerWidth > 1024);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth <= 768);
  const toolsDropdownRef = useRef<HTMLDivElement>(null);
  const [toolsDropdownPosition, setToolsDropdownPosition] = useState<React.CSSProperties>({});

  // Refresh user data when navigating to dashboard after login
  useEffect(() => {
    const shouldRefresh = location.pathname.startsWith('/voice/') || 
                          location.pathname.startsWith('/video/') || 
                          location.pathname.startsWith('/dashboard');
    
    if (shouldRefresh && !user) {
      // Try to refresh user data if we're on a protected route but user is null
      refreshUser().catch(error => {
        console.error('Failed to refresh user in header:', error);
      });
    }
  }, [location.pathname, user, refreshUser]);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth > 1024);
      setIsMobile(window.innerWidth <= 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Prevent body scroll when dropdowns are open
  useEffect(() => {
    if (productDropdownOpen || toolsDropdownOpen || mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [productDropdownOpen, toolsDropdownOpen, mobileOpen]);

  useEffect(() => {
    if (!toolsDropdownOpen || !isDesktop || !toolsDropdownRef.current) {
      setToolsDropdownPosition({});
      return;
    }

    const calculatePosition = () => {
      if (!toolsDropdownRef.current) return;
      
      const rect = toolsDropdownRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const dropdownMaxWidth = 900;
      const dropdownMaxHeight = viewportHeight - rect.bottom - 20; // Leave 20px padding from bottom
      const padding = 32; // 2rem
      
      // Calculate if dropdown would overflow on the right
      const spaceOnRight = viewportWidth - rect.right;
      
      const positionStyle: React.CSSProperties = {
        zIndex: 201,
        maxHeight: `${Math.max(200, Math.min(dropdownMaxHeight, window.innerHeight - 150))}px`, // Constrain to viewport
      };
      
      if (spaceOnRight < dropdownMaxWidth + padding) {
        // Align to right edge of viewport with padding
        positionStyle.position = 'fixed';
        positionStyle.top = `${rect.bottom + 4}px`;
        positionStyle.right = `${padding}px`;
        positionStyle.maxWidth = `${viewportWidth - padding * 2}px`;
      } else {
        // Position normally below trigger
        positionStyle.position = 'absolute';
        positionStyle.top = '100%';
        positionStyle.left = '0';
      }
      
      setToolsDropdownPosition(positionStyle);
    };

    calculatePosition();
    window.addEventListener('resize', calculatePosition);
    window.addEventListener('scroll', calculatePosition, true);
    
    return () => {
      window.removeEventListener('resize', calculatePosition);
      window.removeEventListener('scroll', calculatePosition, true);
    };
  }, [toolsDropdownOpen, isDesktop]);


  const handleToggleMobile = () => {
    setMobileOpen(!mobileOpen);
    setProductDropdownOpen(false);
    setToolsDropdownOpen(false);
  };

  const handleOpenProductDropdown = () => isDesktop && setProductDropdownOpen(true);
  const handleCloseProductDropdown = () => isDesktop && setProductDropdownOpen(false);
  const handleToggleProductDropdown = () => !isDesktop && setProductDropdownOpen(!productDropdownOpen);

  const handleOpenToolsDropdown = () => isDesktop && setToolsDropdownOpen(true);
  const handleCloseToolsDropdown = () => isDesktop && setToolsDropdownOpen(false);
  const handleToggleToolsDropdown = () => !isDesktop && setToolsDropdownOpen(!toolsDropdownOpen);

  // Theme-aware styles - define before using
  const headerBg = theme.palette.mode === 'dark' ? '#000' : '#ffffff';
  const headerBorder = theme.palette.mode === 'dark' ? '#1a1a1a' : '#e5e7eb';
  const textColor = theme.palette.mode === 'dark' ? '#ffffff' : '#111827';
  const dropdownBg = theme.palette.mode === 'dark' ? '#0d0d0d' : '#ffffff';
  const dropdownBorder = theme.palette.mode === 'dark' ? '#1a1a1a' : '#e5e7eb';
  const hoverBg = theme.palette.mode === 'dark' ? '#1a1a1a' : '#f3f4f6';
  const secondaryText = theme.palette.mode === 'dark' ? '#aaaaaa' : '#6b7280';

  const styles = {
    header: { backgroundColor: headerBg, borderBottom: `1px solid ${headerBorder}`, position: 'sticky' as const, top: 0, zIndex: 200, padding: 'clamp(0.5rem, 1.5vw, 0.75rem) clamp(1rem, 3vw, 2rem)', overflowX: 'hidden' as const, maxWidth: '100vw', width: '100%' },
    headerMobile: { backgroundColor: headerBg, borderBottom: `1px solid ${headerBorder}`, position: 'sticky' as const, top: 0, zIndex: 200, padding: 'clamp(0.5rem, 1.5vw, 0.75rem) clamp(0.75rem, 2vw, 1rem)', overflowX: 'hidden' as const, maxWidth: '100vw', width: '100%' },
    container: { maxWidth: '1448px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '0 clamp(0.5rem, 2vw, 1rem)', flexWrap: 'nowrap' as const, overflowX: 'hidden' as const, minWidth: 0 },
    leftNavSection: { display: 'flex', alignItems: 'center', gap: 'clamp(1rem, 3vw, 2.5rem)', flexWrap: 'nowrap' as const, flexShrink: 0, minWidth: 0, overflowX: 'hidden' as const },
    logo: { display: 'flex', alignItems: 'center', textDecoration: 'none', flexShrink: 0 },
    logoSvgContainer: { marginRight: '0.75rem', flexShrink: 0 },
    logoText: { fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 'clamp(1rem, 3vw, 1.2rem)', color: textColor, letterSpacing: '0.5px', whiteSpace: 'nowrap' as const },
    desktopNavLinks: { display: 'flex', alignItems: 'center' as const, gap: 'clamp(0.75rem, 2vw, 1.25rem)', flexWrap: 'nowrap' as const, flexShrink: 0, minWidth: 0, overflowX: 'hidden' as const },
    productDropdownContainer: { position: 'relative' as const, display: 'flex', alignItems: 'center' },
    productDropdownMenu: { position: 'absolute' as const, top: '100%', left: '0', paddingTop: '4px', zIndex: 201, overflow: 'visible', maxWidth: 'calc(100vw - 2rem)', maxHeight: 'calc(100vh - 150px)' },
    productDropdownMenuMobile: { position: 'absolute' as const, top: '100%', left: '0', paddingTop: '4px', zIndex: 201, width: '100%' },
    rightAuthSection: { display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'nowrap' as const, flexShrink: 0, minWidth: 0, overflowX: 'hidden' as const },
    mobileMenuIcon: { cursor: 'pointer' },
    mobileMenu: { display: 'flex', flexDirection: 'column' as const, gap: '0.6rem', backgroundColor: headerBg, padding: '1rem 2rem', borderTop: `1px solid ${headerBorder}`, maxHeight: 'calc(100vh - 80px)', overflowY: 'auto' as const, overflowX: 'hidden' as const },
    mobileDropdownContainer: { position: 'relative' as const, width: '100%' },
    mobileDropdownMenu: { backgroundColor: dropdownBg, borderRadius: '4px', padding: '0.5rem 0', marginTop: '0.5rem', display: 'flex', flexDirection: 'column' as const, gap: '0', maxHeight: 'calc(100vh - 300px)', overflowY: 'auto' as const, overflowX: 'hidden' as const },
    simpleDropdownItem: { fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: '0.8rem', textDecoration: 'none', color: textColor, backgroundColor: 'transparent', padding: '0.4rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  };

  return (
    <>
      <style>{`
        .tools-dropdown-scroll::-webkit-scrollbar {
          height: 8px;
          width: 8px;
        }
        .tools-dropdown-scroll::-webkit-scrollbar-track {
          background: ${theme.palette.mode === 'dark' ? '#0d0d0d' : '#f3f4f6'};
          border-radius: 4px;
        }
        .tools-dropdown-scroll::-webkit-scrollbar-thumb {
          background: ${theme.palette.mode === 'dark' ? '#333333' : '#d1d5db'};
          border-radius: 4px;
        }
        .tools-dropdown-scroll::-webkit-scrollbar-thumb:hover {
          background: ${theme.palette.mode === 'dark' ? '#444444' : '#9ca3af'};
        }
      `}</style>
      <header style={isMobile ? styles.headerMobile : styles.header}>
        <div style={styles.container}>
        {/* Left Section */}
        <div style={styles.leftNavSection}>
          <Link to="/" style={styles.logo}>
            <div style={styles.logoSvgContainer}>
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <path d="M7 16C7 11.5817 10.5817 8 15 8H17C21.4183 8 25 11.5817 25 16V24" stroke="url(#logoGradient)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M15 24L17 24" stroke="url(#logoGradient)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                <defs>
                  <linearGradient id="logoGradient" x1="7" y1="8" x2="25" y2="24" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#4A90E2" />
                    <stop offset="1" stopColor="#50E3C2" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <span style={styles.logoText}>VoiceCrypt.ai</span>
          </Link>

          {/* Desktop Nav */}
          <nav style={{ ...styles.desktopNavLinks, display: isDesktop ? 'flex' : 'none' }}>
            <div style={styles.productDropdownContainer} onMouseEnter={handleOpenProductDropdown} onMouseLeave={handleCloseProductDropdown}>
              <NavLink onClick={handleToggleProductDropdown} theme={theme}>
                Product {productDropdownOpen ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
              </NavLink>
              {productDropdownOpen && isDesktop && <div style={{ ...styles.productDropdownMenu, maxWidth: 'calc(100vw - 2rem)' }}><ComplexDropdown isMobile={false} theme={theme} /></div>}
            </div>
            <div ref={toolsDropdownRef} style={styles.productDropdownContainer} onMouseEnter={handleOpenToolsDropdown} onMouseLeave={handleCloseToolsDropdown}>
              <NavLink onClick={handleToggleToolsDropdown} theme={theme}>
                Tools {toolsDropdownOpen ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
              </NavLink>
              {toolsDropdownOpen && isDesktop && <div style={{ ...(Object.keys(toolsDropdownPosition).length > 0 ? toolsDropdownPosition : styles.productDropdownMenu), maxWidth: 'calc(100vw - 2rem)' }}><ToolsDropdown isMobile={false} theme={theme} /></div>}
            </div>
            <NavLink to="/use-cases" theme={theme}>Use Cases</NavLink>
            <NavLink to="/integrations" theme={theme}>Integrations</NavLink>
            <NavLink to="/cases" theme={theme}>Cases</NavLink>
            <NavLink to="/academy" theme={theme}>Academy</NavLink>
            <NavLink to="/pricing" theme={theme}>Pricing</NavLink>
          </nav>
        </div>

        {/* Right Section */}
        <div style={{ ...styles.rightAuthSection, display: isDesktop ? 'flex' : 'none' }}>
          {/* Theme Switcher */}
          <IconButton
            onClick={toggleTheme}
            sx={{
              color: textColor,
              '&:hover': {
                backgroundColor: hoverBg,
              },
            }}
            aria-label="toggle theme"
          >
            {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
          </IconButton>
          
          {user ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginRight: '0.5rem', flexWrap: 'nowrap', flexShrink: 0, minWidth: 0, overflowX: 'hidden' as const }}>
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 'clamp(0.75rem, 2vw, 0.8rem)', color: textColor, fontWeight: 500, whiteSpace: 'nowrap', lineHeight: '1.5', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>
                  Welcome, {user?.name || user?.email}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                  <EnergyPointsBalance showLabel={false} />
                </div>
                {user.isEmailVerified ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.75rem', backgroundColor: '#d4edda', borderRadius: '9999px', flexShrink: 0 }}>
                    <FaCheckCircle style={{ color: '#155724', fontSize: '0.75rem' }} />
                    <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.7rem', color: '#155724', fontWeight: 500 }}>
                      Email verified
                    </span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.75rem', backgroundColor: '#fff3cd', borderRadius: '9999px', flexShrink: 0 }}>
                    <FaExclamationTriangle style={{ color: '#856404', fontSize: '0.75rem' }} />
                    <Link
                      to="/auth/verify-email"
                      style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.7rem', color: '#856404', fontWeight: 500, textDecoration: 'none' }}
                    >
                      Verify email
                    </Link>
                  </div>
                )}
              </div>
              <NavLink to="/voice/transcribe" theme={theme}>Dashboard</NavLink>
              <NavLink
                onClick={() => {
                  signOut();
                  navigate('/auth/login');
                }}
                theme={theme}
              >
                Sign Out
              </NavLink>
            </>
          ) : (
            <>
              <NavLink to="/auth/signup" theme={theme}>Sign up</NavLink>
              <NavLink to="/auth/login" theme={theme}>Sign in</NavLink>
            </>
          )}
          <PrimaryButton onClick={() => navigate('/demo')}>Watch a demo &gt;</PrimaryButton>
        </div>

        {/* Mobile Hamburger */}
        <div style={{ ...styles.mobileMenuIcon, display: isDesktop ? 'none' : 'block' }} onClick={handleToggleMobile}>
          {mobileOpen ? <FiX color="#fff" size={24} /> : <FiMenu color="#fff" size={24} />}
        </div>
      </div>

      {/* Mobile Menu */}
      {!isDesktop && mobileOpen && (
        <div style={styles.mobileMenu}>
          <div style={styles.mobileDropdownContainer}>
            <NavLink onClick={handleToggleProductDropdown}>
              Product {productDropdownOpen ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
            </NavLink>
            {productDropdownOpen && (
              <div style={styles.mobileDropdownMenu}>
                <ComplexDropdown isMobile={true} />
              </div>
            )}
          </div>
          <div style={styles.mobileDropdownContainer}>
            <NavLink onClick={handleToggleToolsDropdown}>
              Tools {toolsDropdownOpen ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
            </NavLink>
            {toolsDropdownOpen && (
              <div style={styles.mobileDropdownMenu}>
                <ToolsDropdown isMobile={true} />
              </div>
            )}
          </div>
          
          <NavLink to="/use-cases">Use Cases</NavLink>
          <NavLink to="/academy">Academy</NavLink>
          <NavLink to="/pricing">Pricing</NavLink>
          {user ? (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.5rem', width: '100%' }}>
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.85rem', color: '#ffffff', fontWeight: 500 }}>
                  Welcome, {user?.name || user?.email}
                </span>
                <EnergyPointsBalance showLabel={true} />
                {user.isEmailVerified ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.75rem', backgroundColor: '#d4edda', borderRadius: '9999px', width: 'fit-content' }}>
                    <FaCheckCircle style={{ color: '#155724', fontSize: '0.75rem' }} />
                    <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.7rem', color: '#155724', fontWeight: 500 }}>
                      Email verified
                    </span>
                  </div>
                ) : (
                  <Link 
                    to="/auth/verify-email"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.75rem', backgroundColor: '#fff3cd', borderRadius: '9999px', width: 'fit-content', textDecoration: 'none' }}
                  >
                    <FaExclamationTriangle style={{ color: '#856404', fontSize: '0.75rem' }} />
                    <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.7rem', color: '#856404', fontWeight: 500 }}>
                      Verify email
                    </span>
                  </Link>
                )}
              </div>
              <NavLink to="/voice/transcribe">Dashboard</NavLink>
              <NavLink to="/voice/live">Tools</NavLink>
              <NavLink
                onClick={() => {
                  signOut();
                  navigate('/auth/login');
                }}
              >
                Sign Out
              </NavLink>
            </>
          ) : (
            <>
              <NavLink to="/auth/signup">Sign up</NavLink>
              <NavLink to="/auth/login">Sign in</NavLink>
            </>
          )}
          <PrimaryButton onClick={() => navigate('/demo')}>Watch a demo &gt;</PrimaryButton>
        </div>
      )}
    </header>
    </>
  );
}
