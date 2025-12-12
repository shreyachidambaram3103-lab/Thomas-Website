export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const now = new Date();
    const seed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
    const subjects = ['history', 'geography', 'anthropology', 'sociology', 'economics', 'political science'];
    const subjectIndex = Math.floor((Math.sin(seed) * 10000) % subjects.length);
    const subject = subjects[subjectIndex];

    const searchQuery = `obscure ${subject} fact memorable date name number site:.edu OR site:.org OR site:.gov OR site:wikipedia.org`;

    const search1Resp = await fetch('https://api.search1api.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: searchQuery,
        search_service: 'google',
        max_results: 5,
        language: 'en'
      })
    });

    if (!search1Resp.ok) throw new Error('Search failed');
    const search1Json = await search1Resp.json();

    const results = search1Json.results?.map(r => ({ title: r.title, url: r.link, snippet: r.description })) || [];

    if (results.length > 0) {
      const index = Math.floor((Math.sin(seed) * 10000) % results.length);
      const selected = results[index];
      let fact = selected.snippet.trim().replace(/<[^>]+>/g, '');
      if (!fact.endsWith('.')) fact += '.';
      return res.json({ fact, source_url: selected.url, source_title: selected.title });
    }

    // Fallback (kept as requested)
    return res.json({ fact: 'The shortest war in history was between Britain and Zanzibar on August 27, 1896, lasting only 38 minutes.' });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
