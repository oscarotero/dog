import { parseDate, stringToDocument, stringToFragment } from "./utils.ts";
import { stringify } from "std/yaml/mod.ts";
import { format } from "std/fmt/bytes.ts";
import { extract, test } from "std/front_matter/yaml.ts";

export function processDay(path: string | Date) {
  if (path instanceof Date) {
    const day = parseDate(path);
    path = `files/${day[0]}/${day.join("-")}`;
  }

  const files = Deno.readDirSync(path);

  for (const file of files) {
    if (file.name.endsWith(".html")) {
      processFile(`${path}/${file.name}`);
    }
  }
}

let number = 1;

function processFile(path: string) {
  let content = Deno.readTextFileSync(path);

  console.log(
    number++,
    `Processing ${path.padEnd(30)}`,
    format(content.length).padStart(10),
  );

  const { attrs, body } = test(content)
    ? extract<Announcement>(content)
    : { attrs: {}, body: content };

  const date = path.split("/")[2];
  const document = stringToDocument(body);
  const announcement = { date, ...attrs, ...scrape(document) };

  if (!announcement.url && announcement.id) {
    const [year, month, day] = date.split("-");
    announcement.url =
      `https://www.xunta.gal/dog/Publicados/${year}/${year}${month}${day}/Anuncio${announcement.id}_gl.html`;
  } else if (!announcement.id) {
    delete announcement.url;
  }

  // Add the front matter
  content = `---\n${stringify(announcement)}---\n${
    cleanHTML(document.querySelector(".story") || document.body)
  }\n`;

  Deno.writeTextFileSync(path, content);
}

interface Announcement {
  url?: string;
  id?: string;
  title?: string;
  page?: number;
  number?: number;
  date?: string;
  agency?: string;
  section?: string;
  range?: string;
  [key: string]: unknown;
}

function scrape(document: Document): Announcement {
  const announcement: Announcement = {};
  const id = document.querySelector(".idiomaSeleccionado")?.getAttribute("href")
    ?.match(/\/Anuncio([^_]+)_gl\.html$/);
  if (id) {
    announcement.id = id[1];
  }
  const page = document.querySelector("#DOGPaxina")?.textContent?.match(
    /Páx\.\s+([\d.]+)/,
  );
  if (page) {
    announcement.page = Number(page[1].replace(".", ""));
  }
  const number = document.querySelector("#DOGNumero")?.textContent?.match(
    /DOG Núm\.\s+(\d+)/,
  );
  if (number) {
    announcement.number = Number(number[1]);
  }

  const agency = document.querySelector('meta[name="Organismo"]')?.getAttribute(
    "content",
  )?.trim();
  if (agency) {
    announcement.agency = agency;
  }

  const section = document.querySelector('meta[name="Seccion"]')?.getAttribute(
    "content",
  )?.trim();
  if (section) {
    announcement.section = section;
  }

  const title = document.querySelector('meta[name="Titulo"]')?.getAttribute(
    "content",
  )?.trim();
  if (title) {
    announcement.title = title;
  }

  const range = document.querySelector('meta[name="Rango"]')?.getAttribute(
    "content",
  )?.trim();
  if (range) {
    announcement.range = range;
  }

  return announcement;
}

function cleanHTML(element: Element): string {
  const document = element.ownerDocument!;

  // Fix <span>
  element.querySelectorAll("span.dog-cursiva").forEach((span) => {
    const em = document.createElement("em");
    em.innerHTML = span.innerHTML;
    span.replaceWith(em);
  });
  element.querySelectorAll("span.dog-negrita-cursiva").forEach((span) => {
    const em = document.createElement("em");
    em.innerHTML = `<strong>${span.innerHTML}</strong>`;
    span.replaceWith(em);
  });
  element.querySelectorAll("span.dog-negrita,span.texto-en-negrita").forEach(
    (span) => {
      const strong = document.createElement("strong");
      strong.innerHTML = span.innerHTML;
      span.replaceWith(strong);
    },
  );
  element.querySelectorAll("span.dog-superindice,span.dog-cursiva-superindice")
    .forEach((span) => {
      const sup = document.createElement("sup");
      sup.innerHTML = span.innerHTML;
      span.replaceWith(sup);
    });
  element.querySelectorAll("span.dog-subindice").forEach((span) => {
    const sub = document.createElement("sub");
    sub.innerHTML = span.innerHTML;
    span.replaceWith(sub);
  });

  // Remove spans
  element.querySelectorAll([
    "span.dog-normal",
    "span.dog-normal1",
    "span.fuente-de-p-rrafo-predeter-",
    "span.fuente-de-p-rrafo-predeter-1",
    "span.fuente-de-p-rrafo-predeter-4",
    "span.dog-texto-sumario",
    "span.dog-texto-sumario-2",
    "span.dog-subrayado",
    "span.unknown",
    "span.ninguno",
    "span.enlace-de-internet",
    "span.hyperlink",
    "span.hyperlink-1",
    "span.hiperv-nculo",
    "span.hiperligaz-on",
    "span.a2",
    "span.a3",
    "span.a4",
    "span.a5",
    "span.texte1",
    "span.texte",
    "span.feder",
    "span.dog-titulo-publicacion-teu",
    "span.dog-base-sangria-car",
    "span.x-none-",
    "span.c-vermello",
    "span.c-azul",
    "span.c-riscado",
    "span.p1-car",
    "span.ttp1-car",
    "span.ttp1-car-c",
    "span.ttp1-car-car",
    "span.ttp2-car-car",
    "span.listlabel-5",
    "span.listlabel-24",
    "span.listlabel-67",
    "span.e-normal-texto",
    "span.markedcontent",
    "span.tipo-de-letra-predefinido-do-par-grafo",
    "span.tipo-de-letra-predefinido-do-par-grafo1",
  ].join(",")).forEach((span) => {
    span.replaceWith(stringToFragment(span.ownerDocument, span.innerHTML));
  });

  // Fix headers
  element.querySelectorAll([
    "p.dog-anexo-nome",
    "p.dog-anexo-encabezado",
    "p.dog-celda-encabezado",
    "p.dog-capitulo",
    "p.dog-capitulo-nome",
    "p.dog-centrado-negrita",
    "p.dog-titulo",
    "p.dog-titulo-nome",
    "p.dog-artigo",
    "p.dog-centrado-sin-cursiva-c-a",
    "p.dog-centrado-sin-cursiva-c-b",
    "p.dog-centrado-cursiva-c-a",
    "p.dog-centrado-cursiva-c-b",
    "p.dog-seccion",
    "p.dog-subseccion",
  ].join(",")).forEach(
    (p) => {
      const h2 = document.createElement("h2");
      h2.innerHTML = p.innerHTML;
      p.replaceWith(h2);
    },
  );

  // Fix footers
  element.querySelectorAll("p.dog-firma-centrada").forEach((p) => {
    const footer = document.createElement("footer");
    footer.innerHTML = `<p>${p.innerHTML}</p>`;
    p.replaceWith(footer);
  });
  element.querySelectorAll("footer + p.dog-firma-izq").forEach((p) => {
    const footer = p.previousElementSibling;
    if (footer?.matches("footer")) {
      p.removeAttribute("class");
      footer.appendChild(p);
    }
  });
  element.querySelectorAll("p.dog-firma-izq").forEach((p) => {
    const footer = document.createElement("footer");
    footer.innerHTML = `<p>${p.innerHTML}</p>`;
    p.replaceWith(footer);
  });

  // Fix table cells
  element.querySelectorAll("td > p").forEach((p) => {
    const parent = p.parentElement;
    if (parent) {
      parent.innerHTML = p.innerHTML;
    }
  });
  element.querySelectorAll("td,th").forEach((td) =>
    td.innerHTML = td.innerHTML?.trim()
  );
  element.querySelectorAll("td.dog-celda-encabezado").forEach((td) => {
    const th = document.createElement("th");
    th.innerHTML = td.innerHTML;
    td.replaceWith(th);
  });

  // Remove tables attributes
  element.querySelectorAll("table").forEach((table) => {
    table.removeAttribute("id");
    table.removeAttribute("border");
    table.removeAttribute("class");
  });

  // Remove classes
  element.querySelectorAll([
    "p.dog-base-sangria",
    "p.dog-base-sin-sangria-sin-espaciado",
    "p.dog-base-sin-sangria-primera-linea-anexo",
    "p.dog-base-sin-sangria",
    "p.dog-parrafo-justificado",
    "p.dog-dispositiva-cuerpo",
    "p.dog-data",
    "li.dog-vinheta-punto",
    "li.dog-vinheta-asterisco",
    "li.dog-vinheta-guion",
    "li.normal",
    "li.t-tulo-3",
    "li.dog-enum-latina",
    "li.dog-enum-arabe-1",
    "li.x-ning-n-estilo-de-p-rrafo-",
    "td.dog-celda-centrada",
    "td.dog-celda-dcha",
    "td.dog-celda-izq",
    "td.dog-celda-pie",
    "td.dog-celda",
    "table.dog-tabla",
    "ol.latina",
    "ol.arabe",
    "p.basic-paragraph",
    "p.dog-normal1",
    "p.normal",
    "p.e-normal-texto",
    "td.estilo-de-celda-1",
    "p.x-ning-n-estilo-de-p-rrafo-",
    "p.lista-con-vi-etas",
  ].join(",")).forEach((el) => {
    el.removeAttribute("class");
  });

  // Fix links elements
  element.querySelectorAll("span.dog-hyperlink").forEach((span) => {
    span.replaceWith(span.querySelector("a")!);
  });

  let code = element.innerHTML!;

  // Remove HTML comments
  code = code.replace(/<!--[\s\S]*?-->/g, "");

  // Fix HTML entities
  code = code.replace(/&nbsp;/g, " ");

  // Remove empty span tags
  code = code.replace(/<span[^>]*><\/span>/g, "");

  // Remove empty elements tags
  code = code.replace(/<(p|table)[^>]*>\n?<\/(p|table)>/g, "");

  // Fix https links
  code = code.replace(
    /&lt;(https?:\/\/[^\s]+)&gt;/g,
    (_, url) => {
      return `<a href="${url}">${url}</a>`;
    },
  );
  // Fix email address
  code = code.replace(
    /&lt;([^\s]+)@([^\s]+)&gt;/g,
    (_, name, domain) => {
      return `<a href="mailto:${name}@${domain}">${name}@${domain}</a>`;
    },
  );

  // Remove empty lines
  code = code.replace(/^\s*[\r\n]/gm, "");

  // Replace tabs with spaces
  code = code.replace(/\t/g, " ");

  // Pretty print HTML
  code = code.replaceAll("\n</p>\n", "</p>\n");

  return code;
}
