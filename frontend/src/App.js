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
import Legal from "./pages/Legal";
import AdminLogin from "./pages/AdminLogin";
import AdminNews from "./pages/AdminNews";

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Toaster position="top-center" richColors />
        <Routes>
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
          <Route path="/privacy" element={<Legal kind="privacy" />} />
          <Route path="/terms" element={<Legal kind="terms" />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/news" element={<AdminNews />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
