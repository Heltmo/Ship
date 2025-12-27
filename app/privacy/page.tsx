import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-black">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="mb-8">
          <Link href="/">
            <Button variant="outline" size="sm">← Back to Home</Button>
          </Link>
        </div>

        <div className="prose prose-invert prose-slate max-w-none">
          <h1 className="text-4xl font-bold text-slate-100 mb-6">Privacy Policy</h1>
          <p className="text-sm text-slate-400 mb-8">Last updated: December 27, 2025</p>

          <div className="space-y-8 text-slate-300">
            <section>
              <h2 className="text-2xl font-semibold text-slate-100 mb-4">Introduction</h2>
              <p>
                Ship-It ("we", "our", or "us") operates a co-founder matching platform. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-100 mb-4">Information We Collect</h2>

              <h3 className="text-xl font-semibold text-slate-100 mb-3 mt-4">GitHub OAuth Data</h3>
              <p>When you connect your GitHub account, we collect:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>GitHub username and user ID</li>
                <li>Public profile information (name, bio, location, avatar)</li>
                <li>Public repository data (names, descriptions, stars, languages, topics)</li>
                <li>GitHub activity and contribution data (publicly available)</li>
              </ul>

              <h3 className="text-xl font-semibold text-slate-100 mb-3 mt-4">Profile Information</h3>
              <p>Information you provide when creating or updating your profile:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Full name</li>
                <li>Bio and description</li>
                <li>Location</li>
                <li>Social media links (LinkedIn, Twitter, website)</li>
                <li>Portfolio items and projects</li>
              </ul>

              <h3 className="text-xl font-semibold text-slate-100 mb-3 mt-4">Usage Data</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Profile views and interactions (likes, passes, saves)</li>
                <li>Messages sent and received</li>
                <li>Match history</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-100 mb-4">How We Use Your Information</h2>
              <p>We use the collected information to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Create and manage your account</li>
                <li>Display your profile to other eligible users</li>
                <li>Match you with potential co-founders based on proof of work</li>
                <li>Facilitate communication between matched users</li>
                <li>Improve and optimize our service</li>
                <li>Send you notifications about matches and messages (if enabled)</li>
                <li>Prevent fraud and abuse</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-100 mb-4">Data Sharing and Disclosure</h2>

              <h3 className="text-xl font-semibold text-slate-100 mb-3 mt-4">Public Information</h3>
              <p>
                Your profile information (including GitHub data, portfolio items, and contribution activity) is visible to other eligible users on the platform. This is necessary for the core functionality of our co-founder matching service.
              </p>

              <h3 className="text-xl font-semibold text-slate-100 mb-3 mt-4">Third-Party Services</h3>
              <p>We use the following third-party services:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Supabase</strong> - Database and authentication</li>
                <li><strong>GitHub</strong> - OAuth authentication and public data access</li>
                <li><strong>Vercel</strong> - Hosting and infrastructure</li>
              </ul>

              <h3 className="text-xl font-semibold text-slate-100 mb-3 mt-4">Legal Requirements</h3>
              <p>
                We may disclose your information if required by law or in response to valid requests by public authorities.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-100 mb-4">Data Security</h2>
              <p>
                We implement appropriate technical and organizational security measures to protect your personal information. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-100 mb-4">Your Rights</h2>
              <p>You have the right to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Access and review your personal data</li>
                <li>Update or correct your profile information</li>
                <li>Delete your account and associated data</li>
                <li>Disconnect your GitHub account</li>
                <li>Control who can message you</li>
                <li>Opt out of email notifications</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-100 mb-4">Data Retention</h2>
              <p>
                We retain your personal information for as long as your account is active or as needed to provide services. When you delete your account, we will delete or anonymize your personal data within 30 days.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-100 mb-4">Children's Privacy</h2>
              <p>
                Our service is not intended for users under the age of 18. We do not knowingly collect personal information from children under 18.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-100 mb-4">Changes to This Privacy Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-100 mb-4">Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy, please contact us through the platform or via GitHub.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
