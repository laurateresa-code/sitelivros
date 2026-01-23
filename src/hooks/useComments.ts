import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Comment } from '@/types';

export function useComments(postId: string, postAuthorId?: string) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchComments = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          profiles!comments_profiles_fk (
            username,
            display_name,
            avatar_url
          )
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Check which comments are liked by the current user
      let likedCommentIds: string[] = [];
      if (user) {
        const { data: likes } = await supabase
          .from('comment_likes')
          .select('comment_id')
          .eq('user_id', user.id);
        
        likedCommentIds = likes?.map(l => l.comment_id) || [];
      }

      // Transform data to match Comment interface
      const formattedComments = (data || []).map(comment => ({
        ...comment,
        profile: comment.profiles,
        liked_by_user: likedCommentIds.includes(comment.id),
        likes_count: comment.likes_count || 0,
        parent_id: comment.parent_id || null
      })) as Comment[];

      setComments(formattedComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  }, [postId, user]);

  useEffect(() => {
    fetchComments();

    // Real-time updates
    const channel = supabase
      .channel(`comments-${postId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'comments', filter: `post_id=eq.${postId}` },
        () => {
          fetchComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId, fetchComments]);

  const addComment = async (content: string, parentId?: string) => {
    if (!user) return { error: 'User not authenticated' };

    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content,
          parent_id: parentId || null
        })
        .select()
        .single();

      if (error) throw error;

      // Notifications
      if (parentId) {
        // Reply notification
        const parentComment = comments.find(c => c.id === parentId);
        if (parentComment && parentComment.user_id !== user.id) {
            supabase.from('notifications').insert({
                user_id: parentComment.user_id,
                actor_id: user.id,
                type: 'comment',
                entity_id: postId, // Link to post
            }).then(({ error }) => {
                if (error) console.error('Error creating reply notification:', error);
            });
        }
      } else if (postAuthorId && postAuthorId !== user.id) {
        // Post comment notification
        supabase.from('notifications').insert({
            user_id: postAuthorId,
            actor_id: user.id,
            type: 'comment',
            entity_id: postId,
        }).then(({ error }) => {
            if (error) console.error('Error creating comment notification:', error);
        });
      }

      return { error: null };
    } catch (error) {
      console.error('Error adding comment:', error);
      return { error };
    }
  };

  const likeComment = async (commentId: string) => {
    if (!user) return;

    // Optimistic update
    setComments(prev => prev.map(c => 
      c.id === commentId 
        ? { ...c, likes_count: (c.likes_count || 0) + 1, liked_by_user: true } 
        : c
    ));

    const { error } = await supabase
      .from('comment_likes')
      .insert({ user_id: user.id, comment_id: commentId });

    if (error) {
      // Revert if error
      setComments(prev => prev.map(c => 
        c.id === commentId 
          ? { ...c, likes_count: (c.likes_count || 0) - 1, liked_by_user: false } 
          : c
      ));
      console.error('Error liking comment:', error);
    } else {
      // Notification for comment like
      const comment = comments.find(c => c.id === commentId);
      if (comment && comment.user_id !== user.id) {
        supabase.from('notifications').insert({
          user_id: comment.user_id,
          actor_id: user.id,
          type: 'like',
          entity_id: postId, // Using postId as entity_id for easier navigation to context
        }).then(({ error }) => {
          if (error) console.error('Error creating comment like notification:', error);
        });
      }
    }
  };

  const unlikeComment = async (commentId: string) => {
    if (!user) return;

    // Optimistic update
    setComments(prev => prev.map(c => 
      c.id === commentId 
        ? { ...c, likes_count: (c.likes_count || 0) - 1, liked_by_user: false } 
        : c
    ));

    const { error } = await supabase
      .from('comment_likes')
      .delete()
      .eq('user_id', user.id)
      .eq('comment_id', commentId);

    if (error) {
       // Revert if error
      setComments(prev => prev.map(c => 
        c.id === commentId 
          ? { ...c, likes_count: (c.likes_count || 0) + 1, liked_by_user: true } 
          : c
      ));
      console.error('Error unliking comment:', error);
    }
  };

  return {
    comments,
    loading,
    addComment,
    likeComment,
    unlikeComment
  };
}
