import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useBlog } from '../components/contexts/BlogContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Calendar, User, ArrowRight, Tag } from 'lucide-react';

// Define the type for a blog post
interface BlogPostType {
  id: string;
  published: boolean;
  image: string;
  title: string;
  author: string;
  date: string;
  readTime: string;
  excerpt: string;
  tags: string[];
  category: string;
}

const Blog = () => {
  const { posts, updates } = useBlog();
  
  // Filter for published posts and updates
  const publishedPosts: BlogPostType[] = posts.filter((post: BlogPostType) => post.published);
  const publishedUpdates: BlogPostType[] = updates.filter((update: BlogPostType) => update.published);

  const categories = [
    'All Posts',
    'Telecommunications',
    'GIS & Geospatial',
    'Infrastructure',
    'Training & Development',
    'Business Development'
  ];

  const [selectedCategory, setSelectedCategory] = useState('All Posts');
  
  // State for the subscription form
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle the subscription form submission
  const handleSubscribe = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setIsSubmitting(true);
      setMessage('');

      try {
          // Send the email to the API endpoint
          const response = await fetch('/api/subscribe', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify({ email }),
          });

          const data = await response.json();
          setMessage(data.message);
          
          if (response.ok) {
              setEmail(''); // Clear the input on success
          }
      } catch (error) {
          console.error('Failed to subscribe:', error);
          setMessage('An error occurred. Please try again.');
      } finally {
          setIsSubmitting(false);
      }
  };

  const filteredPosts = selectedCategory === 'All Posts' 
    ? publishedPosts 
    : publishedPosts.filter((post: BlogPostType) => post.category === selectedCategory);

  return (
    <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-200 transition-colors duration-500">
      <Header />
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-900 to-blue-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl font-bold mb-6">
              News & Insights
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Stay updated with the latest industry trends, technology insights, 
              and company updates from our team of experts.
            </p>
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="py-8 bg-white dark:bg-gray-900 border-b dark:border-gray-700 transition-colors duration-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Blog Posts */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800 transition-colors duration-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post: BlogPostType) => (
              <article key={post.id} className="bg-white dark:bg-gray-900 rounded-lg shadow-md overflow-hidden hover:shadow-xl dark:hover:shadow-lg transition-shadow group">
                <div className="relative overflow-hidden">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    width={400}
                    height={200}
                  />
                  <div className="absolute top-4 left-4">
                    <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                      {post.category}
                    </span>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-3">
                    <User className="h-4 w-4 mr-1" />
                    <span className="mr-4">{post.author}</span>
                    <Calendar className="h-4 w-4 mr-1" />
                    <span className="mr-4">{new Date(post.date).toLocaleDateString()}</span>
                    <span>{post.readTime}</span>
                  </div>
                  
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {post.title}
                  </h2>
                  
                  <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                    {post.excerpt}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Tag className="h-4 w-4 text-gray-400" />
                      <div className="flex flex-wrap gap-1">
                        {post.tags.slice(0, 2).map((tag: string) => (
                          <span key={tag} className="text-xs text-blue-600 dark:text-blue-200 bg-blue-50 dark:bg-blue-800 px-2 py-1 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <Link 
                      to={`/blog/${post.id}`}
                      className="mt-2 text-blue-600 dark:text-blue-400 font-medium hover:text-blue-800 dark:hover:text-blue-500 transition-colors flex items-center w-fit"
                    >
                      Read More
                      <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {filteredPosts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400 text-lg">No posts found in this category.</p>
            </div>
          )}
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="py-16 bg-blue-600 text-white dark:bg-blue-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Stay Updated
          </h2>
          <p className="text-xl text-blue-100 dark:text-blue-200 mb-8 max-w-2xl mx-auto">
            Subscribe to our newsletter to receive the latest industry insights, 
            technology updates, and company news directly in your inbox.
          </p>
          
          <div className="max-w-md mx-auto">
            <form onSubmit={handleSubscribe} className="flex">
              <input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1 px-4 py-3 rounded-l-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-800 dark:text-white"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-orange-500 text-white px-6 py-3 rounded-r-lg font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Subscribing...' : 'Subscribe'}
              </button>
            </form>
            {message && (
                <p className="text-center mt-4 text-sm font-medium"
                   style={{ color: message.includes('success') ? 'green' : 'red' }}>
                    {message}
                </p>
            )}
            <p className="text-blue-100 dark:text-blue-200 text-sm mt-2">
              We respect your privacy. Unsubscribe at any time.
            </p>
          </div>
        </div>
      </section>

      {/* Dynamic Company Updates */}
      <section className="py-16 bg-white dark:bg-gray-900 transition-colors duration-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Company Updates
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Latest news and announcements from Digital Indian.
            </p>
          </div>

          <div className="space-y-6">
            {publishedUpdates.length > 0 ? (
              publishedUpdates.map((update: BlogPostType, index: number) => (
                <div key={index} className="border-l-4 border-blue-600 dark:border-blue-400 pl-6 py-4">
                  <div className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-1">
                    {new Date(update.date).toLocaleDateString()}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {update.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {update.excerpt}
                  </p>
                  <Link
                    to={`/blog/${update.id}`}
                    className="mt-2 text-blue-600 dark:text-blue-400 font-medium hover:text-blue-800 dark:hover:text-blue-500 transition-colors flex items-center w-fit"
                  >
                    Read More
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 dark:text-gray-400">
                No company updates available.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gray-900 text-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-6">
            Have a Story to Share?
          </h2>
          <p className="text-xl text-gray-300 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
            We'd love to hear about your technology challenges and success stories. 
            Contact us to explore collaboration opportunities or guest posting.
          </p>
          <Link
            to="/contact"
            className="bg-orange-500 text-white px-8 py-4 rounded-lg font-semibold hover:bg-orange-600 transition-colors inline-flex items-center"
          >
            Get in Touch
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default Blog;
