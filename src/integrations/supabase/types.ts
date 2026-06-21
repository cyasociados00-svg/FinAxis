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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          balance_pyg: number
          created_at: string
          id: string
          kind: string
          name: string
          user_id: string
        }
        Insert: {
          balance_pyg?: number
          created_at?: string
          id?: string
          kind: string
          name: string
          user_id: string
        }
        Update: {
          balance_pyg?: number
          created_at?: string
          id?: string
          kind?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      cards: {
        Row: {
          balance_pyg: number
          closing_day: number
          created_at: string
          due_day: number
          id: string
          limit_pyg: number
          min_payment_pct: number
          name: string
          tna: number
          user_id: string
        }
        Insert: {
          balance_pyg?: number
          closing_day?: number
          created_at?: string
          due_day?: number
          id?: string
          limit_pyg?: number
          min_payment_pct?: number
          name: string
          tna?: number
          user_id: string
        }
        Update: {
          balance_pyg?: number
          closing_day?: number
          created_at?: string
          due_day?: number
          id?: string
          limit_pyg?: number
          min_payment_pct?: number
          name?: string
          tna?: number
          user_id?: string
        }
        Relationships: []
      }
      cdas: {
        Row: {
          bank: string
          capital: number
          id: string
          issue_date: string
          maturity_date: string
          tna: number
          user_id: string
        }
        Insert: {
          bank: string
          capital: number
          id?: string
          issue_date: string
          maturity_date: string
          tna: number
          user_id: string
        }
        Update: {
          bank?: string
          capital?: number
          id?: string
          issue_date?: string
          maturity_date?: string
          tna?: number
          user_id?: string
        }
        Relationships: []
      }
      crypto: {
        Row: {
          avg_price_usd: number
          coingecko_id: string
          current_price_usd: number
          id: string
          qty: number
          symbol: string
          user_id: string
        }
        Insert: {
          avg_price_usd: number
          coingecko_id: string
          current_price_usd: number
          id?: string
          qty: number
          symbol: string
          user_id: string
        }
        Update: {
          avg_price_usd?: number
          coingecko_id?: string
          current_price_usd?: number
          id?: string
          qty?: number
          symbol?: string
          user_id?: string
        }
        Relationships: []
      }
      funds: {
        Row: {
          contributions_pyg: number
          current_value_pyg: number
          id: string
          name: string
          user_id: string
        }
        Insert: {
          contributions_pyg?: number
          current_value_pyg?: number
          id?: string
          name: string
          user_id: string
        }
        Update: {
          contributions_pyg?: number
          current_value_pyg?: number
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      installments: {
        Row: {
          amount: number
          due_date: string
          id: string
          number: number
          of: number
          paid: boolean
          transaction_id: string
          user_id: string
        }
        Insert: {
          amount: number
          due_date: string
          id?: string
          number: number
          of: number
          paid?: boolean
          transaction_id: string
          user_id: string
        }
        Update: {
          amount?: number
          due_date?: string
          id?: string
          number?: number
          of?: number
          paid?: boolean
          transaction_id?: string
          user_id?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          exchange_rate: number
          user_id: string
        }
        Insert: {
          exchange_rate?: number
          user_id: string
        }
        Update: {
          exchange_rate?: number
          user_id?: string
        }
        Relationships: []
      }
      stocks: {
        Row: {
          avg_price_usd: number
          current_price_usd: number
          id: string
          name: string
          qty: number
          symbol: string
          user_id: string
        }
        Insert: {
          avg_price_usd: number
          current_price_usd: number
          id?: string
          name: string
          qty: number
          symbol: string
          user_id: string
        }
        Update: {
          avg_price_usd?: number
          current_price_usd?: number
          id?: string
          name?: string
          qty?: number
          symbol?: string
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          account_id: string | null
          amount: number
          card_id: string | null
          category: string
          concept: string
          created_at: string
          date: string
          id: string
          installments: number | null
          method: string
          type: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          card_id?: string | null
          category: string
          concept: string
          created_at?: string
          date?: string
          id?: string
          installments?: number | null
          method: string
          type: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          card_id?: string | null
          category?: string
          concept?: string
          created_at?: string
          date?: string
          id?: string
          installments?: number | null
          method?: string
          type?: string
          user_id?: string
        }
        Relationships: []
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
