import { Link } from 'react-router-dom';
import { NexusLogo } from '@/components/NexusLogo';

const Terms = () => {
  const year = new Date().getFullYear();
  const effectiveDate = 'January 1, 2026';

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b-2 border-neon-cyan/20 py-4">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <Link to="/"><NexusLogo size="sm" /></Link>
          <Link to="/" className="text-sm text-neon-cyan hover:underline">← Home</Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10 max-w-3xl">
        <h1 className="text-3xl sm:text-4xl font-display font-bold mb-2">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-8">Effective {effectiveDate}</p>

        <section className="prose prose-invert max-w-none space-y-6 text-sm sm:text-base leading-relaxed">
          <div>
            <h2 className="text-xl font-semibold mb-2">1. Acceptance of Terms</h2>
            <p>By creating an account or using NexusTouch ("the Service"), you agree to be bound by these Terms of Service. If you are under 18, a parent or legal guardian must review and accept these terms on your behalf.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">2. Eligibility & Age Requirement</h2>
            <p>NexusTouch is designed for creators aged 8–15 with verified guardian oversight. Children under 13 require guardian consent under COPPA. All accounts under 18 require parental verification before accessing image generation, community sharing, or AI persona features.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">3. Acceptable Use</h2>
            <p>You agree not to use the Service to generate, upload, or share content that is unlawful, hateful, sexually explicit, violent, or that infringes on the rights of others. All prompts and outputs are subject to automated safety moderation.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">4. User Content & AI Generations</h2>
            <p>You retain ownership of creative content you produce. By marking content as public, you grant NexusTouch a non-exclusive license to display it within the community gallery. AI-generated outputs are provided "as-is" and may be reused subject to applicable model provider terms.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">5. Subscriptions & Billing</h2>
            <p>Paid plans renew automatically until cancelled. Refunds are issued in accordance with our refund policy and applicable consumer law. Credit balances are non-transferable.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">6. Termination</h2>
            <p>We may suspend or terminate accounts that violate these Terms or that pose a safety risk to the community. You may delete your account at any time from the account settings.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">7. Disclaimers & Limitation of Liability</h2>
            <p>The Service is provided "as-is" without warranties of any kind. To the maximum extent permitted by law, NexusTouch is not liable for indirect, incidental, or consequential damages arising from use of the Service.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">8. Changes to These Terms</h2>
            <p>We may update these Terms from time to time. Material changes will be announced in-app at least 14 days before they take effect.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">9. Contact</h2>
            <p>Questions about these Terms can be sent via the in-app <Link to="/feedback" className="text-neon-cyan hover:underline">Feedback</Link> page.</p>
          </div>
        </section>

        <footer className="mt-12 pt-6 border-t border-neon-cyan/20 text-xs text-muted-foreground text-center">
          © {year} NexusTouch. All rights reserved.
        </footer>
      </main>
    </div>
  );
};

export default Terms;
