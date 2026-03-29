import Header from '@/components/Header';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-black text-zinc-300 selection:bg-zinc-800 selection:text-white flex flex-col">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-12 w-full">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-8">Terms of Service</h1>
        
        <div className="space-y-6 text-zinc-400">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using the DJMC '35 Batch Directory, you agree to be bound by these Terms of Service. If you do not agree to all the terms and conditions, you may not access the service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Eligibility</h2>
            <p>
              This directory is exclusively for verified members of the Dinajpur Medical College Batch 35. You must be a member of this batch to create an account and access the directory.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. User Conduct</h2>
            <p>
              You agree to use the service only for lawful purposes and in a way that does not infringe the rights of, restrict or inhibit anyone else's use and enjoyment of the service. You are responsible for maintaining the confidentiality of your account information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Content</h2>
            <p>
              You retain all your ownership rights in your content. However, by submitting content, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, and display the content in connection with the service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Termination</h2>
            <p>
              We may terminate or suspend access to our service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
