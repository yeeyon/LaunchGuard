import { writeFile } from 'node:fs/promises';

export async function POST(request: Request) {
  const body = await request.json();
  await writeFile('./orders.json', JSON.stringify(body));
  return Response.json({ ok: true });
}
