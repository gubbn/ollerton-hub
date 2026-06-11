import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="mt-12 border-t bg-white">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          {/* About */}
          <div className="max-w-md">
  <h3 className="mb-1 text-2xl font-bold text-red-600">
    Ollerton Hub
  </h3>

  <p className="text-xs uppercase tracking-widest text-gray-400">
    Supporting local businesses
  </p>

  <p className="mt-3 text-xs leading-relaxed text-gray-500">
    Connecting local residents with trusted businesses, organisations
    and services across Ollerton and the surrounding areas.
  </p>
</div>

          {/* Navigation */}
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600">
            <Link
              href="/terms"
              className="transition-colors hover:text-red-600"
            >
              Terms of Use
            </Link>

            <Link
              href="/privacy"
              className="transition-colors hover:text-red-600"
            >
              Privacy Policy
            </Link>

            <Link
              href="/cookies"
              className="transition-colors hover:text-red-600"
            >
              Cookie Policy
            </Link>

            <Link
              href="/contact"
              className="transition-colors hover:text-red-600"
            >
              Contact
            </Link>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-6 border-t pt-4">
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} Ollerton Hub. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}