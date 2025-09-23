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
            <p className="text-blue-100 text-center mt-2">Last updated: December 2024</p>
          </div>

          {/* Content */}
          <div className="p-6 md:p-8 space-y-8">
            
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                By accessing and using BabaWina, you accept and agree to be bound by the terms and provision of this agreement.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Game Rules</h2>
              <div className="space-y-4 text-gray-700">
                <p><strong>How to Play:</strong> Players must guess where the ball is located in the competition image.</p>
                <p><strong>Entry Fee:</strong> Each entry costs R30 unless otherwise specified.</p>
                <p><strong>Winner Selection:</strong> The player whose guess is closest to the actual ball location wins the prize.</p>
                <p><strong>Multiple Entries:</strong> Players may submit multiple entries per competition.</p>
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
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Limitation of Liability</h2>
              <p className="text-gray-700 leading-relaxed">
                BabaWina shall not be liable for any indirect, incidental, special, consequential, or punitive damages, 
                including without limitation, loss of profits, data, use, goodwill, or other intangible losses.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Changes to Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting. 
                Continued use of the service constitutes acceptance of modified terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Contact Information</h2>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-gray-700">
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
