// src/components/contexts/BlogContext.tsx

import React, { createContext, useContext, useState, useEffect } from 'react';
import { BlogPost } from '../../types/blog';

interface BlogContextType {
  posts: BlogPost[];
  updates: BlogPost[];
  addContent: (post: Omit<BlogPost, 'id'>) => void;
  updateContent: (id: string, updatedPost: Partial<BlogPost>) => void;
  deleteContent: (id: string) => void;
  getContent: (id: string) => BlogPost | undefined;
}

const initialContent: BlogPost[] = [
  // ... your initial mock data (same as before)
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

  const addContent = async (content: Omit<BlogPost, 'id'>) => {
    const newContent: BlogPost = {
      ...content,
      id: `${content.contentType}-${Date.now()}`,
    };

    if (newContent.contentType === 'post') {
      const newPosts = [newContent, ...posts];
      saveContent(newPosts, updates);

      // 🔔 Notify subscribers only if published
      if (newContent.published) {
        try {
          await fetch('/api/notify-subscribers', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              title: newContent.title,
              excerpt: newContent.excerpt,
              link: `${window.location.origin}/blog/${newContent.id}`,
            }),
          });
        } catch (err) {
          console.error('Notification error:', err);
        }
      }
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
