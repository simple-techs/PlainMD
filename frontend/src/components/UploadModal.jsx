import React, { useCallback, useState } from "react";
import { X, Upload, FileText, Image, File, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

const UploadModal = ({ onClose }) => {
  const navigate = useNavigate();
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = e.dataTransfer?.files;
    if (files && files[0]) {
      setSelectedFile(files[0]);
      setError("");
    }
  }, []);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError("");
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const { data } = await api.post("/documents/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      onClose();
      if (data.conversation_id) {
        navigate(`/app/chat/${data.conversation_id}`);
      }
    } catch (err) {
      const msg = err.response?.data?.detail || "Upload failed. Please try again.";
      setError(msg);
    } finally {
      setUploading(false);
    }
  };

  const getFileIcon = () => {
    if (!selectedFile) return <Upload size={40} />;
    const type = selectedFile.type || "";
    if (type.includes("pdf")) return <FileText size={40} />;
    if (type.includes("image")) return <Image size={40} />;
    return <File size={40} />;
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-fade-in-up">
        <div className="flex items-center justify-between p-5 border-b border-zinc-100">
          <h2 className="text-lg font-semibold text-zinc-900">Upload Medical Records</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-100 transition-colors">
            <X size={20} className="text-zinc-400" />
          </button>
        </div>

        <div className="p-5">
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
              dragActive
                ? "border-brand-purple bg-brand-lavender/30"
                : selectedFile
                ? "border-brand-purple/30 bg-brand-lavender/10"
                : "border-zinc-200 hover:border-zinc-300 bg-zinc-50/50"
            }`}
          >
            <div className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${
              selectedFile ? "bg-brand-lavender text-brand-purple" : "bg-zinc-100 text-zinc-400"
            }`}>
              {getFileIcon()}
            </div>

            {selectedFile ? (
              <div>
                <p className="text-sm font-medium text-zinc-900">{selectedFile.name}</p>
                <p className="text-xs text-zinc-500 mt-1">{formatFileSize(selectedFile.size)}</p>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="mt-3 text-xs text-brand-purple hover:underline"
                >
                  Choose different file
                </button>
              </div>
            ) : (
              <div>
                <p className="text-sm font-medium text-zinc-700">
                  Drag and drop your medical document here
                </p>
                <p className="text-xs text-zinc-400 mt-1">or click to browse</p>
                <p className="text-xs text-zinc-400 mt-3">
                  Supports PDF, images (PNG, JPG), and text files up to 20MB
                </p>
              </div>
            )}

            <input
              type="file"
              onChange={handleFileSelect}
              accept=".pdf,.png,.jpg,.jpeg,.webp,.txt"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>

          {error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="mt-4 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl border border-zinc-200 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="flex-1 py-2.5 px-4 rounded-xl bg-brand-purple text-white text-sm font-medium hover:bg-brand-purple-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Processing...
                </>
              ) : (
                "Upload & Analyze"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadModal;
