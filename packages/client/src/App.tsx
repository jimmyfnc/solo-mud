import { Terminal, CommandInput } from './components';
import { useGameStore } from './store/gameStore';

function App() {
  const { lines, connected, connecting, addLines } = useGameStore();

  const handleCommand = (command: string) => {
    // Echo the command
    addLines([{ text: `> ${command}`, style: 'normal' }]);

    // TODO: Send to server via Socket.io
    addLines([{ text: '(Not connected to server)', style: 'error' }]);
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

      {/* Terminal output */}
      <Terminal lines={lines} />

      {/* Command input */}
      <CommandInput
        onSubmit={handleCommand}
        disabled={!connected}
        placeholder={connected ? 'Enter command...' : 'Connecting to server...'}
      />
    </div>
  );
}

export default App;
