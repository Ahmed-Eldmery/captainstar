
import { createClient } from '@supabase/supabase-js';

// قراءة القيم من Environment Variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://cofozykudhagnpjepkvp.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvZm96eWt1ZGhhZ25wamVwa3ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMzk4NjgsImV4cCI6MjA4MzgxNTg2OH0.v6_iBr4f0g4K4RgI_dZvZgkoheMfNV1HXsLAUCr_UHU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Generate UUID v4 compatible with Supabase
export const generateId = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Helper function to convert camelCase to snake_case
const toSnakeCase = (obj: any): any => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(toSnakeCase);

  const result: any = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      result[snakeKey] = obj[key];
    }
  }
  return result;
};

// Helper function to convert snake_case to camelCase
const toCamelCase = (obj: any): any => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(toCamelCase);

  const result: any = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
      result[camelKey] = obj[key];
    }
  }
  return result;
};

export const db = {
  async getAll(table: string) {
    const { data, error } = await supabase.from(table).select('*').order('created_at', { ascending: false });
    if (error) {
      console.error(`خطأ جلب من ${table}:`, error);
      throw error;
    }
    return (data || []).map(toCamelCase);
  },
  async insert(table: string, content: any) {
    const snakeCaseContent = toSnakeCase(content);
    console.log(`🔄 حفظ إلى ${table}:`, snakeCaseContent);
    const { data, error } = await supabase.from(table).insert(snakeCaseContent).select();
    if (error) {
      console.error(`❌ خطأ الحفظ في ${table}:`, error);
      throw error;
    }
    console.log(`✅ تم حفظ إلى ${table} بنجاح`);
    return toCamelCase(data[0]);
  },
  async update(table: string, id: string, content: any) {
    const snakeCaseContent = toSnakeCase(content);
    console.log(`🔄 تحديث في ${table}:`, snakeCaseContent);
    const { data, error } = await supabase.from(table).update(snakeCaseContent).eq('id', id).select();
    if (error) {
      console.error(`❌ خطأ التحديث في ${table}:`, error);
      throw error;
    }
    console.log(`✅ تم تحديث ${table} بنجاح`);
    return toCamelCase(data[0]);
  },
  async delete(table: string, id: string) {
    console.log(`🔄 حذف من ${table}:`, id);
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) {
      console.error(`❌ خطأ الحذف من ${table}:`, error);
      throw error;
    }
    console.log(`✅ تم الحذف من ${table} بنجاح`);
    return true;
  },
  async logActivity(userId: string, action: string, entityType?: string, entityId?: string) {
    try {
      await this.insert('activity_logs', {
        id: generateId(),
        userId,
        action,
        entityType: entityType || '',
        entityId: entityId || '',
        createdAt: new Date().toISOString()
      });
    } catch (err) {
      console.warn('تحذير: فشل تسجيل النشاط', err);
    }
  }
};

export const storage = {
  async uploadFile(file: File, path: string) {
    const { data, error } = await supabase.storage.from('assets').upload(path, file, {
      cacheControl: '3600',
      upsert: true
    });
    if (error) throw error;
    const { data: urlData } = supabase.storage.from('assets').getPublicUrl(data.path);
    return urlData.publicUrl;
  },
  async deleteFile(path: string) {
    const { error } = await supabase.storage.from('assets').remove([path]);
    if (error) throw error;
  }
};
