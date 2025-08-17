// src/components/contexts/BlogContext.tsx

import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { BlogPost } from '../../types/blog';

// Supabase row type
export interface SupabasePostRow {
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

  useEffect(() => {
    const loadPosts = async () => {
      const { data, error } = await supabase.from('posts').select('*');
      if (error) return console.error(error);

      if (data) {
        const formatted: BlogPost[] = (data as SupabasePostRow[]).map((item) => ({
          id: item.id.toString(),
          title: item.title,
          excerpt: item.excerpt,
          content: item.content,
          author: item.author,
          date: item.date,
          category: item.category,
          tags: item.tags,
          image: item.image,
          readTime: item.read_time,
          published: item.published,
          contentType: item.content_type,
        }));

        setPosts(formatted.filter((p) => p.contentType === 'post'));
        setUpdates(formatted.filter((p) => p.contentType === 'update'));
      }
    };

    loadPosts();
  }, []);

  const addContent = async (content: Omit<BlogPost, 'id'>) => {
    const user = supabase.auth.getUser ? (await supabase.auth.getUser()).data.user : null;
    if (!user) return console.error('No authenticated user found');

    const { data, error } = await supabase
      .from('posts')
      .insert([
        {
          title: content.title,
          excerpt: content.excerpt,
          content: content.content,
          author: user.id, // automatically use auth.uid()
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

    if (error || !data) return console.error('Insert error:', error);

    const newContent: BlogPost = {
      id: (data as SupabasePostRow).id.toString(),
      title: (data as SupabasePostRow).title,
      excerpt: (data as SupabasePostRow).excerpt,
      content: (data as SupabasePostRow).content,
      author: (data as SupabasePostRow).author,
      date: (data as SupabasePostRow).date,
      category: (data as SupabasePostRow).category,
      tags: (data as SupabasePostRow).tags,
      image: (data as SupabasePostRow).image,
      readTime: (data as SupabasePostRow).read_time,
      published: (data as SupabasePostRow).published,
      contentType: (data as SupabasePostRow).content_type,
    };

    if (newContent.contentType === 'post') setPosts((prev) => [newContent, ...prev]);
    else setUpdates((prev) => [newContent, ...prev]);
  };

  const updateContent = (id: string, updatedContent: Partial<BlogPost>) => {
    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updatedContent } : p)));
    setUpdates((prev) => prev.map((u) => (u.id === id ? { ...u, ...updatedContent } : u)));
  };

  const deleteContent = (id: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== id));
    setUpdates((prev) => prev.filter((u) => u.id !== id));
  };

  const getContent = (id: string) => [...posts, ...updates].find((c) => c.id === id);

  return (
    <BlogContext.Provider
      value={{ posts, updates, addContent, updateContent, deleteContent, getContent }}
    >
      {children}
    </BlogContext.Provider>
  );
};

export const useBlog = () => {
  const context = useContext(BlogContext);
  if (!context) throw new Error('useBlog must be used within a BlogProvider');
  return context;
};
