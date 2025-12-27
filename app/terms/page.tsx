import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-black">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="mb-8">
          <Link href="/">
            <Button variant="outline" size="sm">← Back to Home</Button>
          </Link>
        </div>

        <div className="prose prose-invert prose-slate max-w-none">
          <h1 className="text-4xl font-bold text-slate-100 mb-6">Terms of Service</h1>
          <p className="text-sm text-slate-400 mb-8">Last updated: December 27, 2025</p>

          <div className="space-y-8 text-slate-300">
            <section>
              <h2 className="text-2xl font-semibold text-slate-100 mb-4">Agreement to Terms</h2>
              <p>
                By accessing or using Ship-It ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-100 mb-4">Eligibility</h2>
              <p>
                You must be at least 18 years old to use this Service. By using the Service, you represent and warrant that you meet this age requirement.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-100 mb-4">Account Requirements</h2>
              <p>
                To access the full features of Ship-It, you must:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Connect a valid GitHub account</li>
                <li>Import at least 2 public repositories as proof of work</li>
                <li>Provide accurate and truthful information in your profile</li>
                <li>Maintain the security of your account credentials</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-100 mb-4">User Conduct</h2>
              <p>You agree to use the Service in a respectful and lawful manner. You will NOT:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Harass, abuse, or harm other users</li>
                <li>Impersonate another person or entity</li>
                <li>Post false, misleading, or fraudulent information</li>
                <li>Spam other users with unwanted messages</li>
                <li>Use the Service for any illegal or unauthorized purpose</li>
                <li>Attempt to gain unauthorized access to the Service or other users' accounts</li>
                <li>Scrape or collect data from the Service using automated means</li>
                <li>Create multiple accounts to circumvent platform rules</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-100 mb-4">Content and Intellectual Property</h2>

              <h3 className="text-xl font-semibold text-slate-100 mb-3 mt-4">Your Content</h3>
              <p>
                You retain ownership of any content you post on Ship-It, including your profile information, messages, and portfolio items. By posting content, you grant us a non-exclusive, worldwide, royalty-free license to use, display, and distribute your content as necessary to operate the Service.
              </p>

              <h3 className="text-xl font-semibold text-slate-100 mb-3 mt-4">Our Content</h3>
              <p>
                The Service, including its design, code, features, and branding, is owned by Ship-It and protected by intellectual property laws. You may not copy, modify, or distribute our content without permission.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-100 mb-4">GitHub Integration</h2>
              <p>
                By connecting your GitHub account, you authorize us to access your public GitHub profile and repository data. We will only use this data as described in our Privacy Policy. You can disconnect your GitHub account at any time, which may affect your eligibility to use the platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-100 mb-4">Proof of Work Verification</h2>
              <p>
                Ship-It uses a proof-of-work gating system based on GitHub activity and imported repositories. We reserve the right to verify the authenticity of your work and may remove or restrict accounts that attempt to circumvent this system through fake or inflated portfolios.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-100 mb-4">Interactions and Matches</h2>
              <p>
                Ship-It facilitates introductions between users but does not guarantee any outcomes. We are not responsible for:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>The accuracy of information provided by other users</li>
                <li>Agreements or partnerships formed through the platform</li>
                <li>Disputes between users</li>
                <li>Loss of opportunities or business relationships</li>
              </ul>
              <p className="mt-4">
                You are solely responsible for your interactions with other users and any agreements you enter into.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-100 mb-4">Termination</h2>
              <p>
                We reserve the right to suspend or terminate your account at any time for violations of these Terms, fraudulent activity, or any other reason we deem appropriate. You may also delete your account at any time through your profile settings.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-100 mb-4">Disclaimers</h2>
              <p>
                THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. WE DO NOT GUARANTEE THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-100 mb-4">Limitation of Liability</h2>
              <p>
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, SHIP-IT SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING OUT OF OR RELATED TO YOUR USE OF THE SERVICE.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-100 mb-4">Indemnification</h2>
              <p>
                You agree to indemnify and hold harmless Ship-It from any claims, damages, or expenses arising from your use of the Service, your violation of these Terms, or your violation of any rights of another user.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-100 mb-4">Changes to Terms</h2>
              <p>
                We may update these Terms from time to time. Continued use of the Service after changes constitutes acceptance of the new Terms. We will notify users of significant changes via email or platform notification.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-100 mb-4">Governing Law</h2>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which Ship-It operates, without regard to its conflict of law provisions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-100 mb-4">Contact</h2>
              <p>
                If you have any questions about these Terms, please contact us through the platform or via GitHub.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
