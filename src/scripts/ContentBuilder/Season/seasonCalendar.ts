/**
 * Belgian seasonal produce calendar (volle grond / onverwarmde serres) and
 * the mapping from its Dutch produce names to the English recipe tags used
 * in the Recipes repo. Shared by src/pages/seizoenskalender.astro (calendar
 * entries link to /tags/<tag>) and src/pages/tags/[tag].astro (tag pages
 * show when that ingredient is in season).
 *
 * Source data: features/foodcal/belgisch_seizoenskalender.md.
 */

export interface SeasonMonth {
  name: string;
  groenten: string[];
  fruit: string[];
}

export const SEASON_MONTHS: SeasonMonth[] = [
  {
    name: "Januari",
    groenten: ["aardappel","aardpeer","boerenkool","groene selderij","knolselderij","koolraap","paddenstoelen","pastinaak","pompoen","prei","raap","rammenas","rode biet","rodekool","savooikool","schorseneer","spruiten","ui","veldsla","waterkers","winterpostelein","witlof","wittekool","wortel"],
    fruit: ["appel","peer"]
  },
  {
    name: "Februari",
    groenten: ["aardappel","boerenkool","groene selderij","knolselderij","paddenstoelen","pastinaak","pompoen","prei","raap","rammenas","rode biet","rodekool","savooikool","schorseneer","spruiten","ui","veldsla","winterpostelein","witlof","wittekool","wortel"],
    fruit: ["appel","peer"]
  },
  {
    name: "Maart",
    groenten: ["aardappel","bloemkool","boerenkool","groene selderij","knolselderij","paddenstoelen","pastinaak","pompoen","prei","raap","radijs","rammenas","rode biet","rodekool","roodlof","savooikool","schorseneer","spinazie","spruiten","ui","veldsla","warmoes","winterpostelein","witlof","wittekool","wortel"],
    fruit: ["appel","rabarber"]
  },
  {
    name: "April",
    groenten: ["aardappel","andijvie","bloemkool","groene selderij","paddenstoelen","paksoi","pompoen","prei","raap","raapsteel","radijs","rode biet","roodlof","spinazie","ui","warmoes","waterkers","wortel","witlof"],
    fruit: ["aardbei","rabarber"]
  },
  {
    name: "Mei",
    groenten: ["aardappel","andijvie","asperge","bloemkool","doperwt","groene selderij","koolrabi","kropsla","paddenstoelen","paksoi","peultjes","prei","raap","raapsteel","radijs","rode biet","roodlof","spinazie","spitskool","ui","warmoes","waterkers","wortel"],
    fruit: ["aardbei","rabarber"]
  },
  {
    name: "Juni",
    groenten: ["aardappel","andijvie","artisjok","asperge","bloemkool","broccoli","doperwt","groene selderij","koolrabi","kropsla","paddenstoelen","paksoi","peultjes","prei","prinsessenboon","raap","radijs","rode biet","savooikool","spinazie","spitskool","tomaat","tuinboon","ui","venkel","warmoes","waterkers","wortel"],
    fruit: ["aardbei","abrikoos","blauwe bes","framboos","kers","nectarine","perzik","rabarber","rode bes","zwarte bes"]
  },
  {
    name: "Juli",
    groenten: ["aardappel","andijvie","artisjok","aubergine","bleekselderij","bloemkool","broccoli","chinese kool","courgette","doperwt","groene selderij","komkommer","koolrabi","kropsla","paddenstoelen","paksoi","paprika","peultjes","prei","prinsessenboon","radijs","rode biet","rodekool","savooikool","snijboon","spinazie","spitskool","tomaat","tuinboon","ui","venkel","warmoes","waterkers","wittekool","wortel"],
    fruit: ["aardbei","abrikoos","blauwe bes","braam","framboos","kers","nectarine","perzik","rabarber","rode bes","zwarte bes"]
  },
  {
    name: "Augustus",
    groenten: ["aardappel","andijvie","artisjok","aubergine","bleekselderij","bloemkool","broccoli","chinese kool","courgette","groene selderij","knolselderij","komkommer","koolrabi","kropsla","mais","paddenstoelen","paksoi","paprika","pompoen","prei","prinsessenboon","raapsteel","radijs","rode biet","rodekool","savooikool","snijboon","spinazie","spitskool","tomaat","ui","venkel","warmoes","waterkers","wittekool","wortel"],
    fruit: ["aardbei","abrikoos","appel","blauwe bes","braam","druif","framboos","kers","meloen","nectarine","peer","perzik","pruim","vijg","zwarte bes"]
  },
  {
    name: "September",
    groenten: ["aardappel","andijvie","artisjok","aubergine","bleekselderij","bloemkool","broccoli","chinese kool","courgette","groene selderij","knolselderij","komkommer","koolrabi","kropsla","mais","paddenstoelen","paksoi","paprika","pompoen","prei","prinsessenboon","raap(steel)","radijs","rammenas","rode biet","rodekool","savooikool","snijboon","spinazie","spitskool","tomaat","ui","venkel","warmoes","waterkers","wittekool","wortel"],
    fruit: ["appel","blauwe bes","braam","druif","framboos","kiwibes","meloen","nectarine","peer","perzik","pruim","vijg"]
  },
  {
    name: "Oktober",
    groenten: ["aardappel","andijvie","artisjok","aubergine","bleekselderij","boerenkool","bloemkool","broccoli","chinese kool","courgette","groene selderij","knolselderij","komkommer","koolrabi","kropsla","paddenstoelen","paksoi","paprika","pastinaak","pompoen","prei","prinsessenboon","raap(steel)","radijs","rammenas","rode biet","rodekool","roodlof","savooikool","schorseneer","snijboon","spinazie","spitskool","spruiten","tomaat","ui","veldsla","venkel","warmoes","waterkers","winterpostelein","witlof","wittekool","wortel"],
    fruit: ["appel","braam","druif","framboos","kiwibes","meloen","peer"]
  },
  {
    name: "November",
    groenten: ["aardappel","aardpeer","andijvie","bleekselderij","bloemkool","boerenkool","broccoli","chinese kool","courgette","groene selderij","knolselderij","koolraap","paddenstoelen","pastinaak","pompoen","prei","raap","rammenas","rode biet","rodekool","savooikool","schorseneer","spruiten","ui","veldsla","venkel","warmoes","waterkers","winterpostelein","witlof","wittekool","wortel"],
    fruit: ["appel","druif","meloen","peer"]
  },
  {
    name: "December",
    groenten: ["aardappel","aardpeer","andijvie","boerenkool","groene selderij","knolselderij","koolraap","paddenstoelen","pastinaak","pompoen","prei","raap","rammenas","rode biet","rodekool","savooikool","schorseneer","spruiten","ui","veldsla","waterkers","winterpostelein","witlof","wittekool","wortel"],
    fruit: ["appel","peer"]
  }
];

/**
 * Dutch calendar entry -> recipe tag(s), in order of preference. Tag names
 * follow the Recipes repo convention (Title Case, singular, base ingredient;
 * see the "Ingredient Tags" section of its README). An entry links to the
 * first of its tags that at least one recipe uses.
 */
export const PRODUCE_TAGS: Record<string, string[]> = {
  // groenten
  "aardappel": ["Potato"],
  "aardpeer": ["Jerusalem Artichoke"],
  "andijvie": ["Endive"],
  "artisjok": ["Artichoke"],
  "asperge": ["Asparagus"],
  "aubergine": ["Eggplant"],
  "bleekselderij": ["Celery"],
  "bloemkool": ["Cauliflower"],
  "boerenkool": ["Kale"],
  "broccoli": ["Broccoli"],
  "chinese kool": ["Chinese Cabbage"],
  "courgette": ["Zucchini"],
  "doperwt": ["Pea"],
  "groene selderij": ["Celery"],
  "knolselderij": ["Celeriac"],
  "komkommer": ["Cucumber"],
  "koolraap": ["Rutabaga"],
  "koolrabi": ["Kohlrabi"],
  "kropsla": ["Lettuce"],
  "mais": ["Corn", "Baby Corn"],
  "paddenstoelen": ["Mushroom"],
  "paksoi": ["Bok Choy"],
  "paprika": ["Bell Pepper"],
  "pastinaak": ["Parsnip"],
  "peultjes": ["Snow Pea"],
  "pompoen": ["Pumpkin", "Butternut Squash"],
  "prei": ["Leek"],
  "prinsessenboon": ["Green Bean"],
  "raap": ["Turnip"],
  "raap(steel)": ["Turnip", "Turnip Greens"],
  "raapsteel": ["Turnip Greens"],
  "radijs": ["Radish"],
  "rammenas": ["Black Radish", "Radish"],
  "rode biet": ["Beet"],
  "rodekool": ["Red Cabbage", "Cabbage"],
  "roodlof": ["Radicchio"],
  "savooikool": ["Savoy Cabbage", "Cabbage"],
  "schorseneer": ["Salsify"],
  "snijboon": ["Runner Bean", "Green Bean"],
  "spinazie": ["Spinach"],
  "spitskool": ["Pointed Cabbage", "Cabbage"],
  "spruiten": ["Brussels Sprouts"],
  "tomaat": ["Tomato"],
  "tuinboon": ["Fava Bean"],
  "ui": ["Onion", "Shallot", "Spring Onion"],
  "veldsla": ["Lambs Lettuce"],
  "venkel": ["Fennel"],
  "warmoes": ["Swiss Chard"],
  "waterkers": ["Watercress"],
  "winterpostelein": ["Winter Purslane"],
  "witlof": ["Belgian Endive"],
  "wittekool": ["Cabbage"],
  "wortel": ["Carrot"],
  // fruit
  "aardbei": ["Strawberry"],
  "abrikoos": ["Apricot"],
  "appel": ["Apple"],
  "blauwe bes": ["Blueberry"],
  "braam": ["Blackberry"],
  "druif": ["Grape"],
  "framboos": ["Raspberry"],
  "kers": ["Cherry"],
  "kiwibes": ["Kiwi Berry"],
  "meloen": ["Melon", "Watermelon"],
  "nectarine": ["Nectarine"],
  "peer": ["Pear"],
  "perzik": ["Peach"],
  "pruim": ["Plum"],
  "rabarber": ["Rhubarb"],
  "rode bes": ["Redcurrant"],
  "vijg": ["Fig"],
  "zwarte bes": ["Blackcurrant"],
};

/**
 * The recipe tag a calendar entry should link to: the first of its mapped
 * tags that appears in `recipeTags`, or undefined when no recipe uses it.
 */
export function linkedTagForProduce(produce: string, recipeTags: ReadonlySet<string>): string | undefined {
  return (PRODUCE_TAGS[produce] ?? []).find(tag => recipeTags.has(tag));
}

/**
 * Indexes (0 = January) of the months in which any calendar entry that maps
 * to `tag` is in season. Empty when the tag isn't a seasonal ingredient.
 */
export function seasonMonthsForTag(tag: string): number[] {
  const produce = Object.keys(PRODUCE_TAGS).filter(p => PRODUCE_TAGS[p].includes(tag));
  if (produce.length === 0) return [];
  return SEASON_MONTHS
    .map((month, i) => ({ month, i }))
    .filter(({ month }) => [...month.groenten, ...month.fruit].some(p => produce.includes(p)))
    .map(({ i }) => i);
}
