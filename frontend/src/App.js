import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { AppProvider } from "./context/AppContext";
import Home from "./pages/Home";
import About from "./pages/About";
import Services from "./pages/Services";
import BallastWaterTesting from "./pages/BallastWaterTesting";
import Standards from "./pages/Standards";
import Industries from "./pages/Industries";
import FAQ from "./pages/FAQ";
import News from "./pages/News";
import NewsArticle from "./pages/NewsArticle";
import Contact from "./pages/Contact";
import Careers from "./pages/Careers";
import Legal from "./pages/Legal";
import AdminLogin from "./pages/AdminLogin";
import { ForgotPassword, ResetPassword } from "./pages/PasswordFlow";
import AdminLayout from "./admin/AdminLayout";
import AdminDashboard from "./admin/AdminDashboard";
import GenericCMSManager from "./admin/GenericCMSManager";
import MediaLibrary from "./admin/MediaLibrary";
import SettingsManager from "./admin/SettingsManager";
import UsersManager from "./admin/UsersManager";
import AuditLog from "./admin/AuditLog";
import RequestsView from "./admin/RequestsView";
import AdminNews from "./pages/AdminNews";
import NotFound from "./pages/NotFound";

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Toaster position="top-center" richColors />
        <Routes>
          {/* Public site */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/services" element={<Services />} />
          <Route path="/ballast-water-testing" element={<BallastWaterTesting />} />
          <Route path="/standards" element={<Standards />} />
          <Route path="/industries" element={<Industries />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/news" element={<News />} />
          <Route path="/news/:slug" element={<NewsArticle />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/careers" element={<Careers />} />
          <Route path="/privacy" element={<Legal kind="privacy" />} />
          <Route path="/terms" element={<Legal kind="terms" />} />

          {/* Admin auth */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/forgot-password" element={<ForgotPassword />} />
          <Route path="/admin/reset-password" element={<ResetPassword />} />

          {/* Admin CMS (nested under AdminLayout) */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="service" element={<GenericCMSManager typeOverride="service" />} />
            <Route path="team_member" element={<GenericCMSManager typeOverride="team_member" />} />
            <Route path="client" element={<GenericCMSManager typeOverride="client" />} />
            <Route path="testimonial" element={<GenericCMSManager typeOverride="testimonial" />} />
            <Route path="faq" element={<GenericCMSManager typeOverride="faq" />} />
            <Route path="homepage_section" element={<GenericCMSManager typeOverride="homepage_section" />} />
            <Route path="news" element={<AdminNews />} />
            <Route path="media" element={<MediaLibrary />} />
            <Route path="settings" element={<SettingsManager />} />
            <Route path="users" element={<UsersManager />} />
            <Route path="audit" element={<AuditLog />} />
            <Route path="contact-requests" element={<RequestsView kind="contact" />} />
            <Route path="careers-applications" element={<RequestsView kind="careers" />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
