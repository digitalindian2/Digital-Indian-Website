import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useBlog } from '../components/contexts/BlogContext';
import { useAuth } from '../components/contexts/AuthContext';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Calendar,
  User,
  Tag,
  FileText,
  BarChart3,
  ChevronDown
} from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const { posts, updates, deleteContent, updateContent } = useBlog();
  const { user } = useAuth();
  const [filter, setFilter] = useState<'all' | 'posts' | 'updates'>('all');
  const [isNewContentDropdownOpen, setIsNewContentDropdownOpen] = useState(false);

  const allContent = [...posts, ...updates].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filteredContent = allContent.filter(item => {
    if (filter === 'posts') return item.contentType === 'post';
    if (filter === 'updates') return item.contentType === 'update';
    return true;
  });

  const stats = {
    total: allContent.length,
    posts: posts.length,
    updates: updates.length,
    published: allContent.filter(p => p.published).length,
    drafts: allContent.filter(p => !p.published).length,
  };

  // ✅ CORRECTED: Made function async to await the database update
  const handleTogglePublish = async (contentId: string, currentStatus: boolean) => {
    await updateContent(contentId, { published: !currentStatus });
  };

  // ✅ CORRECTED: Made function async to await the database deletion
  const handleDelete = async (contentId: string) => {
    if (window.confirm('Are you sure you want to delete this content?')) {
      await deleteContent(contentId);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Welcome back, {user?.email}! Manage your blog posts and company updates.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Content</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 bg-indigo-100 dark:bg-indigo-900 rounded-full">
                <BarChart3 className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Blog Posts</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.posts}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 bg-teal-100 dark:bg-teal-900 rounded-full">
                <Tag className="h-6 w-6 text-teal-600 dark:text-teal-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Company Updates</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.updates}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                <Eye className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Published</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.published}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <div className="flex space-x-2 flex-wrap">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                All Content ({stats.total})
              </button>
              <button
                onClick={() => setFilter('posts')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === 'posts'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Posts ({stats.posts})
              </button>
              <button
                onClick={() => setFilter('updates')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === 'updates'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Updates ({stats.updates})
              </button>
            </div>

            <div className="relative">
              <button
                onClick={() => setIsNewContentDropdownOpen(!isNewContentDropdownOpen)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Create New</span>
                <ChevronDown className="h-4 w-4" />
              </button>
              {isNewContentDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-md shadow-lg py-1 z-10">
                  <Link
                    to="/admin/new-post"
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => setIsNewContentDropdownOpen(false)}
                  >
                    New Blog Post
                  </Link>
                  <Link
                    to="/admin/new-update"
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => setIsNewContentDropdownOpen(false)}
                  >
                    New Company Update
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Posts Table and Mobile Cards */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {filter === 'all' && 'All Content'}
              {filter === 'posts' && 'Blog Posts'}
              {filter === 'updates' && 'Company Updates'} ({filteredContent.length})
            </h2>
          </div>

          {filteredContent.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                {filter === 'all' ? 'No content found.' : `No ${filter} found.`}
              </p>
              <Link
                to="/admin/new-post"
                className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create new content
              </Link>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/3">
                        Content
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/6">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/6">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/6">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/6">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredContent.map((content) => (
                      <tr key={content.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4">
                          <div className="flex items-start space-x-4">
                            <img
                              src={content.image}
                              alt={content.title}
                              className="w-16 h-12 object-cover rounded-md flex-shrink-0"
                              width={64}
                              height={48}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {content.title}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                {content.excerpt}
                              </p>
                              <div className="flex items-center space-x-4 mt-1">
                                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                                  <User className="h-3 w-3 mr-1" />
                                  {content.author}
                                </div>
                                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                                  <Tag className="h-3 w-3 mr-1" />
                                  {content.category}
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                           <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              content.contentType === 'post'
                                ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200'
                                : 'bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200'
                            }`}>
                              {content.contentType === 'post' ? 'Post' : 'Update'}
                            </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            content.published
                              ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                              : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                          }`}>
                            {content.published ? (
                              <>
                                <Eye className="h-3 w-3 mr-1" />
                                Published
                              </>
                            ) : (
                              <>
                                <EyeOff className="h-3 w-3 mr-1" />
                                Draft
                              </>
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {new Date(content.date).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <Link
                              to={`/admin/edit-post/${content.id}`}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                            >
                              <Edit className="h-4 w-4" />
                            </Link>
                            <button
                              onClick={() => handleTogglePublish(content.id, content.published)}
                              className={`${
                                content.published
                                  ? 'text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-300'
                                  : 'text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300'
                              }`}
                              title={content.published ? 'Unpublish' : 'Publish'}
                            >
                              {content.published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                            <button
                              onClick={() => handleDelete(content.id)}
                              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-700">
                {filteredContent.map((content) => (
                  <div key={content.id} className="p-4 bg-white dark:bg-gray-800 space-y-2">
                    <div className="flex items-center space-x-4">
                      <img
                        src={content.image}
                        alt={content.title}
                        className="w-16 h-12 object-cover rounded-md flex-shrink-0"
                        width={64}
                        height={48}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {content.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {content.excerpt}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center space-x-2 text-xs">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        content.contentType === 'post'
                          ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200'
                          : 'bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200'
                      }`}>
                        {content.contentType === 'post' ? 'Post' : 'Update'}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        content.published
                          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                          : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                      }`}>
                        {content.published ? (
                          <>
                            <Eye className="h-3 w-3 mr-1" />
                            Published
                          </>
                        ) : (
                          <>
                            <EyeOff className="h-3 w-3 mr-1" />
                            Draft
                          </>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center justify-between space-x-2 mt-2">
                      <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(content.date).toLocaleDateString()}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Link
                          to={`/admin/edit-post/${content.id}`}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleTogglePublish(content.id, content.published)}
                          className={`${
                            content.published
                              ? 'text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-300'
                              : 'text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300'
                          }`}
                          title={content.published ? 'Unpublish' : 'Publish'}
                        >
                          {content.published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => handleDelete(content.id)}
                          className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;