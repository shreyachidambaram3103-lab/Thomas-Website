export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const BRAVE_KEY = process.env.BRAVE_API_KEY || '';

    if (!BRAVE_KEY) {
      return res.status(500).json({ error: 'Missing BRAVE_API_KEY on server.' });
    }

    const searchQuery = `obscure historical geography political fact memorable date name number site:.edu OR site:.org OR site:.gov -site:wikipedia.org`;

    const braveResp = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(searchQuery)}&count=5`, {
      headers: {
        'Accept': 'application/json',
        'X-Subscription-Token': BRAVE_KEY
      }
    });

    if (!braveResp.ok) throw new Error('Search failed');
    const braveJson = await braveResp.json();

    const results = braveJson.web?.results?.map(r => ({ title: r.title, url: r.url, snippet: r.description })) || [];

    if (results.length > 0) {
      const now = new Date();
      const seed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
      const index = Math.floor((Math.sin(seed) * 10000) % results.length);
      const selected = results[index];
      let fact = selected.snippet.trim().replace(/<[^>]+>/g, '');
      if (!fact.endsWith('.')) fact += '.';
      return res.json({ fact, source_url: selected.url, source_title: selected.title });
    }

    return res.json({ fact: 'The shortest war in history was between Britain and Zanzibar on August 27, 1896, lasting only 38 minutes.' });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
