import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { useNavigate } from 'react-router-dom';
import { FiInfo } from 'react-icons/fi'; 

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

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    if (!supabase) {
      // If Supabase is not configured, use default plans
      setPlans([
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
      ]);
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('active', true)
      .order('price', { ascending: true });

    if (data) {
      setPlans(data as Plan[]);
    }
    setLoading(false);
  };

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

  return (
    <div style={{...styles.container, ...styles.darkBackground}}>
      <section style={styles.hero}>
        <h1 style={styles.title}>Simple, <span style={styles.highlightText}>Crypt-Secure</span> Pricing</h1>
        <p style={styles.subtitle}>
          Choose the plan that fits your security needs. All plans include access to our powerful voice security and verification tools.
        </p>
      </section>

      <div style={styles.freeTier}>
        <div style={styles.freeCard}>
          <div style={styles.freeBadge}>Always Free</div>
          <h3 style={styles.freeTitle}>Developer Tier</h3>
          <div style={styles.freePoints}>
            <span style={styles.freeNumber}>100</span>
            <span style={styles.freeText}>Voice Tokens</span>
          </div>
          <p style={styles.freeDescription}>
            Perfect for testing the VoiceCrypt API and authentication features. No credit card required.
          </p>
          <ul style={styles.freeFeatures}>
            <li style={styles.freeFeature}>✓ 100 free Voice Tokens on signup</li>
            <li style={styles.freeFeature}>✓ Core Biometric verification methods</li>
            <li style={styles.freeFeature}>✓ Up to 15 seconds per API call</li>
            <li style={styles.freeFeature}>✓ 7-day logs history</li>
          </ul>
        </div>
      </div>

      <section style={styles.plans}>
        <div style={styles.planGrid}>
          {plans.map((plan) => {
            const isPopular = plan.name === 'Pro';
            return (
              <div
                key={plan.id}
                style={{
                  ...styles.planCard,
                  ...(isPopular ? styles.planCardPopular : {}),
                }}
              >
                {isPopular && <div style={styles.popularBadge}>Most Popular</div>}
                <div style={styles.planHeader}>
                  <h3 style={styles.planName}>{plan.name}</h3>
                  <div style={styles.planPrice}>
                    <span style={styles.planPriceAmount}>${plan.price}</span>
                    <span style={styles.planPricePeriod}>/month</span>
                  </div>
                  <div style={styles.planPoints}>
                    {plan.energy_points.toLocaleString()} Voice Tokens/month
                  </div>
                </div>

                <ul style={styles.planFeatures}>
                  <li style={styles.planFeature}>
                    ✓ Up to {plan.features.maxDuration} seconds of voice data per transaction
                  </li>
                  <li style={styles.planFeature}>
                    ✓ {plan.features.formats.length === 1 && plan.features.formats[0] === 'all'
                      ? 'All voice/data formats supported'
                      : plan.features.formats.join(', ').toUpperCase() + ' verification input'}
                  </li>
                  <li style={styles.planFeature}>
                    ✓ {plan.features.priority.charAt(0).toUpperCase() + plan.features.priority.slice(1)} priority latency
                  </li>
                  <li style={styles.planFeature}>
                    ✓ {plan.features.history}-day secure audit logs
                  </li>
                  {plan.features.api && (
                    <li style={styles.planFeature}>✓ Dedicated API access</li>
                  )}
                  <li style={styles.planFeature}>✓ Advanced biometrics enrollment</li>
                  <li style={styles.planFeature}>✓ Premium technical support</li>
                </ul>

                <button
                  onClick={() => handleSubscribe(plan.name)}
                  style={{
                    ...styles.subscribeButton,
                    ...(isPopular ? styles.subscribeButtonPopular : {}),
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
    <section style={styles.getInTouchContainer}>
        <div style={styles.getInTouchContent}>
            <div style={styles.getInTouchLeft}>
                <h2 style={styles.getInTouchTitle}>Get in Touch</h2>
                <p style={styles.getInTouchSubtitle}>
                    We're looking forward to hearing from you! Please fill out the form for a demo or custom Enterprise plan, and we'll get back to you shortly.
                </p>
                
                {/* Placeholder for Client Logos/Integrations */}
                <div style={styles.clientLogosGrid}>
                    <div style={styles.clientLogoBox}>VoiceCrypt Enterprise</div>
                    <div style={styles.clientLogoBox}>High-Security APIs</div>
                    <div style={styles.clientLogoBox}>Custom Biometrics</div>
                    <div style={styles.clientLogoBox}>Global Compliance</div>
                    <div style={styles.clientLogoBox}>Fraud Detection Suite</div>
                    <div style={styles.clientLogoBox}>Dedicated Support</div>
                </div>
            </div>

            <div style={styles.getInTouchRight}>
                <div style={styles.inputGroup}>
                    <label htmlFor="email" style={styles.inputLabel}>Work Email Address</label>
                    <input 
                        type="email" 
                        id="email" 
                        placeholder="yourname@company.com" 
                        style={styles.inputField} 
                    />
                </div>
                
                <div style={styles.inputGroup}>
                    <label htmlFor="range" style={styles.inputLabel}>Approximate Monthly Token Volume</label>
                    <select id="range" style={{...styles.inputField, ...styles.selectField}}>
                        <option>Select volume range</option>
                        <option>1,000 - 5,000</option>
                        <option>5,001 - 20,000</option>
                        <option>20,001 - 100,000+</option>
                        <option>Custom Enterprise</option>
                    </select>
                </div>

                <div style={styles.inputGroup}>
                    <label htmlFor="phone" style={styles.inputLabel}>Phone Number (Optional)</label>
                    <input 
                        type="tel" 
                        id="phone" 
                        placeholder="+1 555 123 4567" 
                        style={styles.inputField} 
                    />
                </div>

                <button style={styles.submitButton}>
                    Submit
                </button>
            </div>
        </div>
    </section>
      
    {/* Feature Comparison Section */}
    <section style={styles.featureComparison}>
        <h2 style={styles.featureComparisonTitle}>Feature Comparison</h2>

        <div style={styles.comparisonTable}>
            {/* Table Header Row */}
            <div style={styles.comparisonHeaderRow}>
                <div style={styles.comparisonHeaderCell}></div> {/* Empty cell for alignment */}
                <div style={styles.comparisonHeaderCell}>
                    <h3 style={styles.comparisonPlanTitle}>Basic</h3>
                    <p style={styles.comparisonPlanPrice}>from $9.99<span style={styles.comparisonPricePeriod}>/month</span></p>
                    <button style={{ ...styles.comparisonActionButton, ...styles.comparisonActionButtonDefault }} onClick={() => handleSubscribe('Basic')}>
                        Get Started
                    </button>
                </div>
                <div style={styles.comparisonHeaderCell}>
                    <h3 style={styles.comparisonPlanTitle}>Pro</h3>
                    <p style={styles.comparisonPlanPrice}>from $19.99<span style={styles.comparisonPricePeriod}>/month</span></p>
                    <button style={{ ...styles.comparisonActionButton, ...styles.comparisonActionButtonPopular }} onClick={() => handleSubscribe('Pro')}>
                        Get Started
                    </button>
                </div>
                <div style={styles.comparisonHeaderCell}>
                    <h3 style={styles.comparisonPlanTitle}>Enterprise</h3>
                    <p style={styles.comparisonPlanPrice}>Custom</p>
                    <button style={{ ...styles.comparisonActionButton, ...styles.comparisonActionButtonDefault }} onClick={() => navigate('/contact')}>
                        Contact Sales
                    </button>
                </div>
            </div>

            {/* Features Label */}
            <div style={styles.featuresLabel}>Features</div>

            {/* Feature Rows */}
            <div style={styles.comparisonFeatureRow}>
                <div style={styles.comparisonFeatureName}>
                    Voice Tokens included <FiInfo size={14} color="#999" style={styles.infoIcon} title="Monthly allocation of secure voice transaction tokens." />
                </div>
                <div style={styles.comparisonFeatureValue}>500</div>
                <div style={styles.comparisonFeatureValue}>1,500</div>
                <div style={styles.comparisonFeatureValue}>Custom</div>
            </div>

            <div style={styles.comparisonFeatureRow}>
                <div style={styles.comparisonFeatureName}>
                    Max voice transaction duration
                </div>
                <div style={styles.comparisonFeatureValue}>30 sec</div>
                <div style={styles.comparisonFeatureValue}>120 sec</div>
                <div style={styles.comparisonFeatureValue}>300+ sec</div>
            </div>

            <div style={styles.comparisonFeatureRow}>
                <div style={styles.comparisonFeatureName}>
                    Supported input formats
                </div>
                <div style={styles.comparisonFeatureValue}>MP3, WAV</div>
                <div style={styles.comparisonFeatureValue}>MP3, WAV, M4A, FLAC</div>
                <div style={styles.comparisonFeatureValue}>All standard formats</div>
            </div>

            <div style={styles.comparisonFeatureRow}>
                <div style={styles.comparisonFeatureName}>
                    Priority processing
                </div>
                <div style={styles.comparisonFeatureValue}>Standard</div>
                <div style={styles.comparisonFeatureValue}>High</div>
                <div style={styles.comparisonFeatureValue}>Highest</div>
            </div>

            <div style={styles.comparisonFeatureRow}>
                <div style={styles.comparisonFeatureName}>
                    Secure audit logs history
                </div>
                <div style={styles.comparisonFeatureValue}>30 days</div>
                <div style={styles.comparisonFeatureValue}>90 days</div>
                <div style={styles.comparisonFeatureValue}>365+ days</div>
            </div>

            <div style={styles.comparisonFeatureRow}>
                <div style={styles.comparisonFeatureName}>
                    Dedicated API Access
                </div>
                <div style={styles.comparisonFeatureValue}>-</div>
                <div style={styles.comparisonFeatureValue}>✓</div>
                <div style={styles.comparisonFeatureValue}>✓</div>
            </div>

            <div style={styles.comparisonFeatureRow}>
                <div style={styles.comparisonFeatureName}>
                    Advanced Biometric Enrollment
                </div>
                <div style={styles.comparisonFeatureValue}>-</div>
                <div style={styles.comparisonFeatureValue}>✓</div>
                <div style={styles.comparisonFeatureValue}>✓</div>
            </div>
            
            <div style={styles.comparisonFeatureRow}>
                <div style={styles.comparisonFeatureName}>
                    Customer Support Tier
                </div>
                <div style={styles.comparisonFeatureValue}>Email</div>
                <div style={styles.comparisonFeatureValue}>Priority Email</div>
                <div style={styles.comparisonFeatureValue}>Dedicated Account Manager</div>
            </div>

        </div>
    </section>

      <section style={styles.faq}>
        <h2 style={styles.faqTitle}>Frequently Asked Questions</h2>
        <div style={styles.faqGrid}>
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