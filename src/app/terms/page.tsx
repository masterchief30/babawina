import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft } from 'lucide-react'

export default function TermsPage() {
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
              <Image 
                src="/images/hero/mascot002.png" 
                alt="BabaWina Mascot" 
                width={32}
                height={32}
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
            <h1 className="text-3xl md:text-4xl font-bold text-white text-center">Terms & Conditions</h1>
            <p className="text-blue-100 text-center mt-2">Last updated: November 2024</p>
          </div>

          {/* Content */}
          <div className="p-6 md:p-8 space-y-8">
            
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                By accessing and using BabaWina (&quot;we&quot;, &quot;us&quot;, &quot;the Service&quot;), you (&quot;User&quot;, &quot;you&quot;) accept and agree to be bound by these Terms and Conditions, our Privacy Policy, and all applicable laws and regulations. If you do not agree with any part of these terms, you must not use our Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Game Rules</h2>
              <div className="space-y-4 text-gray-700">
                <p><strong>How to Play:</strong> Players must guess where the ball is located in the competition image by clicking on the image to place their entry.</p>
                <p><strong>Entry Fee:</strong> Each entry costs R15.00 (Fifteen Rand) unless otherwise specified for specific competitions. Pricing is displayed clearly before submission.</p>
                <p><strong>Simple Pricing:</strong> All entries are priced equally at R15.00 per entry. There are no hidden fees or complex pricing structures.</p>
                <p><strong>Winner Selection:</strong> The player whose guess is closest to the actual ball location (as determined by our judging system) wins the prize. Distance is calculated using precise coordinate measurements.</p>
                <p><strong>Multiple Entries:</strong> Players may submit multiple entries per competition, subject to any competition-specific limits. Each entry is evaluated independently.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Eligibility</h2>
              <div className="space-y-4 text-gray-700">
                <p>• Players must be 18 years or older</p>
                <p>• Valid South African residents only</p>
                <p>• One account per person</p>
                <p>• BabaWina employees and their immediate family members are not eligible</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Prizes & Payouts</h2>
              <div className="space-y-4 text-gray-700">
                <p>• Prizes are as advertised for each competition</p>
                <p>• Winners will be contacted within 48 hours of competition closure</p>
                <p>• Prize delivery within 30 business days</p>
                <p>• Prizes are non-transferable and non-refundable</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Account Responsibilities</h2>
              <div className="space-y-4 text-gray-700">
                <p>• Keep your account information secure</p>
                <p>• Provide accurate personal information</p>
                <p>• Notify us immediately of any unauthorized use</p>
                <p>• You are responsible for all activities under your account</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Prohibited Activities</h2>
              <div className="space-y-4 text-gray-700">
                <p>• Using automated systems or bots</p>
                <p>• Creating multiple accounts</p>
                <p>• Attempting to manipulate competition results</p>
                <p>• Sharing account credentials</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Payment Processing & Saved Payment Methods</h2>
              <div className="space-y-4 text-gray-700">
                <p><strong>Payment Service Provider:</strong> All payments are processed securely through Stripe, Inc., a PCI-DSS Level 1 certified payment processor. BabaWina does NOT store your credit card details on our servers.</p>
                
                <p><strong>Saved Payment Methods:</strong> By saving your payment method during your first transaction, you explicitly authorize BabaWina to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Store your payment method token (provided by Stripe) for future use</li>
                  <li>Charge your saved payment method for future competition entries</li>
                  <li>Process one-click purchases when you submit competition entries</li>
                </ul>
                
                <p><strong>Payment Confirmation:</strong> Before each charge, you will be shown:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>The exact amount to be charged (in South African Rand)</li>
                  <li>A breakdown of paid and free entries (if applicable)</li>
                  <li>A &quot;Confirm Payment&quot; button which you must click to authorize the charge</li>
                </ul>
                
                <p><strong>Managing Payment Methods:</strong> You may remove your saved payment method at any time from your Account Settings. Removing your payment method will not affect previously submitted entries.</p>
                
                <p><strong>Currency:</strong> All transactions are processed in South African Rand (ZAR). Your bank or card issuer may charge currency conversion fees if your card is not denominated in ZAR.</p>
                
                <p><strong>Security:</strong> We use industry-standard SSL/TLS encryption for all payment data transmission. Your payment information is never exposed to our servers.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Refund & Cancellation Policy</h2>
              <div className="space-y-4 text-gray-700">
                <p><strong>No Refunds:</strong> All competition entry fees are non-refundable once submitted. By clicking &quot;Confirm Payment&quot;, you acknowledge that you are making a final purchase.</p>
                
                <p><strong>Entry Cancellation:</strong> You cannot cancel or modify an entry after it has been submitted and paid for. Please review your entries carefully before confirming payment.</p>
                
                <p><strong>Exceptions:</strong> Refunds may be issued at BabaWina&apos;s sole discretion in the following circumstances:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Technical errors that prevent entry submission after payment</li>
                  <li>Competition cancellation by BabaWina before the end date</li>
                  <li>Duplicate charges due to system errors</li>
                </ul>
                
                <p><strong>Refund Process:</strong> If eligible for a refund, funds will be returned to your original payment method within 5-10 business days.</p>
                
                <p><strong>Disputed Charges:</strong> If you believe you were charged incorrectly, contact us at support@babawina.co.za within 30 days with your transaction details.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Data Protection & Privacy (POPIA Compliance)</h2>
              <div className="space-y-4 text-gray-700">
                <p><strong>Protection of Personal Information Act (POPIA):</strong> BabaWina complies with South Africa&apos;s Protection of Personal Information Act, 2013. We are committed to protecting your privacy and personal information.</p>
                
                <p><strong>Information We Collect:</strong></p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Account information (name, email address, phone number)</li>
                  <li>Payment information (securely processed by Stripe)</li>
                  <li>Competition entries (coordinates, timestamps)</li>
                  <li>Usage data (login times, pages visited)</li>
                </ul>
                
                <p><strong>How We Use Your Information:</strong></p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>To process your competition entries and payments</li>
                  <li>To contact you about competition results and prizes</li>
                  <li>To improve our services and user experience</li>
                  <li>To comply with legal obligations</li>
                  <li>To prevent fraud and ensure fair play</li>
                </ul>
                
                <p><strong>Your Rights:</strong> Under POPIA, you have the right to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Access your personal information</li>
                  <li>Correct inaccurate information</li>
                  <li>Request deletion of your information (subject to legal retention requirements)</li>
                  <li>Object to processing of your information</li>
                  <li>Withdraw consent at any time</li>
                </ul>
                
                <p><strong>Data Security:</strong> We implement appropriate technical and organizational measures to protect your personal information from unauthorized access, disclosure, alteration, or destruction.</p>
                
                <p><strong>Data Retention:</strong> We retain your personal information for as long as necessary to provide our services and comply with legal obligations. Competition entry data is retained for auditing and dispute resolution purposes.</p>
                
                <p><strong>Third-Party Services:</strong> We share your payment information only with Stripe for payment processing. We do not sell or rent your personal information to third parties.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Email Communications & Receipts</h2>
              <div className="space-y-4 text-gray-700">
                <p>By creating an account, you consent to receive:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Payment confirmation and receipt emails</li>
                  <li>Competition result notifications</li>
                  <li>Prize winner announcements</li>
                  <li>Important account and service updates</li>
                </ul>
                <p>You may opt-out of promotional emails but will continue to receive transactional emails related to your account and entries.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Limitation of Liability</h2>
              <p className="text-gray-700 leading-relaxed">
                BabaWina shall not be liable for any indirect, incidental, special, consequential, or punitive damages, 
                including without limitation, loss of profits, data, use, goodwill, or other intangible losses. Our total liability to you for any claims arising from your use of the Service shall not exceed the total amount you paid to BabaWina in the 12 months preceding the claim.
              </p>
              <p className="text-gray-700 leading-relaxed mt-4">
                We are not responsible for: technical failures, internet connectivity issues, payment processor errors, or any force majeure events that may affect your ability to participate in competitions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Dispute Resolution</h2>
              <div className="space-y-4 text-gray-700">
                <p><strong>Governing Law:</strong> These Terms shall be governed by and construed in accordance with the laws of the Republic of South Africa.</p>
                <p><strong>Jurisdiction:</strong> Any disputes arising from these Terms or your use of the Service shall be subject to the exclusive jurisdiction of the South African courts.</p>
                <p><strong>Informal Resolution:</strong> Before initiating formal legal proceedings, we encourage you to contact us at support@babawina.co.za to resolve any disputes informally.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Changes to Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                We reserve the right to modify these terms at any time. Material changes will be notified to you via email or prominent notice on our website at least 7 days before taking effect. Changes will be effective immediately upon posting for non-material changes. 
                Continued use of the service after changes constitutes acceptance of modified terms. If you do not agree to the changes, you must stop using the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">14. Responsible Gaming</h2>
              <div className="bg-amber-50 border-l-4 border-amber-500 p-4 space-y-2 text-gray-700">
                <p><strong>18+ Only:</strong> You must be 18 years or older to use this service.</p>
                <p><strong>Play Responsibly:</strong> Competition entry should be for entertainment purposes only. Please play within your means.</p>
                <p><strong>Gambling Support:</strong> If you feel you may have a gambling problem, please contact the South African Responsible Gambling Foundation at <strong>0800 006 008</strong> or visit <a href="https://www.responsiblegambling.co.za" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">www.responsiblegambling.co.za</a></p>
                <p><strong>Self-Exclusion:</strong> If you wish to self-exclude from our platform, contact us at support@babawina.co.za</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">15. Contact Information</h2>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-gray-700">
                  <strong>Email:</strong> support@babawina.co.za<br />
                  <strong>Address:</strong> South Africa<br />
                  <strong>For Payment Issues:</strong> support@babawina.co.za<br />
                  <strong>For Privacy Requests (POPIA):</strong> support@babawina.co.za
                </p>
              </div>
            </section>

            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg border-2 border-blue-200">
              <p className="text-sm text-gray-800 font-medium text-center">
                <strong>By using BabaWina, you acknowledge that you have read, understood, and agree to be bound by these Terms & Conditions.</strong>
              </p>
              <p className="text-xs text-gray-600 text-center mt-2">
                These terms constitute the entire agreement between you and BabaWina regarding your use of the Service.
              </p>
            </div>

          </div>
        </div>
      </main>
    </div>
  )
}
