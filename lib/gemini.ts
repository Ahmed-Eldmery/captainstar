// Initialize Gemini API
// Priority: 1. Global DB Key (cached in localStorage), 2. localStorage, 3. env variable
import { supabase } from './supabase';

// Get API key with priority: DB global key > localStorage > env
const getApiKey = async (): Promise<string> => {
    // First try localStorage (might be synced from DB)
    const storedKey = localStorage.getItem('gemini_api_key');
    if (storedKey) return storedKey;

    // Try to fetch from database
    try {
        const { data } = await supabase.from('agency_settings').select('value').eq('key', 'gemini_api_key').single();
        if (data?.value) {
            // Cache in localStorage for faster subsequent requests
            localStorage.setItem('gemini_api_key', data.value);
            return data.value;
        }
    } catch (e) {
        console.log('No global API key found in database');
    }

    // Fallback to env variable
    return import.meta.env.VITE_GEMINI_API_KEY || '';
};

export const generateAIResponse = async (
    message: string,
    history: { role: 'user' | 'model'; parts: { text: string }[] }[] = []
): Promise<string> => {
    const API_KEY = await getApiKey();

    if (!API_KEY) {
        return 'عذراً، لم يتم إعداد مفتاح API الخاص بالذكاء الاصطناعي. يرجى الاتصال بالمسؤول لإعداد المفتاح العام.';
    }

    try {
        // Direct REST API call to avoid package compatibility issues
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

        // Convert history to format expected by API
        const contents = history.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: msg.parts
        }));

        // Add the new message
        contents.push({
            role: 'user',
            parts: [{ text: message }]
        });

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ contents })
        });

        if (!response.ok) {
            console.error('Gemini API Error:', response.statusText);
            throw new Error(`API Error: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.candidates && data.candidates.length > 0 && data.candidates[0].content && data.candidates[0].content.parts) {
            return data.candidates[0].content.parts[0].text;
        } else {
            return 'عذراً، لم أتمكن من فهم ذلك.';
        }

    } catch (error) {
        console.error('Error generating AI response:', error);
        return 'عذراً، حدث خطأ أثناء الاتصال بالذكاء الاصطناعي. يرجى المحاولة مرة أخرى لاحقاً.';
    }
};

