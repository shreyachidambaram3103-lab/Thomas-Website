export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const subjects = ['history', 'geography', 'anthropology', 'sociology', 'economics', 'political science', 'sports'];
    const now = new Date();
    const seed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
    const subjectIndex = Math.floor((Math.sin(seed) * 10000) % subjects.length);
    const subject = subjects[subjectIndex];

    let attempts = 0;
    const maxAttempts = 10;
    const factHistory = []; // Server-side, no localStorage - assume single user, no history check here (frontend can handle if needed)

    while (attempts < maxAttempts) {
      const categoryTitle = `Category:${subject.charAt(0).toUpperCase() + subject.slice(1)}`;
      const apiUrl = `https://en.wikipedia.org/w/api.php?action=query&list=categorymembers&cmtype=page&cmnamespace=0&cmtitle=${encodeURIComponent(categoryTitle)}&cmlimit=50&format=json`;

      const membersRes = await fetch(apiUrl);
      if (!membersRes.ok) {
        attempts++;
        continue;
      }
      const membersJson = await membersRes.json();
      const members = membersJson.query?.categorymembers || [];

      if (members.length > 0) {
        const randomIndex = Math.floor(Math.random() * members.length);
        const selected = members[randomIndex];
        const title = selected.title;

        const summaryRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
        if (!summaryRes.ok) {
          attempts++;
          continue;
        }
        const summaryJson = await summaryRes.json();

        let fact = summaryJson.extract || summaryJson.description || 'An interesting fact from Wikipedia.';
        fact = fact.trim();
        if (!fact.endsWith('.')) fact += '.';

        return res.json({ fact, source_url: summaryJson.content_urls?.desktop?.page, source_title: title });
      }
      attempts++;
    }

    return res.json({ fact: 'The shortest war in history was between Britain and Zanzibar on August 27, 1896, lasting only 38 minutes.' });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
