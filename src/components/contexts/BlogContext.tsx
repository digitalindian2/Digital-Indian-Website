// src/components/contexts/BlogContext.tsx

import React, { createContext, useContext, useState, useEffect } from 'react';
import { BlogPost } from '../../types/blog';
import { supabase } from '../../supabaseClient'; // ✅ make sure this exists

// Supabase row type (snake_case)
interface SupabasePostRow {
  id: number;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  date: string;
  category: string;
  tags: string[];
  image: string;
  read_time: string;
  published: boolean;
  content_type: 'post' | 'update';
}

// Context type
interface BlogContextType {
  posts: BlogPost[];
  updates: BlogPost[];
  addContent: (post: Omit<BlogPost, 'id'>) => Promise<void>;
  updateContent: (id: string, updatedPost: Partial<BlogPost>) => void;
  deleteContent: (id: string) => void;
  getContent: (id: string) => BlogPost | undefined;
}

const BlogContext = createContext<BlogContextType | undefined>(undefined);

export const BlogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [updates, setUpdates] = useState<BlogPost[]>([]);

  // Load posts from Supabase
  useEffect(() => {
    const loadPosts = async () => {
      const { data, error } = await supabase.from('posts').select('*');
      if (error) {
        console.error('❌ Supabase fetch error:', error);
        return;
      }
      if (data) {
        const formatted = (data as SupabasePostRow[]).map((item) => ({
          ...item,
          id: item.id.toString(),
          readTime: item.read_time,
          contentType: item.content_type,
        }));

        setPosts(formatted.filter((p) => p.contentType === 'post'));
        setUpdates(formatted.filter((p) => p.contentType === 'update'));
      }
    };

    loadPosts();
  }, []);

  // Save new content
  const addContent = async (content: Omit<BlogPost, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .insert([
          {
            title: content.title,
            excerpt: content.excerpt,
            content: content.content,
            author: content.author,
            date: content.date,
            category: content.category,
            tags: content.tags,
            image: content.image,
            read_time: content.readTime,
            published: content.published,
            content_type: content.contentType,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase insert error:', error);
        return;
      }

      const newContent: BlogPost = {
        ...data,
        id: data.id.toString(),
        readTime: data.read_time,
        contentType: data.content_type,
      };

      if (newContent.contentType === 'post') {
        setPosts((prev) => [newContent, ...prev]);

        // 🔔 Notify subscribers
        if (newContent.published) {
          fetch('/api/notify-subscribers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: newContent.title,
              excerpt: newContent.excerpt,
              link: `${window.location.origin}/blog/${newContent.id}`,
            }),
          }).catch((err) => console.error('Notification error:', err));
        }
      } else {
        setUpdates((prev) => [newContent, ...prev]);
      }
    } catch (err) {
      console.error('❌ addContent failed:', err);
    }
  };

  const updateContent = (id: string, updatedContent: Partial<BlogPost>) => {
    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updatedContent } : p)));
    setUpdates((prev) => prev.map((u) => (u.id === id ? { ...u, ...updatedContent } : u)));
  };

  const deleteContent = (id: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== id));
    setUpdates((prev) => prev.filter((u) => u.id !== id));
  };

  const getContent = (id: string) => {
    return [...posts, ...updates].find((c) => c.id === id);
  };

  const value: BlogContextType = {
    posts,
    updates,
    addContent,
    updateContent,
    deleteContent,
    getContent,
  };

  return <BlogContext.Provider value={value}>{children}</BlogContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useBlog = () => {
  const context = useContext(BlogContext);
  if (context === undefined) {
    throw new Error('useBlog must be used within a BlogProvider');
  }
  return context;
};
