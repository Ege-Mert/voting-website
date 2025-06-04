export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          role: 'admin' | 'voter'
          created_at: string
        }
        Insert: {
          id: string
          email: string
          name: string
          role?: 'admin' | 'voter'
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: 'admin' | 'voter'
          created_at?: string
        }
      }
      events: {
        Row: {
          id: string
          title: string
          description: string | null
          admin_id: string
          start_timestamp: string
          end_timestamp: string
          status: 'draft' | 'open' | 'closed'
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          admin_id: string
          start_timestamp: string
          end_timestamp: string
          status?: 'draft' | 'open' | 'closed'
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          admin_id?: string
          start_timestamp?: string
          end_timestamp?: string
          status?: 'draft' | 'open' | 'closed'
          created_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          event_id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          name?: string
          created_at?: string
        }
      }
      items: {
        Row: {
          id: string
          category_id: string
          name: string
          thumbnail_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          category_id: string
          name: string
          thumbnail_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          category_id?: string
          name?: string
          thumbnail_url?: string | null
          created_at?: string
        }
      }
      votes: {
        Row: {
          id: string
          user_id: string
          item_id: string
          stars: number
          timestamp: string
        }
        Insert: {
          id?: string
          user_id: string
          item_id: string
          stars: number
          timestamp?: string
        }
        Update: {
          id?: string
          user_id?: string
          item_id?: string
          stars?: number
          timestamp?: string
        }
      }
    }
  }
}