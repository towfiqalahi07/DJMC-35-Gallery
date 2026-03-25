import Header from '@/components/Header';

export default function PrivacyPolicy() {
  return (
    <div className="flex-1 bg-black text-zinc-300 font-sans selection:bg-emerald-500/30 flex flex-col">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-20 w-full">
        <h1 className="text-4xl font-bold text-white mb-8">Privacy Policy</h1>
        
        <div className="prose prose-invert max-w-none space-y-6">
          <p>Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
          
          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">1. Information We Collect</h2>
            <p>We collect information that you provide directly to us when using the DJMC '35 Batch portal. This may include:</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>Name and contact information (such as email address)</li>
              <li>Profile information (such as district, blood group, and phone number)</li>
              <li>Authentication data provided by Google OAuth</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">2. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>Provide, maintain, and improve our services</li>
              <li>Allow batchmates to find and connect with each other</li>
              <li>Send administrative messages and announcements</li>
              <li>Respond to your comments, questions, and requests</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">3. Information Sharing</h2>
            <p>Your profile information is visible to other authenticated members of the DJMC '35 Batch. We do not sell or share your personal information with third parties for marketing purposes.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">4. Data Security</h2>
            <p>We take reasonable measures to help protect information about you from loss, theft, misuse, unauthorized access, disclosure, alteration, and destruction. However, no internet or email transmission is ever fully secure or error-free.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">5. Contact Us</h2>
            <p>If you have any questions about this Privacy Policy, please contact us via the <a href="/contact" className="text-emerald-400 hover:underline">Contact page</a>.</p>
          </section>
        </div>
      </main>
    </div>
  );
}
