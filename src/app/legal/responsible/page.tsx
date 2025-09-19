import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Phone, Mail, ExternalLink } from "lucide-react"

export const metadata = {
  title: "Responsible Play - BabaWina",
  description: "Information about responsible gaming and where to get help if needed.",
}

export default function ResponsiblePage() {
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
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-6">Responsible Play</h1>
          <p className="text-xl text-muted-foreground mb-12">
            We&apos;re committed to providing a safe and enjoyable gaming environment for all our users.
          </p>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Guidelines */}
            <div className="bg-white rounded-xl p-6 border shadow-sm">
              <h2 className="text-2xl font-semibold mb-4">Play Responsibly</h2>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-accent rounded-full mt-2 flex-shrink-0"></div>
                  <span>Only play with money you can afford to lose</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-accent rounded-full mt-2 flex-shrink-0"></div>
                  <span>Set time and spending limits before you start</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-accent rounded-full mt-2 flex-shrink-0"></div>
                  <span>Take regular breaks from gaming</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-accent rounded-full mt-2 flex-shrink-0"></div>
                  <span>Don&apos;t chase losses with bigger bets</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-accent rounded-full mt-2 flex-shrink-0"></div>
                  <span>Gaming should be fun, not stressful</span>
                </li>
              </ul>
            </div>

            {/* Warning Signs */}
            <div className="bg-white rounded-xl p-6 border shadow-sm">
              <h2 className="text-2xl font-semibold mb-4">Warning Signs</h2>
              <p className="text-muted-foreground mb-4">
                If you notice any of these signs, it may be time to seek help:
              </p>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Spending more than you planned</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Feeling anxious or depressed about gaming</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Neglecting work, family, or social activities</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Lying about your gaming activities</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Trying unsuccessfully to cut back</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Help Resources */}
          <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-xl p-8 border border-red-200 mb-12">
            <h2 className="text-2xl font-semibold mb-6 text-red-900">Get Help</h2>
            <p className="text-red-800 mb-6">
              If you&apos;re concerned about your gaming habits, help is available. These organizations provide 
              confidential support and resources:
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg p-4 border border-red-200">
                <h3 className="font-semibold mb-3 text-red-900">South African Responsible Gambling Foundation</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-red-600" />
                    <span>0800 006 008 (Toll-free)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-red-600" />
                    <a href="mailto:info@responsiblegambling.co.za" className="text-red-700 hover:underline">
                      info@responsiblegambling.co.za
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <ExternalLink className="w-4 h-4 text-red-600" />
                    <a 
                      href="https://www.responsiblegambling.co.za" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-red-700 hover:underline"
                    >
                      responsiblegambling.co.za
                    </a>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border border-red-200">
                <h3 className="font-semibold mb-3 text-red-900">SADAG (Depression & Anxiety)</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-red-600" />
                    <span>0800 567 567 (Toll-free)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-red-600" />
                    <span>011 262 6396</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ExternalLink className="w-4 h-4 text-red-600" />
                    <a 
                      href="https://www.sadag.org" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-red-700 hover:underline"
                    >
                      sadag.org
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Our Commitment */}
          <div className="bg-white rounded-xl p-8 border shadow-sm">
            <h2 className="text-2xl font-semibold mb-4">Our Commitment</h2>
            <div className="prose prose-slate max-w-none">
              <p>
                At BabaWina, we take responsible gaming seriously. We have implemented several measures 
                to promote safe and responsible play:
              </p>
              
              <h3>Age Verification</h3>
              <p>
                Our platform is strictly for users 18 years and older. We verify age during registration 
                and monitor for underage access.
              </p>

              <h3>Fair Play</h3>
              <p>
                All competitions are conducted fairly with transparent judging. We use advanced systems 
                to detect and prevent fraudulent activities.
              </p>

              <h3>Entry Limits</h3>
              <p>
                Users can submit only one entry per competition to prevent excessive spending and 
                maintain fairness for all participants.
              </p>

              <h3>Support Access</h3>
              <p>
                Our support team is trained to recognize signs of problem gaming and can provide 
                resources and assistance when needed.
              </p>
            </div>
          </div>

          {/* Contact */}
          <div className="mt-12 text-center">
            <h2 className="text-2xl font-semibold mb-4">Need Support?</h2>
            <p className="text-muted-foreground mb-6">
              If you have concerns about your gaming or need assistance, we&apos;re here to help.
            </p>
            <a href="mailto:support@babawina.co.za">
              <Button variant="accent">
                <Mail className="w-4 h-4 mr-2" />
                Contact Support
              </Button>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
