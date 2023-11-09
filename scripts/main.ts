import { processAll, updateDates } from "./utils.ts";
import { saveDay } from "./download.ts";
import { processDay } from "./clean.ts";

// for (const date of updateDates()) {
//   if (await saveDay(date)) {
//     processDay(date);
//   }
// }

// processDay(new Date("2020-09-11"));

// for (const year of Deno.readDirSync("files")) {
//   if (year.isDirectory) {
//     for (const day of Deno.readDirSync(`files/${year.name}`)) {
//       if (day.isDirectory) {
//         processDay(`files/${year.name}/${day.name}`);
//       }
//     }
//   }
// }

processAll((content) => {
  content = content.replaceAll("&amp;nbsp;", " ");
  return content;
});
