import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { useNavigate } from 'react-router-dom';

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

export default function Pricing() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
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
      <div style={styles.container}>
        <div style={styles.loading}>Loading plans...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <section style={styles.hero}>
        <h1 style={styles.title}>Simple, Transparent Pricing</h1>
        <p style={styles.subtitle}>
          Choose the plan that fits your needs. All plans include access to our powerful transcription tools.
        </p>
      </section>

      <div style={styles.freeTier}>
        <div style={styles.freeCard}>
          <div style={styles.freeBadge}>Always Free</div>
          <h3 style={styles.freeTitle}>Free Tier</h3>
          <div style={styles.freePoints}>
            <span style={styles.freeNumber}>100</span>
            <span style={styles.freeText}>Energy Points</span>
          </div>
          <p style={styles.freeDescription}>
            Perfect for trying out VoiceScribe. No credit card required.
          </p>
          <ul style={styles.freeFeatures}>
            <li style={styles.freeFeature}>✓ 100 free energy points on signup</li>
            <li style={styles.freeFeature}>✓ All transcription methods</li>
            <li style={styles.freeFeature}>✓ Up to 15 minutes per file</li>
            <li style={styles.freeFeature}>✓ 7-day history</li>
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
                    {plan.energy_points.toLocaleString()} Energy Points/month
                  </div>
                </div>

                <ul style={styles.planFeatures}>
                  <li style={styles.planFeature}>
                    ✓ Up to {plan.features.maxDuration} minutes per file
                  </li>
                  <li style={styles.planFeature}>
                    ✓ {plan.features.formats.length === 1 && plan.features.formats[0] === 'all'
                      ? 'All audio/video formats'
                      : plan.features.formats.join(', ').toUpperCase()}
                  </li>
                  <li style={styles.planFeature}>
                    ✓ {plan.features.priority.charAt(0).toUpperCase() + plan.features.priority.slice(1)} priority processing
                  </li>
                  <li style={styles.planFeature}>
                    ✓ {plan.features.history}-day transcription history
                  </li>
                  {plan.features.api && (
                    <li style={styles.planFeature}>✓ API access</li>
                  )}
                  <li style={styles.planFeature}>✓ Export to multiple formats</li>
                  <li style={styles.planFeature}>✓ Email support</li>
                </ul>

                <button
                  onClick={() => handleSubscribe(plan.name)}
                  style={{
                    ...styles.subscribeButton,
                    ...(isPopular ? styles.subscribeButtonPopular : {}),
                  }}
                >
                  Subscribe to {plan.name}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      <section style={styles.faq}>
        <h2 style={styles.faqTitle}>Frequently Asked Questions</h2>
        <div style={styles.faqGrid}>
          <div style={styles.faqItem}>
            <h3 style={styles.faqQuestion}>What are Energy Points?</h3>
            <p style={styles.faqAnswer}>
              Energy Points are the currency used for transcription. Each transcription costs a small amount of points based on the audio length.
            </p>
          </div>
          <div style={styles.faqItem}>
            <h3 style={styles.faqQuestion}>Can I change plans anytime?</h3>
            <p style={styles.faqAnswer}>
              Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.
            </p>
          </div>
          <div style={styles.faqItem}>
            <h3 style={styles.faqQuestion}>Do unused points roll over?</h3>
            <p style={styles.faqAnswer}>
              Yes, unused energy points roll over to the next month, so you never lose what you've paid for.
            </p>
          </div>
          <div style={styles.faqItem}>
            <h3 style={styles.faqQuestion}>What formats are supported?</h3>
            <p style={styles.faqAnswer}>
              We support MP3, WAV, M4A, FLAC, and most video formats. Higher tiers support more formats.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

const styles = {
  container: {
    minHeight: 'calc(100vh - 80px)',
    paddingBottom: '4rem',
  },
  loading: {
    textAlign: 'center' as const,
    padding: '4rem',
    fontSize: '1.25rem',
    color: 'var(--color-gray-600)',
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
    color: 'var(--color-gray-900)',
  },
  subtitle: {
    fontSize: '1.25rem',
    color: 'var(--color-gray-600)',
    lineHeight: 1.7,
  },
  freeTier: {
    padding: '2rem 1.5rem',
    maxWidth: '600px',
    margin: '0 auto',
  },
  freeCard: {
    backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    background: 'linear-gradient(135deg, var(--color-secondary) 0%, #059669 100%)',
    padding: '2.5rem',
    borderRadius: 'var(--border-radius-xl)',
    color: 'white',
    textAlign: 'center' as const,
    boxShadow: 'var(--shadow-xl)',
  },
  freeBadge: {
    display: 'inline-block',
    padding: '0.5rem 1rem',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 'var(--border-radius-lg)',
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
  },
  freeFeature: {
    marginBottom: '0.75rem',
    opacity: 0.95,
  },
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
    backgroundColor: 'white',
    borderRadius: 'var(--border-radius-xl)',
    padding: '2rem',
    boxShadow: 'var(--shadow-lg)',
    border: '2px solid var(--color-gray-200)',
    transition: 'all var(--transition-normal)',
    position: 'relative' as const,
    display: 'flex',
    flexDirection: 'column' as const,
  },
  planCardPopular: {
    border: '2px solid var(--color-primary)',
    transform: 'scale(1.05)',
  },
  popularBadge: {
    position: 'absolute' as const,
    top: '-12px',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '0.5rem 1.5rem',
    backgroundColor: 'var(--color-primary)',
    color: 'white',
    borderRadius: 'var(--border-radius-lg)',
    fontSize: '0.875rem',
    fontWeight: 600,
    boxShadow: 'var(--shadow-md)',
  },
  planHeader: {
    textAlign: 'center' as const,
    paddingBottom: '2rem',
    borderBottom: '1px solid var(--color-gray-200)',
    marginBottom: '2rem',
  },
  planName: {
    fontSize: '1.5rem',
    fontWeight: 700,
    marginBottom: '1rem',
    color: 'var(--color-gray-900)',
  },
  planPrice: {
    marginBottom: '0.5rem',
  },
  planPriceAmount: {
    fontSize: '3rem',
    fontWeight: 700,
    color: 'var(--color-gray-900)',
  },
  planPricePeriod: {
    fontSize: '1.125rem',
    color: 'var(--color-gray-600)',
  },
  planPoints: {
    fontSize: '1rem',
    color: 'var(--color-primary)',
    fontWeight: 600,
  },
  planFeatures: {
    listStyle: 'none',
    marginBottom: '2rem',
    flex: 1,
  },
  planFeature: {
    marginBottom: '0.875rem',
    color: 'var(--color-gray-700)',
    fontSize: '0.938rem',
    lineHeight: 1.6,
  },
  subscribeButton: {
    padding: '1rem 2rem',
    backgroundColor: 'var(--color-gray-900)',
    color: 'white',
    borderRadius: 'var(--border-radius-md)',
    fontWeight: 600,
    fontSize: '1rem',
    transition: 'all var(--transition-fast)',
    width: '100%',
  },
  subscribeButtonPopular: {
    backgroundColor: 'var(--color-primary)',
  },
  faq: {
    padding: '4rem 1.5rem',
    maxWidth: '1000px',
    margin: '0 auto',
  },
  faqTitle: {
    fontSize: '2.5rem',
    textAlign: 'center' as const,
    marginBottom: '3rem',
    color: 'var(--color-gray-900)',
  },
  faqGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '2rem',
  },
  faqItem: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: 'var(--border-radius-lg)',
    boxShadow: 'var(--shadow-sm)',
  },
  faqQuestion: {
    fontSize: '1.125rem',
    fontWeight: 600,
    marginBottom: '0.75rem',
    color: 'var(--color-gray-900)',
  },
  faqAnswer: {
    color: 'var(--color-gray-600)',
    lineHeight: 1.7,
  },
};
