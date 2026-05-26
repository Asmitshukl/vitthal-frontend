"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertCircle, CheckCircle, Loader2, MapPin, Phone } from "lucide-react";

type SetupStep = "contact" | "address";

type PincodePlace = {
  city: string;
  state: string;
  label: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000";

export default function SetupProfile() {
  const router = useRouter();
  const [step, setStep] = useState<SetupStep>("contact");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isCheckingSetup, setIsCheckingSetup] = useState(true);
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [isPincodeLoading, setIsPincodeLoading] = useState(false);
  const [cityFieldMode, setCityFieldMode] = useState<"manual" | "select">("manual");
  const [cityOptions, setCityOptions] = useState<PincodePlace[]>([]);

  // Contact details
  const [phone, setPhone] = useState("");

  // Address details
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [landmark, setLandmark] = useState("");
  const [addressPhone, setAddressPhone] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("India");
  const [pincode, setPincode] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  async function checkSetupStatus() {
    try {
      const res = await fetch(`${API_BASE}/api/client/checkSetupStatus`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "x-request-from": "client",
        },
      });

      if (res.ok) {
        const data = await res.json();
        setIsSetupComplete(data.isSetupComplete);
      }
    } catch (error) {
      console.error("Error checking setup status:", error);
    } finally {
      setIsCheckingSetup(false);
    }
  }

  async function lookupPincode(pincodeValue: string) {
    try {
      const res = await fetch(`${API_BASE}/api/vendors/pincode/${pincodeValue}`, {
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      });

      const data = await res.json();

      if (res.ok && data?.success) {
        const places = Array.isArray(data.places) ? (data.places as PincodePlace[]) : [];
        const normalizedPlaces = places
          .filter((place) => typeof place.city === "string" && place.city.length > 0)
          .map((place) => ({
            city: place.city,
            state: typeof place.state === "string" ? place.state : "",
            label: place.label || (place.state ? `${place.city}, ${place.state}` : place.city),
          }));

        setState(data.state || "");
        setCity("");
        setCityOptions(normalizedPlaces);
        setCityFieldMode("select");
      } else {
        setState("");
        setCity("");
        setCityOptions([]);
        setCityFieldMode("manual");
        toast.error(data?.message || "Could not auto-fill city and state. Please enter them manually.");
      }
    } catch (error) {
      console.error("Error fetching pincode data:", error);
      setState("");
      setCity("");
      setCityOptions([]);
      setCityFieldMode("manual");
      toast.error("Failed to fetch city and state. Please enter them manually.");
    } finally {
      setIsPincodeLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void checkSetupStatus();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const normalizedPincode = pincode.replace(/\D/g, "");

    if (normalizedPincode.length !== 6) {
      setCityOptions([]);
      setCityFieldMode("manual");
      return;
    }

    const timer = window.setTimeout(() => {
      setIsPincodeLoading(true);
      void lookupPincode(normalizedPincode);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [pincode]);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setIsGettingLocation(false);
        toast.success("Location captured successfully!");
      },
      (error) => {
        setIsGettingLocation(false);
        toast.error("Failed to get location. Please enable location services.");
        console.error("Geolocation error:", error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) {
      toast.error("Please provide your phone number");
      return;
    }

    setStep("address");
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!addressLine1.trim() || !city || !state || !country || !pincode || !addressPhone.trim()) {
      toast.error("Please fill all address details");
      return;
    }

    if (latitude === null || longitude === null) {
      toast.error("Please capture your location");
      return;
    }

    setIsSubmitting(true);

    try {
      const combinedAddress = [addressLine1.trim(), addressLine2.trim(), landmark.trim()]
        .filter(Boolean)
        .join(", ");

      const res = await fetch(`${API_BASE}/api/client/addClientDetails`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-request-from": "client",
        },
        credentials: "include",
        body: JSON.stringify({
          phone: phone.trim(),
          address: combinedAddress,
          addressLine1: addressLine1.trim(),
          addressLine2: addressLine2.trim(),
          landmark: landmark.trim(),
          addressPhone: addressPhone.trim(),
          city,
          state,
          country,
          pincode,
          latitude,
          longitude,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Failed to complete setup");
        setIsSubmitting(false);
        return;
      }

      toast.success("Profile setup completed successfully!");
      router.push("/profile");
    } catch (error) {
      console.error("Setup error:", error);
      toast.error("Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-2xl">
        {isCheckingSetup ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
          </div>
        ) : isSetupComplete ? (
          <div className="rounded-lg border border-green-200 bg-green-50 p-8 text-center shadow-sm">
            <CheckCircle className="mx-auto h-16 w-16 text-green-600 mb-4" />
            <h1 className="text-2xl font-bold text-zinc-900 mb-2">
              Profile Already Set Up
            </h1>
            <p className="text-sm text-zinc-600 mb-6">
              You have already completed your profile setup. You can edit your
              details from the profile page.
            </p>
            <button
              onClick={() => router.push("/profile")}
              className="inline-flex items-center gap-2 rounded-md bg-green-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-700"
            >
              Go to Profile
            </button>
          </div>
        ) : (
          <>
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold text-zinc-900">
                {step === "contact" ? "Contact Details" : "Delivery Address"}
              </h1>
              <p className="mt-2 text-sm text-zinc-600">
                {step === "contact"
                  ? "We need your phone number for important updates"
                  : "Provide a detailed delivery location. Pincode will auto-fill the state and city list."}
              </p>
              <div className="mt-6 flex justify-center gap-2">
                <div
                  className={`h-2 w-12 rounded-full transition-colors ${
                    step === "contact" ? "bg-blue-600" : "bg-blue-600"
                  }`}
                />
                <div
                  className={`h-2 w-12 rounded-full transition-colors ${
                    step === "address" ? "bg-blue-600" : "bg-zinc-300"
                  }`}
                />
              </div>
            </div>

            <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
              {step === "contact" ? (
                <form onSubmit={handleContactSubmit} className="space-y-6">
                  <div>
                    <label
                      htmlFor="phone"
                      className="mb-2 block text-sm font-medium text-zinc-800"
                    >
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
                      <input
                        id="phone"
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="h-11 w-full rounded-md border border-zinc-300 pl-10 pr-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="h-11 w-full rounded-md bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                  >
                    Continue to Address
                  </button>
                </form>
              ) : (
                <form onSubmit={handleAddressSubmit} className="space-y-6">
                  <div>
                    <label
                      htmlFor="addressLine1"
                      className="mb-2 block text-sm font-medium text-zinc-800"
                    >
                      Address Line 1
                    </label>
                    <input
                      id="addressLine1"
                      type="text"
                      required
                      value={addressLine1}
                      onChange={(e) => setAddressLine1(e.target.value)}
                      placeholder="House/Shop/Plot number, street name"
                      className="h-11 w-full rounded-md border border-zinc-300 px-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="addressLine2"
                      className="mb-2 block text-sm font-medium text-zinc-800"
                    >
                      Address Line 2
                    </label>
                    <input
                      id="addressLine2"
                      type="text"
                      value={addressLine2}
                      onChange={(e) => setAddressLine2(e.target.value)}
                      placeholder="Area, locality, building, road"
                      className="h-11 w-full rounded-md border border-zinc-300 px-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="landmark"
                      className="mb-2 block text-sm font-medium text-zinc-800"
                    >
                      Landmark <span className="text-zinc-500">(optional)</span>
                    </label>
                    <input
                      id="landmark"
                      type="text"
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      placeholder="Nearby landmark"
                      className="h-11 w-full rounded-md border border-zinc-300 px-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30"
                    />
                    <p className="mt-1 text-xs text-zinc-500">
                      Add this only if it helps the delivery person find your address faster.
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="pincode"
                      className="mb-2 block text-sm font-medium text-zinc-800"
                    >
                      Pincode
                    </label>
                    <input
                      id="pincode"
                      type="text"
                      required
                      maxLength={6}
                      value={pincode}
                      onChange={(e) =>
                        setPincode(e.target.value.replace(/\D/g, ""))
                      }
                      placeholder="400001"
                      className="h-11 w-full rounded-md border border-zinc-300 px-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30"
                    />
                    <p className="mt-1 text-xs text-blue-700">
                      Enter pin code first to auto fill city and state.
                    </p>
                    {isPincodeLoading && (
                      <p className="mt-2 flex items-center gap-2 text-xs text-blue-700">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Fetching city and state from your pincode...
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="city"
                        className="mb-2 block text-sm font-medium text-zinc-800"
                      >
                        City
                      </label>
                      {cityFieldMode === "select" ? (
                        <select
                          id="city"
                          required
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="h-11 w-full rounded-md border border-zinc-300 px-3 text-sm text-zinc-900 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30"
                        >
                          <option value="">Select city</option>
                          {cityOptions.map((option) => (
                            <option key={`${option.city}-${option.state}`} value={option.city}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          id="city"
                          type="text"
                          required
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="Mumbai"
                          className="h-11 w-full rounded-md border border-zinc-300 px-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30"
                        />
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="state"
                        className="mb-2 block text-sm font-medium text-zinc-800"
                      >
                        State
                      </label>
                      <input
                        id="state"
                        type="text"
                        required
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        placeholder="Maharashtra"
                        readOnly={cityFieldMode === "select"}
                        className="h-11 w-full rounded-md border border-zinc-300 px-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30 read-only:bg-zinc-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="country"
                      className="mb-2 block text-sm font-medium text-zinc-800"
                    >
                      Country
                    </label>
                    <input
                      id="country"
                      type="text"
                      required
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="India"
                      className="h-11 w-full rounded-md border border-zinc-300 px-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="addressPhone"
                      className="mb-2 block text-sm font-medium text-zinc-800"
                    >
                      Address Mobile Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
                      <input
                        id="addressPhone"
                        type="tel"
                        required
                        value={addressPhone}
                        onChange={(e) => setAddressPhone(e.target.value.replace(/\D/g, ""))}
                        placeholder="10-digit delivery number"
                        maxLength={10}
                        className="h-11 w-full rounded-md border border-zinc-300 pl-10 pr-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-zinc-800">
                      Location Coordinates
                    </label>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={getCurrentLocation}
                        disabled={isGettingLocation}
                        className="flex-1 flex items-center justify-center gap-2 rounded-md border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isGettingLocation ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Getting location...
                          </>
                        ) : (
                          <>
                            <MapPin className="h-4 w-4" />
                            {latitude && longitude
                              ? "Update Location"
                              : "Get Current Location"}
                          </>
                        )}
                      </button>
                    </div>
                    {isPincodeLoading && (
                      <p className="mt-2 flex items-center gap-2 text-xs text-zinc-500">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Looking up city and state from pincode...
                      </p>
                    )}
                    {latitude && longitude && (
                      <div className="mt-2 rounded-md bg-green-50 p-3 text-sm text-green-700">
                        <p>
                          <strong>Latitude:</strong> {latitude.toFixed(6)}
                        </p>
                        <p>
                          <strong>Longitude:</strong> {longitude.toFixed(6)}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setStep("contact")}
                      className="h-11 flex-1 rounded-md border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || !latitude || !longitude}
                      className="h-11 flex-1 rounded-md bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                          Setting up...
                        </>
                      ) : (
                        "Complete Setup"
                      )}
                    </button>
                  </div>
                </form>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
