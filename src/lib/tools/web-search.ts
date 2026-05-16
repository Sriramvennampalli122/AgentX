'use server';
import * as cheerio from 'cheerio';

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

export interface WebSearchResponse {
  success: boolean;
  results: SearchResult[];
  error?: string;
}

/**
 * Performs a web search by scraping the DuckDuckGo HTML lite version.
 */
export async function searchWeb(query: string): Promise<WebSearchResponse> {
  try {
    const response = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`);
    
    if (!response.ok) {
      throw new Error(`Search request failed with status ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const results: SearchResult[] = [];

    $('.result').each((i, el) => {
      if (results.length >= 10) return; // Limit to top 10 results
      
      const title = $(el).find('.result__title a').text().trim();
      let url = $(el).find('.result__title a').attr('href') || '';
      
      if (url && url.startsWith('//duckduckgo.com/l/?uddg=')) {
          try {
            url = decodeURIComponent(url.split('uddg=')[1].split('&')[0]);
          } catch (e) {
            // Keep original if decoding fails
          }
      }
      
      const snippet = $(el).find('.result__snippet').text().trim();
      
      if (title && snippet) {
        results.push({
          title,
          url,
          snippet
        });
      }
    });

    if (results.length === 0) {
      results.push({
        title: `Search results for: ${query}`,
        url: 'https://duckduckgo.com',
        snippet: `No specific results found for "${query}". Please check the main search engine for more detailed web results.`
      });
    }

    return {
      success: true,
      results
    };
  } catch (error: any) {
    console.error('Web search error:', error);
    return {
      success: false,
      results: [],
      error: error.message || 'Failed to connect to search provider'
    };
  }
}
