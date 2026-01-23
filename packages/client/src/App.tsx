import { Terminal, CommandInput, StatusBar, CharacterCreation } from './components';
import { useGameStore } from './store/gameStore';
import { useSocket } from './hooks';

function App() {
  const { lines, connected, connecting, needsCharacterCreation, classOptions } = useGameStore();
  const { sendCommand, createCharacter } = useSocket();

  const handleCommand = (command: string) => {
    sendCommand(command);
  };

  return (
    <div className="h-screen flex flex-col bg-black text-green-400 font-mono">
      {/* Header */}
      <header className="border-b border-gray-700 p-2 flex items-center justify-between">
        <h1 className="text-lg font-bold">Solo MUD</h1>
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              connected ? 'bg-green-500' : connecting ? 'bg-yellow-500' : 'bg-red-500'
            }`}
          />
          <span className="text-sm text-gray-400">
            {connected ? 'Connected' : connecting ? 'Connecting...' : 'Disconnected'}
          </span>
        </div>
      </header>

      {/* Character creation flow */}
      {needsCharacterCreation && classOptions.length > 0 ? (
        <CharacterCreation
          classOptions={classOptions}
          onCreateCharacter={createCharacter}
        />
      ) : (
        <>
          {/* Terminal output */}
          <Terminal lines={lines} />

          {/* Status bar */}
          <StatusBar />

          {/* Command input */}
          <CommandInput
            onSubmit={handleCommand}
            disabled={!connected}
            placeholder={connected ? 'Enter command...' : 'Connecting to server...'}
          />
        </>
      )}
    </div>
  );
}

export default App;
