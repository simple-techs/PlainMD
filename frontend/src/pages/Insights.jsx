import React, { useEffect, useState } from "react";
import { TrendingUp, FileText, Loader2 } from "lucide-react";
import { api } from "../lib/api";
import AppShell from "../components/AppShell";

const Insights = () => {
  const [categories, setCategories] = useState({});
  const [loading, setLoading] = useState(true);
  const [totalDocs, setTotalDocs] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get("/documents/categories/summary");
        setCategories(data.categories || {});
        const total = Object.values(data.categories || {}).reduce((a, b) => a + b, 0);
        setTotalDocs(total);
      } catch (err) {
        console.error("Failed to load insights", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const categoryLabels = {
    labs: "Lab Reports", imaging: "Imaging", medications: "Medications",
    diagnoses: "Diagnoses", visits: "Visits", procedures: "Procedures",
    allergies: "Allergies", prescriptions: "Prescriptions", uncategorized: "Other",
  };

  const categoryColors = {
    labs: "bg-green-500", imaging: "bg-blue-500", medications: "bg-red-500",
    prescriptions: "bg-orange-500", diagnoses: "bg-purple-500", visits: "bg-teal-500",
    procedures: "bg-yellow-500", allergies: "bg-pink-500", uncategorized: "bg-zinc-400",
  };

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-zinc-900 mb-2">Insights</h1>
        <p className="text-sm text-zinc-500 mb-8">An overview of your medical record history.</p>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-brand-purple" />
          </div>
        ) : totalDocs === 0 ? (
          <div className="bg-white rounded-2xl border border-zinc-200/80 p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-brand-lavender flex items-center justify-center mx-auto mb-4">
              <TrendingUp size={24} className="text-brand-purple" />
            </div>
            <h3 className="text-base font-semibold text-zinc-900 mb-1">No insights yet</h3>
            <p className="text-sm text-zinc-400">Upload medical documents to see insights about your health records.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-zinc-200/80 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-brand-lavender flex items-center justify-center">
                  <FileText size={20} className="text-brand-purple" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-zinc-900">{totalDocs}</p>
                  <p className="text-xs text-zinc-500">Total documents uploaded</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-zinc-200/80 p-6">
              <h3 className="text-sm font-semibold text-zinc-900 mb-4">Document Categories</h3>
              <div className="space-y-3">
                {Object.entries(categories).map(([cat, count]) => {
                  const pct = totalDocs > 0 ? (count / totalDocs) * 100 : 0;
                  return (
                    <div key={cat}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-zinc-700">{categoryLabels[cat] || cat}</span>
                        <span className="text-xs text-zinc-400">{count}</span>
                      </div>
                      <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${categoryColors[cat] || categoryColors.uncategorized}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-brand-lavender/30 border border-brand-purple/10 rounded-2xl p-5 text-center">
              <p className="text-sm text-zinc-700 mb-1">Would you like deeper insights about your health records?</p>
              <p className="text-xs text-zinc-500">Ask PlainMD to analyze trends, compare results, or summarize key concerns from your chat.</p>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default Insights;
