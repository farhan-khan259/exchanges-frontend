export const localeMeta = {
  en: { label: "English", dir: "ltr" },
  ur: { label: "اردو", dir: "rtl" },
  roman: { label: "Roman English", dir: "ltr" },
} as const;
export type Locale = keyof typeof localeMeta;
export const catalogs: Record<Locale, Record<string, string>> = {
  en: {},
  ur: {
    Dashboard: "ڈیش بورڈ",
    Transactions: "لین دین",
    Rates: "شرح مبادلہ",
    Customers: "صارفین",
    More: "مزید",
    Home: "ہوم",
    "New Transaction": "نیا لین دین",
    Settings: "ترتیبات",
  },
  roman: {
    Dashboard: "Khulasa",
    Transactions: "Len den",
    Rates: "Currency rates",
    Customers: "Customers",
    More: "Mazeed",
    Home: "Home",
    "New Transaction": "Naya len den",
    Settings: "Settings",
  },
};
export const translate = (locale: Locale, key: string) =>
  catalogs[locale][key] || key;
