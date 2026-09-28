import type { en } from './en'

// Same keys as English, plus the `_few` plural form Romanian needs (2 locuri, 20 de locuri)
type Locale<T> = { [K in keyof T]: T[K] extends string ? string : Locale<T[K]> } & {
  [key: `${string}_few`]: string
}

export const ro = {
  common: {
    appName: 'ParkSpot',
    tagline: 'Schimb de locuri de parcare între vecini',
    verificationBadge: 'Vecini verificați',
    secureBayLocks: 'Locuri securizate',
    help: 'Ajutor',
    terms: 'Termeni',
    comingSoon: '{{feature}} va fi disponibil în curând',
    notFound: 'Pagina nu a fost găsită',
    language: 'Limbă',
  },
  auth: {
    login: {
      title: 'Bine ai revenit',
      description: 'Introdu datele contului pentru a accesa locurile de parcare',
      submit: 'Autentificare',
      noAccount: 'Nu ai cont?',
      registerLink: 'Înregistrează-te',
    },
    register: {
      title: 'Creează-ți contul',
      description: 'Alătură-te schimbului de parcări din blocul tău în mai puțin de un minut',
      submit: 'Creează cont',
      haveAccount: 'Ai deja cont?',
      loginLink: 'Autentifică-te',
    },
    fields: {
      email: 'Adresă de email',
      emailPlaceholder: 'nume@exemplu.ro',
      password: 'Parolă',
      confirmPassword: 'Confirmă parola',
      passwordHint: 'Cel puțin 8 caractere',
      forgotPassword: 'Ai uitat parola?',
      name: 'Nume complet',
      namePlaceholder: 'Ion Popescu',
      apartment: 'Număr apartament',
      apartmentPlaceholder: '12B',
      phone: 'Telefon',
      phonePlaceholder: '+40712345678',
      phoneHint: 'Format internațional, începând cu +',
      remember: 'Păstrează-mă autentificat',
    },
    logout: 'Deconectare',
  },
  form: {
    showPassword: 'Arată parola',
    hidePassword: 'Ascunde parola',
  },
  validation: {
    email: 'Introdu o adresă de email validă',
    passwordRequired: 'Introdu parola',
    passwordMin: 'Folosește cel puțin 8 caractere',
    passwordMax: 'Folosește cel mult 72 de caractere',
    passwordMismatch: 'Parolele nu coincid',
    nameRequired: 'Introdu numele',
    nameMax: 'Folosește cel mult 255 de caractere',
    apartmentRequired: 'Introdu numărul apartamentului',
    apartmentMax: 'Folosește cel mult 50 de caractere',
    phone: 'Folosește formatul internațional, de ex. +40712345678',
  },
  nav: {
    home: 'Acasă',
    findSpot: 'Caută loc',
    mySpots: 'Locurile mele',
    myCars: 'Mașinile mele',
    bookings: 'Rezervări',
    notifications: 'Notificări',
    accountMenu: 'Meniu cont',
  },
  home: {
    greeting: 'Salut, {{name}}',
    apartment: 'Apartament {{number}}',
    verified: 'Vecin verificat',
    role: { USER: 'Locatar', ADMIN: 'Administrator' },
    stats: { mySpots: 'Locurile mele', myCars: 'Mașinile mele', active: 'Active' },
    registerSpot: {
      title: 'Înregistrează un loc',
      badge: 'Găzduiește',
      description: 'Pune locul tău de parcare la dispoziția vecinilor cât timp ești plecat.',
      action: 'Înregistrează loc',
      count_one: 'Ai {{count}} loc înregistrat',
      count_few: 'Ai {{count}} locuri înregistrate',
      count_other: 'Ai {{count}} de locuri înregistrate',
      none: 'Nu ai înregistrat încă niciun loc',
    },
    findSpot: {
      title: 'Caută un loc',
      badge: 'Instant',
      description:
        'Ai nevoie de parcare chiar acum? Găsește un loc liber în blocul tău și rezervă-l rapid.',
      action: 'Caută un loc',
      available_one: '{{count}} loc al vecinilor este liber acum',
      available_few: '{{count}} locuri ale vecinilor sunt libere acum',
      available_other: '{{count}} de locuri ale vecinilor sunt libere acum',
    },
    upcoming: {
      title: 'Activitate viitoare',
      history: 'Tot istoricul',
      confirmed: 'Confirmată',
      inProgress: 'În desfășurare',
      empty: 'Nicio rezervare viitoare',
      emptyHint: 'Rezervă locul unui vecin și va apărea aici.',
    },
    tip: 'Pleci în weekend? Înregistrează-ți locul din timp, ca vizitatorii să nu blocheze accesul în curte!',
  },
  errors: {
    network: 'Serverul nu poate fi contactat. Verifică conexiunea și încearcă din nou.',
    invalidCredentials: 'Email sau parolă incorecte',
    userExists: 'Există deja un utilizator cu acest email sau număr de telefon',
  },
} satisfies Locale<typeof en>
