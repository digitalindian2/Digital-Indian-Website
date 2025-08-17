import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useBlog } from '../components/contexts/BlogContext';
import { useAuth } from '../components/contexts/AuthContext';
import { Save, Eye, ArrowLeft, Image, Tag, CheckCircle } from 'lucide-react';
import { BlogPost } from '../types/blog';

const PostEditor: React.FC = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { addContent, updateContent, getContent } = useBlog();
  const { user } = useAuth();
  
  const isEditing = !!id;
  const existingContent = isEditing ? getContent(id) : null;
  const isNewUpdate = location.pathname === '/admin/new-update';

  const [formData, setFormData] = useState<Omit<BlogPost, 'id'>>({
    title: '',
    excerpt: '',
    content: '',
    author: user?.email || 'Admin',
    category: 'Telecommunications',
    tags: [],
    image: '',
    readTime: '5 min read',
    published: false,
    contentType: isNewUpdate ? 'update' : 'post',
    date: new Date().toISOString().split('T')[0]
  });

  const [tagsInput, setTagsInput] = useState('');
  const [preview, setPreview] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (existingContent) {
      setFormData(existingContent);
      setTagsInput(existingContent.tags ? existingContent.tags.join(', ') : '');
    } else if (isNewUpdate) {
      setFormData(prev => ({
        ...prev,
        contentType: 'update',
        category: 'Company Update',
        readTime: '',
        tags: ['company update'],
        image: 'https://images.pexels.com/photos/3184325/pexels-photo-3184325.jpeg?auto=compress&cs=tinysrgb&w=800'
      }));
      setTagsInput('company update');
    } else {
      setFormData(prev => ({
        ...prev,
        contentType: 'post',
        category: 'Telecommunications',
        readTime: '5 min read',
        tags: [],
        image: ''
      }));
      setTagsInput('');
    }
  }, [existingContent, isNewUpdate]);

  const categories = [
    'Telecommunications',
    'GIS & Geospatial',
    'Infrastructure',
    'Training & Development',
    'Business Development',
    'Technology',
    'Industry News'
  ];

  const handleSubmit = async (e: React.FormEvent, publish = false) => {
    e.preventDefault();
    
    // ✅ ADDED: A null check to ensure 'user' exists before accessing its 'id' property.
    if (!user) {
        console.error("User not authenticated. Cannot submit content.");
        return;
    }
    
    const tagsArray = tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag);
    
    // ✅ CORRECTED: The keys now match the camelCase format of BlogPost type.
    const contentData = {
        ...formData,
        tags: tagsArray,
        date: existingContent?.date || new Date().toISOString().split('T')[0],
        published: publish || formData.published,
        author_id: user.id // Pass the user's ID for RLS
    };

    if (isEditing && existingContent) {
      await updateContent(existingContent.id, contentData);
      setSuccessMessage('Content updated successfully!');
    } else {
      await addContent(contentData);
      setSuccessMessage('New content created successfully!');
    }

    setTimeout(() => {
      setSuccessMessage('');
      navigate('/admin');
    }, 2000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };
  
  const handleContentTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newContentType = e.target.value as 'post' | 'update';
    
    setFormData(prev => ({
      ...prev,
      contentType: newContentType,
      category: newContentType === 'update' ? 'Company Update' : 'Telecommunications',
      readTime: newContentType === 'update' ? '' : '5 min read',
      tags: newContentType === 'update' ? ['company update'] : []
    }));

    setTagsInput(newContentType === 'update' ? 'company update' : '');
  };

  if (preview) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6 flex items-center justify-between">
            <button
              onClick={() => setPreview(false)}
              className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Editor</span>
            </button>
            <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm">
              Preview Mode
            </span>
          </div>

          <article className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            <img
              src={formData.image || 'https://placehold.co/800x400/292524/white?text=No+Image'}
              alt={formData.title}
              className="w-full h-64 object-cover"
            />
            <div className="p-8">
              <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full">
                  {formData.category}
                </span>
                <span>{formData.author}</span>
                <span>{new Date().toLocaleDateString()}</span>
                {formData.readTime && <span>{formData.readTime}</span>}
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                {formData.title || 'Untitled Post'}
              </h1>
              
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
                {formData.excerpt}
              </p>
              
              <div className="prose dark:prose-invert max-w-none">
                <div dangerouslySetInnerHTML={{ __html: formData.content }} />
              </div>
              
              {Array.isArray(formData.tags) && formData.tags.length > 0 && (
                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-2">
                    <Tag className="h-4 w-4 text-gray-400" />
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag, index) => (
                          <span key={index} className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded text-sm">
                            {tag}
                          </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </article>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/admin')}
              className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isEditing ? 'Edit Content' : 'Create New Content'}
            </h1>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => setPreview(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              <Eye className="h-4 w-4" />
              <span>Preview</span>
            </button>
          </div>
        </div>
        
        {successMessage && (
          <div className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-4 py-3 rounded-md mb-6 flex items-center space-x-2">
            <CheckCircle className="h-5 w-5" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={(e) => handleSubmit(e, true)} className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Content Type Selector */}
              {!isEditing && (
                <div>
                  <label htmlFor="contentType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Content Type *
                  </label>
                  <select
                    id="contentType"
                    name="contentType"
                    required
                    value={formData.contentType}
                    onChange={handleContentTypeChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="post">Blog Post</option>
                    <option value="update">Company Update</option>
                  </select>
                </div>
              )}

              <div className="md:col-span-2">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter content title"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Excerpt *
                </label>
                <textarea
                  id="excerpt"
                  name="excerpt"
                  required
                  rows={3}
                  value={formData.excerpt}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Brief description of the post"
                />
              </div>

              <div>
                <label htmlFor="author" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Author
                </label>
                <input
                  type="text"
                  id="author"
                  name="author"
                  value={formData.author}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Only show category for posts */}
              {formData.contentType === 'post' && (
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
              )}
              
              {/* Only show tags for posts */}
              {formData.contentType === 'post' && (
                <div>
                  <label htmlFor="tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    id="tags"
                    name="tags"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="e.g., Technology, Innovation, 5G"
                  />
                </div>
              )}
              
              {/* Only show read time for posts */}
              {formData.contentType === 'post' && (
                <div>
                  <label htmlFor="readTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Read Time
                  </label>
                  <input
                    type="text"
                    id="readTime"
                    name="readTime"
                    value={formData.readTime}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="e.g., 5 min read"
                  />
                </div>
              )}
              
              <div className="md:col-span-2">
                <label htmlFor="image" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Featured Image URL
                </label>
                <div className="flex">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Image className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="url"
                      id="image"
                      name="image"
                      value={formData.image}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="https://images.pexels.com/..."
                    />
                  </div>
                </div>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Use high-quality images from Pexels or other free stock photo sites
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Content *
            </label>
            <textarea
              id="content"
              name="content"
              required
              rows={20}
              value={formData.content}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white font-mono text-sm"
              placeholder="Write your post content here. You can use HTML tags for formatting."
            />
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              You can use HTML tags like &lt;h2&gt;, &lt;p&gt;, &lt;strong&gt;, &lt;em&gt;, &lt;ul&gt;, &lt;li&gt;, etc.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="published"
                    checked={formData.published}
                    onChange={handleInputChange}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Publish immediately
                  </span>
                </label>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  type="submit"
                  className="flex items-center space-x-2 px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  <Save className="h-4 w-4" />
                  <span>Save as Draft</span>
                </button>
                
                <button
                  type="button"
                  onClick={(e) => handleSubmit(e, true)}
                  className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Eye className="h-4 w-4" />
                  <span>{isEditing ? 'Update & Publish' : 'Publish Content'}</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PostEditor;