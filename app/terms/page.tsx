import Header from '@/components/Header';

export default function TermsOfService() {
  return (
    <div className="flex-1 bg-black text-zinc-300 font-sans selection:bg-emerald-500/30 flex flex-col">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-20 w-full">
        <h1 className="text-4xl font-bold text-white mb-8">Terms of Service</h1>
        
        <div className="prose prose-invert max-w-none space-y-6">
          <p>Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
          
          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">1. Acceptance of Terms</h2>
            <p>By accessing and using the DJMC '35 Batch portal, you accept and agree to be bound by the terms and provision of this agreement.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">2. Use of the Service</h2>
            <p>You agree to use the service only for lawful purposes and in a way that does not infringe the rights of, restrict or inhibit anyone else's use and enjoyment of the service. Prohibited behavior includes harassing or causing distress or inconvenience to any other user, transmitting obscene or offensive content, or disrupting the normal flow of dialogue within our service.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">3. User Accounts</h2>
            <p>To access certain features of the service, you must register for an account using Google OAuth. You are responsible for maintaining the confidentiality of your account information and for all activities that occur under your account.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">4. Content</h2>
            <p>Our service allows you to post, link, store, share and otherwise make available certain information, text, graphics, videos, or other material. You are responsible for the content that you post to the service, including its legality, reliability, and appropriateness.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">5. Termination</h2>
            <p>We may terminate or suspend access to our service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">6. Contact Information</h2>
            <p>If you have any questions about these Terms, please contact us via the <a href="/contact" className="text-emerald-400 hover:underline">Contact page</a>.</p>
          </section>
        </div>
      </main>
    </div>
  );
}
