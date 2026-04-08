export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  try {
    const response = await fetch('https://uselessfacts.jsph.pl/random.json?language=en');
    const data = await response.json();

    const fact = data.text.trim();
    const cleanFact = fact.endsWith('.') ? fact : fact + '.';

    return res.json({
      fact: cleanFact,
      source_url: 'https://uselessfacts.jsph.pl/',
      source_title: 'Useless Facts API'
    });
  } catch (err) {
    console.error(err);
    // Only use fallback if the API is truly down (very rare)
    return res.json({
      fact: 'The shortest war in history was between Britain and Zanzibar on August 27, 1896, lasting only 38 minutes.'
    });
  }
}
