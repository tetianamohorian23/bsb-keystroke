import { useState } from "react";
import { DEFAULT_MODE } from "./constants";
import CompareScreen from "./components/compare/CompareScreen";
import DoneScreen from "./components/done/DoneScreen";
import IdentifyScreen from "./components/identify/IdentifyScreen";
import KeyboardBackground from "./components/KeyboardBackground";
import RunScreen from "./components/run/RunScreen";
import SetupScreen from "./components/setup/SetupScreen";
import { usePressedKeys } from "./hooks/usePressedKeys";
import { useRandomKeys } from "./hooks/useRandomKeys";

const INITIAL_SETUP = {
  id: "",
  device: "Notebook",
  keyboard: "Vstavaná",
  mode: DEFAULT_MODE,
  consent: false,
};

export default function App() {
  const [phase, setPhase] = useState("setup"); // setup | run | identify | compare | done
  const [setup, setSetup] = useState(INITIAL_SETUP);
  const [session, setSession] = useState(null); // { meta, rows, summary }
  const typedKeys = usePressedKeys(phase === "run" || phase === "identify");
  const demoKeys = useRandomKeys(phase === "setup");
  const pressed = phase === "setup" ? demoKeys : typedKeys;

  const startRun = () => {
    setSession({
      meta: {
        participant_id: setup.id.trim().replace(/[^\p{L}\p{N} _-]/gu, ""),
        session_id: new Date().toISOString(),
        device: setup.device,
        keyboard: setup.keyboard,
        mode: setup.mode,
      },
    });
    setPhase("run");
  };

  const completeRun = (rows, summary) => {
    setSession((s) => ({ ...s, rows, summary }));
    setPhase("done");
  };

  const backToSetup = () => setPhase("setup");

  return (
    <>
      <KeyboardBackground pressed={pressed} />
      <main className={phase === "run" ? "running" : ""}>
        {phase === "setup" && (
          <SetupScreen
            setup={setup}
            onChange={setSetup}
            onStart={startRun}
            onIdentify={() => setPhase("identify")}
            onCompare={() => setPhase("compare")}
          />
        )}
        {phase === "run" && (
          <RunScreen meta={session.meta} onComplete={completeRun} />
        )}
        {phase === "identify" && (
          <IdentifyScreen mode={setup.mode} onBack={backToSetup} />
        )}
        {phase === "compare" && <CompareScreen onBack={backToSetup} />}
        {phase === "done" && <DoneScreen {...session} onBack={backToSetup} />}
      </main>
    </>
  );
}
