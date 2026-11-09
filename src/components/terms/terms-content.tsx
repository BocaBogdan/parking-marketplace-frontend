import type { ReactNode } from 'react'
import { env } from '@/lib/env'
import { CONTACT_EMAIL, OPERATOR } from '@/components/terms/terms-meta'

// Every statement here describes what the app does today. Change it with the code, not before.

interface Service {
  name: string
  privacyUrl: string
  ro: string
  en: string
}

// Only what's configured: the Google ones are optional in env.ts
const services: Service[] = [
  {
    name: 'Clerk',
    privacyUrl: 'https://clerk.com/legal/privacy',
    ro: 'conturi, autentificare și parole',
    en: 'accounts, sign-in and passwords',
  },
  {
    name: 'Neon',
    privacyUrl: 'https://neon.tech/privacy-policy',
    ro: 'baza de date, găzduită în Frankfurt, Germania (AWS eu-central-1)',
    en: 'the database, hosted in Frankfurt, Germany (AWS eu-central-1)',
  },
  {
    name: 'Render',
    privacyUrl: 'https://render.com/privacy',
    ro: 'serverul aplicației, care păstrează și jurnale tehnice ale cererilor',
    en: "the app's server, which also keeps technical logs of requests",
  },
  {
    name: 'Cloudflare',
    privacyUrl: 'https://www.cloudflare.com/privacypolicy/',
    ro: 'găzduirea site-ului și stocarea documentelor PDF',
    en: 'hosting the website and storing the PDF documents',
  },
  {
    name: 'Resend',
    privacyUrl: 'https://resend.com/legal/privacy-policy',
    ro: 'trimiterea emailurilor',
    en: 'sending emails',
  },
  ...(env.googleMapsApiKey
    ? [
        {
          name: 'Google Maps',
          privacyUrl: 'https://policies.google.com/privacy',
          ro: 'hărțile; când deschizi o pagină cu hartă, browserul tău se conectează la Google, care poate folosi propriile cookie-uri',
          en: 'maps; when you open a page with a map, your browser connects to Google, which may use its own cookies',
        },
      ]
    : []),
  ...(env.feedbackFormUrl
    ? [
        {
          name: 'Google Forms',
          privacyUrl: 'https://policies.google.com/privacy',
          ro: 'formularul de feedback, doar dacă îl completezi',
          en: 'the feedback form, only if you fill it in',
        },
      ]
    : []),
]

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid gap-2">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  )
}

function List({ children }: { children: ReactNode }) {
  return <ul className="grid list-disc gap-1.5 pl-5">{children}</ul>
}

function Email() {
  return (
    <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-primary hover:underline">
      {CONTACT_EMAIL}
    </a>
  )
}

function Services({ lang }: { lang: 'ro' | 'en' }) {
  return (
    <List>
      {services.map((service) => (
        <li key={service.name}>
          <a
            href={service.privacyUrl}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-primary hover:underline"
          >
            {service.name}
          </a>{' '}
          — {service[lang]}
        </li>
      ))}
    </List>
  )
}

export function TermsRo({ appName }: { appName: string }) {
  return (
    <>
      <p>
        Aici explicăm, pe scurt și concret, cine administrează {appName}, ce date păstrăm, cine le
        vede și cu ce servicii lucrăm.
      </p>

      <Section title="1. Cine administrează aplicația">
        <p>
          {appName} este administrată de {OPERATOR}, persoană fizică. Pentru orice întrebare sau
          cerere legată de datele tale scrie la <Email />.
        </p>
      </Section>

      <Section title="2. Ce face aplicația">
        <p>
          Vecinii dintr-o clădire își pun la dispoziție locurile de parcare private când nu le
          folosesc și pot rezerva locurile altor vecini. Contul se creează doar pe baza unei
          invitații de la administratorul clădirii. Aplicația este gratuită.
        </p>
      </Section>

      <Section title="3. Ce date păstrăm">
        <List>
          <li>Contul: adresa de email, prenumele și numele.</li>
          <li>
            Clădirea: clădirea, apartamentul și rolul tău (locatar sau administrator de clădire).
          </li>
          <li>Mașinile: numărul de înmatriculare, un număr de telefon și o descriere.</li>
          <li>
            Locurile de parcare: numărul, descrierea, coordonatele, dacă e subteran, statusul
            aprobării și, dacă e cazul, motivul respingerii. Documentul PDF care dovedește dreptul
            asupra locului îl păstrăm doar până când locul e aprobat; atunci îl ștergem.
          </li>
          <li>
            Disponibilitatea și rezervările: orele în care un loc e liber; cine a rezervat ce loc,
            cu ce mașină și pentru ce interval.
          </li>
          <li>Invitațiile: adresa de email, apartamentul și cine a trimis invitația.</li>
        </List>
        <p>Parola nu o vedem și nu o păstrăm noi; o gestionează Clerk.</p>
      </Section>

      <Section title="4. De unde avem datele">
        <p>
          Adresa de email și apartamentul le primim de la administratorul clădirii, când te invită.
          Restul le introduci tu în aplicație.
        </p>
      </Section>

      <Section title="5. De ce le folosim">
        <p>
          Doar ca aplicația să funcționeze: să te poți autentifica, să știm în ce clădire și
          apartament locuiești, să poți oferi și rezerva locuri și să îți trimitem emailul de
          invitație. Nu vindem datele, nu afișăm reclame și nu folosim instrumente de analiză sau de
          urmărire.
        </p>
      </Section>

      <Section title="6. Cine vede datele tale">
        <List>
          <li>
            Proprietarii unui loc (inclusiv ceilalți locatari ai aceluiași apartament) văd
            rezervările făcute pe locul lor, inclusiv numărul de înmatriculare și telefonul mașinii
            cu care s-a rezervat.
          </li>
          <li>
            Administratorul clădirii tale vede numele, emailul și apartamentul locatarilor,
            documentele PDF ale locurilor din clădire care așteaptă aprobarea sau au fost respinse
            și statistici despre rezervări, inclusiv numere de înmatriculare.
          </li>
          <li>
            Administratorul aplicației are acces la toate datele, ca să aprobe locuri
            și să rezolve probleme.
          </li>
        </List>
      </Section>

      <Section title="7. Servicii externe">
        <p>
          Datele sunt prelucrate cu ajutorul acestor furnizori, fiecare cu propria politică de
          confidențialitate. Unii dintre ei sunt companii din SUA.
        </p>
        <Services lang="ro" />
      </Section>

      <Section title="8. Cookie-uri și stocare în browser">
        <p>
          Folosim doar ce e necesar: cookie-urile Clerk care te țin autentificat și limba aleasă,
          salvată în browser. Nu folosim cookie-uri de reclamă sau de analiză.
        </p>
      </Section>

      <Section title="9. Cât timp păstrăm datele">
        <p>
          Nu ștergem automat datele după o anumită perioadă: ele rămân până când le ștergi tu, acolo
          unde aplicația permite, sau până ne ceri să le ștergem. Rezervările anulate și mașinile
          șterse dispar din baza noastră de date. Documentul PDF al unui loc se șterge când locul e
          aprobat sau când ștergi locul. Copii ale datelor pot rămâne o vreme în backup-urile și
          jurnalele furnizorilor de mai sus.
        </p>
      </Section>

      <Section title="10. Drepturile tale">
        <p>
          Poți cere oricând să vezi ce date avem despre tine, să le corectăm sau să le ștergem,
          inclusiv contul. Aplicația nu are încă un buton de ștergere a contului, așa că scrie-ne la{' '}
          <Email /> și ne ocupăm manual. Dacă răspunsul nostru nu te mulțumește, poți depune o
          plângere la Autoritatea Națională de Supraveghere a Prelucrării Datelor cu Caracter
          Personal (
          <a
            href="https://www.dataprotection.ro/"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-primary hover:underline"
          >
            ANSPDCP
          </a>
          ).
        </p>
      </Section>

      <Section title="11. Reguli de folosire">
        <List>
          <li>
            Aplicația doar pune vecinii în legătură. Înțelegerile dintre voi, felul în care parcați
            și eventualele pagube sunt responsabilitatea celor implicați.
          </li>
          <li>
            Aplicația este oferită gratuit, „așa cum este”. Nu garantăm că funcționează fără
            întreruperi sau că un loc rezervat va fi liber.
          </li>
          <li>Adaugă doar locuri asupra cărora ai dreptul și date corecte.</li>
          <li>Accesul poate fi retras celor care folosesc aplicația abuziv.</li>
        </List>
      </Section>

      <Section title="12. Modificări">
        <p>Dacă schimbăm acești termeni, actualizăm data de mai sus.</p>
      </Section>
    </>
  )
}

export function TermsEn({ appName }: { appName: string }) {
  return (
    <>
      <p>
        This page explains, briefly and concretely, who runs {appName}, what data we keep, who sees
        it and which services we use.
      </p>

      <Section title="1. Who runs the app">
        <p>
          {appName} is run by {OPERATOR}, a private individual. For any question or request about
          your data, write to <Email />.
        </p>
      </Section>

      <Section title="2. What the app does">
        <p>
          Neighbours in a building offer their private parking spots when they don't use them and
          can book other neighbours' spots. Accounts are created only through an invitation from the
          building administrator. The app is free.
        </p>
      </Section>

      <Section title="3. What data we keep">
        <List>
          <li>Account: email address, first and last name.</li>
          <li>Building: your building, apartment and role (resident or building administrator).</li>
          <li>Cars: plate number, a phone number and a description.</li>
          <li>
            Parking spots: number, description, coordinates, whether it's underground, approval
            status and, if any, the rejection reason. The PDF proving your right to the spot is kept
            only until the spot is approved; then we delete it.
          </li>
          <li>
            Availability and bookings: the hours a spot is free; who booked which spot, with which
            car and for what time.
          </li>
          <li>Invitations: email address, apartment and who sent the invitation.</li>
        </List>
        <p>We never see or keep your password; Clerk handles it.</p>
      </Section>

      <Section title="4. Where the data comes from">
        <p>
          Your email address and apartment come from your building administrator when they invite
          you. You enter the rest in the app.
        </p>
      </Section>

      <Section title="5. Why we use it">
        <p>
          Only to make the app work: so you can sign in, so we know your building and apartment, so
          you can offer and book spots, and to send you the invitation email. We don't sell data,
          show ads or use analytics or tracking tools.
        </p>
      </Section>

      <Section title="6. Who sees your data">
        <List>
          <li>
            A spot's owners (including the other residents of the same apartment) see the bookings
            on their spot, including the plate number and phone of the car used to book.
          </li>
          <li>
            Your building administrator sees residents' names, emails and apartments, the PDFs of
            the building's spots that are waiting for approval or were rejected, and booking
            statistics, including plate numbers.
          </li>
          <li>
            The app administrator has access to all data, to approve spots and fix
            problems.
          </li>
        </List>
      </Section>

      <Section title="7. External services">
        <p>
          The data is processed with the help of these providers, each with its own privacy policy.
          Some of them are US companies.
        </p>
        <Services lang="en" />
      </Section>

      <Section title="8. Cookies and browser storage">
        <p>
          We only use what's needed: Clerk's cookies that keep you signed in, and your chosen
          language, saved in your browser. We don't use advertising or analytics cookies.
        </p>
      </Section>

      <Section title="9. How long we keep data">
        <p>
          We don't delete data automatically after a set time: it stays until you delete it, where
          the app lets you, or until you ask us to. Cancelled bookings and deleted cars are removed
          from our database. A spot's PDF is deleted when the spot is approved or when you delete
          the spot. Copies may remain for a while in the backups and logs of the providers above.
        </p>
      </Section>

      <Section title="10. Your rights">
        <p>
          You can ask at any time to see the data we have about you, to correct it or to delete it,
          including your account. The app doesn't have a delete-account button yet, so write to{' '}
          <Email /> and we'll handle it manually. If you're not satisfied with our answer, you can
          complain to the Romanian data protection authority (
          <a
            href="https://www.dataprotection.ro/"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-primary hover:underline"
          >
            ANSPDCP
          </a>
          ).
        </p>
      </Section>

      <Section title="11. Rules of use">
        <List>
          <li>
            The app only connects neighbours. Arrangements between you, how you park and any damage
            are the responsibility of those involved.
          </li>
          <li>
            The app is free and provided "as is". We don't guarantee it works without interruption
            or that a booked spot will be free.
          </li>
          <li>Only add spots you have a right to, and accurate data.</li>
          <li>Access can be removed from anyone who misuses the app.</li>
        </List>
      </Section>

      <Section title="12. Changes">
        <p>If we change these terms, we update the date above.</p>
      </Section>
    </>
  )
}
