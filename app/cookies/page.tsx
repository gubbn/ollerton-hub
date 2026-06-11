export default function CookiesPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-4xl font-bold mb-6">Cookie Policy</h1>

      <p className="mb-6 text-gray-700">
        Last updated: 11 June 2026
      </p>

      <div className="space-y-8 text-gray-700">
        <section>
          <h2 className="text-2xl font-semibold mb-2">1. About cookies</h2>
          <p>
            Cookies are small text files stored on your device when you visit a
            website. They help websites work properly, remember preferences and
            understand how people use the site.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-2">2. How Ollerton Hub uses cookies</h2>
          <p className="mb-3">Ollerton Hub may use cookies to:</p>

          <ul className="list-disc pl-6 space-y-2">
            <li>Keep the website working correctly.</li>
            <li>Allow users to sign in and manage accounts.</li>
            <li>Remember basic preferences.</li>
            <li>Improve website performance and security.</li>
            <li>Understand how visitors use the website.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-2">3. Essential cookies</h2>
          <p>
            Essential cookies are needed for the website to function. These may
            include cookies used for login sessions, security and account access.
            These cookies cannot usually be switched off without affecting how
            the website works.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-2">4. Analytics cookies</h2>
          <p>
            We may use analytics cookies in future to understand how visitors use
            Ollerton Hub, such as which pages are visited most often. These help
            us improve the website and user experience.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-2">5. Third-party services</h2>
          <p>
            Some cookies may be set by third-party services we use to operate
            the website, such as hosting, authentication, database, forms or
            analytics providers.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-2">6. Managing cookies</h2>
          <p>
            You can control or delete cookies through your browser settings.
            Blocking some cookies may affect how parts of the website work,
            including account login and business dashboard features.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-2">7. Changes to this policy</h2>
          <p>
            We may update this Cookie Policy from time to time. Any updates will
            be published on this page.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-2">8. Contact us</h2>
          <p>
            If you have any questions about this Cookie Policy, please contact
            us using the details provided on our Contact page.
          </p>
        </section>
      </div>
    </main>
  )
}