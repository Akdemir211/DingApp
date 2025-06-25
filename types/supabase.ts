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
          name: string | null
          avatar_url: string | null
          created_at: string
          is_pro?: boolean
          grade?: string | null
          target_profession?: string | null
          exam_score?: number | null
          strong_subjects?: string[] | null
          weak_subjects?: string[] | null
        }
        Insert: {
          id: string
          name?: string | null
          avatar_url?: string | null
          created_at?: string
          is_pro?: boolean
          grade?: string | null
          target_profession?: string | null
          exam_score?: number | null
          strong_subjects?: string[] | null
          weak_subjects?: string[] | null
        }
        Update: {
          id?: string
          name?: string | null
          avatar_url?: string | null
          created_at?: string
          is_pro?: boolean
          grade?: string | null
          target_profession?: string | null
          exam_score?: number | null
          strong_subjects?: string[] | null
          weak_subjects?: string[] | null
        }
      }
      chat_rooms: {
        Row: {
          id: string
          name: string
          description: string | null
          is_private: boolean
          password_hash: string | null
          created_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          is_private?: boolean
          password_hash?: string | null
          created_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          is_private?: boolean
          password_hash?: string | null
          created_at?: string
          created_by?: string | null
        }
      }
      chat_messages: {
        Row: {
          id: string
          room_id: string
          user_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          room_id: string
          user_id: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          user_id?: string
          content?: string
          created_at?: string
        }
      }
      chat_room_members: {
        Row: {
          room_id: string
          user_id: string
          joined_at: string
        }
        Insert: {
          room_id: string
          user_id: string
          joined_at?: string
        }
        Update: {
          room_id?: string
          user_id?: string
          joined_at?: string
        }
      }
      chat_files: {
        Row: {
          id: string
          room_id: string
          sender_id: string
          file_url: string
          file_type: string
          file_name: string
          file_size: number
          created_at: string
          message_id: string | null
        }
        Insert: {
          id?: string
          room_id: string
          sender_id: string
          file_url: string
          file_type: string
          file_name: string
          file_size: number
          created_at?: string
          message_id?: string | null
        }
        Update: {
          id?: string
          room_id?: string
          sender_id?: string
          file_url?: string
          file_type?: string
          file_name?: string
          file_size?: number
          created_at?: string
          message_id?: string | null
        }
      }
      ai_chat_history: {
        Row: {
          id: string
          user_id: string
          role: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role?: string
          content?: string
          created_at?: string
        }
      }
      user_assignments: {
        Row: {
          id: string
          user_id: string
          description: string
          subject: string
          due_date: string
          is_completed: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          description: string
          subject: string
          due_date: string
          is_completed?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          description?: string
          subject?: string
          due_date?: string
          is_completed?: boolean
          created_at?: string
        }
      }
      watch_rooms: {
        Row: {
          id: string
          name: string
          description: string | null
          video_url: string
          is_private: boolean
          password_hash: string | null
          created_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          video_url: string
          is_private?: boolean
          password_hash?: string | null
          created_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          video_url?: string
          is_private?: boolean
          password_hash?: string | null
          created_at?: string
          created_by?: string | null
        }
      }
      watch_room_members: {
        Row: {
          room_id: string
          user_id: string
          joined_at: string
        }
        Insert: {
          room_id: string
          user_id: string
          joined_at?: string
        }
        Update: {
          room_id?: string
          user_id?: string
          joined_at?: string
        }
      }
      watch_room_messages: {
        Row: {
          id: string
          room_id: string
          user_id: string
          content: string
          created_at: string
          user?: {
            name: string | null
          }
        }
        Insert: {
          id?: string
          room_id: string
          user_id: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          user_id?: string
          content?: string
          created_at?: string
        }
      }
      study_rooms: {
        Row: {
          id: string
          name: string
          description: string | null
          is_private: boolean
          password_hash: string | null
          created_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          is_private?: boolean
          password_hash?: string | null
          created_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          is_private?: boolean
          password_hash?: string | null
          created_at?: string
          created_by?: string | null
        }
      }
      study_room_members: {
        Row: {
          room_id: string
          user_id: string
          joined_at: string
          current_session_id: string | null
        }
        Insert: {
          room_id: string
          user_id: string
          joined_at?: string
          current_session_id?: string | null
        }
        Update: {
          room_id?: string
          user_id?: string
          joined_at?: string
          current_session_id?: string | null
        }
      }
      study_sessions: {
        Row: {
          id: string
          user_id: string
          duration: number
          created_at: string
          ended_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          duration?: number
          created_at?: string
          ended_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          duration?: number
          created_at?: string
          ended_at?: string | null
        }
      }
      study_leaderboard: {
        Row: {
          user_id: string
          total_duration: number
          rank: number | null
          updated_at: string
        }
        Insert: {
          user_id: string
          total_duration?: number
          rank?: number | null
          updated_at?: string
        }
        Update: {
          user_id?: string
          total_duration?: number
          rank?: number | null
          updated_at?: string
        }
      }
      study_room_timer_state: {
        Row: {
          room_id: string
          is_running: boolean
          start_time: string | null
          pause_time: string | null
          total_paused_duration: number
          current_session_id: string | null
          started_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          room_id: string
          is_running?: boolean
          start_time?: string | null
          pause_time?: string | null
          total_paused_duration?: number
          current_session_id?: string | null
          started_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          room_id?: string
          is_running?: boolean
          start_time?: string | null
          pause_time?: string | null
          total_paused_duration?: number
          current_session_id?: string | null
          started_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      study_room_timer_events: {
        Row: {
          id: string
          room_id: string
          user_id: string
          action: 'start' | 'pause' | 'resume' | 'reset'
          timestamp: string
          elapsed_seconds: number | null
        }
        Insert: {
          id?: string
          room_id: string
          user_id: string
          action: 'start' | 'pause' | 'resume' | 'reset'
          timestamp?: string
          elapsed_seconds?: number | null
        }
        Update: {
          id?: string
          room_id?: string
          user_id?: string
          action?: 'start' | 'pause' | 'resume' | 'reset'
          timestamp?: string
          elapsed_seconds?: number | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}