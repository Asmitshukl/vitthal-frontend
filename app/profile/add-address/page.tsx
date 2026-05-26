import { Suspense } from "react";
import AddAddressClient from "./AddAddressClient";

export default function AddAddressPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-zinc-50 px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-2xl items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-blue-600" />
          </div>
        </main>
      }
    >
      <AddAddressClient />
    </Suspense>
  );
}
