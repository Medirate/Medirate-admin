"use client";

import Image from "next/image";
import Link from "next/link";

export default function AdminNavbar() {
  const navbarStyle = {
    backgroundColor: "rgb(1, 44, 97)",
    height: "5.5rem",
  };

  return (
    <nav className="sticky inset-x-0 top-0 z-[1000] w-full border-b backdrop-blur-lg transition-all pointer-events-auto" style={navbarStyle}>
      <div className="flex h-[5.5rem] items-center justify-between px-8">
        {/* Wordmark on the Left */}
        <div className="flex-shrink-0 transform -translate-x-4">
          <Link href="/" className="flex items-center pointer-events-auto">
            <Image src="/top-black-just-word.png" alt="MediRate Wordmark" width={200} height={80} priority />
          </Link>
        </div>

        <div className="flex items-center space-x-6">
          <Link href="/analytics" className="border border-transparent px-4 py-2 rounded-md text-white transition-colors hover:border-white hover:bg-transparent pointer-events-auto">
            Analytics
          </Link>
          <Link href="/data-update" className="border border-transparent px-4 py-2 rounded-md text-white transition-colors hover:border-white hover:bg-transparent pointer-events-auto">
            Data Update
          </Link>
              <Link href="/rate-developments" className="border border-transparent px-4 py-2 rounded-md text-white transition-colors hover:border-white hover:bg-transparent pointer-events-auto">
                Rate Developments
              </Link>
          <Link href="/email-marketing" className="border border-transparent px-4 py-2 rounded-md text-white transition-colors hover:border-white hover:bg-transparent pointer-events-auto">
            Email - Marketing
          </Link>
        </div>

        {/* Logo on the Right */}
        <div className="flex-shrink-0 transform -translate-x-4">
          <Image src="/top-black-just-logo.png" alt="MediRate Logo" width={80} height={80} priority />
        </div>
      </div>
    </nav>
  );
}