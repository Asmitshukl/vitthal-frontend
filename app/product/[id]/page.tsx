"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import ProductImageGallery from "@/components/ProductImageGallery";
import { useCartStore } from "@/store/cartStore";
import { useQuotationCartStore } from "@/store/quotationCartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { toast } from "sonner";
import {
  ChevronRight,
  Package,
  ShieldCheck,
  Truck,
  Building,
  ShoppingCart,
  Plus,
  Minus,
  Info,
  Layers,
  BadgeCheck,
  Star,
  ArrowRight,
  Loader2,
  Heart,
  MapPin,
  Navigation,
  Crosshair,
} from "lucide-react";

type Vendor = {
  vendor_id: string;
  price: number | string;
  moq: number;
  stock_quantity: number;
  quotation_enabled?: boolean;
  quotation_min_qty?: number | null;
  rating: number;
  review_count: number;
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  state: string | null;
};

type RankedVendor = Vendor & {
  distance: number | null;
  price_score: number;
  distance_score: number;
  review_score: number;
  total_score: number;
  rank: number;
};

type ProductImage = {
  image_url: string;
  is_primary: boolean;
  display_order: number;
};

type ProductDetail = {
  product_id: string;
  product_name: string;
  description: string;
  category: string;
  product_type: string;
  grade?: string;
  material?: string;
  application?: string;
  standard?: string;
  rating: number;
  review_count: number;
  specifications: Record<string, string | number>;
  images: ProductImage[];
  vendors: Vendor[];
};

const PRODUCTS_BASE_URL = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api/products`
  : "http://localhost:9000/api/products";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000";

async function fetchProduct(id: string): Promise<ProductDetail | null> {
  const url = `${PRODUCTS_BASE_URL}/getProductById/${id}`;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch (err) {
    console.error("Error fetching individual product:", err);
    return null;
  }
}

async function fetchRankedVendors(productId: string, lat: number, lng: number): Promise<RankedVendor[]> {
  const url = `${PRODUCTS_BASE_URL}/getRankedVendors/${productId}?userLat=${lat}&userLng=${lng}`;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.error("Error fetching ranked vendors:", err);
    return [];
  }
}

async function fetchRelatedProducts(productId: string): Promise<any[]> {
  const url = `${PRODUCTS_BASE_URL}/getRelatedProducts/${productId}`;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.error("Error fetching related products:", err);
    return [];
  }
}

async function fetchClientAddress(): Promise<{ latitude: number; longitude: number; address: string; city: string } | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/client/clientDetails`, {
      credentials: "include",
      headers: { "Content-Type": "application/json", "x-request-from": "client" },
    });
    if (!res.ok) return null;
    const json = await res.json();
    const data = json.data;
    if (data?.latitude != null && data?.longitude != null) {
      return { latitude: Number(data.latitude), longitude: Number(data.longitude), address: data.address || "", city: data.city || "" };
    }
    return null;
  } catch {
    return null;
  }
}

export default function ProductDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const addItem = useCartStore((s) => s.addItem);
  const fetchCart = useCartStore((s) => s.fetchCart);
  const addQuotationItem = useQuotationCartStore((s) => s.addItem);
  const fetchQuotationCart = useQuotationCartStore((s) => s.fetchCart);
  const addToWishlist = useWishlistStore((s) => s.addItem);
  const totalItems = useCartStore((s) => s.items.length);
  const [addingVendorId, setAddingVendorId] = useState<string | null>(null);
  const [savingWishlist, setSavingWishlist] = useState(false);

  // Location & Ranking state
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; label: string } | null>(null);
  const [rankedVendors, setRankedVendors] = useState<RankedVendor[]>([]);
  const [isLocating, setIsLocating] = useState(false);
  const [isRanking, setIsRanking] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [isLoadingRelated, setIsLoadingRelated] = useState(false);

  useEffect(() => {
    async function loadProduct() {
      const data = await fetchProduct(id);
      setProduct(data);
      if (data?.vendors) {
        const initialQuantities: Record<string, number> = {};
        data.vendors.forEach((v) => {
          initialQuantities[v.vendor_id] = v.moq || 1;
        });
        setQuantities(initialQuantities);
      }
      setLoading(false);
    }
    loadProduct();
  }, [id]);

  // Try to get user's saved address on mount
  useEffect(() => {
    async function loadAddress() {
      const addr = await fetchClientAddress();
      if (addr) {
        setUserLocation({ lat: addr.latitude, lng: addr.longitude, label: `${addr.address}, ${addr.city}` });
      }
    }
    loadAddress();
  }, []);

  // When user location is available, fetch ranked vendors
  useEffect(() => {
    if (!userLocation || !id) return;
    const { lat, lng } = userLocation;
    async function loadRanking() {
      setIsRanking(true);
      const ranked = await fetchRankedVendors(id, lat, lng);
      setRankedVendors(ranked);
      setIsRanking(false);
    }
    loadRanking();
  }, [userLocation, id]);

  // Fetch related products
  useEffect(() => {
    if (!id) return;
    async function loadRelated() {
      setIsLoadingRelated(true);
      const related = await fetchRelatedProducts(id);
      setRelatedProducts(related);
      setIsLoadingRelated(false);
    }
    loadRelated();
  }, [id]);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude, label: "Current Location" });
        setIsLocating(false);
        toast.success("Location detected successfully");
      },
      (error) => {
        setIsLocating(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            toast.error("Location permission denied. Please enable it in your browser settings.");
            break;
          case error.POSITION_UNAVAILABLE:
            toast.error("Location information unavailable.");
            break;
          case error.TIMEOUT:
            toast.error("Location request timed out.");
            break;
          default:
            toast.error("An unknown error occurred while getting location.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  };

  const updateQuantity = (vendorId: string, moq: number, delta: number, stock: number) => {
    setQuantities((prev) => {
      const newQty = (prev[vendorId] || moq) + delta;
      if (newQty < moq) {
        toast.error(`Minimum order quantity is ${moq}`);
        return prev;
      }
      if (stock && newQty > stock) {
        toast.error(`Maximum available stock is ${stock}`);
        return prev;
      }
      return { ...prev, [vendorId]: newQty };
    });
  };

  const handleAddToCart = async (vendor: Vendor) => {
    if (!product) return;
    const quantity = quantities[vendor.vendor_id] || vendor.moq || 1;
    const quotationMinQty = vendor.quotation_min_qty ? Number(vendor.quotation_min_qty) : null;
    const requiresQuotation = Boolean(vendor.quotation_enabled) && quotationMinQty !== null && quantity >= quotationMinQty;

    setAddingVendorId(vendor.vendor_id);
    
    if (requiresQuotation) {
      const quoteSuccess = await addQuotationItem({
        productId: product.product_id,
        productName: product.product_name,
        image: product.images?.[0]?.image_url || "",
        price: Number(vendor.price) || 0,
        moq: vendor.moq,
        quotationMinQty: quotationMinQty,
        quotationEnabled: vendor.quotation_enabled,
        quantity,
        vendorId: vendor.vendor_id,
        vendorName: "",
      });
      if (quoteSuccess) {
        toast.success("Added to quotation cart");
        await fetchQuotationCart(true);
      } else {
        toast.error("Failed to add to quotation cart");
      }
      setAddingVendorId(null);
      return;
    }
    
    const success = await addItem({
      productId: product.product_id,
      productName: product.product_name,
      image: product.images?.find((img) => img.is_primary)?.image_url || product.images?.[0]?.image_url || "",
      price: typeof vendor.price === "string" ? parseFloat(vendor.price) || 0 : vendor.price || 0,
      moq: vendor.moq || 1,
      quantity,
      vendorId: vendor.vendor_id,
      vendorName: `Vendor #${vendor.vendor_id.slice(0, 8)}`,
    });
    
    setAddingVendorId(null);
    
    if (success) {
      toast.success(`Added ${quantity} units to cart from Vendor #${vendor.vendor_id.slice(0, 8)}`);
      await fetchCart();
    } else {
      toast.error("Failed to add item. Please login.");
    }
  };

  const handleSaveToWishlist = async () => {
    if (!product) return;

    const preferredVendor = product.vendors?.[0];
    setSavingWishlist(true);

    const success = await addToWishlist({
      productId: product.product_id,
      productName: product.product_name,
      description: product.description,
      image: product.images?.find((img) => img.is_primary)?.image_url || product.images?.[0]?.image_url || "",
      vendorId: preferredVendor?.vendor_id || null,
      vendorName: preferredVendor ? `Vendor #${preferredVendor.vendor_id.slice(0, 8)}` : "",
      price: preferredVendor ? (typeof preferredVendor.price === "string" ? parseFloat(preferredVendor.price) || 0 : preferredVendor.price || 0) : 0,
      moq: preferredVendor?.moq || 1,
      stockQuantity: preferredVendor?.stock_quantity || 0,
    });

    setSavingWishlist(false);

    if (success) {
      toast.success(`${product.product_name} saved to wishlist`);
    } else {
      toast.error("Failed to save item to wishlist");
    }
  };

  const getPriceRange = () => {
    if (!product?.vendors?.length) return null;
    const prices = product.vendors
      .map((v) => (typeof v.price === "string" ? parseFloat(v.price) : v.price))
      .filter((p): p is number => !!p && !isNaN(p));
    if (!prices.length) return null;
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return min === max ? `₹${min.toLocaleString()}` : `₹${min.toLocaleString()} - ₹${max.toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-32 w-32 bg-zinc-200 rounded-lg mb-4"></div>
          <div className="h-6 w-48 bg-zinc-200 rounded mb-2"></div>
          <div className="h-4 w-32 bg-zinc-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white text-zinc-900 flex flex-col">
        <main className="flex-1 flex flex-col items-center justify-center p-8">
          <Package size={64} className="text-zinc-200 mb-4" />
          <h1 className="text-3xl font-bold mb-4">Product Not Found</h1>
          <p className="text-zinc-500 mb-8">
            The product you are looking for might have been removed or is temporarily unavailable.
          </p>
          <Link
            href="/products"
            className="px-6 py-3 bg-[#1d4ed8] text-white rounded-lg font-medium hover:bg-blue-800 transition"
          >
            Browse Products
          </Link>
        </main>
      </div>
    );
  }

  const priceRange = getPriceRange();

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col">
      <main className="flex-1">
        {/* Breadcrumbs & Cart Summary */}
        <div className="bg-white border-b border-zinc-200">
          <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <nav className="text-sm flex items-center gap-2 text-zinc-500">
                <Link href="/" className="hover:text-zinc-800 transition-colors">Home</Link>
                <ChevronRight size={14} className="text-zinc-400" />
                <Link href="/products" className="hover:text-zinc-800 transition-colors">Products</Link>
                <ChevronRight size={14} className="text-zinc-400" />
                <span className="text-zinc-800 font-medium truncate max-w-xs">{product.product_name}</span>
              </nav>
              <Link 
                href="/cart" 
                className="flex items-center gap-2 px-4 py-2 bg-zinc-100 rounded-lg hover:bg-zinc-200 transition-colors"
              >
                <ShoppingCart size={18} className="text-zinc-600" />
                <span className="text-sm font-medium text-zinc-700">Cart ({totalItems})</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Product Overview Section */}
        <section className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden flex flex-col lg:flex-row">

            {/* Left: Images Array */}
            <div className="lg:w-1/2 bg-zinc-50/50 p-4 lg:p-6 min-h-[400px] lg:min-h-[600px]">
              <ProductImageGallery images={product.images} productName={product.product_name} />
            </div>

            {/* Right: Core Details */}
            <div className="lg:w-1/2 p-6 lg:p-8 flex flex-col">
              {/* Category & Badges */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold uppercase tracking-wider rounded-full">
                  {product.category}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full">
                  <BadgeCheck size={12} />
                  Verified Product
                </span>
              </div>

              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-zinc-900 mb-3">
                {product.product_name}
              </h1>

              {/* Price Range Display */}
              {priceRange && (
                <div className="mb-4">
                  <p className="text-sm text-zinc-500 mb-1">Price Range (per unit)</p>
                  <p className="text-2xl font-bold text-[#1d4ed8]">{priceRange}</p>
                  <p className="text-xs text-zinc-400 mt-1">* Prices vary by supplier. MOQ applies.</p>
                </div>
              )}

              {/* Detailed Product Information */}
              <div className="mb-6 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Package className="text-blue-600" size={16} />
                    <span className="text-zinc-500">Category:</span>
                    <span className="font-semibold text-zinc-900 capitalize">{product.category}</span>
                  </div>
                  {product.product_type && (
                    <div className="flex items-center gap-2">
                      <Layers className="text-blue-600" size={16} />
                      <span className="text-zinc-500">Type:</span>
                      <span className="font-semibold text-zinc-900 capitalize">{product.product_type}</span>
                    </div>
                  )}
                  {product.material && (
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="text-blue-600" size={16} />
                      <span className="text-zinc-500">Material:</span>
                      <span className="font-semibold text-zinc-900">{product.material}</span>
                    </div>
                  )}
                  {product.grade && (
                    <div className="flex items-center gap-2">
                      <BadgeCheck className="text-blue-600" size={16} />
                      <span className="text-zinc-500">Grade:</span>
                      <span className="font-semibold text-zinc-900">{product.grade}</span>
                    </div>
                  )}
                  {product.application && (
                    <div className="flex items-center gap-2">
                      <Truck className="text-blue-600" size={16} />
                      <span className="text-zinc-500">Application:</span>
                      <span className="font-semibold text-zinc-900">{product.application}</span>
                    </div>
                  )}
                  {product.standard && (
                    <div className="flex items-center gap-2">
                      <Info className="text-blue-600" size={16} />
                      <span className="text-zinc-500">Standard:</span>
                      <span className="font-semibold text-zinc-900">{product.standard}</span>
                    </div>
                  )}
                </div>
                
                {/* Product Rating */}
                <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="flex items-center gap-1">
                    <Star className="fill-amber-400 text-amber-400" size={16} />
                    <span className="font-bold text-amber-900">{product.rating || 0}</span>
                  </div>
                  <span className="text-sm text-amber-700">
                    {product.review_count || 0} {product.review_count === 1 ? 'review' : 'reviews'}
                  </span>
                  <span className="text-xs text-amber-600">• Verified by our quality team</span>
                </div>
              </div>

              {/* B2B Trust Indicators */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="flex flex-col items-center p-3 rounded-xl border border-zinc-100 bg-zinc-50/50 text-center">
                  <Building className="text-blue-600 mb-2" size={22} />
                  <p className="text-xs text-zinc-500 font-medium">{product.vendors?.length || 0} Suppliers</p>
                </div>
                <div className="flex flex-col items-center p-3 rounded-xl border border-zinc-100 bg-zinc-50/50 text-center">
                  <ShieldCheck className="text-emerald-500 mb-2" size={22} />
                  <p className="text-xs text-zinc-500 font-medium">Quality Assured</p>
                </div>
                <div className="flex flex-col items-center p-3 rounded-xl border border-zinc-100 bg-zinc-50/50 text-center">
                  <Truck className="text-orange-500 mb-2" size={22} />
                  <p className="text-xs text-zinc-500 font-medium">Bulk Delivery</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-4 border-t border-zinc-100 mt-auto">
                <button
                  onClick={handleSaveToWishlist}
                  disabled={savingWishlist}
                  className="flex-1 px-6 py-3.5 border border-rose-200 bg-rose-50 text-rose-700 text-sm font-semibold rounded-xl hover:bg-rose-100 hover:shadow-md transition-all text-center flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {savingWishlist ? <Loader2 size={18} className="animate-spin" /> : <Heart size={18} />}
                  {savingWishlist ? "Saving..." : "Save to Wishlist"}
                </button>
                <a 
                  href="#vendors-list" 
                  className="flex-1 px-6 py-3.5 bg-[#1d4ed8] text-white text-sm font-semibold rounded-xl hover:bg-blue-800 hover:shadow-lg transition-all text-center flex items-center justify-center gap-2"
                >
                  <ShoppingCart size={18} />
                  View Suppliers & Add to Cart
                </a>
                <Link 
                  href="/cart"
                  className="px-6 py-3.5 border-2 border-zinc-200 text-zinc-700 text-sm font-semibold rounded-xl hover:border-zinc-300 hover:bg-zinc-50 transition-all text-center flex items-center justify-center gap-2"
                >
                  Go to Cart
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Lower Content Grid */}
        <section className="max-w-7xl mx-auto px-4 pb-16 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8">

            {/* Technical Specifications */}
            <div className="lg:col-span-1 border border-zinc-200 bg-white rounded-2xl shadow-sm h-max overflow-hidden">
              <div className="px-6 py-5 border-b border-zinc-100 bg-zinc-50/50 flex items-center gap-2">
                <Layers size={18} className="text-zinc-500" />
                <h3 className="text-lg font-semibold text-zinc-900">Technical Specifications</h3>
              </div>
              <div className="p-6">
                {(product.grade || product.material || product.application || product.standard) && (
                  <ul className="space-y-3 mb-6">
                    {product.grade && (
                      <li className="flex justify-between items-start py-2 border-b border-zinc-50">
                        <span className="text-sm text-zinc-500">Grade</span>
                        <span className="text-sm font-semibold text-zinc-900">{product.grade}</span>
                      </li>
                    )}
                    {product.material && (
                      <li className="flex justify-between items-start py-2 border-b border-zinc-50">
                        <span className="text-sm text-zinc-500">Material</span>
                        <span className="text-sm font-semibold text-zinc-900">{product.material}</span>
                      </li>
                    )}
                    {product.application && (
                      <li className="flex justify-between items-start py-2 border-b border-zinc-50">
                        <span className="text-sm text-zinc-500">Application</span>
                        <span className="text-sm font-semibold text-zinc-900">{product.application}</span>
                      </li>
                    )}
                    {product.standard && (
                      <li className="flex justify-between items-start py-2 border-b border-zinc-50">
                        <span className="text-sm text-zinc-500">Standard</span>
                        <span className="text-sm font-semibold text-zinc-900">{product.standard}</span>
                      </li>
                    )}
                  </ul>
                )}
                {product.specifications && Object.keys(product.specifications).length > 0 ? (
                  <ul className="space-y-3">
                    {Object.entries(product.specifications).map(([key, value]) => (
                      <li key={key} className="flex justify-between items-start py-2 border-b border-zinc-50 last:border-0">
                        <span className="text-sm text-zinc-500 capitalize">{key.replace(/_/g, ' ')}</span>
                        <span className="text-sm font-semibold text-zinc-900 text-right max-w-[60%]">{String(value)}</span>
                      </li>
                    ))}
                  </ul>
                ) : !product.grade && !product.material && !product.application && !product.standard && (
                  <div className="py-8 text-center text-zinc-500 flex flex-col items-center">
                    <Info size={24} className="mb-2 opacity-20" />
                    <p className="text-sm">Specifications available on request</p>
                  </div>
                )}
              </div>
            </div>

            {/* Delivery Location & Vendors */}
            <div id="vendors-list" className="lg:col-span-2 space-y-4">
              {/* Delivery Location Card */}
              <div className="border border-zinc-200 bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50/50 flex items-center gap-2">
                  <MapPin size={18} className="text-blue-600" />
                  <h3 className="text-lg font-semibold text-zinc-900">Delivery Location</h3>
                </div>
                <div className="p-5">
                  {userLocation ? (
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 p-2 bg-blue-50 rounded-lg">
                          <Navigation size={18} className="text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-zinc-900">You want to order at this location</p>
                          <p className="text-sm text-zinc-500 mt-0.5">{userLocation.label}</p>
                          <p className="text-xs text-zinc-400 mt-1">
                            {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleUseCurrentLocation}
                        disabled={isLocating}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors disabled:opacity-60"
                      >
                        {isLocating ? <Loader2 size={14} className="animate-spin" /> : <Crosshair size={14} />}
                        {isLocating ? "Detecting..." : "Update Location"}
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-center py-4">
                      <MapPin size={32} className="text-zinc-300 mb-3" />
                      <p className="text-sm font-semibold text-zinc-900 mb-1">Set your delivery location</p>
                      <p className="text-xs text-zinc-500 mb-4 max-w-sm">
                        We&apos;ll rank suppliers based on your location to find the best prices, closest distances, and top-rated vendors.
                      </p>
                      <button
                        onClick={handleUseCurrentLocation}
                        disabled={isLocating}
                        className="flex items-center gap-2 px-5 py-2.5 bg-[#1d4ed8] text-white text-sm font-semibold rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-60"
                      >
                        {isLocating ? <Loader2 size={16} className="animate-spin" /> : <Crosshair size={16} />}
                        {isLocating ? "Detecting Location..." : "Use Current Location"}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Vendors & Add to Cart */}
              <div className="border border-zinc-200 bg-white rounded-2xl shadow-sm">
                <div className="px-6 py-5 border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building size={18} className="text-zinc-500" />
                    <h3 className="text-lg font-semibold text-zinc-900">
                      {rankedVendors.length > 0 ? "Ranked Suppliers" : "Compare Suppliers & Order"}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {isRanking && <Loader2 size={14} className="animate-spin text-blue-600" />}
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                      {product.vendors?.length || 0} suppliers
                    </span>
                  </div>
                </div>


                <div className="divide-y divide-zinc-100">
                  {(rankedVendors.length > 0 ? rankedVendors : product.vendors) && (rankedVendors.length > 0 ? rankedVendors : product.vendors).length > 0 ? (
                    (rankedVendors.length > 0 ? rankedVendors : product.vendors).map((v) => {
                      const qty = quantities[v.vendor_id] || v.moq || 1;
                      const price = typeof v.price === "string" ? parseFloat(v.price) || 0 : v.price || 0;
                      const totalPrice = price * qty;
                      const quotationMinQty = v.quotation_min_qty ? Number(v.quotation_min_qty) : null;
                      const requiresQuotation = Boolean(v.quotation_enabled) && quotationMinQty !== null && qty >= quotationMinQty;
                      const isRanked = rankedVendors.length > 0 && "rank" in v;
                      const ranked = v as RankedVendor;
                      
                      return (
                        <div key={v.vendor_id} className="p-5 hover:bg-zinc-50/50 transition-colors">
                          <div className="flex flex-col lg:flex-row gap-4">
                            {/* Supplier Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                {isRanked && (
                                  <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                                    ranked.rank === 1 ? "bg-amber-100 text-amber-700" :
                                    ranked.rank === 2 ? "bg-zinc-200 text-zinc-700" :
                                    ranked.rank === 3 ? "bg-orange-100 text-orange-700" :
                                    "bg-zinc-100 text-zinc-500"
                                  }`}>
                                    {ranked.rank}
                                  </span>
                                )}
                                <h4 className="font-semibold text-zinc-900">Vendor #{v.vendor_id.slice(0, 8)}</h4>
                                {(v.city || v.state) && (
                                  <div className="flex items-center gap-1 text-xs text-zinc-500">
                                    <MapPin size={12} />
                                    <span>{[v.city, v.state].filter(Boolean).join(', ')}</span>
                                  </div>
                                )}
                                {v.rating > 0 && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 text-xs rounded-full">
                                    <Star size={10} fill="currentColor" />
                                    {Number(v.rating).toFixed(1)}
                                  </span>
                                )}
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 text-xs rounded-full">
                                  <BadgeCheck size={10} />
                                  Verified
                                </span>
                              </div>
                              
                              <div className={`grid gap-3 mb-3 ${isRanked ? 'grid-cols-4' : 'grid-cols-3'}`}>
                                <div className="bg-zinc-50 border border-zinc-200 px-3 py-2 rounded-lg">
                                  <p className="text-xs text-zinc-500">Unit Price</p>
                                  <p className="text-sm font-bold text-[#1d4ed8]">₹{v.price || "Contact"}</p>
                                </div>
                                <div className="bg-zinc-50 border border-zinc-200 px-3 py-2 rounded-lg">
                                  <p className="text-xs text-zinc-500">MOQ</p>
                                  <p className="text-sm font-semibold text-zinc-800">{v.moq || 1} units</p>
                                </div>
                                <div className="bg-zinc-50 border border-zinc-200 px-3 py-2 rounded-lg">
                                  <p className="text-xs text-zinc-500">Stock</p>
                                  <p className="text-sm font-semibold text-zinc-800">{v.stock_quantity || "N/A"}</p>
                                </div>
                                {isRanked && ranked.distance !== null && (
                                  <div className="bg-zinc-50 border border-zinc-200 px-3 py-2 rounded-lg">
                                    <p className="text-xs text-zinc-500">Distance</p>
                                    <p className="text-sm font-semibold text-zinc-800">
                                      {ranked.distance < 1 ? `${Math.round(ranked.distance * 1000)} m` : `${ranked.distance.toFixed(1)} km`}
                                    </p>
                                  </div>
                                )}
                              </div>

                              {v.quotation_enabled && quotationMinQty !== null && (
                                <div className="mb-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                                  Quotation required for {quotationMinQty}+ units
                                </div>
                              )}

                            </div>

                            {/* Quantity & Add to Cart */}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 lg:w-auto">
                              {/* Quantity Selector */}
                              <div className="flex items-center gap-2 bg-white border border-zinc-200 rounded-lg px-2 py-1.5">
                                <button
                                  onClick={() => updateQuantity(v.vendor_id, v.moq || 1, -1, v.stock_quantity)}
                                  className="p-1.5 text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 rounded transition-colors disabled:opacity-40"
                                  disabled={qty <= (v.moq || 1)}
                                >
                                  <Minus size={16} />
                                </button>
                                <div className="flex flex-col items-center min-w-[60px]">
                                  <input
                                    type="number"
                                    min={v.moq || 1}
                                    max={v.stock_quantity || undefined}
                                    value={qty}
                                    onChange={(e) => {
                                      const val = parseInt(e.target.value);
                                      if (!isNaN(val) && val >= (v.moq || 1)) {
                                        if (!v.stock_quantity || val <= v.stock_quantity) {
                                          setQuantities((prev) => ({ ...prev, [v.vendor_id]: val }));
                                        } else {
                                          toast.error(`Maximum available stock is ${v.stock_quantity}`);
                                        }
                                      }
                                    }}
                                    onBlur={(e) => {
                                      const val = parseInt(e.target.value);
                                      if (isNaN(val) || val < (v.moq || 1)) {
                                        setQuantities((prev) => ({ ...prev, [v.vendor_id]: v.moq || 1 }));
                                        toast.error(`Minimum order quantity is ${v.moq || 1}`);
                                      }
                                    }}
                                    className="w-[60px] text-center text-sm font-semibold text-zinc-900 bg-transparent outline-none border-b border-zinc-300 focus:border-[#1d4ed8] transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  />
                                  <span className="text-[10px] text-zinc-400">units</span>
                                </div>
                                <button
                                  onClick={() => updateQuantity(v.vendor_id, v.moq || 1, 1, v.stock_quantity)}
                                  className="p-1.5 text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 rounded transition-colors"
                                >
                                  <Plus size={16} />
                                </button>
                              </div>

                              {/* Total & Add Button */}
                              <div className="flex flex-col items-end gap-2">
                                {price > 0 && (
                                  <p className="text-sm font-semibold text-zinc-900">
                                    Total: ₹{totalPrice.toLocaleString()}
                                  </p>
                                )}
                                <button 
                                  onClick={() => handleAddToCart(v)}
                                  disabled={addingVendorId === v.vendor_id}
                                  className={`px-5 py-2.5 text-white text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-70 disabled:cursor-not-allowed ${requiresQuotation ? "bg-amber-600 hover:bg-amber-700" : "bg-[#1d4ed8] hover:bg-blue-800"}`}
                                >
                                  {addingVendorId === v.vendor_id ? (
                                    <Loader2 size={16} className="animate-spin" />
                                  ) : (
                                    <ShoppingCart size={16} />
                                  )}
                                  {addingVendorId === v.vendor_id ? "Adding..." : requiresQuotation ? "Request Quote" : "Add to Cart"}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-12 text-center flex flex-col items-center justify-center">
                      <Truck size={48} className="text-zinc-200 mb-4" />
                      <h4 className="text-lg font-medium text-zinc-900 mb-1">No suppliers available</h4>
                      <p className="text-zinc-500 text-sm max-w-sm">We&apos;re actively sourcing verified suppliers for this product. Check back soon or contact our team.</p>
                    </div>
                  )}
                </div>
                
                {/* Cart CTA Footer */}
                {product.vendors?.length > 0 && (
                  <div className="px-6 py-4 border-t border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
                    <p className="text-sm text-zinc-500">
                      {totalItems > 0 ? `${totalItems} items in your cart` : "Add items to proceed"}
                    </p>
                    <Link 
                      href="/cart"
                      className="px-5 py-2 bg-zinc-900 text-white text-sm font-semibold rounded-lg hover:bg-zinc-800 transition-colors flex items-center gap-2"
                    >
                      View Cart & Checkout
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                )}
              </div>
            </div>

          </div>
        </section>

        {/* About This Item Section */}
        <section className="max-w-7xl mx-auto px-4 pb-16 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-zinc-100 bg-zinc-50/50 flex items-center gap-2">
              <Info size={18} className="text-zinc-500" />
              <h3 className="text-lg font-semibold text-zinc-900">About This Item</h3>
            </div>
            <div className="p-6">
              <div className="prose prose-zinc max-w-none">
                <p className="text-zinc-700 leading-relaxed text-base">
                  {product.description || "This industrial-grade product meets stringent quality standards and is suitable for various commercial and industrial applications. Sourced from verified suppliers with competitive pricing and reliable delivery options."}
                </p>
                
                {/* Additional details if available */}
                {(product.grade || product.material || product.application || product.standard) && (
                  <div className="mt-6 p-4 bg-zinc-50 rounded-lg">
                    <h4 className="font-semibold text-zinc-900 mb-3">Product Specifications</h4>
                    <ul className="space-y-2 text-sm">
                      {product.grade && (
                        <li className="flex items-start gap-2">
                          <ChevronRight size={14} className="text-zinc-400 mt-0.5" />
                          <span><strong>Grade:</strong> {product.grade}</span>
                        </li>
                      )}
                      {product.material && (
                        <li className="flex items-start gap-2">
                          <ChevronRight size={14} className="text-zinc-400 mt-0.5" />
                          <span><strong>Material:</strong> {product.material}</span>
                        </li>
                      )}
                      {product.application && (
                        <li className="flex items-start gap-2">
                          <ChevronRight size={14} className="text-zinc-400 mt-0.5" />
                          <span><strong>Application:</strong> {product.application}</span>
                        </li>
                      )}
                      {product.standard && (
                        <li className="flex items-start gap-2">
                          <ChevronRight size={14} className="text-zinc-400 mt-0.5" />
                          <span><strong>Standard:</strong> {product.standard}</span>
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Related Products Section */}
        <section className="max-w-7xl mx-auto px-4 pb-16 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-zinc-900 mb-2">Related Products</h2>
            <p className="text-zinc-600">Similar products in the {product.category} category</p>
          </div>
          
          {isLoadingRelated ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-48 bg-zinc-200 rounded-lg mb-4"></div>
                  <div className="h-4 bg-zinc-200 rounded mb-2"></div>
                  <div className="h-4 bg-zinc-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : relatedProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((related) => {
                const priceLabel = related.min_price === related.max_price
                  ? `₹${related.min_price?.toLocaleString() || "Contact"}`
                  : `₹${related.min_price?.toLocaleString() || 0} – ₹${related.max_price?.toLocaleString() || 0}`;
                
                return (
                  <div key={related.product_id} className="group relative flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition-all hover:border-zinc-300 hover:shadow-md h-full">
                    <Link href={`/product/${related.product_id}`} className="flex h-full flex-col">
                      {/* Image */}
                      <div className="relative h-48 w-full overflow-hidden bg-zinc-100">
                        {related.primary_image ? (
                          <img
                            src={related.primary_image}
                            alt={related.product_name}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-zinc-100">
                            <Package size={32} className="text-zinc-300" />
                          </div>
                        )}
                        {related.seller_count > 0 ? (
                          <span className="absolute top-2.5 left-2.5 rounded bg-white/90 backdrop-blur-sm px-2 py-0.5 text-[10px] font-medium text-zinc-600 shadow-sm">
                            {related.seller_count} {related.seller_count === 1 ? "Supplier" : "Suppliers"}
                          </span>
                        ) : (
                          <span className="absolute top-2.5 left-2.5 rounded bg-amber-100/95 backdrop-blur-sm px-2 py-0.5 text-[10px] font-medium text-amber-700 shadow-sm">
                            Coming Soon
                          </span>
                        )}
                      </div>

                      {/* Body */}
                      <div className="flex flex-1 flex-col gap-3 p-4">
                        {/* Product Name */}
                        <div>
                          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-zinc-900">
                            {related.product_name}
                          </h3>
                        </div>

                        {/* Rating */}
                        {related.rating > 0 && (
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              <Star className="fill-amber-400 text-amber-400" size={12} />
                              <span className="text-sm font-medium text-zinc-900">{related.rating}</span>
                            </div>
                            <span className="text-xs text-zinc-500">({related.review_count || 0})</span>
                          </div>
                        )}

                        {/* Price Section */}
                        <div className="pt-2 border-t border-zinc-100">
                          <p className="text-sm text-zinc-500">Price Range</p>
                          <p className="text-lg font-bold text-zinc-900">{priceLabel}</p>
                        </div>

                        {/* Order Details */}
                        <div className="pt-2 border-t border-zinc-100 space-y-1.5">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-zinc-500">Minimum Order</span>
                            <span className="font-medium text-zinc-700">{related.min_moq || 1} pieces</span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-zinc-500">Suppliers</span>
                            {related.seller_count > 0 ? (
                              <span className="font-medium text-emerald-600">
                                {related.seller_count === 1 ? "1 Verified" : `${related.seller_count} Verified`}
                              </span>
                            ) : (
                              <span className="font-medium text-amber-600">
                                Coming Soon
                              </span>
                            )}
                          </div>
                        </div>

                        {/* CTA */}
                        <div className={`mt-auto pt-2 w-full rounded-lg px-3 py-2.5 text-center text-xs font-semibold transition-colors ${
                          related.seller_count > 0
                            ? "border border-[#1d4ed8] text-[#1d4ed8] group-hover:bg-[#1d4ed8] group-hover:text-white"
                            : "border border-zinc-300 text-zinc-400 bg-zinc-50 cursor-not-allowed"
                        }`}>
                          {related.seller_count > 0 ? "Order Now" : "No Vendors Yet"}
                        </div>
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Package size={48} className="text-zinc-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-zinc-900 mb-2">No related products found</h3>
              <p className="text-zinc-500">Check out our other products in different categories</p>
              <Link
                href="/products"
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-[#1d4ed8] text-white text-sm font-medium rounded-lg hover:bg-blue-800 transition-colors"
              >
                Browse All Products
                <ArrowRight size={16} />
              </Link>
            </div>
          )}
        </section>
      </main>
      
    </div>
  );
}