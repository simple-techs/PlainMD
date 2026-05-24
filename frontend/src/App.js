import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AuthCallback from "./pages/AuthCallback";
import Home from "./pages/Home";
import Chat from "./pages/Chat";
import Conversations from "./pages/Conversations";
import Documents from "./pages/Documents";
import Insights from "./pages/Insights";
import Settings from "./pages/Settings";

const AppRouter = () => (
  <Routes>
    <Route path="/" element={<Landing />} />
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/auth/callback" element={<AuthCallback />} />
    <Route path="/app/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
    <Route path="/app/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
    <Route path="/app/chat/:conversationId" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
    <Route path="/app/conversations" element={<ProtectedRoute><Conversations /></ProtectedRoute>} />
    <Route path="/app/documents" element={<ProtectedRoute><Documents /></ProtectedRoute>} />
    <Route path="/app/insights" element={<ProtectedRoute><Insights /></ProtectedRoute>} />
    <Route path="/app/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AuthProvider>
          <AppRouter />
          <Toaster position="top-center" richColors closeButton />
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
