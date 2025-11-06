// netlify/functions/get-quiz.js
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ... (resztę kodu inicjalizacyjnego zostawiamy bez zmian)
const ALLOWED_CATEGORIES = ["Arkusz1", "Geologia", "Informatyka", "Historia"];
const DEFAULT_CATEGORY = ALLOWED_CATEGORIES[0];
const STATS_ROW_ID = 1; 

export async function handler(event, context) {
    // ZAWSZE dodaj ten nagłówek dla wszystkich odpowiedzi preflight/request!
    const CORS_HEADERS = {
        'Access-Control-Allow-Origin': '*', // <--- TO JEST KLUCZ DO NAPRAWY "FAILED TO FETCH"
        'Content-Type': 'application/json',
        'Access-Control-Allow-Methods': 'GET, OPTIONS', // Dobra praktyka
        'Access-Control-Allow-Headers': 'Content-Type', // Dobra praktyka
    };
    
    // W przypadku żądania OPTIONS (tzw. preflight request), po prostu zwróć nagłówki CORS
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: CORS_HEADERS,
            body: ''
        };
    }

    if (event.httpMethod !== 'GET') {
        return { 
            statusCode: 405, 
            headers: CORS_HEADERS, // Dodajemy nagłówki nawet przy błędzie 405
            body: 'Method Not Allowed' 
        };
    }

    try {
        // ... (Logika: kategoria, pobieranie pytań, losowanie, formatowanie wyniku - bez zmian) ...
        
        const requestedCategory = event.queryStringParameters.category;
        let kategoriaDoZapytania;

        if (requestedCategory && ALLOWED_CATEGORIES.includes(requestedCategory)) {
            kategoriaDoZapytania = requestedCategory;
        } else {
            kategoriaDoZapytania = DEFAULT_CATEGORY;
        }

        const { data: allQuestions, error: questionsError } = await supabase
            .from('pytania')
            .select('*')
            .eq('kategoria', kategoriaDoZapytania);

        if (questionsError) {
            console.error('Supabase Questions Error:', questionsError);
            throw new Error(`Błąd przy pobieraniu pytań: ${questionsError.message}`);
        }

        let count = parseInt(event.queryStringParameters.count) || 1;

        if (count > allQuestions.length) {
            count = allQuestions.length;
        }

        const shuffled = allQuestions.sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, count);

        const questions = selected.map(row => ({
            id: row.id,
            pytanie: row.pytanie,
            poprawna_odp: row.poprawna_odp,
            zle_odp: [row.zla_odp_1, row.zla_odp_2, row.zla_odp_3]
        }));

        // ... (Logika licznika - bez zmian) ...
        
        let totalAsked = 0;

        if (count > 0) {
            const { data: newTotal, error: rpcError } = await supabase
                .rpc('increment_razem_zadanych', { 
                    ilosc: count, 
                    row_id: STATS_ROW_ID 
                });

            if (rpcError) {
                console.error('Supabase RPC Error (Stats):', rpcError);
                totalAsked = -1;
            } else {
                totalAsked = newTotal;
            }
        } else {
            const { data: statsData, error: statsError } = await supabase
                .from('stats')
                .select('razem_zadanych')
                .eq('id', STATS_ROW_ID)
                .single();
            
            if (statsError || !statsData) {
                totalAsked = 0;
            } else {
                totalAsked = statsData.razem_zadanych;
            }
        }

        // --- Zwrócenie Danych Z NAGŁÓWKIEM CORS ---
        return {
            statusCode: 200,
            headers: CORS_HEADERS, // <--- TUTAJ TEŻ!
            body: JSON.stringify({
                kategoria: kategoriaDoZapytania,
                ilosc: questions.length,
                pytania: questions,
                razem_zadanych: totalAsked
            }),
        };

    } catch (error) {
        console.error('General Error:', error);
        return {
            statusCode: 500,
            headers: CORS_HEADERS, // <--- I TUTAJ!
            body: JSON.stringify({ error: error.message || 'Server error' }),
        };
    }
}
