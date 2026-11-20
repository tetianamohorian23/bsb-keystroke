# Biometrická autentifikácia podľa rytmu písania

Webová aplikácia a server na **zber a rozpoznávanie rytmu písania** (angl. *keystroke dynamics*).
Účastník 15-krát napíše buď vetu *„Every keystroke tells a unique story.“*, alebo slovo
*„biometrics“*, aplikácia zaznamená časy stlačenia a uvoľnenia každej klávesy a server z nich
vytvorí šablónu účastníka. Z jedného nového pokusu potom určí, ktorému zo známych účastníkov sa
rytmus písania najviac podobá.

- **Klient:** React + Vite
- **Server:** FastAPI (Python) + SQLite
- **Metóda:** šablóna = priemer a smerodajná odchýlka z pokusov 1–10 (zvlášť pre každý režim),
  podobnosť = štandardizovaná euklidovská vzdialenosť nad dobami držania a intervalmi medzi klávesmi

Úplný popis riešenia je v technickej dokumentácii ([`docs/`](docs/)).

## Inštalácia

Potrebujete Node.js a npm (vyvíjalo sa s 24), Python 3 a moderný prehliadač.

```bash
git clone https://github.com/tetianamohorian23/bsb-keystroke.git
cd bsb-keystroke
npm install

cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1      # Windows (PowerShell); macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
```

## Spustenie

Server a klient sa spúšťajú v dvoch samostatných termináloch.

```bash
# terminál 1: server (http://127.0.0.1:8000), z priečinka backend s aktivovaným prostredím
uvicorn main:app --reload

# terminál 2: klient, z koreňa projektu (zvyčajne http://localhost:5173)
npm run dev
```

Databáza `backend/sessions.sqlite3` sa vytvorí automaticky pri prvom spustení servera.

## Použitie

1. **Zber dát.** Zadajte meno, vyberte zariadenie, klávesnicu a režim (**veta** alebo **slovo**),
   zaškrtnite súhlas a spustite meranie.
2. Napíšte zobrazený text a potvrďte ho klávesom **Enter**. Backspace a Delete nefungujú:
   pri nich aj pri nesprávnom znaku sa pokus nezapočíta, vstup sa na chvíľu zamkne a zobrazí sa
   dôvod. Všetkých pokusov je **15**.
3. Po 15 pokusoch sa relácia **uloží automaticky**.
4. **Rozpoznanie.** „Rozpoznať pokus“: napíšte text raz a server vráti troch najpodobnejších
   účastníkov, alebo pokus označí ako neznámy.
5. **Graf presnosti.** Po každom uložení relácie server prekreslí súbor
   [`backend/accuracy_chart.png`](backend/accuracy_chart.png) (presnosť top-1 a top-3 pre vetu
   a slovo). Na webovej stránke sa nezobrazuje.

## Vyhodnotenie a API

Úspešnosť vráti `GET /api/evaluation?mode=phrase|word` (šablóny z pokusov 1–10, test na
pokusoch 11–15) a porovnanie režimov `GET /api/compare`. Všetky koncové body sú popísané
v [`backend/README.md`](backend/README.md), interaktívna dokumentácia je na
http://127.0.0.1:8000/docs.

Analýzu FAR/FRR (overenie identity, kalibrácia prahu, grafy pre dokumentáciu) vytvorí
`python far_frr.py` v priečinku `backend` (vo virtuálnom prostredí s `matplotlib`).
Skript nič nemení a neukladá do databázy.

## Štruktúra projektu

```
.
├── src/        klient (React): components, hooks, utils, styles
├── backend/    server (FastAPI): API, šablóny, identifikácia, vyhodnotenie
├── docs/       technická dokumentácia (LaTeX, hlavný súbor main.tex)
└── video/      demonštračné video
```

## Autori

Tetiana Mohorian, Artem Skrypnyk, Polina Istomina (TUKE, FEI).
