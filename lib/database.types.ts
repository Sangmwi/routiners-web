export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      messages: {
        Row: {
          content: string
          createdAt: string
          id: number
          role: string
          threadId: number
        }
        Insert: {
          content: string
          createdAt?: string
          id?: number
          role: string
          threadId: number
        }
        Update: {
          content?: string
          createdAt?: string
          id?: number
          role?: string
          threadId?: number
        }
        Relationships: [
          {
            foreignKeyName: "messages_threadId_fkey"
            columns: ["threadId"]
            isOneToOne: false
            referencedRelation: "threads"
            referencedColumns: ["id"]
          },
        ]
      }
      threads: {
        Row: {
          createdAt: string
          id: number
          title: string
          updatedAt: string
          userId: string
        }
        Insert: {
          createdAt?: string
          id?: number
          title: string
          updatedAt: string
          userId: string
        }
        Update: {
          createdAt?: string
          id?: number
          title?: string
          updatedAt?: string
          userId?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          bio: string | null
          birth_date: string
          body_fat_percentage: number | null
          created_at: string
          email: string
          enlistment_month: string
          gender: string
          height_cm: number | null
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
          skeletal_muscle_mass_kg: number | null
          specialty: string
          unit_id: string
          unit_name: string
          updated_at: string
          weight_kg: number | null
        }
        Insert: {
          bio?: string | null
          birth_date: string
          body_fat_percentage?: number | null
          created_at?: string
          email: string
          enlistment_month: string
          gender: string
          height_cm?: number | null
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
          skeletal_muscle_mass_kg?: number | null
          specialty: string
          unit_id: string
          unit_name: string
          updated_at?: string
          weight_kg?: number | null
        }
        Update: {
          bio?: string | null
          birth_date?: string
          body_fat_percentage?: number | null
          created_at?: string
          email?: string
          enlistment_month?: string
          gender?: string
          height_cm?: number | null
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
          skeletal_muscle_mass_kg?: number | null
          specialty?: string
          unit_id?: string
          unit_name?: string
          updated_at?: string
          weight_kg?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      public_user_profiles: {
        Row: {
          bio: string | null
          body_fat_percentage: number | null
          created_at: string | null
          gender: string | null
          height_cm: number | null
          id: string | null
          interested_exercise_locations: string[] | null
          interested_exercise_types: string[] | null
          is_smoker: boolean | null
          nickname: string | null
          profile_image_url: string | null
          rank: string | null
          skeletal_muscle_mass_kg: number | null
          specialty: string | null
          unit_name: string | null
          weight_kg: number | null
        }
        Relationships: []
      }
    }
    Functions: {
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
          body_fat_percentage: number
          created_at: string
          email: string
          enlistment_month: string
          gender: string
          height_cm: number
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
          skeletal_muscle_mass_kg: number
          specialty: string
          unit_id: string
          unit_name: string
          updated_at: string
          weight_kg: number
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

type PublicSchema = Database[keyof Database]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
