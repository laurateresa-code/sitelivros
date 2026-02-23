import { Layout } from '@/components/layout/Layout';
import { useUserBooks } from '@/hooks/useUserBooks';
import { Loader2 } from 'lucide-react';
import { ReadingNow } from '@/components/books/ReadingNow';
import { ReadingGoals } from '@/components/dashboard/ReadingGoals';
import { LibraryBookshelf } from '@/components/profile/LibraryBookshelf';

export default function MyBooks() {
  const { books, loading } = useUserBooks();

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8 pb-12">
        <div className="grid gap-8 md:grid-cols-[1fr_300px]">
          <div className="space-y-8 min-w-0">
            {/* Widget de Sessão Ativa */}
            <ReadingNow />
          </div>

          <div className="space-y-6">
            <ReadingGoals />
          </div>
        </div>

        {/* Nova Estante Minimalista - Full Width */}
        <LibraryBookshelf books={books} isLoading={loading} hideReading={true} />
      </div>
    </Layout>
  );
}
