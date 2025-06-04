export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'voter';
}

export interface Event {
  id: string;
  title: string;
  description: string | null;
  admin_id: string;
  start_timestamp: string;
  end_timestamp: string;
  status: 'draft' | 'open' | 'closed';
  created_at: string;
}

export interface Category {
  id: string;
  event_id: string;
  name: string;
  created_at: string;
  items?: Item[];
}

export interface Item {
  id: string;
  category_id: string;
  name: string;
  thumbnail_url: string | null;
  created_at: string;
  vote_count?: number;
  user_vote?: number;
}

export interface Vote {
  id: string;
  user_id: string;
  item_id: string;
  stars: number;
  timestamp: string;
}

export interface ItemResult extends Item {
  total_points: number;
  avg_score: number;
  vote_count: number;
  rank: number;
}

export interface CategoryWithResults extends Category {
  items: ItemResult[];
}

export interface EventWithCategories extends Event {
  categories: Category[];
}