export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const subjects = ['history', 'geography', 'anthropology', 'sociology', 'economics', 'political science', 'sports'];
    const now = new Date();
    const seed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
    const subjectIndex = Math.floor((Math.sin(seed) * 10000) % subjects.length);
    const subject = subjects[subjectIndex];

    const category = subject.charAt(0).toUpperCase() + subject.slice(1);

    // Use Wikipedia's special random in category endpoint (reliable, deep tree)
    const randomUrl = `https://en.wikipedia.org/wiki/Special:RandomInCategory/${encodeURIComponent(category)}`;

    // Fetch the random page URL (redirect)
    const randomRes = await fetch(randomUrl, { redirect: 'manual' });
    if (!randomRes.ok && randomRes.status !== 302) throw new Error('Random page fetch failed');

    const location = randomRes.headers.get('location');
    if (!location) throw new Error('No redirect location');

    const title = decodeURIComponent(location.split('/wiki/')[1].replace(/_/g, ' '));

    // Get summary
    const summaryRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
    if (!summaryRes.ok) throw new Error('Summary fetch failed');
    const summaryJson = await summaryRes.json();

    let fact = summaryJson.extract || `${title}: ${summaryJson.description || 'An interesting fact.'}`;
    fact = fact.trim();
    if (!fact.endsWith('.')) fact += '.';

    res.json({
      fact,
      source_url: summaryJson.content_urls?.desktop?.page,
      source_title: title
    });
  } catch (err) {
    console.error('Fact generation error:', err);
    res.json({ fact: 'The shortest war in history was between Britain and Zanzibar on August 27, 1896, lasting only 38 minutes.' });
  }
}
