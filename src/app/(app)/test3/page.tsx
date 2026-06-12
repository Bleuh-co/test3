import type { Metadata } from "next";
import { FireworksShow } from "@/components/FireworksShow";

export const metadata: Metadata = {
  title: "Démo — Test3",
};

export default function Test3Page() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8 text-center">
        <span className="badge-accent">Démo</span>
        <h1 className="text-3xl font-bold text-chanv-terre mt-3">
          🚀 Test3 — Démonstration festive
        </h1>
        <p className="text-sm text-slate-500 mt-2">
          Une petite app de démonstration du générateur d&apos;apps Chanv.
        </p>
      </div>
      <div className="max-w-2xl mx-auto">
        <FireworksShow />
      </div>
    </main>
  );
}
