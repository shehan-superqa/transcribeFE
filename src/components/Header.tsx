import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../lib/auth'; 
import { FiMenu, FiX, FiChevronDown, FiChevronRight } from 'react-icons/fi'; 


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

// --- DropdownItem Component ---
const DropdownItem = ({ to, children }: { to: string; children: React.ReactNode }) => {
  const [hover, setHover] = React.useState(false);
  return (
    <Link
      to={to}
      style={{
        fontFamily: "'Inter', sans-serif",
        fontWeight: 400,
        fontSize: '0.8rem', 
        textDecoration: 'none',
        color: '#ffffff',
        backgroundColor: hover ? '#1a1a1a' : 'transparent', 
        padding: '0.4rem 1rem', 
        transition: 'background-color 0.2s ease-in-out',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {children}
      <FiChevronRight size={14} color="#ffffff" style={{ opacity: hover ? 1 : 0.6 }} /> 
    </Link>
  );
};

// --- PrimaryButton Component ---
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
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []); 

  const handleToggleMobile = () => {
    setMobileOpen(!mobileOpen);
    setProductDropdownOpen(false); 
  }
  const handleToggleProductDropdown = () => setProductDropdownOpen(!productDropdownOpen);

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
    productDropdownContainer: {
      position: 'relative' as const,
    },
    productDropdownMenu: {
      position: 'absolute' as const,
      top: '120%', 
      left: 0,
      backgroundColor: '#0d0d0d', 
      borderRadius: '8px',
      padding: '0.5rem 0',
      minWidth: '180px', 
      boxShadow: '0 8px 20px rgba(0, 0, 0, 0.5)', 
      zIndex: 201, 
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '0', 
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
                {/* Abstract shape representing content or data stream */}
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
            <div style={styles.productDropdownContainer}>
              <NavLink onClick={handleToggleProductDropdown}>
                Product <FiChevronDown size={14} style={{ marginLeft: '0.25rem' }} />
              </NavLink>
              {productDropdownOpen && (
                <div style={styles.productDropdownMenu}>
                  <DropdownItem to="/product/features">Features</DropdownItem>
                  <DropdownItem to="/product/integrations">Integrations</DropdownItem>
                  <DropdownItem to="/product/solutions">Solutions</DropdownItem>
                </div>
              )}
            </div>
            <NavLink to="/integrations">Integrations</NavLink>
            <NavLink to="/cases">Cases</NavLink>
            <NavLink to="/academy">Academy</NavLink>
            <NavLink to="/pricing">Pricing</NavLink>
          </nav>
        </div>

        {/* Right Section: Auth and Demo Button */}
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
          <div style={styles.mobileDropdownContainer}>
            <NavLink onClick={handleToggleProductDropdown}>
              Product <FiChevronDown size={14} style={{ marginLeft: '0.25rem' }} />
            </NavLink>
            {productDropdownOpen && (
              <div style={styles.mobileDropdownMenu}>
                <DropdownItem to="/product/features">Features</DropdownItem>
                <DropdownItem to="/product/integrations">Integrations</DropdownItem>
                <DropdownItem to="/product/solutions">Solutions</DropdownItem>
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