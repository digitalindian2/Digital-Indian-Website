/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../../supabaseClient';
import { BlogPost } from '../../types/blog';

// This interface should match the columns in your Supabase 'posts' table
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

interface BlogContextType {
  posts: BlogPost[];
  updates: BlogPost[];
  addContent: (post: Omit<BlogPost, 'id'>) => Promise<void>;
  updateContent: (id: string, updatedPost: Partial<Omit<BlogPost, 'id'>>) => Promise<void>;
  deleteContent: (id: string) => Promise<void>;
  getContent: (id: string) => BlogPost | undefined;
}

const BlogContext = createContext<BlogContextType | undefined>(undefined);

export const BlogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [updates, setUpdates] = useState<BlogPost[]>([]);

  // Function to fetch and format data from Supabase
  const loadContent = async () => {
    const { data, error } = await supabase.from('posts').select('*').order('date', { ascending: false });
    if (error) {
      console.error("Error loading content:", error);
      return;
    }

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
      
      setPosts(formatted.filter(item => item.contentType === 'post'));
      setUpdates(formatted.filter(item => item.contentType === 'update'));
    }
  };

  useEffect(() => {
    loadContent();
  }, []);

  const addContent = async (contentData: Omit<BlogPost, 'id'>) => {
    const { error } = await supabase.from('posts').insert([
      {
        title: contentData.title,
        excerpt: contentData.excerpt,
        content: contentData.content,
        author: contentData.author,
        date: contentData.date,
        category: contentData.category,
        tags: contentData.tags,
        image: contentData.image,
        read_time: contentData.readTime,
        published: contentData.published,
        content_type: contentData.contentType,
      },
    ]);
    if (error) {
      console.error("Error adding content:", error);
    } else {
      await loadContent(); // Refresh local state from DB
    }
  };

  const updateContent = async (id: string, updatedContent: Partial<BlogPost>) => {
    const { error } = await supabase
      .from('posts')
      .update({
        title: updatedContent.title,
        excerpt: updatedContent.excerpt,
        content: updatedContent.content,
        author: updatedContent.author,
        date: updatedContent.date,
        category: updatedContent.category,
        tags: updatedContent.tags,
        image: updatedContent.image,
        read_time: updatedContent.readTime,
        published: updatedContent.published,
        content_type: updatedContent.contentType,
      })
      .eq('id', id);

    if (error) {
      console.error("Error updating content:", error);
    } else {
      await loadContent(); // Refresh local state from DB
    }
  };

  const deleteContent = async (id: string) => {
    const { error } = await supabase.from('posts').delete().eq('id', id);
    if (error) {
      console.error("Error deleting content:", error);
    } else {
      await loadContent(); // Refresh local state from DB
    }
  };

  const getContent = (id: string): BlogPost | undefined => {
    return [...posts, ...updates].find((c) => c.id === id);
  };

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
  if (!context) {
    throw new Error('useBlog must be used within a BlogProvider');
  }
  return context;
};
