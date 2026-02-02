// Initialize Gemini API
// Note: This requires VITE_GEMINI_API_KEY to be set in .env
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

export const generateAIResponse = async (
    message: string,
    history: { role: 'user' | 'model'; parts: { text: string }[] }[] = []
): Promise<string> => {
    if (!API_KEY) {
        return 'عذراً، لم يتم إعداد مفتاح API الخاص بالذكاء الاصطناعي. يرجى التأكد من إعداد VITE_GEMINI_API_KEY في ملف .env';
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
