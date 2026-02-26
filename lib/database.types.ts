export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      big3_records: {
        Row: {
          created_at: string | null
          id: string
          lift_type: string
          notes: string | null
          recorded_at: string
          reps: number | null
          routine_event_id: string | null
          rpe: number | null
          source: string
          updated_at: string | null
          user_id: string
          weight: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          lift_type: string
          notes?: string | null
          recorded_at: string
          reps?: number | null
          routine_event_id?: string | null
          rpe?: number | null
          source?: string
          updated_at?: string | null
          user_id: string
          weight: number
        }
        Update: {
          created_at?: string | null
          id?: string
          lift_type?: string
          notes?: string | null
          recorded_at?: string
          reps?: number | null
          routine_event_id?: string | null
          rpe?: number | null
          source?: string
          updated_at?: string | null
          user_id?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "big3_records_routine_event_id_fkey"
            columns: ["routine_event_id"]
            isOneToOne: false
            referencedRelation: "routine_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "big3_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "big3_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          content_type: string
          conversation_id: string
          created_at: string
          deleted_at: string | null
          edited_at: string | null
          id: string
          media_metadata: Json | null
          media_url: string | null
          metadata: Json | null
          reply_to_id: string | null
          role: string
          sender_id: string | null
        }
        Insert: {
          content: string
          content_type?: string
          conversation_id: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          media_metadata?: Json | null
          media_url?: string | null
          metadata?: Json | null
          reply_to_id?: string | null
          role?: string
          sender_id?: string | null
        }
        Update: {
          content?: string
          content_type?: string
          conversation_id?: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          media_metadata?: Json | null
          media_url?: string | null
          metadata?: Json | null
          reply_to_id?: string | null
          role?: string
          sender_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "public_user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      community_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string | null
          deleted_at: string | null
          id: string
          parent_id: string | null
          post_id: string
          updated_at: string | null
        }
        Insert: {
          author_id?: string
          content: string
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          parent_id?: string | null
          post_id: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          parent_id?: string | null
          post_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "public_user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "community_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_likes: {
        Row: {
          created_at: string | null
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          post_id: string
          user_id?: string
        }
        Update: {
          created_at?: string | null
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      community_posts: {
        Row: {
          author_id: string
          category: string
          comments_count: number | null
          content: string
          created_at: string | null
          deleted_at: string | null
          id: string
          image_urls: string[] | null
          likes_count: number | null
          updated_at: string | null
        }
        Insert: {
          author_id?: string
          category?: string
          comments_count?: number | null
          content: string
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          image_urls?: string[] | null
          likes_count?: number | null
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          category?: string
          comments_count?: number | null
          content?: string
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          image_urls?: string[] | null
          likes_count?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "public_user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          id: string
          joined_at: string
          last_read_at: string | null
          last_read_message_id: string | null
          left_at: string | null
          muted: boolean | null
          muted_until: string | null
          role: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          joined_at?: string
          last_read_at?: string | null
          last_read_message_id?: string | null
          left_at?: string | null
          muted?: boolean | null
          muted_until?: string | null
          role?: string
          user_id?: string
        }
        Update: {
          conversation_id?: string
          id?: string
          joined_at?: string
          last_read_at?: string | null
          last_read_message_id?: string | null
          left_at?: string | null
          muted?: boolean | null
          muted_until?: string | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          ai_result_applied: boolean | null
          ai_result_applied_at: string | null
          context_summary: string | null
          created_at: string
          created_by: string
          deleted_at: string | null
          id: string
          metadata: Json | null
          summarized_until: string | null
          title: string | null
          type: string
          updated_at: string
        }
        Insert: {
          ai_result_applied?: boolean | null
          ai_result_applied_at?: string | null
          context_summary?: string | null
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          id?: string
          metadata?: Json | null
          summarized_until?: string | null
          title?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          ai_result_applied?: boolean | null
          ai_result_applied_at?: string | null
          context_summary?: string | null
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          id?: string
          metadata?: Json | null
          summarized_until?: string | null
          title?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "public_user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_summarized_until_fkey"
            columns: ["summarized_until"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      dietary_profiles: {
        Row: {
          ai_notes: Json | null
          available_sources: string[] | null
          budget_per_month: number | null
          created_at: string
          diet_type: string | null
          dietary_goal: string | null
          eating_habits: string[] | null
          food_restrictions: string[] | null
          meals_per_day: number | null
          preferences: string[] | null
          target_calories: number | null
          target_protein: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_notes?: Json | null
          available_sources?: string[] | null
          budget_per_month?: number | null
          created_at?: string
          diet_type?: string | null
          dietary_goal?: string | null
          eating_habits?: string[] | null
          food_restrictions?: string[] | null
          meals_per_day?: number | null
          preferences?: string[] | null
          target_calories?: number | null
          target_protein?: number | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          ai_notes?: Json | null
          available_sources?: string[] | null
          budget_per_month?: number | null
          created_at?: string
          diet_type?: string | null
          dietary_goal?: string | null
          eating_habits?: string[] | null
          food_restrictions?: string[] | null
          meals_per_day?: number | null
          preferences?: string[] | null
          target_calories?: number | null
          target_protein?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dietary_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "public_user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dietary_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      fitness_profiles: {
        Row: {
          ai_notes: Json | null
          created_at: string
          equipment_access: string | null
          experience_level: string | null
          fitness_goal: string | null
          focus_areas: string[] | null
          injuries: string[] | null
          preferences: string[] | null
          preferred_days_per_week: number | null
          restrictions: string[] | null
          session_duration_minutes: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_notes?: Json | null
          created_at?: string
          equipment_access?: string | null
          experience_level?: string | null
          fitness_goal?: string | null
          focus_areas?: string[] | null
          injuries?: string[] | null
          preferences?: string[] | null
          preferred_days_per_week?: number | null
          restrictions?: string[] | null
          session_duration_minutes?: number | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          ai_notes?: Json | null
          created_at?: string
          equipment_access?: string | null
          experience_level?: string | null
          fitness_goal?: string | null
          focus_areas?: string[] | null
          injuries?: string[] | null
          preferences?: string[] | null
          preferred_days_per_week?: number | null
          restrictions?: string[] | null
          session_duration_minutes?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fitness_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "public_user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fitness_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      inbody_records: {
        Row: {
          bmi: number | null
          body_fat_mass: number | null
          body_fat_percentage: number | null
          created_at: string | null
          height: number | null
          id: string
          inbody_score: number | null
          left_arm_fat: number | null
          left_arm_muscle: number | null
          left_leg_fat: number | null
          left_leg_muscle: number | null
          measured_at: string
          minerals: number | null
          protein: number | null
          right_arm_fat: number | null
          right_arm_muscle: number | null
          right_leg_fat: number | null
          right_leg_muscle: number | null
          skeletal_muscle_mass: number | null
          total_body_water: number | null
          trunk_fat: number | null
          trunk_muscle: number | null
          updated_at: string | null
          user_id: string
          weight: number
        }
        Insert: {
          bmi?: number | null
          body_fat_mass?: number | null
          body_fat_percentage?: number | null
          created_at?: string | null
          height?: number | null
          id?: string
          inbody_score?: number | null
          left_arm_fat?: number | null
          left_arm_muscle?: number | null
          left_leg_fat?: number | null
          left_leg_muscle?: number | null
          measured_at: string
          minerals?: number | null
          protein?: number | null
          right_arm_fat?: number | null
          right_arm_muscle?: number | null
          right_leg_fat?: number | null
          right_leg_muscle?: number | null
          skeletal_muscle_mass?: number | null
          total_body_water?: number | null
          trunk_fat?: number | null
          trunk_muscle?: number | null
          updated_at?: string | null
          user_id?: string
          weight: number
        }
        Update: {
          bmi?: number | null
          body_fat_mass?: number | null
          body_fat_percentage?: number | null
          created_at?: string | null
          height?: number | null
          id?: string
          inbody_score?: number | null
          left_arm_fat?: number | null
          left_arm_muscle?: number | null
          left_leg_fat?: number | null
          left_leg_muscle?: number | null
          measured_at?: string
          minerals?: number | null
          protein?: number | null
          right_arm_fat?: number | null
          right_arm_muscle?: number | null
          right_leg_fat?: number | null
          right_leg_muscle?: number | null
          skeletal_muscle_mass?: number | null
          total_body_water?: number | null
          trunk_fat?: number | null
          trunk_muscle?: number | null
          updated_at?: string | null
          user_id?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "inbody_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inbody_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      message_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      routine_events: {
        Row: {
          ai_session_id: string | null
          completed_at: string | null
          created_at: string
          data: Json
          date: string
          id: string
          rationale: string | null
          source: string
          status: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          ai_session_id?: string | null
          completed_at?: string | null
          created_at?: string
          data: Json
          date: string
          id?: string
          rationale?: string | null
          source?: string
          status?: string
          title: string
          type?: string
          user_id?: string
        }
        Update: {
          ai_session_id?: string | null
          completed_at?: string | null
          created_at?: string
          data?: Json
          date?: string
          id?: string
          rationale?: string | null
          source?: string
          status?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "routine_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routine_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          bio: string | null
          birth_date: string
          created_at: string
          email: string
          enlistment_month: string
          gender: string
          id: string
          interested_exercise_locations: string[] | null
          interested_exercise_types: string[] | null
          is_smoker: boolean | null
          nickname: string
          phone_number: string
          profile_photo_url: string | null
          provider_id: string
          rank: string
          real_name: string
          show_activity_public: boolean | null
          show_info_public: boolean | null
          specialty: string
          unit_id: string
          unit_name: string
          updated_at: string
        }
        Insert: {
          bio?: string | null
          birth_date: string
          created_at?: string
          email: string
          enlistment_month: string
          gender: string
          id?: string
          interested_exercise_locations?: string[] | null
          interested_exercise_types?: string[] | null
          is_smoker?: boolean | null
          nickname: string
          phone_number: string
          profile_photo_url?: string | null
          provider_id: string
          rank: string
          real_name: string
          show_activity_public?: boolean | null
          show_info_public?: boolean | null
          specialty: string
          unit_id: string
          unit_name: string
          updated_at?: string
        }
        Update: {
          bio?: string | null
          birth_date?: string
          created_at?: string
          email?: string
          enlistment_month?: string
          gender?: string
          id?: string
          interested_exercise_locations?: string[] | null
          interested_exercise_types?: string[] | null
          is_smoker?: boolean | null
          nickname?: string
          phone_number?: string
          profile_photo_url?: string | null
          provider_id?: string
          rank?: string
          real_name?: string
          show_activity_public?: boolean | null
          show_info_public?: boolean | null
          specialty?: string
          unit_id?: string
          unit_name?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      public_user_profiles: {
        Row: {
          bio: string | null
          created_at: string | null
          gender: string | null
          id: string | null
          interested_exercise_locations: string[] | null
          interested_exercise_types: string[] | null
          is_smoker: boolean | null
          nickname: string | null
          profile_image_url: string | null
          rank: string | null
          show_activity_public: boolean | null
          show_info_public: boolean | null
          specialty: string | null
          unit_name: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          gender?: string | null
          id?: string | null
          interested_exercise_locations?: string[] | null
          interested_exercise_types?: string[] | null
          is_smoker?: boolean | null
          nickname?: string | null
          profile_image_url?: string | null
          rank?: string | null
          show_activity_public?: boolean | null
          show_info_public?: boolean | null
          specialty?: string | null
          unit_name?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          gender?: string | null
          id?: string | null
          interested_exercise_locations?: string[] | null
          interested_exercise_types?: string[] | null
          is_smoker?: boolean | null
          nickname?: string | null
          profile_image_url?: string | null
          rank?: string | null
          show_activity_public?: boolean | null
          show_info_public?: boolean | null
          specialty?: string | null
          unit_name?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      current_user_id: { Args: never; Returns: string }
      get_user_recommendations: {
        Args: {
          p_height: number
          p_interested_exercises: string[]
          p_interested_locations: string[]
          p_limit?: number
          p_unit_id: string
          p_user_id: string
          p_weight: number
        }
        Returns: {
          bio: string
          birth_date: string
          created_at: string
          email: string
          enlistment_month: string
          gender: string
          id: string
          interested_exercise_locations: string[]
          interested_exercise_types: string[]
          is_smoker: boolean
          nickname: string
          phone_number: string
          profile_photo_url: string
          provider_id: string
          rank: string
          real_name: string
          show_activity_public: boolean
          show_info_public: boolean
          similarity_score: number
          specialty: string
          unit_id: string
          unit_name: string
          updated_at: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
