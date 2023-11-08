import { updateDates } from "./utils.ts";
import { saveDay } from "./download.ts";
import { process } from "./clean.ts";


// for (const date of updateDates()) {
//   if (await saveDay(date)) {
//     process(date);
//   }
// }

// process(new Date("2020-09-11"));

for (const year of Deno.readDirSync("files")) {
  if (year.isDirectory) {
    for (const day of Deno.readDirSync(`files/${year.name}`)) {
      if (day.isDirectory) {
        process(`files/${year.name}/${day.name}`);
      }
    }
  }
}
