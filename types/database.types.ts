export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "packed"
  | "shipped"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "refunded"
  | "payment_failed";

export type PaymentMethod = "razorpay" | "cod";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export type DiscountType = "percentage" | "flat";

export type StockStatus = "in_stock" | "out_of_stock" | "backorder" | "made_to_measure";

export type AddressType = "home" | "work" | "other";

export type AdminRole = "owner" | "staff";

export type HomepageSectionType =
  | "hero_banner"
  | "featured_products"
  | "category_grid"
  | "testimonials"
  | "couture_spotlight"
  | "custom_html";

export type Database = {
  public: {
    Tables: {
      admin_users: {
        Row: {
          id: string;
          role: AdminRole;
          full_name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role?: AdminRole;
          full_name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          role?: AdminRole;
          full_name?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      customers: {
        Row: {
          id: string;
          full_name: string;
          phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      addresses: {
        Row: {
          id: string;
          customer_id: string;
          full_name: string;
          phone: string;
          address_line1: string;
          address_line2: string | null;
          city: string;
          state: string;
          pincode: string;
          is_default: boolean;
          address_type: AddressType;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          full_name: string;
          phone: string;
          address_line1: string;
          address_line2?: string | null;
          city: string;
          state: string;
          pincode: string;
          is_default?: boolean;
          address_type?: AddressType;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          full_name?: string;
          phone?: string;
          address_line1?: string;
          address_line2?: string | null;
          city?: string;
          state?: string;
          pincode?: string;
          is_default?: boolean;
          address_type?: AddressType;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "addresses_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
        ];
      };

      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          image_url: string | null;
          display_order: number;
          is_active: boolean;
          parent_id: string | null;
          seo_title: string | null;
          seo_description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          image_url?: string | null;
          display_order?: number;
          is_active?: boolean;
          parent_id?: string | null;
          seo_title?: string | null;
          seo_description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          image_url?: string | null;
          display_order?: number;
          is_active?: boolean;
          parent_id?: string | null;
          seo_title?: string | null;
          seo_description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };

      products: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          category_id: string | null;
          base_price: number;
          compare_at_price: number | null;
          fabric: string | null;
          care_instructions: string | null;
          craftsmanship: string | null;
          is_active: boolean;
          is_featured: boolean;
          is_made_to_order: boolean;
          stock_status: StockStatus;
          weight_grams: number | null;
          length_cm: number | null;
          width_cm: number | null;
          height_cm: number | null;
          hsn_code: string | null;
          gst_rate: number;
          blouse_included: boolean | null;
          saree_length_meters: number | null;
          seo_title: string | null;
          seo_description: string | null;
          seo_keywords: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          category_id?: string | null;
          base_price: number;
          compare_at_price?: number | null;
          fabric?: string | null;
          care_instructions?: string | null;
          craftsmanship?: string | null;
          is_active?: boolean;
          is_featured?: boolean;
          is_made_to_order?: boolean;
          stock_status?: StockStatus;
          weight_grams?: number | null;
          length_cm?: number | null;
          width_cm?: number | null;
          height_cm?: number | null;
          hsn_code?: string | null;
          gst_rate?: number;
          blouse_included?: boolean | null;
          saree_length_meters?: number | null;
          seo_title?: string | null;
          seo_description?: string | null;
          seo_keywords?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          category_id?: string | null;
          base_price?: number;
          compare_at_price?: number | null;
          fabric?: string | null;
          care_instructions?: string | null;
          craftsmanship?: string | null;
          is_active?: boolean;
          is_featured?: boolean;
          is_made_to_order?: boolean;
          stock_status?: StockStatus;
          weight_grams?: number | null;
          length_cm?: number | null;
          width_cm?: number | null;
          height_cm?: number | null;
          hsn_code?: string | null;
          gst_rate?: number;
          blouse_included?: boolean | null;
          saree_length_meters?: number | null;
          seo_title?: string | null;
          seo_description?: string | null;
          seo_keywords?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };

      product_variants: {
        Row: {
          id: string;
          product_id: string;
          size: string;
          color: string;
          color_hex: string | null;
          sku: string;
          stock_quantity: number;
          price_override: number | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          size: string;
          color: string;
          color_hex?: string | null;
          sku: string;
          stock_quantity?: number;
          price_override?: number | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          size?: string;
          color?: string;
          color_hex?: string | null;
          sku?: string;
          stock_quantity?: number;
          price_override?: number | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };

      product_images: {
        Row: {
          id: string;
          product_id: string;
          variant_id: string | null;
          image_url: string;
          alt_text: string | null;
          display_order: number;
          is_primary: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          variant_id?: string | null;
          image_url: string;
          alt_text?: string | null;
          display_order?: number;
          is_primary?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          variant_id?: string | null;
          image_url?: string;
          alt_text?: string | null;
          display_order?: number;
          is_primary?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_images_variant_id_fkey";
            columns: ["variant_id"];
            isOneToOne: false;
            referencedRelation: "product_variants";
            referencedColumns: ["id"];
          },
        ];
      };

      size_charts: {
        Row: {
          id: string;
          name: string;
          category_id: string | null;
          product_id: string | null;
          chart_data: Json;
          measurement_unit: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          category_id?: string | null;
          product_id?: string | null;
          chart_data?: Json;
          measurement_unit?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          category_id?: string | null;
          product_id?: string | null;
          chart_data?: Json;
          measurement_unit?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "size_charts_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "size_charts_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };

      orders: {
        Row: {
          id: string;
          order_number: string;
          customer_id: string | null;
          status: OrderStatus;
          payment_method: PaymentMethod;
          payment_status: PaymentStatus;
          subtotal: number;
          shipping_charge: number;
          discount_amount: number;
          total_amount: number;
          shipping_address: Json;
          billing_address: Json | null;
          razorpay_order_id: string | null;
          razorpay_payment_id: string | null;
          razorpay_signature: string | null;
          coupon_code: string | null;
          notes: string | null;
          cancel_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_number?: string;
          customer_id?: string | null;
          status?: OrderStatus;
          payment_method?: PaymentMethod;
          payment_status?: PaymentStatus;
          subtotal: number;
          shipping_charge?: number;
          discount_amount?: number;
          total_amount: number;
          shipping_address: Json;
          billing_address?: Json | null;
          razorpay_order_id?: string | null;
          razorpay_payment_id?: string | null;
          razorpay_signature?: string | null;
          coupon_code?: string | null;
          notes?: string | null;
          cancel_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_number?: string;
          customer_id?: string | null;
          status?: OrderStatus;
          payment_method?: PaymentMethod;
          payment_status?: PaymentStatus;
          subtotal?: number;
          shipping_charge?: number;
          discount_amount?: number;
          total_amount?: number;
          shipping_address?: Json;
          billing_address?: Json | null;
          razorpay_order_id?: string | null;
          razorpay_payment_id?: string | null;
          razorpay_signature?: string | null;
          coupon_code?: string | null;
          notes?: string | null;
          cancel_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
        ];
      };

      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string | null;
          variant_id: string | null;
          product_name_snapshot: string;
          variant_details_snapshot: Json;
          unit_price: number;
          quantity: number;
          subtotal: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id?: string | null;
          variant_id?: string | null;
          product_name_snapshot: string;
          variant_details_snapshot?: Json;
          unit_price: number;
          quantity: number;
          subtotal: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string | null;
          variant_id?: string | null;
          product_name_snapshot?: string;
          variant_details_snapshot?: Json;
          unit_price?: number;
          quantity?: number;
          subtotal?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_variant_id_fkey";
            columns: ["variant_id"];
            isOneToOne: false;
            referencedRelation: "product_variants";
            referencedColumns: ["id"];
          },
        ];
      };

      order_status_history: {
        Row: {
          id: string;
          order_id: string;
          status: OrderStatus;
          note: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          status: OrderStatus;
          note?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          status?: OrderStatus;
          note?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "order_status_history_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };

      coupons: {
        Row: {
          id: string;
          code: string;
          discount_type: DiscountType;
          discount_value: number;
          min_order_value: number;
          max_discount_amount: number | null;
          usage_limit: number | null;
          usage_count: number;
          valid_from: string;
          valid_until: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          discount_type: DiscountType;
          discount_value: number;
          min_order_value?: number;
          max_discount_amount?: number | null;
          usage_limit?: number | null;
          usage_count?: number;
          valid_from?: string;
          valid_until: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          discount_type?: DiscountType;
          discount_value?: number;
          min_order_value?: number;
          max_discount_amount?: number | null;
          usage_limit?: number | null;
          usage_count?: number;
          valid_from?: string;
          valid_until?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      reviews: {
        Row: {
          id: string;
          product_id: string;
          customer_id: string | null;
          customer_name: string;
          rating: number;
          title: string | null;
          comment: string;
          is_verified_purchase: boolean;
          is_approved: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          customer_id?: string | null;
          customer_name: string;
          rating: number;
          title?: string | null;
          comment: string;
          is_verified_purchase?: boolean;
          is_approved?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          customer_id?: string | null;
          customer_name?: string;
          rating?: number;
          title?: string | null;
          comment?: string;
          is_verified_purchase?: boolean;
          is_approved?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reviews_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reviews_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };

      wishlists: {
        Row: {
          id: string;
          customer_id: string;
          product_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          product_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          product_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "wishlists_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wishlists_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };

      site_settings: {
        Row: {
          key: string;
          value: Json;
          description: string | null;
          is_public: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          key: string;
          value: Json;
          description?: string | null;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          key?: string;
          value?: Json;
          description?: string | null;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      homepage_sections: {
        Row: {
          id: string;
          section_type: HomepageSectionType;
          title: string | null;
          display_order: number;
          is_active: boolean;
          content: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          section_type: HomepageSectionType;
          title?: string | null;
          display_order?: number;
          is_active?: boolean;
          content?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          section_type?: HomepageSectionType;
          title?: string | null;
          display_order?: number;
          is_active?: boolean;
          content?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      is_admin_owner: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      generate_order_number: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
    };
    Enums: {
      order_status: OrderStatus;
      payment_method: PaymentMethod;
      payment_status: PaymentStatus;
      discount_type: DiscountType;
      stock_status: StockStatus;
      address_type: AddressType;
      admin_role: AdminRole;
      homepage_section_type: HomepageSectionType;
    };
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
export type Enums<T extends keyof Database["public"]["Enums"]> = Database["public"]["Enums"][T];
