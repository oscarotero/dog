import { parseDate, stringToDocument, yesterday } from "./utils.ts";
import { Element } from "dom";

async function save(
  url: URL,
  date: string,
  index = 1,
): Promise<URL | undefined> {
  const response = await fetch(url);
  const html = await response.text();

  // Save file
  Deno.mkdirSync(`files/${date}`, { recursive: true });
  const path = `files/${date}/${index}.html`;
  Deno.writeTextFileSync(path, html);

  const document = stringToDocument(html);
  const next = document.querySelector(".enlaceSiguiente a") as Element;
  const href = next?.getAttribute("href");

  if (href) {
    return new URL(href, url);
  }
}

async function saveNumber(url: URL, date: string) {
  // Check if exists
  try {
    if (Deno.statSync(`files/${date}`)) {
      console.log(`Skip ${date}`);
      return;
    }
  } catch {
    // Nothing
  }

  const response = await fetch(url);
  const document = stringToDocument(await response.text());

  // Check if exists (the response is always 200)
  const title = document.querySelector(".cabeceiraContido h1");
  if (title?.innerText.trim() === "Páxina non atopada") {
    console.log("Not found");
    return;
  }

  const firstLink = document.querySelector(
    ".corpoContido .dog-toc-sumario a",
  ) as Element;

  await saveAll(new URL(firstLink.getAttribute("href")!, url), date);
}

async function saveAll(next: URL | undefined, date: string, page = 1) {
  while (next) {
    console.log({ url: next.href, page });
    next = await save(next, date, page++);
  }
}

function getUrlForDate(date = new Date()): [URL, string] {
  const [year, month, day] = parseDate(date);

  const url =
    `https://www.xunta.gal/diario-oficial-galicia/mostrarContenido.do?ruta=/${year}/${year}${month}${day}/Secciones1_gl.html&paginaCompleta=false&fecha=${day}/${month}/${year}&compMenu=10102`;
  return [new URL(url), `${year}-${month}-${day}`];
}

await saveNumber(...getUrlForDate(yesterday()));
