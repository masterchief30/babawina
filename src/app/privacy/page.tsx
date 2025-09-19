import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-400">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-xl shadow-md">
        <div className="container mx-auto px-4 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors">
              <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
              <span className="font-semibold text-sm md:text-base">Back to Home</span>
            </Link>
            <div className="flex items-center gap-2 md:gap-3">
              <img 
                src="/images/hero/mascot002.png" 
                alt="BabaWina Mascot" 
                className="w-6 h-6 md:w-8 md:h-8 object-contain"
              />
              <span className="text-lg md:text-xl font-bold text-blue-600">BabaWina</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 md:px-8 py-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white text-center">Privacy Policy</h1>
            <p className="text-blue-100 text-center mt-2">Last updated: December 2024</p>
          </div>

          {/* Content */}
          <div className="p-6 md:p-8 space-y-8">
            
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Information We Collect</h2>
              <div className="space-y-4 text-gray-700">
                <p><strong>Personal Information:</strong></p>
                <ul className="list-disc list-inside ml-4 space-y-2">
                  <li>Email address (for account creation and communication)</li>
                  <li>Age confirmation (to verify eligibility)</li>
                  <li>Competition entries and game data</li>
                </ul>
                <p><strong>Automatically Collected:</strong></p>
                <ul className="list-disc list-inside ml-4 space-y-2">
                  <li>IP address and device information</li>
                  <li>Browser type and version</li>
                  <li>Usage patterns and preferences</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. How We Use Your Information</h2>
              <div className="space-y-4 text-gray-700">
                <p>We use your information to:</p>
                <ul className="list-disc list-inside ml-4 space-y-2">
                  <li>Provide and maintain our gaming services</li>
                  <li>Process competition entries and determine winners</li>
                  <li>Send important account and competition updates</li>
                  <li>Improve our platform and user experience</li>
                  <li>Comply with legal obligations</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Information Sharing</h2>
              <div className="space-y-4 text-gray-700">
                <p><strong>We DO NOT sell your personal information.</strong></p>
                <p>We may share information only in these cases:</p>
                <ul className="list-disc list-inside ml-4 space-y-2">
                  <li>With your explicit consent</li>
                  <li>To comply with legal requirements</li>
                  <li>To protect our rights and safety</li>
                  <li>With service providers (under strict confidentiality)</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Data Security</h2>
              <div className="space-y-4 text-gray-700">
                <p>We implement industry-standard security measures:</p>
                <ul className="list-disc list-inside ml-4 space-y-2">
                  <li>Encrypted data transmission (SSL/TLS)</li>
                  <li>Secure database storage</li>
                  <li>Regular security audits</li>
                  <li>Limited access to personal data</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Your Rights</h2>
              <div className="space-y-4 text-gray-700">
                <p>You have the right to:</p>
                <ul className="list-disc list-inside ml-4 space-y-2">
                  <li>Access your personal information</li>
                  <li>Correct inaccurate data</li>
                  <li>Delete your account and data</li>
                  <li>Withdraw consent at any time</li>
                  <li>Data portability</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Cookies & Tracking</h2>
              <div className="space-y-4 text-gray-700">
                <p>We use cookies and similar technologies to:</p>
                <ul className="list-disc list-inside ml-4 space-y-2">
                  <li>Keep you logged in</li>
                  <li>Remember your preferences</li>
                  <li>Analyze site usage</li>
                  <li>Improve functionality</li>
                </ul>
                <p>You can control cookies through your browser settings.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Data Retention</h2>
              <p className="text-gray-700 leading-relaxed">
                We retain your personal information only as long as necessary for the purposes outlined in this policy, 
                or as required by law. Account data is deleted within 30 days of account closure.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Children&apos;s Privacy</h2>
              <p className="text-gray-700 leading-relaxed">
                Our service is not intended for users under 18. We do not knowingly collect personal information 
                from children under 18. If you believe we have collected such information, please contact us immediately.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Changes to This Policy</h2>
              <p className="text-gray-700 leading-relaxed">
                We may update this privacy policy from time to time. We will notify you of any changes by posting 
                the new policy on this page and updating the &quot;Last updated&quot; date.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Contact Us</h2>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-gray-700">
                  If you have any questions about this Privacy Policy, please contact us:<br />
                  <strong>Email:</strong> support@babawina.co.za<br />
                  <strong>Address:</strong> South Africa
                </p>
              </div>
            </section>

          </div>
        </div>
      </main>
    </div>
  )
}
