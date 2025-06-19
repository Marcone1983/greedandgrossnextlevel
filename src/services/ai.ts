import axios from 'axios';
import { CrossRequest, CrossResult, Strain } from '@/types';
import { checkCachedCross, saveCachedCross } from './firebase';
import { generateStrainId } from '@/utils/helpers';
import { OPENAI_API_KEY } from '@env';
import memoryService from './memoryService';

const OPENAI_MODEL = 'gpt-4o-mini';

const GREED_GROSS_PROMPT = `Esperto breeder, genetista, farmacista, erborista, agronomo
Sono GREED & GROSS, un esperto genetista della cannabis. La mia specializzazione è nel breeding e backcrossing della cannabis, con una conoscenza approfondita di ogni strain esistente, dei loro alberi genealogici, dei relativi fenotipi, flavonoidi, antocianine, terpeni, e degli effetti corrispondenti. Il mio obiettivo è creare un videogioco che funga da simulatore per lo sviluppo di nuove genetiche di cannabis. Questo gioco consentirà ai breeder di tutto il mondo di simulare la creazione di nuovi strain, esplorando le possibilità genetiche, le resistenze, i tempi di crescita e di fioritura, e l'impatto dei terpeni come pinene e limonene sui sapori. La simulazione predittiva sarà uno strumento preciso e dettagliato che aiuta a prevedere l'outcome di incroci reali, fornendo un ambiente esperto per testare le combinazioni prima di procedere nella realtà. Il mio compito è eseguire ricerche approfondite su tutti gli strain esistenti e diventare un esperto di queste informazioni, integrandole nel ambiente per renderlo un simulatore realistico e accurato della genetica della cannabis.`;

export async function performCrossBreeding(request: CrossRequest, contextPrompt?: string): Promise<CrossResult> {
  try {
    // Check cache first
    const cached = await checkCachedCross(request.parentA, request.parentB);
    if (cached) {
      return {
        request,
        result: cached,
        prediction: {
          confidence: 95,
          alternativePhenotypes: [],
          warnings: [],
        },
        cached: true,
        timestamp: new Date(),
      };
    }

    // Get user context if available
    let userContext = '';
    if (contextPrompt) {
      userContext = `\n\nContesto utente: ${contextPrompt}. Considera le preferenze dell'utente nella previsione.`;
    }

    // Call OpenAI API
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: GREED_GROSS_PROMPT + userContext,
          },
          {
            role: 'user',
            content: `Simula l'incrocio genetico tra ${request.parentA} e ${request.parentB}. 
            Fornisci una previsione dettagliata del risultato includendo:
            - Nome del nuovo strain
            - Tipo (sativa/indica/hybrid) e percentuali
            - Livelli di THC e CBD previsti
            - Profilo terpenico completo con percentuali
            - Effetti attesi
            - Sapori dominanti
            - Tempo di fioritura
            - Resa prevista
            - Difficoltà di coltivazione
            - Resistenze
            - Fenotipi dominanti
            
            Rispondi in formato JSON strutturato.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const aiResponse = JSON.parse(response.data.choices[0].message.content);
    
    const strain: Strain = {
      id: generateStrainId(),
      name: aiResponse.name || `${request.parentA} x ${request.parentB}`,
      parentA: request.parentA,
      parentB: request.parentB,
      type: aiResponse.type || 'hybrid',
      thc: aiResponse.thc || 18,
      cbd: aiResponse.cbd || 0.5,
      terpenes: aiResponse.terpenes || [
        { name: 'Myrcene', percentage: 0.5, effects: ['Sedating', 'Muscle relaxant'] },
        { name: 'Limonene', percentage: 0.3, effects: ['Mood elevation', 'Stress relief'] },
        { name: 'Pinene', percentage: 0.2, effects: ['Alertness', 'Memory retention'] },
      ],
      effects: aiResponse.effects || ['Relaxed', 'Happy', 'Creative'],
      flavors: aiResponse.flavors || ['Earthy', 'Citrus', 'Pine'],
      genetics: {
        phenotypes: aiResponse.phenotypes || ['Dense buds', 'Purple hues'],
        floweringTime: aiResponse.floweringTime || 9,
        yield: aiResponse.yield || 'Medium-High',
        difficulty: aiResponse.difficulty || 'medium',
        resistance: aiResponse.resistance || ['Mold', 'Pests'],
        dominantTraits: aiResponse.dominantTraits || ['High resin production'],
      },
      createdBy: request.userId,
      createdAt: new Date(),
      popularity: 0,
    };

    // Save to cache
    await saveCachedCross(strain);

    return {
      request,
      result: strain,
      prediction: {
        confidence: 85,
        alternativePhenotypes: aiResponse.alternativePhenotypes || [],
        warnings: aiResponse.warnings || [],
      },
      cached: false,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('AI Cross Error:', error);
    
    // Fallback response
    return {
      request,
      result: generateFallbackStrain(request),
      prediction: {
        confidence: 50,
        alternativePhenotypes: [],
        warnings: ['Risultato generato offline'],
      },
      cached: false,
      timestamp: new Date(),
    };
  }
}

function generateFallbackStrain(request: CrossRequest): Strain {
  return {
    id: generateStrainId(),
    name: `${request.parentA} x ${request.parentB}`,
    parentA: request.parentA,
    parentB: request.parentB,
    type: 'hybrid',
    thc: Math.floor(Math.random() * 10) + 15,
    cbd: Math.random() * 2,
    terpenes: [
      { name: 'Myrcene', percentage: 0.4, effects: ['Relaxing'] },
      { name: 'Caryophyllene', percentage: 0.3, effects: ['Anti-inflammatory'] },
      { name: 'Linalool', percentage: 0.3, effects: ['Calming'] },
    ],
    effects: ['Balanced', 'Relaxed', 'Happy'],
    flavors: ['Herbal', 'Spicy', 'Sweet'],
    genetics: {
      phenotypes: ['Medium height', 'Dense buds'],
      floweringTime: 8,
      yield: 'Medium',
      difficulty: 'medium',
      resistance: ['Average'],
      dominantTraits: ['Balanced effects'],
    },
    createdBy: request.userId,
    createdAt: new Date(),
    popularity: 0,
  };
}