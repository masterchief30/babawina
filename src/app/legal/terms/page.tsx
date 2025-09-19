import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export const metadata = {
  title: "Terms of Service - BabaWina",
  description: "Terms and conditions for using the BabaWina platform.",
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-primary">
            BabaWina
          </Link>
          
          <Link href="/">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto prose prose-slate">
          <h1>Terms of Service</h1>
          <p className="text-muted-foreground">Last updated: September 18, 2025</p>

          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing and using BabaWina (&quot;the Service&quot;), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
          </p>

          <h2>2. Eligibility</h2>
          <p>
            You must be at least 18 years old to use this service. By using BabaWina, you represent and warrant that you are at least 18 years of age and have the legal capacity to enter into this agreement.
          </p>

          <h2>3. Competition Rules</h2>
          <h3>3.1 Entry Requirements</h3>
          <ul>
            <li>Each user may submit only one entry per competition</li>
            <li>Entries must be submitted before the competition end time</li>
            <li>Entry fees are non-refundable once submitted</li>
          </ul>

          <h3>3.2 Judging Process</h3>
          <ul>
            <li>Winners are determined by proximity to the actual ball position</li>
            <li>In case of ties, the earliest submission wins</li>
            <li>All judging decisions are final</li>
            <li>Judging footage is available upon request for transparency</li>
          </ul>

          <h2>4. Prizes and Payments</h2>
          <p>
            Prizes will be awarded to verified winners within 30 days of competition closure. Winners will be contacted via their registered email address. Unclaimed prizes may be forfeited after 90 days.
          </p>

          <h2>5. User Conduct</h2>
          <p>
            Users agree not to:
          </p>
          <ul>
            <li>Use automated systems or bots to submit entries</li>
            <li>Attempt to manipulate or interfere with the competition process</li>
            <li>Create multiple accounts to circumvent entry limits</li>
            <li>Engage in any fraudulent or deceptive practices</li>
          </ul>

          <h2>6. Privacy and Data Protection</h2>
          <p>
            Your privacy is important to us. Please review our Privacy Policy to understand how we collect, use, and protect your information.
          </p>

          <h2>7. Limitation of Liability</h2>
          <p>
            BabaWina shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly.
          </p>

          <h2>8. Modifications to Terms</h2>
          <p>
            We reserve the right to modify these terms at any time. Users will be notified of significant changes via email or through the platform.
          </p>

          <h2>9. Governing Law</h2>
          <p>
            These terms shall be governed by and construed in accordance with the laws of South Africa.
          </p>

          <h2>10. Contact Information</h2>
          <p>
            For questions about these Terms of Service, please contact us at{" "}
            <a href="mailto:support@babawina.co.za" className="text-accent hover:underline">
              support@babawina.co.za
            </a>
          </p>

          <div className="mt-12 p-6 bg-muted/30 rounded-lg">
            <p className="text-sm text-muted-foreground mb-0">
              <strong>Remember:</strong> 18+ only. Play responsibly. If you feel you may have a gambling problem, 
              please seek help from the South African Responsible Gambling Foundation.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
