import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

// Assuming 'useAuth' and icon imports are available
import { useAuth } from '../lib/auth'; 
// UPDATED: Imported FiChevronUp
import { FiMenu, FiX, FiChevronDown, FiChevronUp } from 'react-icons/fi'; 

// --- 1. NavLink Component (Unchanged) ---
const NavLink = ({ to, children, onClick }: { to?: string; children: React.ReactNode; onClick?: () => void }) => {
  const [hover, setHover] = React.useState(false);
  const commonStyles = {
    fontFamily: "'Inter', sans-serif",
    fontWeight: 400,
    fontSize: '0.8rem', 
    textDecoration: 'none',
    color: '#ffffff', 
    backgroundColor: hover ? '#1a1a1a' : 'transparent', 
    padding: '0.4rem 0.6rem', 
    borderRadius: '4px', 
    transition: 'all 0.2s ease-in-out',
    whiteSpace: 'nowrap' as const,
    display: 'flex', 
    alignItems: 'center',
    margin: '0', 
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

// --- 2. PrimaryButton Component (Unchanged) ---
const PrimaryButton = ({ onClick, children }: { onClick?: () => void; children: React.ReactNode }) => {
  const [hover, setHover] = React.useState(false);
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: "'Inter', sans-serif",
        fontWeight: 500,
        fontSize: '0.85rem', 
        padding: '0.5rem 1.1rem', 
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
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {children}
    </button>
  );
};

// =============================================================
// --- Dropdown Components (Content and Structure Unchanged) ---
// =============================================================

// Item for the right-hand sections
const SectionItem = ({ to, title, description }: { to: string; title: string; description: string }) => {
  const [hover, setHover] = React.useState(false);
  return (
    <Link
      to={to}
      style={{
        textDecoration: 'none',
        padding: '0.6rem 1rem',
        backgroundColor: hover ? '#1a1a1a' : 'transparent', 
        transition: 'background-color 0.2s ease-in-out',
        display: 'block',
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <h4 style={{
        fontFamily: "'Inter', sans-serif",
        fontWeight: 500,
        fontSize: '0.85rem', 
        color: '#ffffff',
        margin: 0,
        lineHeight: 1.2,
      }}>
        {title}
      </h4>
      <p style={{
        fontFamily: "'Inter', sans-serif",
        fontWeight: 400,
        fontSize: '0.7rem', 
        color: '#aaaaaa',
        margin: '0.2rem 0 0 0',
        lineHeight: 1.4,
      }}>
        {description}
      </p>
    </Link>
  );
};

// Section for the right-hand items
const DropdownSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{
    minWidth: '220px', 
    borderLeft: '1px solid #1a1a1a', 
    padding: '0.5rem 0',
  }}>
    <h3 style={{
      fontFamily: "'Inter', sans-serif",
      fontWeight: 600,
      fontSize: '0.75rem', 
      color: '#aaaaaa',
      textTransform: 'uppercase',
      padding: '0 1rem 0.5rem 1rem',
      margin: 0,
    }}>
      {title}
    </h3>
    {children}
  </div>
);

// The Left, Highlighted Item
const HighlightedItem = ({ to, title, description }: { to: string; title: string; description: string }) => {
  const [hover, setHover] = React.useState(false);
  
  // Modern Gradient
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
        width: '180px', 
        minHeight: '180px', 
        padding: '1.25rem',
        borderRadius: '8px',
        background: hover ? HOVER_GRADIENT : MODERN_GRADIENT,
        boxShadow: hover ? '0 4px 20px rgba(0, 119, 182, 0.7)' : '0 4px 10px rgba(0, 0, 0, 0.5)',
        transition: 'all 0.3s ease-in-out',
        flexShrink: 0,
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <h3 style={{
        fontFamily: "'Inter', sans-serif",
        fontWeight: 600,
        fontSize: '1.1rem', 
        color: '#ffffff',
        margin: '0 0 0.5rem 0',
      }}>
        {title}
      </h3>
      <p style={{
        fontFamily: "'Inter', sans-serif",
        fontWeight: 400,
        fontSize: '0.75rem', 
        color: '#e0e0e0',
        margin: 0,
      }}>
        {description}
      </p>
    </Link>
  );
};


// Main wrapper for the complex dropdown menu
const ComplexDropdown = () => {
  return (
    <div style={{
      display: 'flex',
      backgroundColor: '#0d0d0d', 
      borderRadius: '8px',
      boxShadow: '0 8px 20px rgba(0, 0, 0, 0.5)', 
      overflow: 'hidden', 
      minWidth: '600px', 
      padding: '0.5rem', 
    }}>
      {/* Left Column (Highlighted) */}
      <HighlightedItem 
        to="/product/secure-voice-comm"
        title="Secure Comm."
        description="End-to-end encryption for all voice and data streams."
      />

      {/* Right Column (Sections) */}
      <div style={{ display: 'flex' }}>
        <DropdownSection title="Core Features">
          <SectionItem 
            to="/product/voice-biometrics"
            title="Voice Biometrics"
            description="Verify user identity using unique voice prints (IVR)"
          />
          <SectionItem 
            to="/product/data-tokenization"
            title="Data Tokenization"
            description="Anonymize sensitive data in real-time conversations"
          />
        </DropdownSection>
        <DropdownSection title="Use Cases">
          <SectionItem 
            to="/solutions/contact-center-security"
            title="Contact Center Security"
            description="Protect customer PII and meet compliance standards"
          />
          <SectionItem 
            to="/solutions/remote-work-security"
            title="Remote Work Security"
            description="Secure virtual meetings and team collaborations"
          />
        </DropdownSection>
      </div>
    </div>
  );
};
// =============================================================
// --- END Dropdown Components ---
// =============================================================


export default function Header() {
  const { user, signOut } = useAuth(); 
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [productDropdownOpen, setProductDropdownOpen] = useState(false); 

  const [isDesktop, setIsDesktop] = useState(typeof window !== 'undefined' && window.innerWidth > 1024);

  
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth > 1024);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
      // Clean up the event listener
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []); 

  const handleToggleMobile = () => {
    setMobileOpen(!mobileOpen);
    setProductDropdownOpen(false); 
  }

  // Simple functions to set state based on mouse events
  const handleOpenProductDropdown = () => isDesktop && setProductDropdownOpen(true);
  const handleCloseProductDropdown = () => isDesktop && setProductDropdownOpen(false);
  
  // Use onClick to handle mobile toggle behavior
  const handleToggleProductDropdown = () => !isDesktop && setProductDropdownOpen(!productDropdownOpen);


  // --- Styles Object ---
  const styles = {
    header: {
      backgroundColor: '#000000', 
      borderBottom: '1px solid #1a1a1a', 
      position: 'sticky' as const,
      top: 0,
      zIndex: 200,
      padding: '0.75rem 2rem', 
    },
    container: {
      maxWidth: '1448px',
      margin: '0 auto',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      width: '100%',
    },
    leftNavSection: {
      display: 'flex',
      alignItems: 'center',
      gap: '2.5rem', 
    },
    logo: {
      display: 'flex',
      alignItems: 'center', 
      textDecoration: 'none',
    },
    logoSvgContainer: {
      marginRight: '0.75rem',
    },
    logoText: {
      fontFamily: "'Inter', sans-serif",
      fontWeight: 700,
      fontSize: '1.2rem', 
      color: '#ffffff',
      letterSpacing: '0.5px',
    },
    desktopNavLinks: {
      display: 'flex',
      alignItems: 'baseline' as const, 
      gap: '1.25rem', 
    },
    // The hover/leave handlers are on the parent container
    productDropdownContainer: {
      position: 'relative' as const,
      marginBottom: '-4px', 
    },
    productDropdownMenu: {
      position: 'absolute' as const,
      top: '100%', 
      left: '-200px', 
      paddingTop: '4px', 
      zIndex: 201, 
    },
    rightAuthSection: {
      display: 'flex',
      alignItems: 'center', 
      gap: '0.75rem', 
    },
    mobileMenuIcon: {
      cursor: 'pointer',
    },
    mobileMenu: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '0.6rem', 
      backgroundColor: '#000000',
      padding: '1rem 2rem',
      borderTop: '1px solid #1a1a1a',
    },
    mobileDropdownContainer: {
      position: 'relative' as const, 
      width: '100%',
    },
    mobileDropdownMenu: {
      backgroundColor: '#0d0d0d',
      borderRadius: '4px',
      padding: '0.5rem 0',
      marginTop: '0.5rem',
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '0',
    },
    // Simple DropdownItem for mobile use only
    simpleDropdownItem: {
      fontFamily: "'Inter', sans-serif",
      fontWeight: 400,
      fontSize: '0.8rem', 
      textDecoration: 'none',
      color: '#ffffff',
      backgroundColor: 'transparent', 
      padding: '0.4rem 1rem', 
      transition: 'background-color 0.2s ease-in-out',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    }
  };


  return (
    <header style={styles.header}>
      <div style={styles.container}>
        {/* Left Section: Logo and Navigation */}
        <div style={styles.leftNavSection}>
          {/* Logo */}
          <Link to="/" style={styles.logo}>
            <div style={styles.logoSvgContainer}>
              {/* MODERN ABSTRACT LOGO */}
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7 16C7 11.5817 10.5817 8 15 8H17C21.4183 8 25 11.5817 25 16V24" stroke="url(#logoGradient)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M15 24L17 24" stroke="url(#logoGradient)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                
                <defs>
                  <linearGradient id="logoGradient" x1="7" y1="8" x2="25" y2="24" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#4A90E2"/> {/* Blue start */}
                    <stop offset="1" stopColor="#50E3C2"/> {/* Teal end */}
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <span style={styles.logoText}>VoiceCrypt.ai</span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav 
            style={{ 
              ...styles.desktopNavLinks, 
              display: isDesktop ? 'flex' : 'none' 
            }}
          >
            {/* Product Dropdown: Hover/Click logic */}
            <div 
                style={styles.productDropdownContainer}
                onMouseEnter={handleOpenProductDropdown} 
                onMouseLeave={handleCloseProductDropdown} 
            >
              {/* Conditional Icon Rendering */}
              <NavLink onClick={handleToggleProductDropdown}> 
                Product 
                {productDropdownOpen ? (
                  <FiChevronUp size={14} style={{ marginLeft: '0.25rem' }} />
                ) : (
                  <FiChevronDown size={14} style={{ marginLeft: '0.25rem' }} />
                )}
              </NavLink>
              {productDropdownOpen && isDesktop && ( 
                <div style={styles.productDropdownMenu}>
                  <ComplexDropdown />
                </div>
              )}
            </div>
            <NavLink to="/integrations">Integrations</NavLink>
            <NavLink to="/cases">Cases</NavLink>
            <NavLink to="/academy">Academy</NavLink>
            <NavLink to="/pricing">Pricing</NavLink>
          </nav>
        </div>

        {/* Right Section: Auth and Demo Button (Desktop Only) */}
        <div 
          style={{ 
            ...styles.rightAuthSection, 
            display: isDesktop ? 'flex' : 'none' 
          }}
        >
          {user ? (
            <>
              <NavLink to="/dashboard">Dashboard</NavLink>
              <NavLink onClick={signOut}>Sign Out</NavLink>
            </>
          ) : (
            <>
              <NavLink to="/signup">Sign up</NavLink>
              <NavLink to="/login">Sign in</NavLink>
            </>
          )}
          <PrimaryButton onClick={() => navigate('/demo')}>
            Watch a demo <span style={{ marginLeft: '0.25rem' }}>&gt;</span>
          </PrimaryButton>
        </div>

        {/* Mobile Hamburger/X Icon */}
        <div 
            style={{ 
                ...styles.mobileMenuIcon, 
                display: isDesktop ? 'none' : 'block' 
            }} 
            onClick={handleToggleMobile}
        >
          {mobileOpen ? <FiX color="#fff" size={24} /> : <FiMenu color="#fff" size={24} />}
        </div>
      </div>

      {/* Mobile Menu (Conditional Rendering) */}
      {!isDesktop && mobileOpen && ( 
        <div style={styles.mobileMenu}>
          {/* Mobile Product Dropdown (Simple List for Usability) */}
          <div style={styles.mobileDropdownContainer}>
            {/* Conditional Icon Rendering for Mobile */}
            <NavLink onClick={handleToggleProductDropdown}>
              Product 
              {productDropdownOpen ? (
                  <FiChevronUp size={14} style={{ marginLeft: '0.25rem' }} />
                ) : (
                  <FiChevronDown size={14} style={{ marginLeft: '0.25rem' }} />
                )}
            </NavLink>
            {productDropdownOpen && (
              <div style={styles.mobileDropdownMenu}>
                {/* Updated simple list items for mobile */}
                <Link to="/product/secure-voice-comm" style={styles.simpleDropdownItem}>Secure Communication</Link>
                <Link to="/product/voice-biometrics" style={styles.simpleDropdownItem}>Voice Biometrics</Link>
                <Link to="/product/data-tokenization" style={styles.simpleDropdownItem}>Data Tokenization</Link>
                <Link to="/solutions/contact-center-security" style={styles.simpleDropdownItem}>Contact Center Security</Link>
                <Link to="/solutions/remote-work-security" style={styles.simpleDropdownItem}>Remote Work Security</Link>
              </div>
            )}
          </div>
          <NavLink to="/integrations">Integrations</NavLink>
          <NavLink to="/cases">Cases</NavLink>
          <NavLink to="/academy">Academy</NavLink>
          <NavLink to="/pricing">Pricing</NavLink>
          {user ? (
            <>
              <NavLink to="/dashboard">Dashboard</NavLink>
              <NavLink onClick={signOut}>Sign Out</NavLink>
            </>
          ) : (
            <>
              <NavLink to="/signup">Sign up</NavLink>
              <NavLink to="/login">Sign in</NavLink>
            </>
          )}
          <PrimaryButton onClick={() => navigate('/demo')}>
            Watch a demo <span style={{ marginLeft: '0.25rem' }}>&gt;</span>
          </PrimaryButton>
        </div>
      )}
    </header>
  );
}