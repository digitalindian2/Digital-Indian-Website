import { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./components/contexts/AuthContext";
import { BlogProvider } from "./components/contexts/BlogContext";

import Header from "./components/Header";
import Footer from "./components/Footer";
import Chatbot from "./components/Chatbot";

// Lazy-load all pages and protected route
const Home = lazy(() => import("./pages/Home"));
const About = lazy(() => import("./pages/About"));
const Services = lazy(() => import("./pages/Services"));
const Industries = lazy(() => import("./pages/Industries"));
const Contact = lazy(() => import("./pages/Contact"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const Login = lazy(() => import("./pages/Login"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const PostEditor = lazy(() => import("./pages/PostEditor"));
const ProtectedRoute = lazy(() => import("./components/ProtectedRoute"));

function App() {
  return (
    <AuthProvider>
      <BlogProvider>
        <Router>
          <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-500">
            <Header />

            <Suspense fallback={<div className="text-center p-10">Loading...</div>}>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/services" element={<Services />} />
                <Route path="/industries" element={<Industries />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/:id" element={<BlogPost />} />
                <Route path="/login" element={<Login />} />

                {/* Admin Routes */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute requireAdmin>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/new-post"
                  element={
                    <ProtectedRoute requireAdmin>
                      <PostEditor />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/new-update"
                  element={
                    <ProtectedRoute requireAdmin>
                      <PostEditor />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/edit-post/:id"
                  element={
                    <ProtectedRoute requireAdmin>
                      <PostEditor />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </Suspense>

            <Footer />
            <Chatbot />
          </div>
        </Router>
      </BlogProvider>
    </AuthProvider>
  );
}

export default App;
