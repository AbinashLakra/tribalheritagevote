/**
 * @file Public layout wrapper for all public-facing pages.
 * Renders the shared Navbar and Footer around page content.
 */

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

/**
 * Wraps every page under the `(public)` route group with the
 * site-wide navigation bar and footer.
 */
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
