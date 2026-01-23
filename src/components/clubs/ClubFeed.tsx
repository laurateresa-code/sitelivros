import { useFeed } from '@/hooks/useFeed';
import { PostCard } from '@/components/feed/PostCard';
import { CreatePostDialog } from '@/components/feed/CreatePostDialog';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';

interface ClubFeedProps {
  clubId: string;
}

export function ClubFeed({ clubId }: ClubFeedProps) {
  const { posts, loading, likePost, unlikePost, refresh } = useFeed(clubId);

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-lg border p-4 shadow-sm">
        <h3 className="font-semibold mb-4">Feed do Clube</h3>
        <CreatePostDialog onPostCreated={refresh} clubId={clubId} />
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <Card key={i} className="p-6">
              <div className="flex gap-4">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : posts.length > 0 ? (
        <div className="space-y-6">
          {posts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              onLike={likePost}
              onUnlike={unlikePost}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-muted/30 rounded-lg border-2 border-dashed">
          <p className="text-muted-foreground">Nenhuma publicação neste clube ainda.</p>
          <p className="text-sm text-muted-foreground mt-1">Seja o primeiro a publicar!</p>
        </div>
      )}
    </div>
  );
}
