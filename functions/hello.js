// netlify/functions/supabase-data.js
import { createClient } from '@supabase/supabase-js';

// Netlify automatycznie wstrzykuje zmienne środowiskowe
const SUPABASE_URL = process.env.SUPABASE_URL;
// Użyj klucza Service Role (lub innego klucza z uprawnieniami)
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY; 

// Utwórz klienta Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

export async function handler(event, context) {
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        // Przykład zapytania: pobierz dane z tabeli 'items'
        const { data, error } = await supabase
            .from('pytania') // Zmień na nazwę swojej tabeli
            .select('*');

        if (error) {
            console.error('Supabase Error:', error);
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Failed to fetch data' }),
            };
        }

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        };
    } catch (error) {
        console.error('General Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Server error' }),
        };
    }
}
