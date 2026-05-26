"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Phone,
  LogOut,
  ChevronRight,
  Package,
  Edit2,
  Camera,
  Check,
  MapPin,
  Heart,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";

type Address = {
  id: string;
  address: string;
  address_line1?: string | null;
  address_line2?: string | null;
  landmark?: string | null;
  address_phone?: string | null;
  city: string;
  state: string;
  country: string;
  pincode: string;
  latitude: number;
  longitude: number;
  created_at?: string;
  updated_at?: string;
};

type ClientDetails = {
  user_id: string;
  user_name: string;
  email: string;
  phone?: string;
  addresses?: Address[];
  primary_address?: Address | null;
};

export default function ProfilePage() {
  const { user, fetchUser, logout, checkClientSetupStatus } = useAuthStore();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [clientDetails, setClientDetails] = useState<ClientDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSetupComplete, setIsSetupComplete] = useState(true);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    async function fetchClientDetails() {
      try {
        const setupComplete = await checkClientSetupStatus();
        setIsSetupComplete(setupComplete);

        if (!setupComplete) {
          return;
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/client/clientDetails`,
          {
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
              "x-request-from": "client",
            },
          },
        );

        if (response.ok) {
          const data = await response.json();
          setClientDetails(data.data);

          if (data.data?.phone) {
            setEditPhone(data.data.phone);
          }
        } else {
          setIsSetupComplete(false);
        }
      } catch (error) {
        console.error("Failed to fetch client details:", error);
        setIsSetupComplete(false);
      } finally {
        setIsLoading(false);
      }
    }

    void fetchClientDetails();
  }, [checkClientSetupStatus]);

  useEffect(() => {
    if (user) {
      setEditName(user.username);
    }
  }, [user]);

  async function handleLogout() {
    await logout();
    toast.success("Logged out successfully");
    router.push("/");
  }

  function handleEdit() {
    setIsEditing(true);
  }

  function handleCancel() {
    setIsEditing(false);
    setEditName(user?.username || "");
    setEditPhone(clientDetails?.phone || "");
  }

  async function handleSave() {
    if (!isSetupComplete) {
      toast.error("Please set up your profile first");
      return;
    }

    try {
      let updated = false;

      if (editPhone !== clientDetails?.phone) {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/client/updateClientNumber`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              "x-request-from": "client",
            },
            credentials: "include",
            body: JSON.stringify({ phone: editPhone }),
          },
        );

        if (!response.ok) throw new Error("Failed to update phone number");

        setClientDetails((prev) => (prev ? { ...prev, phone: editPhone } : null));
        updated = true;
      }

      if (editName !== user?.username) {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/auth/update-name`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              "x-request-from": "client",
            },
            credentials: "include",
            body: JSON.stringify({ name: editName }),
          },
        );

        if (!response.ok) throw new Error("Failed to update name");

        await fetchUser();
        setClientDetails((prev) => (prev ? { ...prev, user_name: editName } : null));
        updated = true;
      }

      setIsEditing(false);
      if (updated) {
        toast.success("Profile updated successfully");
      }
    } catch (error) {
      toast.error("Error updating profile");
    }
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-screen flex-1 items-center justify-center bg-zinc-50">
        <Loader2 className="h-8 w-8 animate-spin text-[#1d4ed8]" />
      </div>
    );
  }

  if (!isSetupComplete) {
    return (
      <main className="flex-1 bg-zinc-50">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <nav className="mb-6 text-sm text-zinc-500">
            <Link href="/" className="transition-colors hover:text-zinc-800">
              Home
            </Link>
            <span className="mx-2">/</span>
            <span className="font-medium text-zinc-800">My Profile</span>
          </nav>

          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-red-100 p-3 text-red-600">
                <AlertCircle size={24} />
              </div>
              <div className="flex-1">
                <h1 className="text-xl font-semibold text-red-900">
                  Account setup required
                </h1>
                <p className="mt-2 text-sm text-red-800">
                  You have not completed your account setup yet. Your profile details are hidden until setup is finished.
                </p>
                <button
                  onClick={() => router.push("/profile/setup")}
                  className="mt-4 inline-flex items-center justify-center rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700"
                >
                  Go to Setup
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700 transition-colors hover:bg-red-100"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 bg-zinc-50">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <nav className="mb-6 text-sm text-zinc-500">
          <Link href="/" className="transition-colors hover:text-zinc-800">
            Home
          </Link>
          <span className="mx-2">/</span>
          <span className="font-medium text-zinc-800">My Profile</span>
        </nav>

        {!isSetupComplete && (
          <div className="mb-8 flex flex-col items-start justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 p-6 shadow-sm sm:flex-row sm:items-center">
            <div className="flex items-start gap-4">
              <div className="mt-1 rounded-full bg-amber-100 p-3 text-amber-600 sm:mt-0">
                <AlertCircle size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-zinc-900">Complete Your Profile</h3>
                <p className="mt-1 text-sm text-zinc-600">
                  You haven't set up your profile yet. Please set it up to add your phone number and delivery address.
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push("/profile/setup")}
              className="whitespace-nowrap rounded-lg bg-amber-600 px-6 py-2.5 font-medium text-white shadow-sm transition-colors hover:bg-amber-700"
            >
              Set Up Profile
            </button>
          </div>
        )}

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Link
            href="/orders"
            className="group flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-all hover:border-zinc-300 hover:shadow-md"
          >
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-blue-50 p-3 text-blue-600 transition-colors group-hover:bg-blue-100">
                <Package size={24} />
              </div>
              <div>
                <p className="font-semibold text-zinc-900">My Orders</p>
                <p className="text-xs text-zinc-500">View your order history</p>
              </div>
            </div>
            <ChevronRight size={20} className="text-zinc-400 group-hover:text-zinc-600" />
          </Link>

          <Link
            href="/wishlist"
            className="group flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-all hover:border-zinc-300 hover:shadow-md"
          >
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-rose-50 p-3 text-rose-600 transition-colors group-hover:bg-rose-100">
                <Heart size={24} />
              </div>
              <div>
                <p className="font-semibold text-zinc-900">Saved Products</p>
                <p className="text-xs text-zinc-500">Your wishlist items</p>
              </div>
            </div>
            <ChevronRight size={20} className="text-zinc-400 group-hover:text-zinc-600" />
          </Link>
        </div>

        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="h-28 bg-linear-to-r from-[#1d4ed8] to-[#3b82f6]" />

          <div className="px-6 pb-6 sm:px-8">
            <div className="-mt-14 flex flex-col items-center gap-4 sm:flex-row sm:items-end sm:gap-6">
              <div className="group relative">
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-zinc-100 text-zinc-600 shadow-lg">
                  {profileImage ? (
                    <img src={profileImage} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    <User size={40} />
                  )}
                </div>
                <label className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                  <Camera size={20} className="text-white" />
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              </div>

              <div className="flex-1 pb-5 text-center sm:text-left">
                {isEditing ? (
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-transparent text-center text-xl font-bold text-white placeholder-white/50 focus:outline-none sm:w-auto sm:text-left"
                    placeholder="Your Name"
                  />
                ) : (
                  <h1 className="text-xl font-bold text-white">{user?.username || "Guest User"}</h1>
                )}
                <p className="mt-0.5 text-sm text-zinc-500">{user?.email || "—"}</p>
              </div>

              <button
                onClick={isEditing ? handleSave : handleEdit}
                disabled={!isSetupComplete}
                className="flex items-center gap-2 rounded-lg bg-[#1d4ed8] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1e40af] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isEditing ? <Check size={16} /> : <Edit2 size={16} />}
                {isEditing ? "Save Changes" : "Edit Profile"}
              </button>
            </div>

            <div className="mt-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold text-zinc-900">Account Details</h2>
                {isEditing && isSetupComplete && (
                  <button
                    onClick={handleCancel}
                    className="flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 transition-colors hover:bg-zinc-50"
                  >
                    <Check size={14} className="hidden" />
                    <span>Cancel</span>
                  </button>
                )}
              </div>

              {!isSetupComplete && (
                <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm text-amber-800">
                    Please <Link href="/profile/setup" className="font-semibold underline hover:text-amber-900">set up your profile</Link> first to edit your account details.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-4">
                  <div className="mb-1.5 flex items-center gap-2 text-xs text-zinc-500">
                    <User size={14} />
                    Full Name
                  </div>
                  {isEditing && isSetupComplete ? (
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full border-b border-zinc-300 bg-transparent py-1 text-sm font-medium text-zinc-900 focus:border-[#1d4ed8] focus:outline-none"
                      placeholder="Your Name"
                    />
                  ) : (
                    <p className="text-sm font-medium text-zinc-900">{user?.username || "—"}</p>
                  )}
                </div>

                <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-4">
                  <div className="mb-1.5 flex items-center gap-2 text-xs text-zinc-500">
                    <Mail size={14} />
                    Email Address
                  </div>
                  <p className="text-sm font-medium text-zinc-900">{user?.email || "—"}</p>
                </div>

                <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-4 sm:col-span-2">
                  <div className="mb-1.5 flex items-center gap-2 text-xs text-zinc-500">
                    <Phone size={14} />
                    Phone Number
                  </div>
                  {isEditing && isSetupComplete ? (
                    <input
                      type="tel"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="w-full border-b border-zinc-300 bg-transparent py-1 text-sm font-medium text-zinc-900 focus:border-[#1d4ed8] focus:outline-none"
                      placeholder="Add phone number"
                    />
                  ) : (
                    <p className="text-sm font-medium text-zinc-900">{clientDetails?.phone || "—"}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-zinc-200 pt-6">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-semibold text-zinc-900">Saved Addresses</h2>
                  <p className="text-sm text-zinc-500">Add more than one delivery address and edit each one separately.</p>
                </div>
                <Link
                  href="/profile/add-address"
                  className="inline-flex items-center gap-2 rounded-lg bg-[#1d4ed8] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1e40af]"
                >
                  <MapPin size={16} />
                  Add Address
                </Link>
              </div>

              {clientDetails?.addresses?.length ? (
                <div className="space-y-4">
                  {clientDetails.addresses.map((address) => {
                    const addressPhone = address.address_phone || clientDetails.phone || "—";

                    return (
                      <div key={address.id} className="rounded-lg border border-blue-200 bg-blue-50/50 p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div className="rounded-lg bg-blue-100 p-2 text-blue-600">
                              <MapPin size={18} />
                            </div>
                            <div>
                              <p className="font-medium text-zinc-900">{address.address_line1 || address.address}</p>
                              {address.address_line2 && <p className="text-sm text-zinc-600">{address.address_line2}</p>}
                              {address.landmark && <p className="text-sm text-zinc-600">Landmark: {address.landmark}</p>}
                              <p className="mt-0.5 text-sm text-zinc-600">{address.city}, {address.state} - {address.pincode}</p>
                              <p className="text-sm text-zinc-500">{address.country}</p>
                              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-600">
                                <span className="inline-flex items-center gap-1.5">
                                  <Phone size={14} />
                                  {addressPhone}
                                </span>
                                {address.latitude && address.longitude && (
                                  <span>
                                    📍 {address.latitude}, {address.longitude}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <Link
                            href={`/profile/add-address?addressId=${address.id}`}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-white"
                          >
                            <Edit2 size={14} />
                            Edit Address
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-zinc-300 p-6 text-center">
                  <MapPin size={32} className="mx-auto mb-2 text-zinc-300" />
                  <p className="text-sm text-zinc-500">No address saved yet</p>
                  <Link href="/profile/add-address" className="mt-2 inline-flex text-sm font-medium text-[#1d4ed8] hover:underline">
                    Add your first address
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700 transition-colors hover:bg-red-100"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </main>
  );
}
