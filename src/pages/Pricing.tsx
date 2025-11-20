import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';
import { useNavigate } from 'react-router-dom';
import { FiInfo } from 'react-icons/fi';
import { authenticatedFetch, handleResponse } from '../lib/api'; 

interface Plan {
  id: string;
  name: string;
  price: number;
  energy_points: number;
  features: {
    maxDuration: number;
    formats: string[];
    priority: string;
    history: number;
    api?: boolean;
  };
}

// --- UPDATED FAQ Item Component ---
const FaqItem = ({ question, answer }) => {
    const [hover, setHover] = useState(false);

    // Dynamic style based on hover state
    const itemStyle = {
        ...styles.faqItem,
        // Structural effect (lift/scale) is kept
        transform: hover ? 'translateY(-5px) scale(1.01)' : 'translateY(0) scale(1)',
        
        // --- VISUAL CHANGE ON HOVER ---
        // Change shadow to a subtle, neutral/white glow
        boxShadow: hover 
            ? '0 10px 20px rgba(255, 255, 255, 0.05), 0 0 15px rgba(255, 255, 255, 0.1)' 
            : '0 2px 10px rgba(0, 0, 0, 0.5)',
        
        // Change border to a light grey, removing the cyan color
        border: hover ? '1px solid #777777' : '1px solid #333333',
        // ---------------------------------
    };

    return (
        <div 
            style={itemStyle}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
        >
            <h3 style={styles.faqQuestion}>{question}</h3>
            <p style={styles.faqAnswer}>{answer}</p>
        </div>
    );
};
// ----------------------------------------------------


export default function Pricing() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 768);
      setIsTablet(window.innerWidth > 768 && window.innerWidth <= 1024);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    fetchPlans();
  }, []);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 768);
      setIsTablet(window.innerWidth > 768 && window.innerWidth <= 1024);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const fetchPlans = async () => {
    try {
      // Try to fetch plans from API
      const response = await authenticatedFetch('/api/subscription/plans', { method: 'GET' });
      const data = await handleResponse<{ success: boolean; plans: Plan[] }>(response);
      
      if (data.success && data.plans && data.plans.length > 0) {
        setPlans(data.plans);
      } else {
        // Fallback to default plans if API doesn't return any
        setPlans(getDefaultPlans());
      }
    } catch (error) {
      // If API fails, use default plans
      console.warn('Failed to fetch plans from API, using defaults:', error);
      setPlans(getDefaultPlans());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultPlans = (): Plan[] => [
    {
      id: '1',
      name: 'Basic',
      price: 9.99,
      energy_points: 500,
      features: {
        maxDuration: 30,
        formats: ['mp3', 'wav'],
        priority: 'standard',
        history: 30,
      },
    },
    {
      id: '2',
      name: 'Pro',
      price: 19.99,
      energy_points: 1500,
      features: {
        maxDuration: 120,
        formats: ['mp3', 'wav', 'm4a', 'flac'],
        priority: 'high',
        history: 90,
      },
    },
    {
      id: '3',
      name: 'Enterprise',
      price: 49.99,
      energy_points: 5000,
      features: {
        maxDuration: 300,
        formats: ['all'],
        priority: 'highest',
        history: 365,
        api: true,
      },
    },
  ];

  const handleSubscribe = (planName: string) => {
    if (!user) {
      navigate('/login');
      return;
    }
    alert(`Subscription feature coming soon! You selected the ${planName} plan.`);
  };

  if (loading) {
    return (
      <div style={{...styles.container, ...styles.darkBackground}}>
        <div style={styles.loading}>Loading plans...</div>
      </div>
    );
  }

  // Get responsive styles
  const getResponsiveStyles = () => {
    const base = styles;
    if (isMobile) {
      return {
        ...base,
        hero: { ...base.hero, padding: '2rem 1rem 1.5rem' },
        title: { ...base.title, fontSize: '2rem' },
        subtitle: { ...base.subtitle, fontSize: '1rem', padding: '0 0.5rem' },
        freeTier: { ...base.freeTier, padding: '1.5rem 1rem' },
        freeCard: { ...base.freeCard, padding: '1.5rem' },
        freeTitle: { ...base.freeTitle, fontSize: '1.5rem' },
        freeNumber: { ...base.freeNumber, fontSize: '3rem' },
        freeText: { ...base.freeText, fontSize: '1rem' },
        freeDescription: { ...base.freeDescription, fontSize: '0.95rem' },
        plans: { ...base.plans, padding: '2rem 1rem' },
        planGrid: { ...base.planGrid, gridTemplateColumns: '1fr', gap: '1.5rem' },
        planCard: { ...base.planCard, padding: '1.5rem' },
        planName: { ...base.planName, fontSize: '1.25rem' },
        planPriceAmount: { ...base.planPriceAmount, fontSize: '2.25rem' },
        getInTouchContainer: { ...base.getInTouchContainer, padding: '2rem 1rem' },
        getInTouchContent: { ...base.getInTouchContent, flexDirection: 'column' as const },
        getInTouchLeft: { ...base.getInTouchLeft, minWidth: 'auto', padding: '2rem 1.5rem' },
        getInTouchRight: { ...base.getInTouchRight, minWidth: 'auto', padding: '2rem 1.5rem' },
        getInTouchTitle: { ...base.getInTouchTitle, fontSize: '1.75rem' },
        getInTouchSubtitle: { ...base.getInTouchSubtitle, fontSize: '1rem' },
        clientLogosGrid: { ...base.clientLogosGrid, gridTemplateColumns: 'repeat(2, 1fr)' },
        featureComparison: { ...base.featureComparison, padding: '2rem 1rem' },
        featureComparisonTitle: { ...base.featureComparisonTitle, fontSize: '1.75rem', marginBottom: '1.5rem' },
        comparisonTable: { ...base.comparisonTable, display: 'block', overflowX: 'auto' },
        comparisonHeaderRow: { ...base.comparisonHeaderRow, display: 'flex', minWidth: '600px' },
        comparisonHeaderCell: { ...base.comparisonHeaderCell, minWidth: '150px', flex: '1' },
        comparisonPlanTitle: { ...base.comparisonPlanTitle, fontSize: '1.1rem' },
        comparisonPlanPrice: { ...base.comparisonPlanPrice, fontSize: '0.95rem' },
        featuresLabel: { ...base.featuresLabel, display: 'none' },
        comparisonFeatureRow: { ...base.comparisonFeatureRow, display: 'flex', minWidth: '600px' },
        comparisonFeatureName: { ...base.comparisonFeatureName, minWidth: '200px', flex: '1.5', borderRight: 'none', borderBottom: '1px solid #333333', padding: '0.75rem' },
        comparisonFeatureValue: { ...base.comparisonFeatureValue, minWidth: '150px', flex: '1', borderRight: 'none', borderBottom: '1px solid #333333', padding: '0.75rem' },
        faq: { ...base.faq, padding: '2rem 1rem' },
        faqTitle: { ...base.faqTitle, fontSize: '1.75rem', marginBottom: '1.5rem' },
        faqGrid: { ...base.faqGrid, gridTemplateColumns: '1fr', gap: '1.25rem' },
        faqItem: { ...base.faqItem, padding: '1.25rem' },
        faqQuestion: { ...base.faqQuestion, fontSize: '1rem' },
        faqAnswer: { ...base.faqAnswer, fontSize: '0.9rem' },
      };
    } else if (isTablet) {
      return {
        ...base,
        hero: { ...base.hero, padding: '3rem 1.25rem 1.75rem' },
        title: { ...base.title, fontSize: '2.5rem' },
        subtitle: { ...base.subtitle, fontSize: '1.1rem' },
        planGrid: { ...base.planGrid, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' },
        getInTouchContent: { ...base.getInTouchContent, flexWrap: 'wrap' as const },
        getInTouchLeft: { ...base.getInTouchLeft, minWidth: '300px' },
        getInTouchRight: { ...base.getInTouchRight, minWidth: '300px' },
        comparisonTable: { ...base.comparisonTable, fontSize: '0.9rem' },
        faqGrid: { ...base.faqGrid, gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' },
      };
    }
    return base;
  };

  const responsiveStyles = getResponsiveStyles();

  return (
    <div style={{...responsiveStyles.container, ...responsiveStyles.darkBackground}}>
      <section style={responsiveStyles.hero}>
        <h1 style={responsiveStyles.title}>Simple, <span style={responsiveStyles.highlightText}>Crypt-Secure</span> Pricing</h1>
        <p style={responsiveStyles.subtitle}>
          Choose the plan that fits your security needs. All plans include access to our powerful voice security and verification tools.
        </p>
      </section>

      <div style={responsiveStyles.freeTier}>
        <div style={responsiveStyles.freeCard}>
          <div style={responsiveStyles.freeBadge}>Always Free</div>
          <h3 style={responsiveStyles.freeTitle}>Developer Tier</h3>
          <div style={responsiveStyles.freePoints}>
            <span style={responsiveStyles.freeNumber}>100</span>
            <span style={responsiveStyles.freeText}>Voice Tokens</span>
          </div>
          <p style={responsiveStyles.freeDescription}>
            Perfect for testing the VoiceCrypt API and authentication features. No credit card required.
          </p>
          <ul style={responsiveStyles.freeFeatures}>
            <li style={responsiveStyles.freeFeature}>✓ 100 free Voice Tokens on signup</li>
            <li style={responsiveStyles.freeFeature}>✓ Core Biometric verification methods</li>
            <li style={responsiveStyles.freeFeature}>✓ Up to 15 seconds per API call</li>
            <li style={responsiveStyles.freeFeature}>✓ 7-day logs history</li>
          </ul>
        </div>
      </div>

      <section style={responsiveStyles.plans}>
        <div style={responsiveStyles.planGrid}>
          {plans.map((plan) => {
            const isPopular = plan.name === 'Pro';
            return (
              <div
                key={plan.id}
                style={{
                  ...responsiveStyles.planCard,
                  ...(isPopular ? responsiveStyles.planCardPopular : {}),
                }}
              >
                {isPopular && <div style={responsiveStyles.popularBadge}>Most Popular</div>}
                <div style={responsiveStyles.planHeader}>
                  <h3 style={responsiveStyles.planName}>{plan.name}</h3>
                  <div style={responsiveStyles.planPrice}>
                    <span style={responsiveStyles.planPriceAmount}>${plan.price}</span>
                    <span style={responsiveStyles.planPricePeriod}>/month</span>
                  </div>
                  <div style={responsiveStyles.planPoints}>
                    {plan.energy_points.toLocaleString()} Voice Tokens/month
                  </div>
                </div>

                <ul style={responsiveStyles.planFeatures}>
                  <li style={responsiveStyles.planFeature}>
                    ✓ Up to {plan.features.maxDuration} seconds of voice data per transaction
                  </li>
                  <li style={responsiveStyles.planFeature}>
                    ✓ {plan.features.formats.length === 1 && plan.features.formats[0] === 'all'
                      ? 'All voice/data formats supported'
                      : plan.features.formats.join(', ').toUpperCase() + ' verification input'}
                  </li>
                  <li style={responsiveStyles.planFeature}>
                    ✓ {plan.features.priority.charAt(0).toUpperCase() + plan.features.priority.slice(1)} priority latency
                  </li>
                  <li style={responsiveStyles.planFeature}>
                    ✓ {plan.features.history}-day secure audit logs
                  </li>
                  {plan.features.api && (
                    <li style={responsiveStyles.planFeature}>✓ Dedicated API access</li>
                  )}
                  <li style={responsiveStyles.planFeature}>✓ Advanced biometrics enrollment</li>
                  <li style={responsiveStyles.planFeature}>✓ Premium technical support</li>
                </ul>

                <button
                  onClick={() => handleSubscribe(plan.name)}
                  style={{
                    ...responsiveStyles.subscribeButton,
                    ...(isPopular ? responsiveStyles.subscribeButtonPopular : {}),
                  }}
                >
                  Start {plan.name} Plan
                </button>
              </div>
            );
          })}
        </div>
      </section>
      
    {/* NEW SECTION: Get in Touch */}
    <section style={responsiveStyles.getInTouchContainer}>
        <div style={responsiveStyles.getInTouchContent}>
            <div style={responsiveStyles.getInTouchLeft}>
                <h2 style={responsiveStyles.getInTouchTitle}>Get in Touch</h2>
                <p style={responsiveStyles.getInTouchSubtitle}>
                    We're looking forward to hearing from you! Please fill out the form for a demo or custom Enterprise plan, and we'll get back to you shortly.
                </p>
                
                {/* Placeholder for Client Logos/Integrations */}
                <div style={responsiveStyles.clientLogosGrid}>
                    <div style={responsiveStyles.clientLogoBox}>VoiceCrypt Enterprise</div>
                    <div style={responsiveStyles.clientLogoBox}>High-Security APIs</div>
                    <div style={responsiveStyles.clientLogoBox}>Custom Biometrics</div>
                    <div style={responsiveStyles.clientLogoBox}>Global Compliance</div>
                    <div style={responsiveStyles.clientLogoBox}>Fraud Detection Suite</div>
                    <div style={responsiveStyles.clientLogoBox}>Dedicated Support</div>
                </div>
            </div>

            <div style={responsiveStyles.getInTouchRight}>
                <div style={responsiveStyles.inputGroup}>
                    <label htmlFor="email" style={responsiveStyles.inputLabel}>Work Email Address</label>
                    <input 
                        type="email" 
                        id="email" 
                        placeholder="yourname@company.com" 
                        style={responsiveStyles.inputField} 
                    />
                </div>
                
                <div style={responsiveStyles.inputGroup}>
                    <label htmlFor="range" style={responsiveStyles.inputLabel}>Approximate Monthly Token Volume</label>
                    <select id="range" style={{...responsiveStyles.inputField, ...responsiveStyles.selectField}}>
                        <option>Select volume range</option>
                        <option>1,000 - 5,000</option>
                        <option>5,001 - 20,000</option>
                        <option>20,001 - 100,000+</option>
                        <option>Custom Enterprise</option>
                    </select>
                </div>

                <div style={responsiveStyles.inputGroup}>
                    <label htmlFor="phone" style={responsiveStyles.inputLabel}>Phone Number (Optional)</label>
                    <input 
                        type="tel" 
                        id="phone" 
                        placeholder="+1 555 123 4567" 
                        style={responsiveStyles.inputField} 
                    />
                </div>

                <button style={responsiveStyles.submitButton}>
                    Submit
                </button>
            </div>
        </div>
    </section>
      
    {/* Feature Comparison Section */}
    <section style={responsiveStyles.featureComparison}>
        <h2 style={responsiveStyles.featureComparisonTitle}>Feature Comparison</h2>

        <div style={responsiveStyles.comparisonTable}>
            {/* Table Header Row */}
            <div style={responsiveStyles.comparisonHeaderRow}>
                <div style={responsiveStyles.comparisonHeaderCell}></div> {/* Empty cell for alignment */}
                <div style={responsiveStyles.comparisonHeaderCell}>
                    <h3 style={responsiveStyles.comparisonPlanTitle}>Basic</h3>
                    <p style={responsiveStyles.comparisonPlanPrice}>from $9.99<span style={responsiveStyles.comparisonPricePeriod}>/month</span></p>
                    <button style={{ ...responsiveStyles.comparisonActionButton, ...responsiveStyles.comparisonActionButtonDefault }} onClick={() => handleSubscribe('Basic')}>
                        Get Started
                    </button>
                </div>
                <div style={responsiveStyles.comparisonHeaderCell}>
                    <h3 style={responsiveStyles.comparisonPlanTitle}>Pro</h3>
                    <p style={responsiveStyles.comparisonPlanPrice}>from $19.99<span style={responsiveStyles.comparisonPricePeriod}>/month</span></p>
                    <button style={{ ...responsiveStyles.comparisonActionButton, ...responsiveStyles.comparisonActionButtonPopular }} onClick={() => handleSubscribe('Pro')}>
                        Get Started
                    </button>
                </div>
                <div style={responsiveStyles.comparisonHeaderCell}>
                    <h3 style={responsiveStyles.comparisonPlanTitle}>Enterprise</h3>
                    <p style={responsiveStyles.comparisonPlanPrice}>Custom</p>
                    <button style={{ ...responsiveStyles.comparisonActionButton, ...responsiveStyles.comparisonActionButtonDefault }} onClick={() => navigate('/contact')}>
                        Contact Sales
                    </button>
                </div>
            </div>

            {/* Features Label */}
            {!isMobile && <div style={responsiveStyles.featuresLabel}>Features</div>}

            {/* Feature Rows */}
            <div style={responsiveStyles.comparisonFeatureRow}>
                <div style={responsiveStyles.comparisonFeatureName}>
                    Voice Tokens included <FiInfo size={14} color="#999" style={responsiveStyles.infoIcon} title="Monthly allocation of secure voice transaction tokens." />
                </div>
                <div style={responsiveStyles.comparisonFeatureValue}>500</div>
                <div style={responsiveStyles.comparisonFeatureValue}>1,500</div>
                <div style={responsiveStyles.comparisonFeatureValue}>Custom</div>
            </div>

            <div style={responsiveStyles.comparisonFeatureRow}>
                <div style={responsiveStyles.comparisonFeatureName}>
                    Max voice transaction duration
                </div>
                <div style={responsiveStyles.comparisonFeatureValue}>30 sec</div>
                <div style={responsiveStyles.comparisonFeatureValue}>120 sec</div>
                <div style={responsiveStyles.comparisonFeatureValue}>300+ sec</div>
            </div>

            <div style={responsiveStyles.comparisonFeatureRow}>
                <div style={responsiveStyles.comparisonFeatureName}>
                    Supported input formats
                </div>
                <div style={responsiveStyles.comparisonFeatureValue}>MP3, WAV</div>
                <div style={responsiveStyles.comparisonFeatureValue}>MP3, WAV, M4A, FLAC</div>
                <div style={responsiveStyles.comparisonFeatureValue}>All standard formats</div>
            </div>

            <div style={responsiveStyles.comparisonFeatureRow}>
                <div style={responsiveStyles.comparisonFeatureName}>
                    Priority processing
                </div>
                <div style={responsiveStyles.comparisonFeatureValue}>Standard</div>
                <div style={responsiveStyles.comparisonFeatureValue}>High</div>
                <div style={responsiveStyles.comparisonFeatureValue}>Highest</div>
            </div>

            <div style={responsiveStyles.comparisonFeatureRow}>
                <div style={responsiveStyles.comparisonFeatureName}>
                    Secure audit logs history
                </div>
                <div style={responsiveStyles.comparisonFeatureValue}>30 days</div>
                <div style={responsiveStyles.comparisonFeatureValue}>90 days</div>
                <div style={responsiveStyles.comparisonFeatureValue}>365+ days</div>
            </div>

            <div style={responsiveStyles.comparisonFeatureRow}>
                <div style={responsiveStyles.comparisonFeatureName}>
                    Dedicated API Access
                </div>
                <div style={responsiveStyles.comparisonFeatureValue}>-</div>
                <div style={responsiveStyles.comparisonFeatureValue}>✓</div>
                <div style={responsiveStyles.comparisonFeatureValue}>✓</div>
            </div>

            <div style={responsiveStyles.comparisonFeatureRow}>
                <div style={responsiveStyles.comparisonFeatureName}>
                    Advanced Biometric Enrollment
                </div>
                <div style={responsiveStyles.comparisonFeatureValue}>-</div>
                <div style={responsiveStyles.comparisonFeatureValue}>✓</div>
                <div style={responsiveStyles.comparisonFeatureValue}>✓</div>
            </div>
            
            <div style={responsiveStyles.comparisonFeatureRow}>
                <div style={responsiveStyles.comparisonFeatureName}>
                    Customer Support Tier
                </div>
                <div style={responsiveStyles.comparisonFeatureValue}>Email</div>
                <div style={responsiveStyles.comparisonFeatureValue}>Priority Email</div>
                <div style={responsiveStyles.comparisonFeatureValue}>Dedicated Account Manager</div>
            </div>

        </div>
    </section>

      <section style={responsiveStyles.faq}>
        <h2 style={responsiveStyles.faqTitle}>Frequently Asked Questions</h2>
        <div style={responsiveStyles.faqGrid}>
            <FaqItem
                question="What are Voice Tokens?"
                answer="Voice Tokens are the secure currency used for verification and API calls. Each transaction consumes a small amount of tokens based on data size and security level."
            />
            <FaqItem
                question="How is my voice data secured?"
                answer="We never store raw voice data. Instead, we use irreversible cryptographic voice prints (biometric hashes) for identity verification, ensuring maximum privacy."
            />
            <FaqItem
                question="Do unused tokens roll over?"
                answer="Yes, any unused Voice Tokens roll over to the next billing cycle, so your investment in security is never wasted."
            />
            <FaqItem
                question="Is API access available on all plans?"
                answer="Core API access is available on our **Free Tier** for testing. Dedicated, high-volume API keys and premium support are included in our **Enterprise** plan."
            />
        </div>
      </section>
    </div>
  );
}

const styles = {
  // --- Dark Theme Palette Variables ---
  colorPrimary: '#00B4D8', // Electric Cyan/Blue
  colorSecondary: '#480CA8', // Deep Violet/Indigo
  colorDark: '#0a0a0a', // Page Background
  colorCard: '#181818', // Card Background
  colorTextLight: '#ffffff',
  colorTextMuted: '#cccccc',
  colorBorder: '#333333',
  colorShadow: 'rgba(0, 0, 0, 0.7)',
  borderRadius: '12px',
  
  // --- General/Container Styles ---
  container: {
    minHeight: 'calc(100vh - 80px)',
    paddingBottom: '4rem',
  },
  darkBackground: {
    backgroundColor: '#0a0a0a',
    color: '#ffffff',
  },
  loading: {
    textAlign: 'center' as const,
    padding: '4rem',
    fontSize: '1.25rem',
    color: '#999999',
  },
  hero: {
    textAlign: 'center' as const,
    padding: '4rem 1.5rem 2rem',
    maxWidth: '800px',
    margin: '0 auto',
  },
  title: {
    fontSize: '3rem',
    fontWeight: 700,
    marginBottom: '1rem',
    color: '#ffffff',
  },
  highlightText: {
    color: '#00B4D8', // Electric Cyan
  },
  subtitle: {
    fontSize: '1.25rem',
    color: '#cccccc',
    lineHeight: 1.7,
  },

  // --- Free Tier Card Styles ---
  freeTier: {
    padding: '2rem 1.5rem',
    maxWidth: '600px',
    margin: '0 auto',
  },
  freeCard: {
    background: `linear-gradient(135deg, ${'#00B4D8'} 0%, ${'#480CA8'} 100%)`, 
    padding: '2.5rem',
    borderRadius: '12px',
    color: 'white',
    textAlign: 'center' as const,
    boxShadow: '0 10px 30px rgba(0, 180, 216, 0.3)',
  },
  freeBadge: {
    display: 'inline-block',
    padding: '0.5rem 1rem',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: '8px',
    fontSize: '0.875rem',
    fontWeight: 600,
    marginBottom: '1rem',
    backdropFilter: 'blur(10px)',
  },
  freeTitle: {
    fontSize: '2rem',
    fontWeight: 700,
    marginBottom: '1rem',
  },
  freePoints: {
    marginBottom: '1.5rem',
  },
  freeNumber: {
    fontSize: '4rem',
    fontWeight: 700,
    display: 'block',
    lineHeight: 1,
    textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)', 
  },
  freeText: {
    fontSize: '1.25rem',
    opacity: 0.9,
  },
  freeDescription: {
    fontSize: '1.125rem',
    marginBottom: '2rem',
    opacity: 0.9,
  },
  freeFeatures: {
    listStyle: 'none',
    textAlign: 'left' as const,
    display: 'inline-block',
    fontSize: '1rem',
    paddingLeft: '0',
  },
  freeFeature: {
    marginBottom: '0.75rem',
    opacity: 0.95,
    position: 'relative' as const,
    paddingLeft: '1.5rem',
  },

  // --- Paid Plans Styles ---
  plans: {
    padding: '3rem 1.5rem',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  planGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '2rem',
  },
  planCard: {
    backgroundColor: '#181818', 
    borderRadius: '12px',
    padding: '2rem',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.5)',
    border: '1px solid #333333', 
    transition: 'all 0.3s ease-in-out',
    position: 'relative' as const,
    display: 'flex',
    flexDirection: 'column' as const,
  },
  planCardPopular: {
    border: '2px solid #00B4D8', 
    transform: 'scale(1.05)',
    background: '#1c1c1c', 
    boxShadow: '0 8px 25px rgba(0, 180, 216, 0.2)',
  },
  popularBadge: {
    position: 'absolute' as const,
    top: '-12px',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '0.5rem 1.5rem',
    backgroundColor: '#00B4D8', 
    color: '#181818', 
    borderRadius: '8px',
    fontSize: '0.875rem',
    fontWeight: 700,
    boxShadow: '0 2px 8px rgba(0, 180, 216, 0.4)',
  },
  planHeader: {
    textAlign: 'center' as const,
    paddingBottom: '2rem',
    borderBottom: '1px solid #333333',
    marginBottom: '2rem',
  },
  planName: {
    fontSize: '1.5rem',
    fontWeight: 700,
    marginBottom: '1rem',
    color: '#ffffff',
  },
  planPrice: {
    marginBottom: '0.5rem',
  },
  planPriceAmount: {
    fontSize: '3rem',
    fontWeight: 700,
    color: '#ffffff',
  },
  planPricePeriod: {
    fontSize: '1.125rem',
    color: '#999999',
  },
  planPoints: {
    fontSize: '1rem',
    color: '#00B4D8', 
    fontWeight: 600, 
  },
  planFeatures: {
    listStyle: 'none',
    marginBottom: '2rem',
    flex: 1,
    paddingLeft: '0', 
  },
  planFeature: {
    marginBottom: '0.875rem',
    color: '#cccccc',
    fontSize: '0.938rem',
    lineHeight: 1.6,
    position: 'relative' as const,
    paddingLeft: '1.5rem',
  },
  subscribeButton: {
    padding: '1rem 2rem',
    backgroundColor: '#333333', 
    color: 'white',
    borderRadius: '8px',
    fontWeight: 600,
    fontSize: '1rem',
    transition: 'all 0.2s ease-in-out',
    width: '100%',
    cursor: 'pointer',
    border: 'none',
  },
  subscribeButtonPopular: {
    backgroundColor: '#00B4D8', 
    color: '#181818',
  },
    
  // --- GET IN TOUCH Styles ---
  getInTouchContainer: {
    padding: '4rem 1.5rem',
    maxWidth: '1200px',
    margin: '0 auto',
    backgroundColor: '#0a0a0a',
  },
  getInTouchContent: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    backgroundColor: '#181818',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
    overflow: 'hidden',
    border: '1px solid #333333',
  },
  getInTouchLeft: {
    flex: '1 1 50%',
    padding: '3rem',
    backgroundColor: '#111111',
    minWidth: '350px',
  },
  getInTouchRight: {
    flex: '1 1 50%',
    padding: '3rem',
    minWidth: '350px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1.5rem',
  },
  getInTouchTitle: {
    fontSize: '2.25rem',
    fontWeight: 700,
    color: '#ffffff',
    marginBottom: '1rem',
  },
  getInTouchSubtitle: {
    fontSize: '1.125rem',
    color: '#cccccc',
    lineHeight: 1.6,
    marginBottom: '2rem',
  },
  clientLogosGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '1rem',
    marginTop: '2rem',
  },
  clientLogoBox: {
    backgroundColor: '#181818',
    padding: '1rem',
    borderRadius: '8px',
    border: '1px solid #333333',
    textAlign: 'center' as const,
    color: '#00B4D8',
    fontWeight: 600,
    fontSize: '0.875rem',
    minHeight: '60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5rem',
  },
  inputLabel: {
    fontSize: '0.9rem',
    fontWeight: 600,
    color: '#cccccc',
  },
  inputField: {
    padding: '1rem',
    backgroundColor: '#222222',
    border: '1px solid #444444',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '1rem',
    transition: 'border-color 0.2s',
  },
  selectField: {
    appearance: 'none' as const, // Remove default select arrow
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2300B4D8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 1rem center',
    paddingRight: '2.5rem',
  },
  submitButton: {
    padding: '1rem 2rem',
    backgroundColor: '#00B4D8',
    color: '#181818',
    borderRadius: '8px',
    fontWeight: 700,
    fontSize: '1.1rem',
    transition: 'background-color 0.2s',
    marginTop: '1.5rem',
    cursor: 'pointer',
    border: 'none',
  },

  // --- Feature Comparison Styles ---
  featureComparison: {
    padding: '4rem 1.5rem',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  featureComparisonTitle: {
    fontSize: '2.5rem',
    textAlign: 'center' as const,
    marginBottom: '3rem',
    color: '#ffffff',
  },
  comparisonTable: {
    display: 'grid',
    gridTemplateColumns: '1.5fr repeat(3, 1fr)',
    border: '1px solid #333333',
    borderRadius: '12px',
    overflow: 'hidden',
    backgroundColor: '#181818',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
  },
  comparisonHeaderRow: {
    display: 'contents', 
  },
  comparisonHeaderCell: {
    padding: '1.5rem 1rem',
    backgroundColor: '#111111', 
    borderBottom: '2px solid #00B4D8', 
    textAlign: 'center' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'space-between',
    gap: '10px',
  },
  comparisonPlanTitle: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#00B4D8',
    margin: '0',
  },
  comparisonPlanPrice: {
    fontSize: '1.1rem',
    fontWeight: 600,
    color: '#ffffff',
    margin: '0.5rem 0',
  },
  comparisonPricePeriod: {
    fontSize: '0.8rem',
    fontWeight: 400,
    color: '#999999',
    marginLeft: '5px',
  },
  comparisonActionButton: {
    padding: '0.75rem 1.5rem',
    borderRadius: '6px',
    fontWeight: 600,
    fontSize: '0.9rem',
    width: '100%',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  comparisonActionButtonDefault: {
    backgroundColor: '#333333',
    color: '#ffffff',
    border: '1px solid #555555',
  },
  comparisonActionButtonPopular: {
    backgroundColor: '#00B4D8',
    color: '#111111',
    border: 'none',
  },
  featuresLabel: {
    gridColumn: '1 / span 4', 
    backgroundColor: '#222222',
    color: '#00B4D8',
    fontWeight: 700,
    padding: '0.75rem 1.5rem',
    fontSize: '1rem',
    borderTop: '1px solid #333333',
    borderBottom: '1px solid #333333',
  },
  comparisonFeatureRow: {
    display: 'contents', 
  },
  comparisonFeatureName: {
    padding: '1rem 1.5rem',
    textAlign: 'left' as const,
    borderRight: '1px solid #333333',
    borderBottom: '1px solid #222222',
    color: '#cccccc',
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
  },
  comparisonFeatureValue: {
    padding: '1rem 1rem',
    textAlign: 'center' as const,
    borderRight: '1px solid #333333',
    borderBottom: '1px solid #222222',
    color: '#ffffff',
    fontWeight: 600,
  },
  infoIcon: {
    marginLeft: '8px',
    cursor: 'help',
  },

  // --- FAQ Styles ---
  faq: {
    padding: '4rem 1.5rem',
    maxWidth: '1000px',
    margin: '0 auto',
  },
  faqTitle: {
    fontSize: '2.5rem',
    textAlign: 'center' as const,
    marginBottom: '3rem',
    color: '#ffffff',
  },
  faqGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '2rem',
  },
  faqItem: { 
    backgroundColor: '#181818', 
    padding: '1.5rem',
    borderRadius: '12px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
    border: '1px solid #333333',
    transition: 'all 0.3s ease-in-out', 
    cursor: 'pointer',
  },
  faqQuestion: {
    fontSize: '1.125rem',
    fontWeight: 600,
    marginBottom: '0.75rem',
    color: '#00B4D8', 
  },
  faqAnswer: {
    color: '#cccccc',
    lineHeight: 1.7,
  },
};