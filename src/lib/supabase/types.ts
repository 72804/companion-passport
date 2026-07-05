export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      companions: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          companion_type: string;
          tone: string;
          language_style: string;
          avatar_style: string;
          boundaries: Json;
          passport_snapshot: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          companion_type: string;
          tone: string;
          language_style: string;
          avatar_style: string;
          boundaries?: Json;
          passport_snapshot?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["companions"]["Insert"]>;
        Relationships: [];
      };
      passport_memories: {
        Row: {
          id: string;
          user_id: string;
          companion_id: string;
          category: string;
          text: string;
          source_message: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          companion_id: string;
          category: string;
          text: string;
          source_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["passport_memories"]["Insert"]>;
        Relationships: [];
      };
      chat_messages: {
        Row: {
          id: string;
          user_id: string;
          companion_id: string;
          role: string;
          content: string;
          provider: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          companion_id: string;
          role: string;
          content: string;
          provider?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["chat_messages"]["Insert"]>;
        Relationships: [];
      };
      memory_suggestions: {
        Row: {
          id: string;
          user_id: string;
          companion_id: string;
          category: string;
          text: string;
          source_message: string;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          companion_id: string;
          category: string;
          text: string;
          source_message?: string;
          status?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["memory_suggestions"]["Insert"]>;
        Relationships: [];
      };
      robot_waitlist: {
        Row: {
          id: string;
          user_id: string | null;
          name: string;
          email: string;
          preferred_robot_type: string;
          price_range: string;
          deposit_interest: string;
          desired_behaviors: string[];
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          name: string;
          email: string;
          preferred_robot_type: string;
          price_range: string;
          deposit_interest: string;
          desired_behaviors?: string[];
          notes?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["robot_waitlist"]["Insert"]>;
        Relationships: [];
      };
      analytics_events: {
        Row: {
          id: string;
          user_id: string | null;
          anonymous_id: string | null;
          event_name: string;
          event_properties: Json;
          page_path: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          anonymous_id?: string | null;
          event_name: string;
          event_properties?: Json;
          page_path?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["analytics_events"]["Insert"]>;
        Relationships: [];
      };
      feedback: {
        Row: {
          id: string;
          user_id: string | null;
          anonymous_id: string | null;
          rating: number | null;
          message: string;
          page_path: string | null;
          category: string | null;
          contact_email: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          anonymous_id?: string | null;
          rating?: number | null;
          message: string;
          page_path?: string | null;
          category?: string | null;
          contact_email?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["feedback"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type CompanionRow = Database["public"]["Tables"]["companions"]["Row"];
export type PassportMemoryRow = Database["public"]["Tables"]["passport_memories"]["Row"];
export type ChatMessageRow = Database["public"]["Tables"]["chat_messages"]["Row"];
export type MemorySuggestionRow = Database["public"]["Tables"]["memory_suggestions"]["Row"];
export type WaitlistRow = Database["public"]["Tables"]["robot_waitlist"]["Row"];
