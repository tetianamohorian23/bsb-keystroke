# Biometrická autentifikácia podľa rytmu písania

Webová aplikácia a server na **zber a rozpoznávanie rytmu písania** (angl. *keystroke dynamics*).
Účastník 15-krát napíše buď vetu *„Every keystroke tells a unique story.“*, alebo krátke slovo
*„biometrics“* (režim si vyberie na začiatku), aplikácia zaznamená
časy stlačenia a uvoľnenia každej klávesy a server z nich vytvorí šablónu účastníka. Z jedného
nového pokusu potom určí, ktorému zo známych účastníkov sa rytmus písania najviac podobá.

- **Klient:** React + Vite (prehliadač)
- **Server:** FastAPI (Python) + SQLite
- **Metóda:** šablóna = priemer a smerodajná odchýlka z pokusov 1–10, podobnosť = štandardizovaná euklidovská vzdialenosť nad príznakmi (doby držania + intervaly medzi klávesmi): 73 príznakov pre vetu (37 kláves), 19 pre slovo (10 kláves). Šablóny sa tvoria zvlášť pre každý režim

Úplný popis riešenia je v technickej dokumentácii ([`docs/`](docs/)).

## Čo potrebujete

| Nástroj | Verzia (s ktorou sa vyvíjalo) |
|---|---|
| Node.js a npm | 24 |
| Python | 3.14 (stačí Python 3) |
| Prehliadač | Microsoft Edge alebo iný moderný (podpora `canvas` a `performance.now()`) |

## Inštalácia

```bash
# 1. Stiahnutie projektu
git clone https://github.com/tetianamohorian23/bsb-keystroke.git
cd bsb-keystroke

# 2. Klient (React): z koreňa projektu
npm install

# 3. Server (Python): vo vlastnom virtuálnom prostredí
cd backend
python -m venv .venv
```

Aktivácia virtuálneho prostredia a inštalácia závislostí servera:

```powershell
# Windows (PowerShell)
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

```bash
# macOS / Linux
source .venv/bin/activate
pip install -r requirements.txt
```

## Spustenie

Server a klient sa spúšťajú v **dvoch samostatných termináloch**.

**Terminál 1: server** (beží na http://127.0.0.1:8000)

```bash
cd backend
# prostredie musí byť aktivované (pozri vyššie)
uvicorn main:app --reload
```

**Terminál 2: klient** (z koreňa projektu)

```bash
npm run dev
```

Vite vypíše adresu aplikácie, zvyčajne **http://localhost:5173**. Požiadavky na cestu `/api`
presmeruje na server na porte 8000 (nastavenie v [`vite.config.js`](vite.config.js)). Databáza
`backend/sessions.sqlite3` sa vytvorí automaticky pri prvom spustení servera.

Kontrola, že server beží: http://127.0.0.1:8000/api/health (odpoveď obsahuje `status: ok`).
Interaktívna dokumentácia API (Swagger): http://127.0.0.1:8000/docs.

## Ako aplikáciu používať

1. **Zber dát.** Na úvodnej obrazovke zadajte meno a priezvisko, vyberte zariadenie, typ
   klávesnice (pri stolovom počítači nie je ponuka „Vstavaná“), režim (**veta** alebo
   **slovo**) a zaškrtnite súhlas so záznamom. Tlačidlo „Začať meranie“ sa aktivuje až potom.
2. Napíšte zobrazený text rovnako, ako bežne píšete, a potvrďte ho klávesom **Enter**.
   **Backspace a Delete nefungujú**. Pri ich stlačení aj pri nesprávnom znaku sa pokus
   nezapočíta: vstup sa na chvíľu (1,6 s) zamkne, veta sa zatrasie a zobrazí sa, čo sa stalo
   (napr. „Nesprávny znak „x“, očakávalo sa „o““), potom sa písanie začne odznova. Pokus
   s neuvoľnenou klávesou sa nezapočíta. Všetkých pokusov je **15**.
3. Po 15 pokusoch sa relácia **uloží na server automaticky** (opakované odoslanie tej istej
   relácie sa nezapíše znova). Ak uloženie zlyhá, zobrazí sa tlačidlo „Skúsiť znova“ a možnosť
   stiahnuť CSV.
4. **Rozpoznanie.** Na úvodnej obrazovke zvoľte režim a „Rozpoznať pokus“ a napíšte text raz.
   Server vráti troch najpodobnejších účastníkov, alebo pokus označí ako neznámy. Potrebuje na
   to v databáze relácie s platnými pokusmi v danom režime (odporúčané je aspoň 10 na účastníka).
5. **Graf presnosti.** Po každom uložení novej relácie server sám prekreslí súbor
   [`backend/accuracy_chart.png`](backend/accuracy_chart.png): stĺpcový graf presnosti (top-1
   a top-3) pre vetu a slovo. Je spravodlivý len vtedy, keď aspoň dvaja účastníci písali vetu
   aj slovo; inak to graf uvedie v podtitule. Na webovej stránke sa graf nezobrazuje.

> Zobrazené percentá sú len **relatívna miera podobnosti** medzi tromi najbližšími šablónami,
> nie pravdepodobnosť zhody.

## Vyhodnotenie úspešnosti

Po zbere dát otvorte http://127.0.0.1:8000/api/evaluation (voliteľne `?mode=word`, predvolene
`phrase`). Šablóny sa vytvoria z pokusov 1–10 a testujú sa na pokusoch 11–15; odpoveď obsahuje
`top1`, `top3`, `unknown_rate`, `avg_time_s`, `total` a maticu zámen `confusion`. Porovnanie
oboch režimov vráti http://127.0.0.1:8000/api/compare (`common` = len účastníci, ktorí
absolvovali oba režimy, `all` = všetci). Výpočet môže trvať niekoľko sekúnd.

## API

| Metóda | Cesta | Popis |
|---|---|---|
| GET | `/api/health` | kontrola, že server beží |
| POST | `/api/sessions` | uloženie dokončenej relácie (`{meta, rows}`) |
| GET | `/api/sessions?limit=50&offset=0` | zoznam relácií bez udalostí |
| GET | `/api/sessions/{id}` | metadáta a všetky udalosti jednej relácie |
| GET | `/api/stats` | počet relácií a udalostí |
| POST | `/api/identify` | identifikácia jedného pokusu (`{rows, mode}`) |
| GET | `/api/evaluation?mode=phrase\|word` | vyhodnotenie na pokusoch 11–15 |
| GET | `/api/compare` | porovnanie režimov veta vs. slovo |

Podrobnosti sú v [`backend/README.md`](backend/README.md).

## Štruktúra projektu

```
.
├── index.html, package.json, vite.config.js
├── src/                 klient (React)
│   ├── components/      obrazovky: setup, run, identify, done, typing
│   ├── hooks/           useTypingAttempt, usePressedKeys, useRandomKeys
│   ├── utils/           api, csv, summary
│   └── styles/          CSS rozdelené podľa obrazovky
├── backend/             server (FastAPI): API, šablóny, identifikácia, vyhodnotenie
├── docs/                technická dokumentácia (LaTeX)
└── video/               demonštračné video
```

## Dokumentácia

Technická dokumentácia je v priečinku [`docs/`](docs/) (hlavný súbor `main.tex`). Preloží sa
postupom `pdflatex main` → `bibtex main` → `pdflatex main` → `pdflatex main`
(v Overleafe stačí tlačidlo *Recompile*).

## Riešenie problémov

| Príznak | Riešenie |
|---|---|
| `WinError 10013` pri spustení servera | Port 8000 používa iný program. Zastavte ho alebo spustite server na inom porte (`uvicorn main:app --port 8001`) a upravte adresu v `vite.config.js`. |
| Odpoveď `detail: Not Found` na `/api/...` | Na porte beží iná aplikácia. Overte `/api/health`. |
| Uloženie na server zlyhá | Server nebeží, alebo Vite presmerováva na zlý port (`vite.config.js`). |
| Účastník chýba vo vyhodnotení | Má menej ako 11 platných pokusov. Platný pokus má presne 74 udalostí pri vete (37 stlačení a 37 uvoľnení), 20 pri slove (10 + 10). |
| Pokus sa vynuluje počas písania | Bol stlačený Backspace/Delete alebo nesprávny znak: vstup sa na chvíľu zamkne, zobrazí sa dôvod a pokus sa začína odznova. Po Enter sa vynuluje aj vtedy, keď nie sú uvoľnené všetky klávesy. |

## Osobné údaje

Dynamika písania je biometrický údaj a ako identifikátor sa ukladá meno účastníka. Databázu
`backend/sessions.sqlite3` preto **nezverejňujte** a bez súhlasu účastníkov ju nezdieľajte.
Zozbierané dáta sú len na výskumné účely tohto projektu.

## Autori

Tetiana Mohorian, Artem Skrypnyk, Polina Istomina (TUKE, FEI).
