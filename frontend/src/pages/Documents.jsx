import React, { useEffect, useState } from "react";
import { FileText, Trash2, Loader2 } from "lucide-react";
import { api } from "../lib/api";
import AppShell from "../components/AppShell";

const categories = [
  { key: "", label: "All" },
  { key: "labs", label: "Labs" },
  { key: "imaging", label: "Imaging" },
  { key: "medications", label: "Medications" },
  { key: "diagnoses", label: "Diagnoses" },
  { key: "visits", label: "Visits" },
  { key: "procedures", label: "Procedures" },
  { key: "allergies", label: "Allergies" },
  { key: "prescriptions", label: "Prescriptions" },
];

const categoryColors = {
  labs: "bg-green-100 text-green-600",
  imaging: "bg-blue-100 text-blue-600",
  medications: "bg-red-100 text-red-600",
  prescriptions: "bg-orange-100 text-orange-600",
  diagnoses: "bg-purple-100 text-purple-600",
  visits: "bg-teal-100 text-teal-600",
  procedures: "bg-yellow-100 text-yellow-600",
  allergies: "bg-pink-100 text-pink-600",
  uncategorized: "bg-zinc-100 text-zinc-600",
};

const Documents = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const params = activeCategory ? { category: activeCategory } : {};
        const { data } = await api.get("/documents", { params });
        setDocuments(data.documents || []);
      } catch (err) {
        console.error("Failed to load documents", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [activeCategory]);

  const handleDelete = async (e, docId) => {
    e.stopPropagation();
    if (!window.confirm("Delete this document?")) return;
    try {
      await api.delete(`/documents/${docId}`);
      setDocuments((prev) => prev.filter((d) => d.document_id !== docId));
    } catch (err) {
      console.error("Failed to delete", err);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-zinc-900 mb-6">Documents</h1>

        <div className="flex items-center gap-2 mb-6 overflow-x-auto scrollbar-hide pb-1">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                activeCategory === cat.key
                  ? "bg-brand-purple text-white"
                  : "bg-white border border-zinc-200 text-zinc-500 hover:border-brand-purple/30"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-brand-purple" />
          </div>
        ) : documents.length === 0 ? (
          <div className="bg-white rounded-2xl border border-zinc-200/80 p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-brand-lavender flex items-center justify-center mx-auto mb-4">
              <FileText size={24} className="text-brand-purple" />
            </div>
            <h3 className="text-base font-semibold text-zinc-900 mb-1">No documents</h3>
            <p className="text-sm text-zinc-400">
              {activeCategory ? `No ${activeCategory} documents found.` : "Upload your first medical record to get started."}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => (
              <div
                key={doc.document_id}
                className="flex items-center justify-between bg-white rounded-2xl border border-zinc-200/80 p-4 hover:border-brand-purple/20 transition-all group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${categoryColors[doc.category] || categoryColors.uncategorized}`}>
                    <FileText size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-900 truncate">{doc.filename}</p>
                    <p className="text-xs text-zinc-400">
                      {formatDate(doc.uploaded_at)}
                      {doc.category && doc.category !== "uncategorized" && (
                        <span> &middot; {doc.category.charAt(0).toUpperCase() + doc.category.slice(1)}</span>
                      )}
                    </p>
                    {doc.summary && <p className="text-xs text-zinc-400 mt-1 line-clamp-1">{doc.summary}</p>}
                  </div>
                </div>
                <button
                  onClick={(e) => handleDelete(e, doc.document_id)}
                  className="p-2 rounded-lg hover:bg-red-50 text-zinc-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default Documents;
