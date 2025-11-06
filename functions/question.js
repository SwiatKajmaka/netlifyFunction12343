// netlify/functions/get-quiz.js
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// 1. Lista dozwolonych kategorii (taka sama jak w Twoim skrypcie)
const ALLOWED_CATEGORIES = ["Arkusz1", "Geologia", "Informatyka", "Historia"];
const DEFAULT_CATEGORY = ALLOWED_CATEGORIES[0];

// 2. ID wiersza w tabeli 'stats', który przechowuje licznik
const STATS_ROW_ID = 1; // Załóżmy, że licznik jest w wierszu o id = 1

export async function handler(event, context) {
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        // --- Logika Kategorii ---
        const requestedCategory = event.queryStringParameters.category;
        let kategoriaDoZapytania;

        if (requestedCategory && ALLOWED_CATEGORIES.includes(requestedCategory)) {
            kategoriaDoZapytania = requestedCategory;
        } else {
            kategoriaDoZapytania = DEFAULT_CATEGORY;
        }

        // --- Pobieranie Pytań ---
        // Pobierz WSZYSTKIE pytania z danej kategorii, aby móc je pomieszać
        const { data: allQuestions, error: questionsError } = await supabase
            .from('pytania')
            .select('*')
            .eq('kategoria', kategoriaDoZapytania);

        if (questionsError) {
            console.error('Supabase Questions Error:', questionsError);
            throw new Error(`Błąd przy pobieraniu pytań: ${questionsError.message}`);
        }

        // --- Logika Losowania i Liczby Pytań ---
        let count = parseInt(event.queryStringParameters.count) || 1;

        // Ogranicz liczbę pytań do dostępnej puli
        if (count > allQuestions.length) {
            count = allQuestions.length;
        }

        // Losuj pytania (tak jak w Twoim skrypcie, mieszamy w JS)
        const shuffled = allQuestions.sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, count);

        // --- Formatowanie Wyniku ---
        // Dopasuj do schematu: id, pytanie, poprawna_odp, zle_odp: [tablica]
        const questions = selected.map(row => ({
            id: row.id,
            pytanie: row.pytanie,
            poprawna_odp: row.poprawna_odp,
            zle_odp: [row.zla_odp_1, row.zla_odp_2, row.zla_odp_3]
        }));

        // --- Aktualizacja Licznika ---
        // Użyj funkcji RPC 'increment_razem_zadanych' (którą zdefiniujesz w kroku 2)
        // aby atomowo zwiększyć licznik o 'count' (rzeczywistą liczbę zwróconych pytań)
        
        let totalAsked = 0;

        if (count > 0) {
            const { data: newTotal, error: rpcError } = await supabase
                .rpc('increment_razem_zadanych', { 
                    ilosc: count, 
                    row_id: STATS_ROW_ID 
                });

            if (rpcError) {
                // Jeśli aktualizacja licznika się nie uda, zaloguj błąd, 
                // ale WCIĄŻ ZWRÓĆ pytania, tak jak robiłby to skrypt Google
                console.error('Supabase RPC Error (Stats):', rpcError);
                totalAsked = -1; // Zwróć -1, aby zasygnalizować błąd licznika
            } else {
                totalAsked = newTotal;
            }
        } else {
            // Jeśli nie pobrano pytań, po prostu pobierz aktualną wartość licznika
            const { data: statsData, error: statsError } = await supabase
                .from('stats')
                .select('razem_zadanych')
                .eq('id', STATS_ROW_ID)
                .single();
            
            if (statsError || !statsData) {
                totalAsked = 0; // Załóż 0, jeśli tabela stats jest pusta
            } else {
                totalAsked = statsData.razem_zadanych;
            }
        }

        // --- Zwrócenie Danych ---
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
            },
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
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: error.message || 'Server error' }),
        };
    }
}
