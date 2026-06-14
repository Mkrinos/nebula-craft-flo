import { Link } from 'react-router-dom';
import { SEOHead } from '@/components/SEOHead';
import NexusLogo from "@/components/NexusLogo";

const Privacy = () => {
  const year = new Date().getFullYear();
  const effectiveDate = 'January 1, 2026';

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEOHead
        title="Privacy Policy"
        description="NexusTouch Privacy Policy. Learn how we protect children's data and privacy on our AI creative platform."
        url="https://www.nexus-touch.com/privacy"
      />
      <header className="border-b-2 border-neon-cyan/20 py-4">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <Link to="/"><NexusLogo size="sm" /></Link>
          <Link to="/" aria-label="Back to home page" className="text-sm text-neon-cyan hover:underline">← Home</Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10 max-w-3xl">
        <h1 className="text-3xl sm:text-4xl font-display font-bold mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">Effective {effectiveDate}</p>

        <section className="prose prose-invert max-w-none space-y-6 text-sm sm:text-base leading-relaxed">
          <div>
            <h2 className="text-xl font-semibold mb-2">1. Who We Are</h2>
            <p>NexusTouch is a touch-first creative AI platform for young creators. Privacy and safety are foundational to how we build the product.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">2. Information We Collect</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Account data:</strong> email, display name, age band, and guardian linkage.</li>
              <li><strong>Creative data:</strong> prompts, generated images, quests, playlists, and achievements.</li>
              <li><strong>Usage data:</strong> credits consumed, feature interactions, and device type.</li>
              <li><strong>Safety signals:</strong> moderation decisions on prompts and comments.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">3. How We Use Information</h2>
            <p>We use data to operate the Service, personalise the creative experience, enforce safety guardrails, process billing, and improve product quality. We do not sell personal data.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">4. Children's Privacy (COPPA / GDPR-K)</h2>
            <p>For users under 13, we require verifiable parental consent before collecting personal information beyond what is needed for account creation. Parents can review, export, or delete their child's data at any time via the <Link to="/parental-controls" className="text-neon-cyan hover:underline">Parental Controls</Link> page.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">5. AI Processing</h2>
            <p>Prompts and selected context are sent to our AI gateway providers solely to generate the requested output. Prompts are not used to train third-party models without explicit consent.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">6. Data Storage & Security</h2>
            <p>Data is stored on managed cloud infrastructure with row-level security, encrypted at rest and in transit. Access is restricted to authenticated users via least-privilege policies.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">7. Sharing</h2>
            <p>We share data only with service providers required to run the Service (hosting, AI inference, payments) under contractual confidentiality obligations, or when required by law.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">8. Your Rights</h2>
            <p>You can access, correct, export, or delete your personal data from your account settings, or by contacting us through the in-app feedback form. EU/UK users have additional rights under GDPR.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">9. Retention</h2>
            <p>We retain account and creative data for as long as your account is active. Deleted accounts are purged within 30 days, except where retention is required by law.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">10. Updates</h2>
            <p>We will notify users of material changes to this Policy in-app at least 14 days before they take effect.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">11. Contact</h2>
            <p>Privacy questions can be sent via the in-app <Link to="/feedback" className="text-neon-cyan hover:underline">Feedback</Link> page.</p>
          </div>
        </section>

        <footer className="mt-12 pt-6 border-t border-neon-cyan/20 text-xs text-muted-foreground text-center">
          © {year} NexusTouch. All rights reserved.
        </footer>
      </main>
    </div>
  );
};

export default Privacy;
