/// <reference lib="dom" />
import { DOMParser } from "dom";
import { format } from "std/fmt/bytes.ts";

const parser = new DOMParser();

export function stringToDocument(string: string): Document {
  const document = parser.parseFromString(string, "text/html");

  if (!document) {
    throw new Error("Unable to parse the HTML code" + string);
  }

  return document as unknown as Document;
}

export function stringToFragment(
  document: Document,
  string: string,
): DocumentFragment {
  const body = stringToDocument(string).body;
  const fragmentDocument = document.createDocumentFragment();
  while (body.firstChild) {
    fragmentDocument.appendChild(body.firstChild);
  }
  return fragmentDocument;
}

export function yesterday(): Date {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday;
}

export function* updateDates(): Generator<Date> {
  const date = new Date();

  while (true) {
    date.setDate(date.getDate() - 1);
    const [year, month, day] = parseDate(date);
    const path = `files/${year}/${year}-${month}-${day}`;

    // Check if the path exists
    try {
      if (Deno.statSync(path).isDirectory) {
        return;
      }
    } catch {
      yield date;
    }
  }
}

export function parseDate(date: Date): [number, string, string] {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ];
}

let number = 1;
export function process(
  path: string | Date,
  callback: (content: string) => string,
) {
  if (path instanceof Date) {
    const day = parseDate(path);
    path = `files/${day[0]}/${day.join("-")}`;
  }

  const files = Deno.readDirSync(path);

  for (const file of files) {
    if (file.name.endsWith(".html")) {
      const filename = `${path}/${file.name}`;
      const content = Deno.readTextFileSync(filename);

      console.log(
        number++,
        `Processing ${path.padEnd(30)}`,
        format(content.length).padStart(10),
      );

      const newContent = callback(content);
      if (newContent) {
        Deno.writeTextFileSync(filename, newContent);
      }
    }
  }
}

export function processAll(callback: (content: string) => string) {
  for (const year of Deno.readDirSync("files")) {
    if (year.isDirectory) {
      for (const day of Deno.readDirSync(`files/${year.name}`)) {
        if (day.isDirectory) {
          process(`files/${year.name}/${day.name}`, callback);
        }
      }
    }
  }
}
