import { Terminal, CommandInput, StatusBar, WelcomeScreen } from './components';
import { useGameStore } from './store/gameStore';
import { useSocket } from './hooks';

function App() {
  const {
    lines,
    connected,
    connecting,
    showCharacterSelect,
    playerCode,
    savedCharacters,
    maxCharacters,
    classOptions,
    player,
  } = useGameStore();

  const {
    sendCommand,
    createCharacter,
    loadCharacter,
    deleteCharacter,
    linkPlayerCode,
  } = useSocket();

  const handleCommand = (command: string) => {
    sendCommand(command);
  };

  // Determine what to show
  const showWelcome = showCharacterSelect && !player;
  const showGame = player && !showCharacterSelect;

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

      {/* Welcome/Character Select Screen */}
      {showWelcome && (
        <WelcomeScreen
          playerCode={playerCode}
          savedCharacters={savedCharacters}
          maxCharacters={maxCharacters}
          classOptions={classOptions}
          onLoadCharacter={loadCharacter}
          onDeleteCharacter={deleteCharacter}
          onCreateCharacter={createCharacter}
          onLinkPlayerCode={linkPlayerCode}
        />
      )}

      {/* Game UI */}
      {showGame && (
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

      {/* Loading state - waiting for server */}
      {!showWelcome && !showGame && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-pulse text-2xl text-green-400 mb-4">
              {connecting ? 'Connecting to server...' : 'Loading...'}
            </div>
            {!connected && !connecting && (
              <p className="text-gray-500">Unable to connect. Please refresh to try again.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
