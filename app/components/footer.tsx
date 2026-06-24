import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="mt-12 border-t bg-white">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-md">
            <h3 className="mb-1 text-2xl font-bold text-red-600">
              Ollerton Hub
            </h3>

            <p className="text-xs uppercase tracking-widest text-stone-400">
              Supporting local businesses
            </p>

            <p className="mt-3 text-xs leading-relaxed text-stone-500">
              Connecting local residents with trusted businesses, organisations
              and services across Ollerton and the surrounding areas.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <h4 className="mb-3 text-sm font-bold text-stone-900">
                For Businesses
              </h4>

              <div className="flex flex-col gap-2 text-sm text-stone-600">
                <Link
                  href="/dashboard/business"
                  className="font-semibold text-red-600 hover:underline"
                >
                  Create a business listing
                </Link>

                <Link href="/login" className="hover:text-red-600">
                  Business login
                </Link>

              
                <Link href="/contact?topic=advertising" className="hover:text-red-600">
                  Advertise with us
                </Link>
              </div>
            </div>

            <div>
              <h4 className="mb-3 text-sm font-bold text-stone-900">
                Useful links
              </h4>

              <div className="flex flex-col gap-2 text-sm text-stone-600">
                <Link href="/directory" className="hover:text-red-600">
                  Directory
                </Link>

                <Link href="/about" className="hover:text-red-600">
                  About
                </Link>

                <Link href="/faq" className="hover:text-red-600">
                  FAQs
                </Link>

                <Link href="/contact" className="hover:text-red-600">
                  Contact
                </Link>

                <Link href="/contact?topic=local-info" className="hover:text-red-600">
                  Suggest local info
                </Link>

                <Link href="/terms" className="hover:text-red-600">
                  Terms of Use
                </Link>

                <Link href="/privacy" className="hover:text-red-600">
                  Privacy Policy
                </Link>

                <Link href="/cookies" className="hover:text-red-600">
                  Cookie Policy
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t pt-4">
          <p className="text-xs text-stone-400">
            © {new Date().getFullYear()} Ollerton Hub. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}