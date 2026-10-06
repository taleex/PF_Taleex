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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      contact_info: {
        Row: {
          created_at: string
          icon: string | null
          icon_name: string | null
          id: string
          info_key: string
          label: string
          link: string | null
          order_index: number | null
          type: string | null
          value: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          icon_name?: string | null
          id?: string
          info_key: string
          label: string
          link?: string | null
          order_index?: number | null
          type?: string | null
          value: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          icon_name?: string | null
          id?: string
          info_key?: string
          label?: string
          link?: string | null
          order_index?: number | null
          type?: string | null
          value?: string
        }
        Relationships: []
      }
      contact_submissions: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          status: string
          subject: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          status?: string
          subject: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          status?: string
          subject?: string
        }
        Relationships: []
      }
      experiences: {
        Row: {
          company: string
          created_at: string
          description: string | null
          employment_type: string | null
          highlights: string[] | null
          id: string
          location: string | null
          order_index: number | null
          period: string
          position: string
          updated_at: string
        }
        Insert: {
          company: string
          created_at?: string
          description?: string | null
          employment_type?: string | null
          highlights?: string[] | null
          id?: string
          location?: string | null
          order_index?: number | null
          period: string
          position: string
          updated_at?: string
        }
        Update: {
          company?: string
          created_at?: string
          description?: string | null
          employment_type?: string | null
          highlights?: string[] | null
          id?: string
          location?: string | null
          order_index?: number | null
          period?: string
          position?: string
          updated_at?: string
        }
        Relationships: []
      }
      feedback_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          type?: string
        }
        Relationships: []
      }
      page_sections: {
        Row: {
          content: string | null
          created_at: string
          id: string
          section_key: string
          subtitle: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          section_key: string
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          section_key?: string
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          cv_url: string | null
          display_name: string
          email: string | null
          experience_years: number | null
          id: string
          interests: string | null
          location: string | null
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          cv_url?: string | null
          display_name: string
          email?: string | null
          experience_years?: number | null
          id?: string
          interests?: string | null
          location?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          cv_url?: string | null
          display_name?: string
          email?: string | null
          experience_years?: number | null
          id?: string
          interests?: string | null
          location?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          category: string
          created_at: string
          demo_url: string | null
          description: string
          featured: boolean | null
          github_url: string | null
          id: string
          image_url: string | null
          order_index: number | null
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          demo_url?: string | null
          description: string
          featured?: boolean | null
          github_url?: string | null
          id?: string
          image_url?: string | null
          order_index?: number | null
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          demo_url?: string | null
          description?: string
          featured?: boolean | null
          github_url?: string | null
          id?: string
          image_url?: string | null
          order_index?: number | null
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_content: {
        Row: {
          created_at: string
          id: string
          key: string
          section: string
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          section: string
          updated_at?: string
          value: string
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          section?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      site_images: {
        Row: {
          alt_text: string | null
          created_at: string
          description: string | null
          id: string
          image_key: string
          image_url: string
          updated_at: string
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_key: string
          image_url: string
          updated_at?: string
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_key?: string
          image_url?: string
          updated_at?: string
        }
        Relationships: []
      }
      skill_categories: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          name: string
          order_index: number | null
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          order_index?: number | null
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          order_index?: number | null
        }
        Relationships: []
      }
      skills: {
        Row: {
          category_id: string | null
          created_at: string
          icon: string | null
          id: string
          level: number | null
          name: string
          order_index: number | null
          svg_url: string | null
          svg_url_dark: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          level?: number | null
          name: string
          order_index?: number | null
          svg_url?: string | null
          svg_url_dark?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          level?: number | null
          name?: string
          order_index?: number | null
          svg_url?: string | null
          svg_url_dark?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "skills_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "skill_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
