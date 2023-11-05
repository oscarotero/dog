import { parseDate, stringToDocument, yesterday } from "./utils.ts";

async function saveDay(date: Date) {
  const [year, month, day] = parseDate(date);

  const url = new URL(
    `https://www.xunta.gal/diario-oficial-galicia/mostrarContenido.do?ruta=/${year}/${year}${month}${day}/Secciones1_gl.html&paginaCompleta=false&fecha=${day}/${month}/${year}&compMenu=10102`,
  );

  // Check if exists
  const path = `files/${year}/${year}-${month}-${day}`;
  try {
    if (Deno.statSync(path)) {
      console.log(`Skip ${path}`);
      return;
    }
  } catch {
    // Nothing
  }

  const response = await fetch(url);
  const document = stringToDocument(await response.text());

  // Check if exists (the response is always 200)
  const title = document.querySelector(".cabeceiraContido h1");

  if (title?.innerHTML.trim() === "Páxina non atopada") {
    console.log("No DOG for", date);
    return;
  }

  const firstLink = document.querySelector(
    ".corpoContido .dog-toc-sumario a",
  );

  await saveAll(new URL(firstLink?.getAttribute("href")!, url), path);
}

async function saveAll(next: URL | undefined, path: string, page = 1) {
  Deno.mkdirSync(path, { recursive: true });

  while (next) {
    console.log({ url: next.href, page });
    next = await save(next, path, page++);
  }
}

async function save(
  url: URL,
  path: string,
  index = 1,
): Promise<URL | undefined> {
  const response = await fetch(url);
  const html = await response.text();

  // Save file
  Deno.writeTextFileSync(`${path}/${index}.html`, html);

  const document = stringToDocument(html);
  const next = document.querySelector(".enlaceSiguiente a") as Element;
  const href = next?.getAttribute("href");

  if (href) {
    return new URL(href, url);
  }
}

await saveDay(yesterday());
