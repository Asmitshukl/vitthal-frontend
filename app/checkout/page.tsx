"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { toast } from "sonner";
import { MapPin, CreditCard, Package, CheckCircle, ChevronLeft, Loader2, ShieldCheck, Edit2, X } from "lucide-react";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000";

interface ClientDetails {
    user_name: string;
    email: string;
    phone: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    pincode: string | null;
    latitude: number | null;
    longitude: number | null;
}

export default function CheckoutPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading: authLoading, fetchUser, checkClientSetupStatus } = useAuthStore();
    const { items, totalPrice, fetchCart, clearCart } = useCartStore();

    const [clientDetails, setClientDetails] = useState<ClientDetails | null>(null);
    const [fetchingClient, setFetchingClient] = useState(true);
    const [placingOrder, setPlacingOrder] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
    const [isSetupVerified, setIsSetupVerified] = useState(false);

    // Address form state
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [addressForm, setAddressForm] = useState({
        address: "",
        city: "",
        state: "",
        country: "India",
        pincode: "",
        latitude: null as number | null,
        longitude: null as number | null
    });
    const [savingAddress, setSavingAddress] = useState(false);
    const [isGettingLocation, setIsGettingLocation] = useState(false);

    useEffect(() => {
        fetchUser();
        fetchCart();
    }, [fetchUser, fetchCart]);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push("/login?redirect=/checkout");
        }
    }, [isAuthenticated, authLoading, router]);

    async function loadClientDetails() {
        try {
            const res = await fetch(`${API_BASE}/api/client/clientDetails`, {
                credentials: "include",
                headers : {
                    "Content-Type": "application/json",
                    "x-request-from": "client"
                }
            });
            if (res.ok) {
                const data = await res.json();
                setClientDetails(data.data);
                if (data.data?.address) {
                    setAddressForm({
                        address: data.data.address,
                        city: data.data.city || "",
                        state: data.data.state || "",
                        country: data.data.country || "India",
                        pincode: data.data.pincode || "",
                        latitude: data.data.latitude || null,
                        longitude: data.data.longitude || null
                    });
                } else {
                    setShowAddressForm(true);
                }
            } else {
                setShowAddressForm(true);
            }
        } catch (err) {
            console.error("Failed to load client details", err);
            setShowAddressForm(true);
        } finally {
            setFetchingClient(false);
        }
    }

    useEffect(() => {
        if (isAuthenticated) {
            const timer = window.setTimeout(() => {
                void (async () => {
                    const setupComplete = await checkClientSetupStatus();

                    if (!setupComplete) {
                        toast.error("Please set up your account first");
                        router.replace("/profile/setup");
                        setFetchingClient(false);
                        return;
                    }

                    setIsSetupVerified(true);
                    await loadClientDetails();
                })();
            }, 0);

            return () => window.clearTimeout(timer);
        }
    }, [checkClientSetupStatus, isAuthenticated, router]);

    const getCurrentLocation = () => {
        if (!navigator.geolocation) {
            toast.error("Geolocation is not supported by your browser");
            return;
        }
        setIsGettingLocation(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setAddressForm(prev => ({
                    ...prev,
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                }));
                setIsGettingLocation(false);
                toast.success("Location captured successfully!");
            },
            () => {
                setIsGettingLocation(false);
                toast.error("Failed to get location. Please enable location services.");
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    const handleSaveAddress = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!addressForm.address || !addressForm.city || !addressForm.state || !addressForm.country || !addressForm.pincode) {
            toast.error("All address fields are required");
            return;
        }
        if (addressForm.latitude === null || addressForm.longitude === null) {
            toast.error("Please capture your location coordinates");
            return;
        }
        setSavingAddress(true);
        try {
            const res = await fetch(`${API_BASE}/api/client/upsertAddress`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "x-request-from": "client" },
                credentials: "include",
                body: JSON.stringify(addressForm)
            });

            if (res.ok) {
                toast.success("Address saved successfully");
                await loadClientDetails();
                setShowAddressForm(false);
            } else {
                const data = await res.json();
                toast.error(data.message || "Failed to save address");
            }
        } catch (err) {
            toast.error("Error saving address");
        } finally {
            setSavingAddress(false);
        }
    };

    const handlePlaceOrder = async () => {
        if (!clientDetails?.address) {
            toast.error("Please add a delivery address first");
            return;
        }

        setPlacingOrder(true);
        try {
            const res = await fetch(`${API_BASE}/api/checkout/placeOrder`, {
                method: "POST",
                credentials: "include",
                headers : {
                    "Content-Type": "application/json",
                    "x-request-from": "client"
                }
            });

            if (res.ok) {
                toast.success("Order placed successfully!");
                await clearCart();
                router.push("/orders?success=true"); // Redirect to orders page or a success page
            } else {
                const data = await res.json();
                toast.error(data.message || "Failed to place order");
            }
        } catch (err) {
            toast.error("An error occurred while placing your order.");
        } finally {
            setPlacingOrder(false);
        }
    };

    if (authLoading || fetchingClient || !isSetupVerified) {
        return (
            <div className="flex h-screen items-center justify-center bg-zinc-50">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-zinc-50 pt-20 px-4">
                <div className="max-w-3xl mx-auto text-center space-y-6">
                    <Package className="mx-auto h-24 w-24 text-zinc-300" />
                    <h2 className="text-2xl font-semibold text-zinc-900">Your cart is empty</h2>
                    <p className="text-zinc-500">Add some products to your cart before checking out.</p>
                    <Link href="/products" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                        Browse Products
                    </Link>
                </div>
            </div>
        );
    }

    const subtotal = totalPrice();
    const taxes = subtotal * 0.18; // Mock 18% GST for industrial goods
    const finalTotal = subtotal + taxes;

    return (
        <div className="min-h-screen bg-zinc-50 pb-20 pt-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button onClick={() => router.back()} className="p-2 hover:bg-zinc-200 rounded-full transition-colors">
                        <ChevronLeft className="w-5 h-5 text-zinc-600" />
                    </button>
                    <h1 className="text-3xl font-bold text-zinc-900">Checkout</h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column: Forms and Selections */}
                    <div className="lg:col-span-8 space-y-6">
                        
                        {/* 1. Address Section */}
                        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
                            <div className="border-b border-zinc-100 bg-zinc-50/50 px-6 py-4 flex items-center gap-3">
                                <MapPin className="w-5 h-5 text-blue-600" />
                                <h2 className="text-lg font-semibold text-zinc-900">Delivery Address</h2>
                            </div>
                            
                            <div className="p-6">
                                {clientDetails?.address && !showAddressForm ? (
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <p className="font-medium text-zinc-900">{clientDetails.user_name}</p>
                                            <p className="text-sm text-zinc-600">{clientDetails.address}</p>
                                            <p className="text-sm text-zinc-600">{clientDetails.city}, {clientDetails.state} {clientDetails.pincode}</p>
                                            <p className="text-sm text-zinc-600">{clientDetails.country}</p>
                                            {clientDetails.phone && <p className="text-sm text-zinc-600 mt-2">Phone: {clientDetails.phone}</p>}
                                            {clientDetails.latitude && clientDetails.longitude && (
                                                <p className="text-xs text-zinc-400 mt-1">📍 {clientDetails.latitude}, {clientDetails.longitude}</p>
                                            )}
                                        </div>
                                        <button onClick={() => setShowAddressForm(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-300 text-zinc-700 hover:bg-zinc-50 transition-colors text-sm">
                                            <Edit2 size={14} />
                                            Edit
                                        </button>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSaveAddress} className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-zinc-700 mb-1">Street Address</label>
                                                <input required type="text" value={addressForm.address} onChange={e => setAddressForm({...addressForm, address: e.target.value})} className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none" placeholder="123 Industrial Estate" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-zinc-700 mb-1">City</label>
                                                <input required type="text" value={addressForm.city} onChange={e => setAddressForm({...addressForm, city: e.target.value})} className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-zinc-700 mb-1">State</label>
                                                <input required type="text" value={addressForm.state} onChange={e => setAddressForm({...addressForm, state: e.target.value})} className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-zinc-700 mb-1">PIN Code</label>
                                                <input required type="text" value={addressForm.pincode} onChange={e => setAddressForm({...addressForm, pincode: e.target.value})} className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-zinc-700 mb-1">Country</label>
                                                <input required type="text" value={addressForm.country} onChange={e => setAddressForm({...addressForm, country: e.target.value})} className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-zinc-700 mb-1">Location Coordinates</label>
                                            <button
                                                type="button"
                                                onClick={getCurrentLocation}
                                                disabled={isGettingLocation}
                                                className="flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 transition-colors"
                                            >
                                                {isGettingLocation ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                                                {addressForm.latitude ? "Update Location" : "Capture Location"}
                                            </button>
                                            {addressForm.latitude && addressForm.longitude && (
                                                <p className="mt-2 text-xs text-green-600 font-medium">
                                                    Coordinates: {addressForm.latitude.toFixed(6)}, {addressForm.longitude.toFixed(6)}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex justify-end pt-2">
                                            {clientDetails?.address && (
                                                <button type="button" onClick={() => setShowAddressForm(false)} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 mr-4">
                                                    <X size={14} />
                                                    Cancel
                                                </button>
                                            )}
                                            <button type="submit" disabled={savingAddress || !addressForm.latitude || !addressForm.longitude} className="flex items-center gap-2 bg-zinc-900 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50">
                                                {savingAddress ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                                Save Address
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </div>

                        {/* 2. Payment Options */}
                        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden opacity-90">
                            <div className="border-b border-zinc-100 bg-zinc-50/50 px-6 py-4 flex items-center gap-3">
                                <CreditCard className="w-5 h-5 text-blue-600" />
                                <h2 className="text-lg font-semibold text-zinc-900">Payment Method</h2>
                            </div>
                            <div className="p-6 space-y-4">
                                <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === 'bank_transfer' ? 'border-blue-600 bg-blue-50/30' : 'border-zinc-200 hover:border-zinc-300'}`}>
                                    <input type="radio" name="payment" value="bank_transfer" checked={paymentMethod === 'bank_transfer'} onChange={(e) => setPaymentMethod(e.target.value)} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                                    <div className="flex-1">
                                        <p className="font-medium text-zinc-900">NEFT / RTGS Bank Transfer</p>
                                        <p className="text-sm text-zinc-500">Direct transfer to our business account. Details provided after order.</p>
                                    </div>
                                </label>

                                <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === 'credit' ? 'border-blue-600 bg-blue-50/30' : 'border-zinc-200 hover:border-zinc-300'}`}>
                                    <input type="radio" name="payment" value="credit" checked={paymentMethod === 'credit'} onChange={(e) => setPaymentMethod(e.target.value)} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                                    <div className="flex-1">
                                        <p className="font-medium text-zinc-900">Business Credit Line</p>
                                        <p className="text-sm text-zinc-500">Pay within 30 days (Subject to credit approval).</p>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Order Summary */}
                    <div className="lg:col-span-4">
                        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm sticky top-24 overflow-hidden">
                            <div className="border-b border-zinc-100 px-6 py-4 bg-zinc-50/50">
                                <h2 className="text-lg font-semibold text-zinc-900">Order Summary</h2>
                            </div>
                            
                            <div className="p-6">
                                <div className="space-y-4 max-h-64 overflow-y-auto pr-2 mb-6 scrollbar-thin scrollbar-thumb-zinc-200">
                                    {items.map((item) => (
                                        <div key={`${item.productId}-${item.vendorId}`} className="flex items-start gap-3">
                                            {item.image ? (
                                                <img src={item.image} alt={item.productName} className="w-12 h-12 rounded-md object-cover border border-zinc-200" />
                                            ) : (
                                                <div className="w-12 h-12 bg-zinc-100 rounded-md border border-zinc-200 flex items-center justify-center">
                                                    <Package className="w-5 h-5 text-zinc-400" />
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-zinc-900 truncate">{item.productName}</p>
                                                <p className="text-xs text-zinc-500">Supplier: {item.vendorName}</p>
                                                <p className="text-xs text-zinc-500">Qty: {item.quantity}</p>
                                            </div>
                                            <p className="text-sm font-medium text-zinc-900 whitespace-nowrap">
                                                ₹{(item.price * item.quantity).toLocaleString()}
                                            </p>
                                        </div>
                                    ))}
                                </div>

                                <div className="space-y-3 pt-4 border-t border-zinc-100">
                                    <div className="flex justify-between text-sm text-zinc-600">
                                        <span>Subtotal</span>
                                        <span className="font-medium text-zinc-900">₹{subtotal.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-zinc-600">
                                        <span>Estimated Tax (18% GST)</span>
                                        <span className="font-medium text-zinc-900">₹{taxes.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-zinc-600">
                                        <span>Shipping</span>
                                        <span className="font-medium text-green-600">Calculated after order</span>
                                    </div>
                                    
                                    <div className="pt-4 border-t border-zinc-100 flex justify-between items-center">
                                        <span className="text-base font-semibold text-zinc-900">Total</span>
                                        <span className="text-xl font-bold text-blue-600">₹{finalTotal.toLocaleString()}</span>
                                    </div>
                                </div>

                                <button 
                                    onClick={handlePlaceOrder} 
                                    disabled={placingOrder || !clientDetails?.address || showAddressForm}
                                    className="w-full mt-8 bg-blue-600 text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {placingOrder ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                                    {placingOrder ? "Processing..." : "Place Order Securely"}
                                </button>
                                
                                {(!clientDetails?.address || showAddressForm) && (
                                    <p className="text-xs text-red-500 text-center mt-3">
                                        Please save your delivery address to continue.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
