import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Post } from '@/types';
import { useAuth } from './useAuth';

export function usePost(postId: string) {
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  const fetchPost = useCallback(async () => {
    if (!postId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data: postData, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', postId)
        .single();

      if (error) throw error;
      if (!postData) {
        setPost(null);
        return;
      }

      // Fetch related data
      const [profileResult, bookResult, sessionResult] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', postData.user_id).single(),
        postData.book_id 
          ? supabase.from('books').select('*').eq('id', postData.book_id).single()
          : Promise.resolve({ data: null }),
        postData.reading_session_id
          ? supabase.from('reading_sessions').select('*').eq('id', postData.reading_session_id).single()
          : Promise.resolve({ data: null })
      ]);

      // Check if liked by current user
      let likedByUser = false;
      if (user) {
        const { data: like } = await supabase
          .from('likes')
          .select('id')
          .eq('user_id', user.id)
          .eq('post_id', postId)
          .maybeSingle();
        
        likedByUser = !!like;
      }

      const formattedPost: Post = {
        ...postData,
        profile: profileResult.data || {
          id: postData.user_id,
          user_id: postData.user_id,
          username: 'Unknown',
          display_name: 'Unknown User',
          avatar_url: null,
          reader_level: 'iniciante',
          is_reading_now: false
        },
        book: bookResult.data || undefined,
        reading_session: sessionResult.data || undefined,
        liked_by_user: likedByUser,
      };

      setPost(formattedPost);
    } catch (error) {
      console.error('Error fetching post:', error);
      setError(error as Error);
    } finally {
      setLoading(false);
    }
  }, [postId, user]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  const likePost = async () => {
    if (!user || !post) return;

    // Optimistic update
    setPost(prev => prev ? ({
      ...prev,
      likes_count: (prev.likes_count || 0) + 1,
      liked_by_user: true
    }) : null);

    const { error } = await supabase
      .from('likes')
      .insert({ user_id: user.id, post_id: postId });

    if (error) {
      // Revert
      setPost(prev => prev ? ({
        ...prev,
        likes_count: (prev.likes_count || 0) - 1,
        liked_by_user: false
      }) : null);
      console.error('Error liking post:', error);
    } else {
        // Notification
        if (post.user_id !== user.id) {
            supabase.from('notifications').insert({
                user_id: post.user_id,
                actor_id: user.id,
                type: 'like',
                entity_id: postId,
            }).then(({ error }) => {
                if (error) console.error('Error creating notification:', error);
            });
        }
    }
  };

  const unlikePost = async () => {
    if (!user || !post) return;

    // Optimistic update
    setPost(prev => prev ? ({
      ...prev,
      likes_count: (prev.likes_count || 0) - 1,
      liked_by_user: false
    }) : null);

    const { error } = await supabase
      .from('likes')
      .delete()
      .eq('user_id', user.id)
      .eq('post_id', postId);

    if (error) {
      // Revert
      setPost(prev => prev ? ({
        ...prev,
        likes_count: (prev.likes_count || 0) + 1,
        liked_by_user: true
      }) : null);
      console.error('Error unliking post:', error);
    }
  };

  const deletePost = async () => {
    if (!user || !post) return;
    
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId)
      .eq('user_id', user.id);

    if (error) throw error;
  };

  return { post, loading, error, likePost, unlikePost, deletePost, refresh: fetchPost };
}
