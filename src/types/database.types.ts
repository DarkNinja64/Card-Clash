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
      answer_options: {
        Row: {
          answer_text: string
          id: string
          is_correct: boolean | null
          question_id: string
        }
        Insert: {
          answer_text: string
          id?: string
          is_correct?: boolean | null
          question_id: string
        }
        Update: {
          answer_text?: string
          id?: string
          is_correct?: boolean | null
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "answer_options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      course_enrollments: {
        Row: {
          course_id: string
          enrolled_at: string | null
          id: string
          student_id: string | null
        }
        Insert: {
          course_id: string
          enrolled_at?: string | null
          id?: string
          student_id?: string | null
        }
        Update: {
          course_id?: string
          enrolled_at?: string | null
          id?: string
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_enrollments_profile_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      student_saved_decks: {
        Row: {
          id: string
          student_id: string
          deck_id: string
          saved_at: string | null
        }
        Insert: {
          id?: string
          student_id: string
          deck_id: string
          saved_at?: string | null
        }
        Update: {
          id?: string
          student_id?: string
          deck_id?: string
          saved_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_saved_decks_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "student_saved_decks_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: false
            referencedRelation: "decks"
            referencedColumns: ["id"]
          }
        ]
      }
      courses: {
        Row: {
          created_at: string | null
          id: string
          name: string
          teacher_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          teacher_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          teacher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "courses_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_profiles"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      deck_question_card_answer_options: {
        Row: {
          answer_text: string
          deck_question_card_id: string
          id: string
          is_correct: boolean
        }
        Insert: {
          answer_text: string
          deck_question_card_id: string
          id?: string
          is_correct?: boolean
        }
        Update: {
          answer_text?: string
          deck_question_card_id?: string
          id?: string
          is_correct?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "deck_question_card_answer_options_deck_question_card_id_fkey"
            columns: ["deck_question_card_id"]
            isOneToOne: false
            referencedRelation: "deck_question_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      deck_question_cards: {
        Row: {
          deck_id: string
          id: string
          question_id: string
          question_text: string
        }
        Insert: {
          deck_id: string
          id?: string
          question_id: string
          question_text?: string
        }
        Update: {
          deck_id?: string
          id?: string
          question_id?: string
          question_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "deck_question_cards_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: false
            referencedRelation: "decks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deck_question_cards_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      decks: {
        Row: {
          course_id: string
          created_at: string | null
          created_by: string
          id: string
          name: string
          share_code: string | null
        }
        Insert: {
          course_id: string
          created_at?: string | null
          created_by: string
          id?: string
          name: string
          share_code?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string | null
          created_by?: string
          id?: string
          name?: string
          share_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "decks_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "teacher_profiles"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      game_participants: {
        Row: {
          enrollee_id: string
          game_session_id: string
          id: string
          score: number | null
        }
        Insert: {
          enrollee_id: string
          game_session_id: string
          id?: string
          score?: number | null
        }
        Update: {
          enrollee_id?: string
          game_session_id?: string
          id?: string
          score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "game_participants_enrollee_id_fkey"
            columns: ["enrollee_id"]
            isOneToOne: false
            referencedRelation: "course_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_participants_game_session_id_fkey"
            columns: ["game_session_id"]
            isOneToOne: false
            referencedRelation: "game_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      game_sessions: {
        Row: {
          deck_id: string
          ended_at: string | null
          id: string
          started_at: string | null
        }
        Insert: {
          deck_id: string
          ended_at?: string | null
          id?: string
          started_at?: string | null
        }
        Update: {
          deck_id?: string
          ended_at?: string | null
          id?: string
          started_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_sessions_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: false
            referencedRelation: "decks"
            referencedColumns: ["id"]
          },
        ]
      }
      participant_responses: {
        Row: {
          answered_at: string | null
          deck_question_card_id: string
          game_participant_id: string
          game_session_id: string
          id: string
          is_correct: boolean | null
          response_time_ms: number | null
          selected_answer_id: string | null
        }
        Insert: {
          answered_at?: string | null
          deck_question_card_id: string
          game_participant_id: string
          game_session_id: string
          id?: string
          is_correct?: boolean | null
          response_time_ms?: number | null
          selected_answer_id?: string | null
        }
        Update: {
          answered_at?: string | null
          deck_question_card_id?: string
          game_participant_id?: string
          game_session_id?: string
          id?: string
          is_correct?: boolean | null
          response_time_ms?: number | null
          selected_answer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "participant_responses_deck_question_card_id_fkey"
            columns: ["deck_question_card_id"]
            isOneToOne: false
            referencedRelation: "deck_question_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participant_responses_game_participant_id_fkey"
            columns: ["game_participant_id"]
            isOneToOne: false
            referencedRelation: "game_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participant_responses_game_session_id_fkey"
            columns: ["game_session_id"]
            isOneToOne: false
            referencedRelation: "game_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participant_responses_selected_answer_id_fkey"
            columns: ["selected_answer_id"]
            isOneToOne: false
            referencedRelation: "answer_options"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          displayname: string | null
          email: string
          id: string
          role: string
        }
        Insert: {
          created_at?: string | null
          displayname?: string | null
          email: string
          id: string
          role: string
        }
        Update: {
          created_at?: string | null
          displayname?: string | null
          email?: string
          id?: string
          role?: string
        }
        Relationships: []
      }
      question_card: {
        Row: {
          answer_option_1: string
          answer_option_2: string | null
          answer_option_3: string | null
          answer_option_4: string | null
          category: string | null
          correct_answer_option: string | null
          created_at: string
          difficulty: Database["public"]["Enums"]["difficulty"]
          id: number
          question: string
          timer_seconds: number | null
        }
        Insert: {
          answer_option_1: string
          answer_option_2?: string | null
          answer_option_3?: string | null
          answer_option_4?: string | null
          category?: string | null
          correct_answer_option?: string | null
          created_at?: string
          difficulty: Database["public"]["Enums"]["difficulty"]
          id?: number
          question: string
          timer_seconds?: number | null
        }
        Update: {
          answer_option_1?: string
          answer_option_2?: string | null
          answer_option_3?: string | null
          answer_option_4?: string | null
          category?: string | null
          correct_answer_option?: string | null
          created_at?: string
          difficulty?: Database["public"]["Enums"]["difficulty"]
          id?: number
          question?: string
          timer_seconds?: number | null
        }
        Relationships: []
      }
      question_tags: {
        Row: {
          id: string
          question_id: string
          tag_id: string
        }
        Insert: {
          id?: string
          question_id: string
          tag_id: string
        }
        Update: {
          id?: string
          question_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_tags_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          created_by: string | null
          id: string
          question_text: string
        }
        Insert: {
          created_by?: string | null
          id?: string
          question_text: string
        }
        Update: {
          created_by?: string | null
          id?: string
          question_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "teacher_profiles"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      student_profiles: {
        Row: {
          profile_id: string
        }
        Insert: {
          profile_id: string
        }
        Update: {
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          id: string
          name: string | null
        }
        Insert: {
          id?: string
          name?: string | null
        }
        Update: {
          id?: string
          name?: string | null
        }
        Relationships: []
      }
      teacher_profiles: {
        Row: {
          profile_id: string
        }
        Insert: {
          profile_id: string
        }
        Update: {
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      correct_option: "1" | "2" | "3" | "4"
      difficulty: "intro" | "core" | "challenge"
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
    Enums: {
      correct_option: ["1", "2", "3", "4"],
      difficulty: ["intro", "core", "challenge"],
    },
  },
} as const
