import { Layout } from '@/components/layout/Layout';
import { useUserBooks } from '@/hooks/useUserBooks';
import { Loader2 } from 'lucide-react';
import { ReadingNow } from '@/components/books/ReadingNow';
import { ReadingGoals } from '@/components/dashboard/ReadingGoals';
import { ReadingChallenge } from '@/components/books/ReadingChallenge';
import { WantToRead } from '@/components/books/WantToRead';

export default function MyBooks() {
  const { loading } = useUserBooks();

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
          <div className="space-y-8">
            <ReadingNow />
          </div>

          <div className="space-y-6">
            <WantToRead />
            <ReadingGoals />
            <ReadingChallenge />
          </div>
        </div>
      </div>
    </Layout>
  );
}
