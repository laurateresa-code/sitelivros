import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface FollowUser {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

export function useFollows() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const followUser = useCallback(async (followerId: string, followingId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('follows')
        .insert({
          follower_id: followerId,
          following_id: followingId
        });

      if (error) throw error;
      
      toast({ title: 'Usuário seguido com sucesso!' });
      return true;
    } catch (error) {
      console.error('Error following user:', error);
      toast({ title: 'Erro ao seguir usuário', variant: 'destructive' });
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const unfollowUser = useCallback(async (followerId: string, followingId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', followerId)
        .eq('following_id', followingId);

      if (error) throw error;
      
      toast({ title: 'Deixou de seguir usuário' });
      return true;
    } catch (error) {
      console.error('Error unfollowing user:', error);
      toast({ title: 'Erro ao deixar de seguir', variant: 'destructive' });
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const getFollowers = useCallback(async (userId: string) => {
    try {
      const { data: followsData, error: followsError } = await supabase
        .from('follows')
        .select('follower_id')
        .eq('following_id', userId);

      if (followsError) throw followsError;

      if (!followsData || followsData.length === 0) {
        return [];
      }

      const followerIds = followsData.map(d => d.follower_id);

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .in('user_id', followerIds);

      if (profilesError) throw profilesError;
      
      return profilesData as FollowUser[];
    } catch (error) {
      console.error('Error fetching followers:', error);
      return [];
    }
  }, []);

  const getFollowing = useCallback(async (userId: string) => {
    try {
      const { data: followsData, error: followsError } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', userId);

      if (followsError) throw followsError;

      if (!followsData || followsData.length === 0) {
        return [];
      }

      const followingIds = followsData.map(d => d.following_id);

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .in('user_id', followingIds);

      if (profilesError) throw profilesError;

      return profilesData as FollowUser[];
    } catch (error) {
      console.error('Error fetching following:', error);
      return [];
    }
  }, []);

  const checkIsFollowing = useCallback(async (followerId: string, followingId: string) => {
    try {
      const { count, error } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', followerId)
        .eq('following_id', followingId);

      if (error) throw error;
      return (count || 0) > 0;
    } catch (error) {
      console.error('Error checking follow status:', error);
      return false;
    }
  }, []);

  return {
    followUser,
    unfollowUser,
    getFollowers,
    getFollowing,
    checkIsFollowing,
    loading
  };
}
