export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const subjects = ['history', 'geography', 'anthropology', 'sociology', 'economics', 'political science', 'sports'];
    const now = new Date();
    const seed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
    const subjectIndex = Math.floor((Math.sin(seed) * 10000) % subjects.length);
    const subject = subjects[subjectIndex];

    const categoryTitle = `Category:${subject.charAt(0).toUpperCase() + subject.slice(1)}`;

    // Fetch all articles from category and subcategories (deep)
    let allArticles = [];
    let continueToken = '';
    do {
      let url = `https://en.wikipedia.org/w/api.php?action=query&generator=categorymembers&gcmtitle=${encodeURIComponent(categoryTitle)}&gcmtype=page&gcmnamespace=0&gcmlimit=500&prop=info&format=json`;
      if (continueToken) url += `&gcmcontinue=${continueToken}`;
      const response = await fetch(url);
      if (!response.ok) break;
      const data = await response.json();
      const pages = data.query?.pages || {};
      allArticles = allArticles.concat(Object.values(pages));
      continueToken = data.continue?.gcmcontinue || '';
    } while (continueToken);

    if (allArticles.length === 0) throw new Error('No articles');

    const randomIndex = Math.floor(Math.random() * allArticles.length);
    const selected = allArticles[randomIndex];
    const title = selected.title;

    const summaryRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
    if (!summaryRes.ok) throw new Error('Summary failed');
    const summaryJson = await summaryRes.json();

    let fact = summaryJson.extract || `${title}: ${summaryJson.description || 'An interesting article.'}`;
    fact = fact.trim();
    if (!fact.endsWith('.')) fact += '.';

    return res.json({
      fact,
      source_url: summaryJson.content_urls?.desktop?.page,
      source_title: title
    });
  } catch (err) {
    console.error(err);
    return res.json({ fact: 'The shortest war in history was between Britain and Zanzibar on August 27, 1896, lasting only 38 minutes.' });
  }
}
