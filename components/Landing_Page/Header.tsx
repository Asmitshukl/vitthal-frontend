"use client";

import { useEffect, useState, useRef, useLayoutEffect } from "react";
import { Menu, X, ShoppingCart, User, LogOut, ChevronDown, Bell } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { useNotificationStore } from "@/store/notificationStore";
import { toast } from "sonner";
import Image from "next/image";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdown, setProfileDropdown] = useState(false);
  const [notifDropdown, setNotifDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const { user, isAuthenticated, isLoading, fetchUser, logout } = useAuthStore();
  const totalItems = useCartStore((s) => s.items.length);
  const { notifications, unreadCount, fetchNotifications, fetchUnreadCount, markRead, markAllRead } = useNotificationStore();
  const router = useRouter();

  useLayoutEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useLayoutEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdown(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, fetchUnreadCount]);

  function handleOpenNotifications() {
    setNotifDropdown(!notifDropdown);
    if (!notifDropdown) fetchNotifications();
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  }

  async function handleLogout() {
    await logout();
    setProfileDropdown(false);
    toast.success("Logged out successfully");
    router.push("/");
  }

  return (
    <header className="border-b border-zinc-200 bg-white sticky top-0 z-50">
      <div className="border-b border-zinc-100 bg-zinc-50/80">
        <div className="mx-auto flex h-9 w-full max-w-7xl items-center justify-between px-4 text-xs text-zinc-600 sm:px-6 lg:px-8">
          <p>Trusted by procurement teams in manufacturing and distribution</p>
          <p className="hidden sm:block">support@mtwo.com</p>
        </div>
      </div>
      <div className="mx-auto flex  h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-xl flex h-full justify-center items-center gap-3 font-semibold tracking-tight text-zinc-900">
          <Image
            src="/logo.jpeg"
            alt="MTWO Groups"
            width={42}
            height={42}
          />
          <h1 className="font-heading text-xl">MTWO Groups</h1>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:block font-body">
          <ul className="flex items-center gap-6 text-sm font-medium text-zinc-700">
            <li>
              <Link href="/products" className="hover:text-zinc-900 transition-colors">
                Products
              </Link>
            </li>
            <li>
              <Link href="/#categories" className="hover:text-zinc-900 transition-colors">
                Categories
              </Link>
            </li>
            <li>
              <Link href="/aboutUs" className="hover:text-zinc-900 transition-colors">
                About us
              </Link>
            </li>
            <li>
              <Link href="/contacts" className="hover:text-zinc-900 transition-colors">
                Contact us
              </Link>
            </li>

            {isLoading ? (
              // Skeleton loaders for desktop auth buttons
              <>
                <li className="animate-pulse">
                  <div className="h-5 w-16 bg-zinc-200 rounded"></div>
                </li>
                <li className="animate-pulse">
                  <div className="h-8 w-20 bg-zinc-200 rounded"></div>
                </li>
              </>
            ) : isAuthenticated ? (
              <>
                <li>
                  <Link href="/cart" className="hover:text-zinc-900 transition-colors relative flex items-center gap-1">
                    <ShoppingCart size={18} />
                    Cart
                    {totalItems > 0 && (
                      <span className="absolute -top-2 -right-4 flex h-5 w-5 items-center justify-center rounded-full bg-[#1d4ed8] text-[10px] font-bold text-white">
                        {totalItems}
                      </span>
                    )}
                  </Link>
                </li>
                {/* Notification Bell */}
                <li className="relative" ref={notifRef}>
                  <button
                    onClick={handleOpenNotifications}
                    className="relative flex items-center gap-1 rounded-lg p-2 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
                    aria-label="Notifications"
                  >
                    <Bell size={20} />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white animate-pulse">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </button>
                  {notifDropdown && (
                    <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-2xl z-50 flex flex-col">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
                        <p className="text-sm font-semibold text-zinc-900">Notifications</p>
                        {unreadCount > 0 && (
                          <button
                            onClick={() => markAllRead()}
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div className="overflow-y-auto max-h-72 divide-y divide-zinc-50">
                        {notifications.length === 0 ? (
                          <div className="px-4 py-8 text-center text-sm text-zinc-400">
                            <Bell size={24} className="mx-auto mb-2 text-zinc-300" />
                            No notifications yet
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <button
                              key={n.id}
                              onClick={() => {
                                if (!n.is_read) markRead(n.id);
                                setNotifDropdown(false);
                                if (n.reference_type === "quotation" && n.reference_id) {
                                  router.push(`/quotations/${n.reference_id}`);
                                }
                              }}
                              className={`w-full text-left px-4 py-3 hover:bg-zinc-50 transition-colors flex gap-3 ${!n.is_read ? "bg-blue-50/50" : ""}`}
                            >
                              <div className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${!n.is_read ? "bg-blue-500" : "bg-transparent"}`} />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-zinc-800 truncate">{n.title}</p>
                                <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{n.body}</p>
                                <p className="text-xs text-zinc-400 mt-1">{timeAgo(n.created_at)}</p>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </li>
                <li className="relative">
                  <div ref={dropdownRef}>
                    <button
                      onClick={() => setProfileDropdown(!profileDropdown)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-zinc-100 transition-colors"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1d4ed8] text-white">
                        <User size={16} />
                      </div>
                      <span className="text-sm font-medium text-zinc-700">{user?.username || "Account"}</span>
                      <ChevronDown size={16} className={`text-zinc-400 transition-transform ${profileDropdown ? "rotate-180" : ""}`} />
                    </button>
                    {profileDropdown && (
                      <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-zinc-200 bg-white py-2 shadow-xl z-50">
                        <div className="px-4 py-3 border-b border-zinc-100">
                          <p className="text-sm font-medium text-zinc-900">{user?.username || "User"}</p>
                          <p className="text-xs text-zinc-500 truncate">{user?.email || ""}</p>
                        </div>
                        <Link
                          href="/profile"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
                          onClick={() => setProfileDropdown(false)}
                        >
                          <User size={18} className="text-zinc-400" />
                          My Profile
                        </Link>
                        <Link
                          href="/quotations"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
                          onClick={() => setProfileDropdown(false)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"/></svg>
                          My Quotations
                        </Link>
                        <Link
                          href="/cart"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
                          onClick={() => setProfileDropdown(false)}
                        >
                          <ShoppingCart size={18} className="text-zinc-400" />
                          My Cart
                        </Link>
                        <div className="border-t border-zinc-100 mt-1 pt-1">
                          <button
                            onClick={handleLogout}
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <LogOut size={18} />
                            Logout
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link href="/login" className="hover:text-zinc-900 transition-colors">
                    Login
                  </Link>
                </li>
                <li>
                  <Link
                    href="/register"
                    className="rounded-md border border-zinc-300 px-3 py-1.5 text-zinc-800 hover:bg-zinc-100 transition-colors"
                  >
                    Signup
                  </Link>
                </li>
              </>
            )}
          </ul>
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 text-zinc-700 hover:text-zinc-900 transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Navigation - Slide from Right */}
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300 ${mobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        onClick={() => setMobileMenuOpen(false)}
      />
      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-72 bg-white z-50 md:hidden shadow-2xl transform transition-transform duration-300 ease-in-out ${mobileMenuOpen ? "translate-x-0" : "translate-x-full"
          }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-zinc-200">
          <span className="text-lg font-semibold text-zinc-900">Menu</span>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 text-zinc-700 hover:text-zinc-900 transition-colors"
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
        </div>
        {/* Sidebar Content */}
        <nav className="h-[calc(100%-73px)] overflow-y-auto">
          <ul className="flex flex-col px-4 py-4 space-y-1 text-sm font-medium text-zinc-700">
            <li>
              <Link
                href="/products"
                className="hover:text-zinc-900 hover:bg-zinc-50 transition-colors block py-3 px-3 rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                Products
              </Link>
            </li>
            <li>
              <Link
                href="/#categories"
                className="hover:text-zinc-900 hover:bg-zinc-50 transition-colors block py-3 px-3 rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                Categories
              </Link>
            </li>
            <li>
              <Link
                href="/aboutUs"
                className="hover:text-zinc-900 hover:bg-zinc-50 transition-colors block py-3 px-3 rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                About Us
              </Link>
            </li>
            <li>
              <Link
                href="/contacts"
                className="hover:text-zinc-900 hover:bg-zinc-50 transition-colors block py-3 px-3 rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                Contact Us
              </Link>
            </li>

            <li className="border-t border-zinc-200 mt-4 pt-4">
              <p className="px-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Account</p>
            </li>

            {isLoading ? (
              // Mobile skeleton loaders
              <>
                <li className="animate-pulse py-2 px-3">
                  <div className="h-5 w-20 bg-zinc-200 rounded"></div>
                </li>
                <li className="animate-pulse py-2 px-3">
                  <div className="h-10 w-full bg-zinc-200 rounded border border-zinc-300"></div>
                </li>
              </>
            ) : isAuthenticated ? (
              <>
                <li>
                  <Link
                    href="/cart"
                    className="hover:text-zinc-900 hover:bg-zinc-50 transition-colors flex items-center gap-3 py-3 px-3 rounded-lg"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <ShoppingCart size={18} /> Cart
                    {totalItems > 0 && (
                      <span className="rounded-full bg-[#1d4ed8] px-2 py-0.5 text-[10px] font-bold text-white">
                        {totalItems}
                      </span>
                    )}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/profile"
                    className="hover:text-zinc-900 hover:bg-zinc-50 transition-colors flex items-center gap-3 py-3 px-3 rounded-lg"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <User size={18} /> Profile
                  </Link>
                </li>
                <li>
                  <Link
                    href="/quotations"
                    className="hover:text-zinc-900 hover:bg-zinc-50 transition-colors flex items-center gap-3 py-3 px-3 rounded-lg"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"/></svg>
                    Quotations
                  </Link>
                </li>
                <li>
                  <button
                    onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                    className="flex w-full items-center gap-3 py-3 px-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={18} /> Logout
                  </button>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link
                    href="/login"
                    className="hover:text-zinc-900 hover:bg-zinc-50 transition-colors block py-3 px-3 rounded-lg"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Login
                  </Link>
                </li>
                <li>
                  <Link
                    href="/register"
                    className="rounded-lg bg-[#1d4ed8] px-3 py-3 text-white hover:bg-[#1e40af] transition-colors block text-center"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Signup
                  </Link>
                </li>
              </>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
}
