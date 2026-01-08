export type ContentStage = 'Idea' | 'Script' | 'Shooting' | 'Editing' | 'Scheduled' | 'Posted';
export type SocialPlatform = 'IG' | 'YT' | 'Podcast' | 'Shorts';

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      content_items: {
        Row: {
          id: string;
          category_id: string;
          name: string;
          raw_file_urls: string[];
          inspo_urls: string[];
          final_url: string | null;
          stage: ContentStage;
          social: SocialPlatform;
          timeline_days: number;
          scheduled_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category_id: string;
          name: string;
          raw_file_urls?: string[];
          inspo_urls?: string[];
          final_url?: string | null;
          stage?: ContentStage;
          social?: SocialPlatform;
          timeline_days?: number;
          scheduled_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          category_id?: string;
          name?: string;
          raw_file_urls?: string[];
          inspo_urls?: string[];
          final_url?: string | null;
          stage?: ContentStage;
          social?: SocialPlatform;
          timeline_days?: number;
          scheduled_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "content_items_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      content_stage: ContentStage;
      social_platform: SocialPlatform;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type Category = Database['public']['Tables']['categories']['Row'];
export type ContentItem = Database['public']['Tables']['content_items']['Row'];
export type ContentItemWithCategory = ContentItem & { category: Category };
