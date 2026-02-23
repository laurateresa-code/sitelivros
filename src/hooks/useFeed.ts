import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Post } from '@/types';
import { useAuth } from './useAuth';

export function useFeed(clubId?: string) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch posts first without joins to avoid relationship errors
      let query = supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (clubId) {
        query = query.eq('club_id', clubId);
      }

      const { data: postsData, error } = await query;

      if (error) throw error;

      if (!postsData || postsData.length === 0) {
        setPosts([]);
        setLoading(false);
        return;
      }

      // Collect IDs for manual fetching
      const userIds = [...new Set(postsData.map(p => p.user_id))];
      const bookIds = [...new Set(postsData.map(p => p.book_id).filter(Boolean))];
      const sessionIds = [...new Set(postsData.map(p => p.reading_session_id).filter(Boolean))];
      
      // Fetch related data in parallel
      const [profilesResult, booksResult, sessionsResult] = await Promise.all([
        userIds.length > 0 
          ? supabase.from('profiles').select('id, user_id, username, display_name, avatar_url, is_reading_now, reader_level').in('user_id', userIds)
          : Promise.resolve({ data: [] }),
        bookIds.length > 0
          ? supabase.from('books').select('id, title, author, cover_url').in('id', bookIds)
          : Promise.resolve({ data: [] }),
        sessionIds.length > 0
          ? supabase.from('reading_sessions').select('id, pages_read, duration_minutes, notes').in('id', sessionIds)
          : Promise.resolve({ data: [] })
      ]);

      const profilesMap = new Map((profilesResult.data || []).map(p => [p.user_id, p]));
      const booksMap = new Map((booksResult.data || []).map(b => [b.id, b]));
      const sessionsMap = new Map((sessionsResult.data || []).map(s => [s.id, s]));

      // Check which posts are liked by the current user
      let likedPostIds: string[] = [];
      if (user) {
        const { data: likes } = await supabase
          .from('likes')
          .select('post_id')
          .eq('user_id', user.id);
        
        likedPostIds = likes?.map(l => l.post_id) || [];
      }

      const formattedPosts = postsData.map(post => {
        const profile = profilesMap.get(post.user_id);
        const book = post.book_id ? booksMap.get(post.book_id) : null;
        const reading_session = post.reading_session_id ? sessionsMap.get(post.reading_session_id) : null;

        return {
          ...post,
          profile: profile || {
            id: post.user_id,
            user_id: post.user_id,
            username: 'Unknown',
            display_name: 'Unknown User',
            avatar_url: null,
            reader_level: 'iniciante',
            is_reading_now: false
          },
          book,
          reading_session,
          liked_by_user: likedPostIds.includes(post.id),
        };
      }) as Post[];

      setPosts(formattedPosts);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setError(error as Error);
      // Fallback for empty feed on error
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [user, clubId]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Real-time updates
  useEffect(() => {
    const channel = supabase
      .channel(clubId ? `club-posts-${clubId}` : 'posts-realtime')
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'posts',
          filter: clubId ? `club_id=eq.${clubId}` : undefined 
        },
        async (payload) => {
          const newPost = payload.new as Post;
          
          // Fetch additional data for the new post
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, user_id, username, display_name, avatar_url, reader_level, is_reading_now')
            .eq('user_id', newPost.user_id)
            .single();

          let book = null;
          if (newPost.book_id) {
             const { data } = await supabase.from('books').select('id, title, author, cover_url').eq('id', newPost.book_id).single();
             book = data;
          }

          let reading_session = null;
          if (newPost.reading_session_id) {
             const { data } = await supabase.from('reading_sessions').select('id, pages_read, duration_minutes, notes').eq('id', newPost.reading_session_id).single();
             reading_session = data;
          }

          const formattedPost: Post = {
            ...newPost,
            profile: (profile as any) || {
                id: newPost.user_id,
                user_id: newPost.user_id,
                username: 'Unknown',
                display_name: 'Unknown User',
                avatar_url: null,
                reader_level: 'iniciante',
                is_reading_now: false,
            },
            book: book || undefined,
            reading_session: reading_session || undefined,
            liked_by_user: false,
            likes_count: 0,
            comments_count: 0
          };

          setPosts(prev => {
            // Check if post already exists to avoid duplicates from optimistic updates or race conditions
            if (prev.some(p => p.id === formattedPost.id)) {
              return prev;
            }
            return [formattedPost, ...prev];
          });
        }
      )
      .on(
        'postgres_changes',
        { 
          event: 'DELETE', 
          schema: 'public', 
          table: 'posts',
          filter: clubId ? `club_id=eq.${clubId}` : undefined 
        },
        (payload) => {
          setPosts(prev => prev.filter(p => p.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clubId]);

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

      // Create notification
      const post = posts.find(p => p.id === postId);
      if (post && post.user_id !== user.id) {
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

  const deletePost = async (postId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting post:', error);
      throw error;
    }

    // State update is handled by realtime subscription, but we can do optimistic update as well
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  return { posts, loading, error, likePost, unlikePost, deletePost, refresh: fetchPosts };
}
