import SetupCard from "./SetupCard";

export default function SetupScreen({ demoText, setup, onChange, onStart, onIdentify }) {
  return (
    <div className="setup-layout">
      <section className="intro">
        <h1>Každý píše vlastným rytmom</h1>
        <p className="lead">
          Projekt o biometrickej autentifikácii. Niekoľkokrát napíšete tú istú
          vetu alebo slovo a my zaznamenávame časy stlačenia kláves spolu s vaším menom.
        </p>
        {/* Len ozdoba: frázy sa "píšu" samy, preto je skrytá pre čítačky obrazovky. */}
        <p className="type-demo" aria-hidden="true">
          <span>{demoText}</span>
          <i className="type-caret" />
        </p>
        <div className="metric-chips">
          <span>
            <b>15</b> opakovaní
          </span>
          <span>
            <b>1</b> časovanie kláves
          </span>
          <span>
            <b>0</b> hesiel
          </span>
        </div>
      </section>
      <SetupCard
        setup={setup}
        onChange={onChange}
        onStart={onStart}
        onIdentify={onIdentify}
      />
    </div>
  );
}
