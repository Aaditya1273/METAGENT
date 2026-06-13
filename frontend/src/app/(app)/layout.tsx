"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";

const NAV_ITEMS = [
  { path: "/dashboard", label: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { path: "/portfolio", label: "Portfolio", icon: "M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" },
  { path: "/harvest", label: "Harvest", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  { path: "/reports", label: "Reports", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
  { path: "/settings", label: "Settings", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" },
];

function NavIcon({ path }: { path: string }) {
  const item = NAV_ITEMS.find(n => n.path === path);
  if (!item) return null;
  return (
    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
    </svg>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isConnected } = useAccount();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isActive = (path: string) => pathname === path;

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="p-4 lg:p-6 border-b border-emerald-100/60">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/40 group-hover:scale-105 transition-all duration-300">
            T
          </div>
          {(sidebarOpen || mobileSidebarOpen) && (
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-gray-900">Tax<span className="text-emerald-500">Fi</span></h1>
              <p className="text-xs text-gray-400 hidden lg:block">AI Tax Agent</p>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 lg:p-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            onClick={() => setMobileSidebarOpen(false)}
            className={`group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium ${
              isActive(item.path)
                ? "bg-gradient-to-r from-emerald-50 to-white text-emerald-600 border border-emerald-200/60 shadow-sm"
                : "text-gray-500 hover:text-emerald-600 hover:bg-emerald-50/50"
            }`}
          >
            <svg
              className={`w-5 h-5 flex-shrink-0 transition-transform duration-300 ${
                isActive(item.path) ? "scale-110" : "group-hover:scale-110"
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={isActive(item.path) ? 2 : 1.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
            </svg>
            {(sidebarOpen || mobileSidebarOpen) && (
              <span className="truncate">{item.label}</span>
            )}
            {isActive(item.path) && (
              <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </Link>
        ))}
      </nav>

      {/* User section */}
      <div className="p-2 lg:p-4 border-t border-emerald-100/60">
        <ConnectButton.Custom>
          {({ account, chain, openConnectModal, mounted: connectMounted }) => {
            return (
              <div>
                {!connectMounted || !account ? (
                  <button
                    onClick={openConnectModal}
                    className="relative w-full text-sm py-2.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 transition-all active:scale-[0.97] overflow-hidden group"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      {(sidebarOpen || mobileSidebarOpen) && "Connect Wallet"}
                    </span>
                  </button>
                ) : (
                  <div className="group relative">
                    <div className="flex items-center gap-2 lg:gap-3 p-2 rounded-xl hover:bg-emerald-50/50 transition-all duration-300 cursor-pointer">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0 shadow-md">
                        <span className="text-xs font-bold text-white">
                          {account.displayName?.slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      {(sidebarOpen || mobileSidebarOpen) && (
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {account.displayName}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {chain?.name || "Connected"}
                          </p>
                        </div>
                    )}
                    </div>
                  </div>
                )}
              </div>
            );
          }}
        </ConnectButton.Custom>
      </div>
    </>
  );

  if (!mounted) return null;

  if (!isConnected) {
    return <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">{children}</main>;
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 text-gray-900">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex ${
          sidebarOpen ? "w-64" : "w-20"
        } transition-all duration-300 bg-white/80 backdrop-blur-2xl border-r border-emerald-100/60 shadow-lg shadow-emerald-500/5 flex-col flex-shrink-0`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar (overlay) */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-emerald-900/20 backdrop-blur-sm"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <aside className="relative w-64 bg-white/90 backdrop-blur-2xl border-r border-emerald-100 shadow-xl h-full flex flex-col animate-slide-right">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Mobile Header */}
      <div className="fixed top-0 left-0 right-0 z-40 lg:hidden bg-white/80 backdrop-blur-xl border-b border-emerald-100/60 px-4 py-3 flex items-center justify-between shadow-sm">
        <button
          onClick={() => setMobileSidebarOpen(true)}
          className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-emerald-50 transition-colors"
          aria-label="Open menu"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold text-xs shadow-lg">
            T
          </div>
          <span className="text-gray-900 font-bold text-sm">Tax<span className="text-emerald-500">Fi</span></span>
        </div>
        <div className="w-10" />
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pt-14 lg:pt-0">
        <div className="max-w-7xl mx-auto p-4 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
