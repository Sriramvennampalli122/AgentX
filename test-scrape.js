const cheerio = require('cheerio');
fetch('https://html.duckduckgo.com/html/?q=apple+news').then(r=>r.text()).then(html => {
  const $ = cheerio.load(html);
  $('.result').each((i, el) => {
    const title = $(el).find('.result__title a').text();
    let url = $(el).find('.result__title a').attr('href');
    if (url && url.startsWith('//duckduckgo.com/l/?uddg=')) {
        url = decodeURIComponent(url.split('uddg=')[1].split('&')[0]);
    }
    const snippet = $(el).find('.result__snippet').text();
    if (title) console.log({title, url, snippet});
  });
}).catch(console.error);
