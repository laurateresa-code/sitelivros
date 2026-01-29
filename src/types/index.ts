export type ReaderLevel = 'iniciante' | 'leitor' | 'leitor_avido' | 'devorador' | 'mestre';

export interface Profile {
  id: string;
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  bio: string | null;
  reader_level: ReaderLevel;
  total_pages_read: number;
  total_books_read: number;
  total_reading_time: number;
  streak_days: number;
  last_reading_date: string | null;
  last_broken_streak: number | null;
  consecutive_recoveries: number;
  last_recovery_date: string | null;
  is_reading_now: boolean;
  current_book_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Book {
  id: string;
  google_books_id: string | null;
  title: string;
  author: string | null;
  description: string | null;
  cover_url: string | null;
  page_count: number | null;
  published_date: string | null;
  categories: string[] | null;
  isbn: string | null;
  average_rating: number;
  total_ratings: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserBook {
  id: string;
  user_id: string;
  book_id: string;
  status: 'reading' | 'read' | 'want_to_read';
  current_page: number;
  rating: number | null;
  review: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  updated_at: string;
  book?: Book;
}

export interface ReadingSession {
  id: string;
  user_id: string;
  book_id: string;
  pages_read: number;
  start_page: number;
  end_page: number;
  duration_minutes: number;
  notes: string | null;
  started_at: string;
  ended_at: string;
  created_at: string;
  book?: Book;
}

export interface Post {
  id: string;
  user_id: string;
  book_id: string | null;
  reading_session_id: string | null;
  type: 'started_reading' | 'finished_reading' | 'session_update' | 'review' | 'milestone' | 'general';
  content: string | null;
  rating: number | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
  profile?: Profile;
  book?: Book;
  reading_session?: ReadingSession;
  liked_by_user?: boolean;
  club_id?: string | null;
}

export interface ClubMessage {
  id: string;
  club_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile?: Profile;
}

export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface Like {
  id: string;
  user_id: string;
  post_id: string;
  created_at: string;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  likes_count: number;
  parent_id: string | null;
  profile?: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  liked_by_user?: boolean;
}

export interface Club {
  id: string;
  name: string;
  description: string | null;
  cover_url: string | null;
  owner_id: string;
  current_book_id: string | null;
  member_count: number;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  current_book?: Book;
}

export interface ClubMember {
  id: string;
  club_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  joined_at: string;
  nickname?: string;
}

export interface ClubMemberWithProfile extends ClubMember {
  profile: Profile;
}

export interface Badge {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  requirement_type: string;
  requirement_value: number;
  created_at: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
  badge?: Badge;
}

export interface Notification {
  id: string;
  user_id: string;
  actor_id: string;
  type: 'like' | 'comment' | 'follow' | 'mention';
  entity_id: string;
  read: boolean;
  created_at: string;
  actor?: Profile;
}

export interface GoogleBookResult {
  id: string;
  volumeInfo: {
    title: string;
    authors?: string[];
    description?: string;
    imageLinks?: {
      thumbnail?: string;
      smallThumbnail?: string;
    };
    pageCount?: number;
    publishedDate?: string;
    categories?: string[];
    industryIdentifiers?: Array<{
      type: string;
      identifier: string;
    }>;
  };
}
