import { LkProvider } from './lk-core';
import { PlaygroundShell } from './playground/PlaygroundShell';

export default function App() {
  return (
    <LkProvider manageDocumentTitle>
      <PlaygroundShell />
    </LkProvider>
  );
}
