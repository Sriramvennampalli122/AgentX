
'use server';

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
 * Simulates a web search using the DuckDuckGo API (Instant Answers) 
 * for prototype purposes, providing real-ish data.
 */
export async function searchWeb(query: string): Promise<WebSearchResponse> {
  try {
    const response = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`);
    
    if (!response.ok) {
      throw new Error(`Search request failed with status ${response.status}`);
    }

    const data = await response.json();
    const results: SearchResult[] = [];

    // Map Abstract info
    if (data.AbstractText) {
      results.push({
        title: data.Heading || 'Main Result',
        url: data.AbstractURL || '',
        snippet: data.AbstractText
      });
    }

    // Map Related Topics
    if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
      data.RelatedTopics.slice(0, 5).forEach((topic: any) => {
        if (topic.Text && topic.FirstURL) {
          results.push({
            title: topic.Text.split(' - ')[0] || 'Related Topic',
            url: topic.FirstURL,
            snippet: topic.Text
          });
        }
      });
    }

    // Fallback mock results if API returns nothing specific for niche queries
    if (results.length === 0) {
      results.push({
        title: `Search results for: ${query}`,
        url: 'https://duckduckgo.com',
        snippet: `No specific instant answers found for "${query}". Please check the main search engine for more detailed web results.`
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
