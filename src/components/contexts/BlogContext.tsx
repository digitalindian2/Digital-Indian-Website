// src/components/contexts/BlogContext.tsx

import React, { createContext, useContext, useState, useEffect } from 'react';
import { BlogPost } from '../../types/blog';

// Interface for the context value
interface BlogContextType {
  posts: BlogPost[];
  updates: BlogPost[];
  addContent: (post: Omit<BlogPost, 'id'>) => void;
  updateContent: (id: string, updatedPost: Partial<BlogPost>) => void;
  deleteContent: (id: string) => void;
  getContent: (id: string) => BlogPost | undefined;
}

// Initial mock data with a new 'contentType' field
const initialContent: BlogPost[] = [
  {
    id: '1',
    title: '5G Network Deployment: Challenges and Opportunities',
    excerpt: 'Exploring the key challenges and emerging opportunities in 5G network deployment for telecom operators.',
    content: `
      <h2>Introduction</h2>
      <p>The deployment of 5G networks represents one of the most significant technological advances in telecommunications. This comprehensive analysis explores the multifaceted challenges and unprecedented opportunities that telecom operators face in this transformative journey.</p>
      
      <h2>Key Challenges</h2>
      <p>Infrastructure requirements for 5G networks are substantially more complex than previous generations. The need for dense small cell deployments, fiber backhaul, and edge computing capabilities presents significant logistical and financial challenges.</p>
      
      <h2>Emerging Opportunities</h2>
      <p>Despite the challenges, 5G opens doors to revolutionary applications including IoT ecosystems, autonomous vehicles, and immersive AR/VR experiences that will reshape industries.</p>
      
      <h2>Conclusion</h2>
      <p>Success in 5G deployment requires strategic planning, substantial investment, and innovative approaches to network architecture and service delivery.</p>
    `,
    author: 'Sarah Chen',
    date: '2025-01-15',
    category: 'Telecommunications',
    tags: ['5G', 'Network Infrastructure', 'Telecom'],
    image: 'https://images.pexels.com/photos/5483077/pexels-photo-5483077.jpeg?auto=compress&cs=tinysrgb&w=600',
    readTime: '5 min read',
    published: true,
    contentType: 'post'
  },
  {
    id: '2',
    title: 'GIS Solutions for Smart City Development',
    excerpt: 'How geospatial technologies are transforming urban planning and smart city initiatives worldwide.',
    content: `
      <h2>The Role of GIS in Smart Cities</h2>
      <p>Geographic Information Systems (GIS) serve as the backbone of modern smart city initiatives, providing the spatial intelligence needed for effective urban planning and management.</p>
      
      <h2>Key Applications</h2>
      <p>From traffic optimization to utility management, GIS technologies enable cities to make data-driven decisions that improve quality of life for residents while optimizing resource allocation.</p>
      
      <h2>Future Trends</h2>
      <p>The integration of AI and machine learning with GIS platforms is opening new possibilities for predictive analytics and automated urban management systems.</p>
    `,
    author: 'Michael Rodriguez',
    date: '2025-01-10',
    category: 'GIS & Geospatial',
    tags: ['Smart Cities', 'Urban Planning', 'GIS'],
    image: 'https://images.pexels.com/photos/1036936/pexels-photo-1036936.jpeg?auto=compress&cs=tinysrgb&w=600',
    readTime: '7 min read',
    published: true,
    contentType: 'post'
  },
  // Initial company updates
  {
    id: 'update-1',
    title: 'TechSolutions Expands Operations to New Markets',
    excerpt: 'We\'re excited to announce our expansion into three new regional markets, bringing our technology solutions to more businesses.',
    content: '',
    author: 'Admin',
    date: '2025-01-20',
    category: 'Company Update',
    tags: ['company update', 'expansion'],
    image: 'https://images.pexels.com/photos/3184325/pexels-photo-3184325.jpeg?auto=compress&cs=tinysrgb&w=800',
    readTime: '',
    published: true,
    contentType: 'update'
  },
  {
    id: 'update-2',
    title: 'New GIS Training Center Opens',
    excerpt: 'Our state-of-the-art training facility is now operational, offering advanced GIS and geospatial analytics courses.',
    content: '',
    author: 'Admin',
    date: '2025-01-10',
    category: 'Company Update',
    tags: ['company update', 'training'],
    image: 'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=800',
    readTime: '',
    published: true,
    contentType: 'update'
  }
];

const BlogContext = createContext<BlogContextType | undefined>(undefined);

export const BlogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [updates, setUpdates] = useState<BlogPost[]>([]);

  useEffect(() => {
    const savedContent = localStorage.getItem('blogContent');
    if (savedContent) {
      const allContent = JSON.parse(savedContent);
      setPosts(allContent.filter((item: BlogPost) => item.contentType === 'post'));
      setUpdates(allContent.filter((item: BlogPost) => item.contentType === 'update'));
    } else {
      setPosts(initialContent.filter(item => item.contentType === 'post'));
      setUpdates(initialContent.filter(item => item.contentType === 'update'));
      localStorage.setItem('blogContent', JSON.stringify(initialContent));
    }
  }, []);

  const saveContent = (newPosts: BlogPost[], newUpdates: BlogPost[]) => {
    setPosts(newPosts);
    setUpdates(newUpdates);
    localStorage.setItem('blogContent', JSON.stringify([...newPosts, ...newUpdates]));
  };

  const addContent = (content: Omit<BlogPost, 'id'>) => {
    const newContent: BlogPost = {
      ...content,
      id: `${content.contentType}-${Date.now()}`,
    };
    if (newContent.contentType === 'post') {
      const newPosts = [newContent, ...posts];
      saveContent(newPosts, updates);
    } else {
      const newUpdates = [newContent, ...updates];
      saveContent(posts, newUpdates);
    }
  };

  const updateContent = (id: string, updatedContent: Partial<BlogPost>) => {
    const allContent = [...posts, ...updates];
    const updatedAllContent = allContent.map(item =>
      item.id === id ? { ...item, ...updatedContent } : item
    );
    
    const newPosts = updatedAllContent.filter(item => item.contentType === 'post');
    const newUpdates = updatedAllContent.filter(item => item.contentType === 'update');
    
    saveContent(newPosts, newUpdates);
  };

  const deleteContent = (id: string) => {
    const allContent = [...posts, ...updates];
    const newAllContent = allContent.filter(item => item.id !== id);

    const newPosts = newAllContent.filter(item => item.contentType === 'post');
    const newUpdates = newAllContent.filter(item => item.contentType === 'update');

    saveContent(newPosts, newUpdates);
  };

  const getContent = (id: string) => {
    const allContent = [...posts, ...updates];
    return allContent.find(content => content.id === id);
  };

  const value: BlogContextType = {
    posts,
    updates,
    addContent,
    updateContent,
    deleteContent,
    getContent
  };

  return (
    <BlogContext.Provider value={value}>
      {children}
    </BlogContext.Provider>
  );
};

export const useBlog = () => {
  const context = useContext(BlogContext);
  if (context === undefined) {
    throw new Error('useBlog must be used within a BlogProvider');
  }
  return context;
};
