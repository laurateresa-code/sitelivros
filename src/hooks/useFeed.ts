import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Post } from '@/types';
import { useAuth } from './useAuth';

export function useFeed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    
    try {
      const { data: postsData, error } = await supabase
        .from('posts')
        .select(`
          *,
          profile:profiles!posts_profiles_fk (
            id,
            user_id,
            username,
            display_name,
            avatar_url,
            is_reading_now,
            reader_level
          ),
          book:books (
            id,
            title,
            author,
            cover_url
          ),
          reading_session:reading_sessions (
            id,
            pages_read,
            duration_minutes,
            notes
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Check which posts are liked by the current user
      let likedPostIds: string[] = [];
      if (user) {
        const { data: likes } = await supabase
          .from('likes')
          .select('post_id')
          .eq('user_id', user.id);
        
        likedPostIds = likes?.map(l => l.post_id) || [];
      }

      const formattedPosts = (postsData || []).map(post => {
        // Helper to handle single relation returned as array or object
        const getSingle = (val: any) => Array.isArray(val) ? val[0] : val;

        return {
          ...post,
          profile: getSingle(post.profile),
          book: getSingle(post.book),
          reading_session: getSingle(post.reading_session),
          liked_by_user: likedPostIds.includes(post.id),
        };
      }) as Post[];

      setPosts(formattedPosts);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Real-time updates
  useEffect(() => {
    const channel = supabase
      .channel('posts-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'posts' },
        () => {
          fetchPosts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPosts]);

  const likePost = async (postId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('likes')
      .insert({ user_id: user.id, post_id: postId });

    if (!error) {
      setPosts(prev => prev.map(post =>
        post.id === postId
          ? { ...post, likes_count: post.likes_count + 1, liked_by_user: true }
          : post
      ));
    }
  };

  const unlikePost = async (postId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('likes')
      .delete()
      .eq('user_id', user.id)
      .eq('post_id', postId);

    if (!error) {
      setPosts(prev => prev.map(post =>
        post.id === postId
          ? { ...post, likes_count: post.likes_count - 1, liked_by_user: false }
          : post
      ));
    }
  };

  return { posts, loading, likePost, unlikePost, refresh: fetchPosts };
}
