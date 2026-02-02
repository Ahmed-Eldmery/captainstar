
import React, { useState, useRef, useEffect } from 'react';
import {
  File, FileText, FileImage, FileVideo,
  Search, Download, Plus, Grid, List, X, Loader2, Trash2,
  HardDrive, ShieldCheck, Zap, Globe
} from 'lucide-react';
import { User, FileAsset } from '../types';
import { db, storage, generateId } from '../lib/supabase';
import { saveFileToDB, getFileFromDB, deleteFileFromDB } from '../lib/db';

interface FilesProps {
  user: User;
  files: FileAsset[];
  setFiles: React.Dispatch<React.SetStateAction<FileAsset[]>>;
}

const FilesPage: React.FC<FilesProps> = ({ user, files, setFiles }) => {
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredFiles = files.filter(f =>
    f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.client.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(10); // بدأت المعالجة

    const fileId = generateId();
    const filePath = `agency-assets/${fileId}_${file.name}`;

    try {
      // 1. الرفع لـ Supabase Storage (الجودة الأصلية 100%)
      const publicUrl = await storage.uploadFile(file, filePath);
      setUploadProgress(60);

      // 2. الحفظ في IndexedDB (للسرعة القصوى في المعاينة لاحقاً)
      await saveFileToDB({
        id: fileId,
        blob: file,
        name: file.name
      });
      setUploadProgress(80);

      // 3. التسجيل في قاعدة البيانات السحابية
      const fileData: FileAsset = {
        id: fileId,
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        type: file.type.startsWith('image/') ? 'image' :
          file.type.startsWith('video/') ? 'video' : 'document',
        client: 'كابتن ستار',
        date: new Date().toISOString().split('T')[0],
        url: publicUrl
      };

      await db.insert('file_assets', fileData);

      // تسجيل النشاط
      await db.logActivity(user.id, `رفع ملف جديد: ${file.name}`, 'File', fileId);

      setFiles(prev => [fileData, ...prev]);
      setUploadProgress(100);

      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);

    } catch (err: any) {
      console.error('File Upload Error:', err);
      // alert specific error if possible
      let msg = err.message || 'خطأ غير معروف';
      if (msg.includes('row-level security')) msg = 'خطأ صلاحيات (RLS). يرجى التأكد من سياسات التخزين.';
      if (msg.includes('Bucket not found')) msg = 'لم يتم العثور على مجلد "assets" في التخزين.';

      alert(`فشل الرفع: ${msg}. \nيرجى التأكد من إعدادات Supabase Storage.`);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDownload = (file: FileAsset) => {
    if (!file.url) {
      alert('رابط الملف غير متوفر');
      return;
    }
    const a = document.createElement('a');
    a.href = file.url;
    a.download = file.name;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDeleteFile = async (id: string) => {
    if (!confirm('هل تريد حذف هذا الملف من السحابة نهائياً؟')) return;

    try {
      await db.delete('file_assets', id);
      await deleteFileFromDB(id);

      const file = files.find(f => f.id === id);
      // تسجيل النشاط
      if (file) await db.logActivity(user.id, `حذف ملف: ${file.name}`, 'File', id);

      setFiles(prev => prev.filter(f => f.id !== id));
    } catch (err) {
      alert('فشل الحذف من السحابة');
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
            المستودع السحابي <Globe className="text-blue-600 animate-pulse" />
          </h1>
          <p className="text-slate-500 mt-2 font-bold flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" /> ملفاتك محمية ومخزنة بجودتها الخام على Supabase.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="bg-slate-900 text-white px-10 py-5 rounded-[2rem] font-black shadow-2xl hover:bg-rose-600 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
          >
            {isUploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Plus className="w-6 h-6 text-rose-500" />}
            <span>{isUploading ? 'جاري المزامنة السحابية...' : 'رفع جودة أصلية'}</span>
          </button>
        </div>
      </div>

      {isUploading && (
        <div className="bg-white p-10 rounded-[3rem] border-2 border-rose-100 shadow-2xl animate-in slide-in-from-top-4 duration-500">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-rose-600 animate-pulse" />
              </div>
              <div>
                <span className="font-black text-slate-900 block text-lg">جاري الرفع للسحابة...</span>
                <span className="text-xs font-bold text-slate-400">تخزين آمن ومستقر 100%</span>
              </div>
            </div>
            <span className="text-rose-600 font-black text-2xl">{uploadProgress}%</span>
          </div>
          <div className="h-4 bg-slate-100 rounded-full overflow-hidden border border-slate-50 p-1">
            <div
              className="h-full bg-rose-600 rounded-full transition-all duration-300 shadow-lg shadow-rose-200"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/20 flex flex-col md:flex-row gap-6 items-center justify-between">
        <div className="flex items-center gap-6 flex-1 w-full">
          <div className="relative flex-1 group">
            <Search className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-rose-500 transition-colors" />
            <input
              type="text"
              placeholder="ابحث في السحابة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-14 pl-6 py-4 bg-slate-100/50 border-0 rounded-2xl text-sm font-bold outline-none focus:bg-white transition-all shadow-inner"
            />
          </div>
        </div>
        <div className="bg-slate-100 p-1.5 rounded-2xl flex items-center">
          <button onClick={() => setView('grid')} className={`p-3 rounded-xl transition-all ${view === 'grid' ? 'bg-white shadow-lg text-rose-600' : 'text-slate-400'}`}><Grid className="w-5 h-5" /></button>
          <button onClick={() => setView('list')} className={`p-3 rounded-xl transition-all ${view === 'list' ? 'bg-white shadow-lg text-rose-600' : 'text-slate-400'}`}><List className="w-5 h-5" /></button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {filteredFiles.map(file => (
          <div key={file.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl p-6 hover:shadow-2xl hover:border-rose-100 transition-all group cursor-pointer relative overflow-hidden">
            <div className="aspect-square bg-slate-50 rounded-[2rem] flex items-center justify-center mb-6 relative overflow-hidden shadow-inner border border-slate-100">
              {file.type === 'image' && file.url ? (
                <img src={file.url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              ) : file.type === 'image' ? <FileImage className="w-12 h-12 text-blue-500" /> : file.type === 'video' ? <FileVideo className="w-12 h-12 text-purple-500" /> : <FileText className="w-12 h-12 text-rose-500" />}

              <div className="absolute inset-0 bg-slate-900/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-[2px]">
                <button
                  onClick={() => handleDownload(file)}
                  className="p-5 bg-white rounded-[1.25rem] hover:bg-rose-50 text-slate-900 shadow-2xl transition-all active:scale-90 flex flex-col items-center gap-2"
                >
                  <Download className="w-6 h-6" />
                  <span className="text-[10px] font-black uppercase">تنزيل الأصل</span>
                </button>
                <button
                  onClick={() => handleDeleteFile(file.id)}
                  className="p-5 bg-rose-600 rounded-[1.25rem] hover:bg-rose-700 text-white shadow-2xl transition-all active:scale-90"
                >
                  <Trash2 className="w-6 h-6" />
                </button>
              </div>
            </div>
            <h3 className="text-sm font-black text-slate-900 truncate mb-2 pr-2" title={file.name}>{file.name}</h3>
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-black uppercase tracking-widest pr-2">
              <span className="flex items-center gap-1"><HardDrive className="w-3 h-3" /> {file.size}</span>
              <span className="text-rose-500 font-black tracking-tighter">{file.client}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FilesPage;
