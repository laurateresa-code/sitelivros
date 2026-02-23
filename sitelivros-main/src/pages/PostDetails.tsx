import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PostCard } from '@/components/feed/PostCard';
import { usePost } from '@/hooks/usePost';
import { Layout } from '@/components/layout/Layout';

const PostDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { post, loading, likePost, unlikePost, deletePost } = usePost(id || '');

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!post) {
    return (
      <Layout>
        <div className="container max-w-2xl py-6">
          <Button 
            variant="ghost" 
            className="mb-4 gap-2 pl-0 hover:pl-2 transition-all"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          <div className="text-center py-10">
            <h2 className="text-xl font-semibold">Post não encontrado</h2>
            <p className="text-muted-foreground mt-2">O post que você está procurando não existe ou foi removido.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout fullWidth>
      <div className="w-full md:container md:max-w-3xl md:mx-auto md:py-6 pb-20 md:pb-6 animate-fade-in">
        <div className="px-4 pt-2 pb-0 md:px-0">
          <Button 
            variant="ghost" 
            className="mb-1 gap-2 pl-0 hover:pl-2 transition-all text-muted-foreground hover:text-foreground"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
        </div>

        <PostCard 
          post={post}
          onLike={likePost}
          onUnlike={unlikePost}
          onDelete={async (id) => {
            await deletePost();
            navigate(-1);
          }}
          isDetailView={true}
        />
      </div>
    </Layout>
  );
};

export default PostDetails;
