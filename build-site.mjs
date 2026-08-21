import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';

const outputDirectory = 'dist';
const articleApiUrl = process.env.ARTICLE_API_URL || '';

await rm(outputDirectory, { recursive: true, force: true });
await mkdir(outputDirectory, { recursive: true });
await cp('styles.css', `${outputDirectory}/styles.css`);
await cp('script.js', `${outputDirectory}/script.js`);
await cp('assets', `${outputDirectory}/assets`, { recursive: true });
for (const page of ['index.html', 'articles.html']) {
  const html = (await readFile(page, 'utf8')).replace('content="" />', `content="${articleApiUrl}" />`);
  await writeFile(`${outputDirectory}/${page}`, html);
}
