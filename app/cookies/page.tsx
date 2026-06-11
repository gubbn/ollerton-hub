export default function CookiesPage() {
  return (
    <main className="min-h-screen bg-stone-100 px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-stone-200 md:p-10">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-red-600">
            Cookies
          </p>

          <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-stone-900">
            Cookie Policy
          </h1>

          <p className="mb-8 text-sm text-stone-500">
            Last updated: 11 June 2026
          </p>

          <div className="space-y-8 text-stone-700">
            <section>
              <h2 className="text-2xl font-bold text-stone-900">
                1. What are cookies?
              </h2>

              <p className="mt-3">
                Cookies are small text files stored on your device when you
                visit a website. They help websites function correctly, remember
                preferences and improve the overall user experience.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-stone-900">
                2. How Ollerton Hub uses cookies
              </h2>

              <p className="mt-3">
                Ollerton Hub may use cookies and similar technologies to support
                the operation of the website and provide a better experience for
                visitors and business owners.
              </p>

              <ul className="mt-4 list-disc space-y-2 pl-6">
                <li>To allow users to sign in securely.</li>
                <li>To maintain active sessions.</li>
                <li>To remember preferences and settings.</li>
                <li>To improve website performance.</li>
                <li>To help identify technical issues.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-stone-900">
                3. Essential cookies
              </h2>

              <p className="mt-3">
                Some cookies are essential for Ollerton Hub to function
                correctly. These support features such as authentication,
                security and access to business dashboards.
              </p>

              <p className="mt-3">
                Without these cookies, parts of the website may not work as
                expected.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-stone-900">
                4. Analytics cookies
              </h2>

              <p className="mt-3">
                Ollerton Hub may introduce analytics tools in the future to help
                us understand how visitors use the website. This information
                helps us improve the directory and user experience.
              </p>

              <p className="mt-3">
                Any analytics tools introduced will be covered by this policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-stone-900">
                5. Third-party services
              </h2>

              <p className="mt-3">
                We use trusted third-party providers to operate Ollerton Hub.
                These providers may use cookies necessary to deliver their
                services.
              </p>

              <p className="mt-3">
                Examples include hosting, authentication and database services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-stone-900">
                6. Managing cookies
              </h2>

              <p className="mt-3">
                Most web browsers allow you to control, block or delete cookies
                through your browser settings.
              </p>

              <p className="mt-3">
                Please note that disabling certain cookies may affect the
                functionality of Ollerton Hub, including business login and
                dashboard access.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-stone-900">
                7. Changes to this policy
              </h2>

              <p className="mt-3">
                We may update this Cookie Policy from time to time to reflect
                changes to our services or legal requirements.
              </p>

              <p className="mt-3">
                Any updates will be published on this page.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-stone-900">
                8. Contact us
              </h2>

              <p className="mt-3">
                If you have any questions about this Cookie Policy, please
                contact Ollerton Hub using the details provided on our Contact
                page.
              </p>
            </section>
          </div>
        </section>
      </div>
    </main>
  )
}