import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export const metadata = {
  title: "Privacy Policy - BabaWina",
  description: "How we collect, use, and protect your personal information.",
}

export default function PrivacyPage() {
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
          <h1>Privacy Policy</h1>
          <p className="text-muted-foreground">Last updated: September 18, 2025</p>

          <h2>1. Information We Collect</h2>
          
          <h3>1.1 Personal Information</h3>
          <p>
            When you create an account, we collect:
          </p>
          <ul>
            <li>Email address</li>
            <li>Display name (optional)</li>
            <li>Password (encrypted)</li>
          </ul>

          <h3>1.2 Competition Data</h3>
          <p>
            When you participate in competitions, we collect:
          </p>
          <ul>
            <li>Your crosshair placement coordinates</li>
            <li>Submission timestamp</li>
            <li>IP address (hashed for security)</li>
          </ul>

          <h3>1.3 Technical Information</h3>
          <p>
            We automatically collect:
          </p>
          <ul>
            <li>Browser type and version</li>
            <li>Device information</li>
            <li>Usage analytics (anonymized)</li>
          </ul>

          <h2>2. How We Use Your Information</h2>
          
          <h3>2.1 Service Provision</h3>
          <ul>
            <li>To create and manage your account</li>
            <li>To process competition entries</li>
            <li>To determine and contact winners</li>
            <li>To provide customer support</li>
          </ul>

          <h3>2.2 Communication</h3>
          <ul>
            <li>To send important service updates</li>
            <li>To notify you of competition results</li>
            <li>To respond to your inquiries</li>
          </ul>

          <h3>2.3 Security and Fraud Prevention</h3>
          <ul>
            <li>To detect and prevent fraudulent activities</li>
            <li>To ensure fair play in competitions</li>
            <li>To protect the integrity of our platform</li>
          </ul>

          <h2>3. Information Sharing</h2>
          
          <h3>3.1 Winner Information</h3>
          <p>
            When you win a competition, we may publicly display:
          </p>
          <ul>
            <li>Your display name or initials</li>
            <li>General location (city)</li>
            <li>Prize information</li>
          </ul>

          <h3>3.2 Service Providers</h3>
          <p>
            We may share information with trusted service providers who help us operate our platform, including:
          </p>
          <ul>
            <li>Cloud hosting services (Supabase)</li>
            <li>Payment processors</li>
            <li>Email service providers</li>
          </ul>

          <h3>3.3 Legal Requirements</h3>
          <p>
            We may disclose information when required by law or to protect our rights and safety.
          </p>

          <h2>4. Data Security</h2>
          <p>
            We implement appropriate security measures to protect your personal information:
          </p>
          <ul>
            <li>Encryption of sensitive data</li>
            <li>Secure database storage</li>
            <li>Regular security audits</li>
            <li>Access controls and authentication</li>
          </ul>

          <h2>5. Data Retention</h2>
          <p>
            We retain your information for as long as necessary to provide our services and comply with legal obligations:
          </p>
          <ul>
            <li>Account information: Until account deletion</li>
            <li>Competition entries: 7 years for audit purposes</li>
            <li>Winner records: Permanently for transparency</li>
          </ul>

          <h2>6. Your Rights</h2>
          <p>
            Under South African data protection laws, you have the right to:
          </p>
          <ul>
            <li>Access your personal information</li>
            <li>Correct inaccurate information</li>
            <li>Delete your account and associated data</li>
            <li>Object to certain processing activities</li>
            <li>Data portability</li>
          </ul>

          <h2>7. Cookies and Tracking</h2>
          <p>
            We use essential cookies to:
          </p>
          <ul>
            <li>Maintain your login session</li>
            <li>Remember your preferences</li>
            <li>Ensure platform security</li>
          </ul>
          <p>
            We do not use third-party advertising cookies.
          </p>

          <h2>8. Children's Privacy</h2>
          <p>
            Our service is not intended for users under 18 years of age. We do not knowingly collect personal information from children under 18.
          </p>

          <h2>9. International Transfers</h2>
          <p>
            Your information may be processed in countries outside South Africa. We ensure appropriate safeguards are in place to protect your data.
          </p>

          <h2>10. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any material changes via email or through our platform.
          </p>

          <h2>11. Contact Us</h2>
          <p>
            For questions about this Privacy Policy or to exercise your rights, contact us at{" "}
            <a href="mailto:support@babawina.co.za" className="text-accent hover:underline">
              support@babawina.co.za
            </a>
          </p>

          <div className="mt-12 p-6 bg-muted/30 rounded-lg">
            <p className="text-sm text-muted-foreground mb-0">
              <strong>Your Privacy Matters:</strong> We are committed to protecting your personal information 
              and being transparent about how we use it. If you have any concerns, please don't hesitate to contact us.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
