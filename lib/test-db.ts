import { supabase } from './supabase';

export const testDatabaseConnection = async () => {
  console.log('🧪 جاري اختبار الاتصال بقاعدة البيانات...\n');
  
  const tables = ['users', 'clients', 'projects', 'tasks', 'community_posts', 'file_assets'];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        console.error(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: موجود وعامل`);
      }
    } catch (err: any) {
      console.error(`❌ ${table}: ${err.message}`);
    }
  }
  
  console.log('\n✨ انتهى الاختبار');
};

// اختبر عند تحميل الصفحة
if (typeof window !== 'undefined') {
  testDatabaseConnection();
}
