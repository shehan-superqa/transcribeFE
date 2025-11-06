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
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          energy_points: number
          subscription_plan: string
          subscription_status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          energy_points?: number
          subscription_plan?: string
          subscription_status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          energy_points?: number
          subscription_plan?: string
          subscription_status?: string
          created_at?: string
          updated_at?: string
        }
      }
      transcriptions: {
        Row: {
          id: string
          user_id: string
          input_type: 'file' | 'youtube' | 'recording'
          input_source: string
          transcription_text: string | null
          duration_seconds: number | null
          energy_cost: number
          status: 'processing' | 'completed' | 'failed'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          input_type: 'file' | 'youtube' | 'recording'
          input_source: string
          transcription_text?: string | null
          duration_seconds?: number | null
          energy_cost: number
          status?: 'processing' | 'completed' | 'failed'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          input_type?: 'file' | 'youtube' | 'recording'
          input_source?: string
          transcription_text?: string | null
          duration_seconds?: number | null
          energy_cost?: number
          status?: 'processing' | 'completed' | 'failed'
          created_at?: string
        }
      }
      subscription_plans: {
        Row: {
          id: string
          name: string
          price: number
          energy_points: number
          features: Json
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          price: number
          energy_points: number
          features: Json
          active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          price?: number
          energy_points?: number
          features?: Json
          active?: boolean
          created_at?: string
        }
      }
    }
  }
}
