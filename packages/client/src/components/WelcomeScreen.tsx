import { useState } from 'react';
import type { CharacterSummary, ClassOption, ClassName } from '@solo-mud/shared';

interface WelcomeScreenProps {
  playerCode: string | null;
  savedCharacters: CharacterSummary[];
  maxCharacters: number;
  classOptions: ClassOption[];
  onLoadCharacter: (characterId: string) => void;
  onDeleteCharacter: (characterId: string, confirmName: string) => void;
  onCreateCharacter: (name: string, className: ClassName) => void;
  onLinkPlayerCode: (code: string) => void;
}

/**
 * Format "last played" time as human-readable string.
 */
function formatLastPlayed(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

export function WelcomeScreen({
  playerCode,
  savedCharacters,
  maxCharacters,
  classOptions,
  onLoadCharacter,
  onDeleteCharacter,
  onCreateCharacter,
  onLinkPlayerCode,
}: WelcomeScreenProps) {
  const [view, setView] = useState<'select' | 'create' | 'link'>('select');
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [deleteInput, setDeleteInput] = useState('');
  const [linkCode, setLinkCode] = useState('');

  // Character creation state
  const [newName, setNewName] = useState('');
  const [selectedClass, setSelectedClass] = useState<ClassName | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = newName.trim();
    if (trimmedName.length < 2 || trimmedName.length > 20) {
      setError('Name must be between 2 and 20 characters.');
      return;
    }

    if (!/^[a-zA-Z][a-zA-Z0-9_ ]*[a-zA-Z0-9]$|^[a-zA-Z]$/.test(trimmedName)) {
      setError('Name must start with a letter. Can contain letters, numbers, spaces, and underscores.');
      return;
    }

    if (!selectedClass) {
      setError('Please select a class.');
      return;
    }

    onCreateCharacter(trimmedName, selectedClass);
  };

  const handleDelete = () => {
    if (!deleteConfirm) return;
    if (deleteInput.toLowerCase() !== deleteConfirm.name.toLowerCase()) {
      setError('Character name does not match.');
      return;
    }
    onDeleteCharacter(deleteConfirm.id, deleteInput);
    setDeleteConfirm(null);
    setDeleteInput('');
  };

  const handleLinkCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (linkCode.trim()) {
      onLinkPlayerCode(linkCode.trim().toUpperCase());
      setLinkCode('');
      setView('select');
    }
  };

  const canCreateMore = savedCharacters.length < maxCharacters;

  // Delete confirmation modal
  if (deleteConfirm) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-gray-900 border border-red-700 rounded-lg p-6">
          <h2 className="text-xl font-bold text-red-400 mb-4">Delete Character?</h2>
          <p className="text-gray-300 mb-4">
            Are you sure you want to delete <span className="text-green-400 font-bold">{deleteConfirm.name}</span>?
          </p>
          <p className="text-gray-400 text-sm mb-4">
            This cannot be undone! Type the character name to confirm:
          </p>
          <input
            type="text"
            value={deleteInput}
            onChange={(e) => setDeleteInput(e.target.value)}
            placeholder={deleteConfirm.name}
            className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-green-400 placeholder-gray-600 focus:outline-none focus:border-red-500 mb-4"
            autoFocus
          />
          {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
          <div className="flex gap-4">
            <button
              onClick={() => {
                setDeleteConfirm(null);
                setDeleteInput('');
                setError(null);
              }}
              className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="flex-1 px-4 py-2 bg-red-700 hover:bg-red-600 rounded text-white font-bold"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Link player code view
  if (view === 'link') {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-md w-full">
          <h2 className="text-2xl font-bold text-green-400 mb-2 text-center">Link Player Code</h2>
          <p className="text-gray-400 text-center mb-6">
            Enter your player code to access characters from another device.
          </p>
          <form onSubmit={handleLinkCode} className="space-y-4">
            <input
              type="text"
              value={linkCode}
              onChange={(e) => setLinkCode(e.target.value.toUpperCase())}
              placeholder="XXXX-XXXX-0000"
              className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-3 text-green-400 placeholder-gray-600 focus:outline-none focus:border-green-500 text-center text-lg tracking-widest"
              autoFocus
            />
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setView('select')}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-gray-300"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={!linkCode.trim()}
                className={`flex-1 px-4 py-2 rounded font-bold ${
                  linkCode.trim()
                    ? 'bg-green-600 hover:bg-green-500 text-white'
                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                }`}
              >
                Link
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Character creation view
  if (view === 'create') {
    return (
      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <div className="max-w-2xl w-full">
          <button
            onClick={() => setView('select')}
            className="text-gray-400 hover:text-green-400 mb-4 flex items-center gap-2"
          >
            &larr; Back to character select
          </button>
          <h2 className="text-3xl font-bold text-green-400 mb-2 text-center">Create New Character</h2>
          <p className="text-gray-400 text-center mb-8">
            Choose your name and class to begin your adventure
          </p>

          <form onSubmit={handleCreateSubmit} className="space-y-8">
            {/* Name input */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-green-300 mb-2">
                Character Name
              </label>
              <input
                type="text"
                id="name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Enter your name..."
                className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-3 text-green-400 placeholder-gray-600 focus:outline-none focus:border-green-500"
                maxLength={20}
                autoFocus
              />
            </div>

            {/* Class selection */}
            <div>
              <label className="block text-sm font-medium text-green-300 mb-4">Choose Your Class</label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {classOptions.map((cls) => (
                  <button
                    key={cls.id}
                    type="button"
                    onClick={() => setSelectedClass(cls.id as ClassName)}
                    className={`p-4 rounded border text-left transition-all ${
                      selectedClass === cls.id
                        ? 'border-green-500 bg-green-900/30'
                        : 'border-gray-700 hover:border-gray-500 bg-gray-900/50'
                    }`}
                  >
                    <h3 className="font-bold text-lg text-green-400">{cls.name}</h3>
                    <p className="text-sm text-gray-400 mt-1">{cls.description}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      Primary: {cls.primaryStats.map((s) => s.toUpperCase()).join(', ')}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Error message */}
            {error && <div className="text-red-400 text-sm text-center">{error}</div>}

            {/* Submit button */}
            <div className="text-center">
              <button
                type="submit"
                disabled={!newName.trim() || !selectedClass}
                className={`px-8 py-3 rounded font-bold text-lg transition-all ${
                  newName.trim() && selectedClass
                    ? 'bg-green-600 hover:bg-green-500 text-white cursor-pointer'
                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                }`}
              >
                Begin Adventure
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Main character select view
  return (
    <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
      <div className="max-w-2xl w-full">
        <h1 className="text-4xl font-bold text-green-400 mb-2 text-center">Solo MUD</h1>
        <p className="text-gray-400 text-center mb-8">
          {savedCharacters.length > 0
            ? 'Welcome back! Select a character or create a new one.'
            : 'Welcome to Solo MUD! Create your character to begin your adventure.'}
        </p>

        {/* Create new character button */}
        {canCreateMore && (
          <button
            onClick={() => setView('create')}
            className="w-full mb-6 p-4 rounded border-2 border-dashed border-gray-600 hover:border-green-500 bg-gray-900/30 hover:bg-green-900/20 transition-all text-center"
          >
            <span className="text-green-400 font-bold text-lg">+ Create New Character</span>
            <p className="text-gray-500 text-sm mt-1">
              {savedCharacters.length} / {maxCharacters} characters
            </p>
          </button>
        )}

        {/* Saved characters list */}
        {savedCharacters.length > 0 && (
          <div className="space-y-4 mb-8">
            <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
              Saved Characters
            </h2>
            {savedCharacters.map((char) => (
              <div
                key={char.id}
                className="p-4 rounded border border-gray-700 bg-gray-900/50 hover:border-gray-500 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-lg text-green-400">{char.name}</h3>
                    <p className="text-gray-400">
                      Level {char.level}{' '}
                      <span className="capitalize">{char.class}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Last played: {formatLastPlayed(char.lastPlayed)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onLoadCharacter(char.id)}
                      className="px-4 py-2 bg-green-700 hover:bg-green-600 rounded text-white font-bold"
                    >
                      Play
                    </button>
                    <button
                      onClick={() => setDeleteConfirm({ id: char.id, name: char.name })}
                      className="px-3 py-2 bg-gray-700 hover:bg-red-700 rounded text-gray-400 hover:text-white transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Player code display */}
        {playerCode && (
          <div className="mt-8 p-4 rounded bg-gray-900/50 border border-gray-700">
            <p className="text-sm text-gray-400 mb-2">Your player code:</p>
            <p className="text-lg text-green-400 font-mono tracking-widest text-center">
              {playerCode}
            </p>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Save this code to access your characters from another device.
            </p>
          </div>
        )}

        {/* Link player code */}
        <button
          onClick={() => setView('link')}
          className="w-full mt-4 text-center text-sm text-gray-500 hover:text-green-400 transition-colors"
        >
          Have a player code? Click here to link your account.
        </button>
      </div>
    </div>
  );
}
