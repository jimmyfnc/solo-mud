import { useState } from 'react';
import type { ClassOption, ClassName } from '@solo-mud/shared';

interface CharacterCreationProps {
  classOptions: ClassOption[];
  onCreateCharacter: (name: string, className: ClassName) => void;
}

export function CharacterCreation({ classOptions, onCreateCharacter }: CharacterCreationProps) {
  const [name, setName] = useState('');
  const [selectedClass, setSelectedClass] = useState<ClassName | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
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

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-2xl w-full">
        <h2 className="text-3xl font-bold text-green-400 mb-2 text-center">
          Create Your Character
        </h2>
        <p className="text-gray-400 text-center mb-8">
          Choose your name and class to begin your adventure
        </p>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Name input */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-green-300 mb-2">
              Character Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name..."
              className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-3 text-green-400 placeholder-gray-600 focus:outline-none focus:border-green-500"
              maxLength={20}
              autoFocus
            />
          </div>

          {/* Class selection */}
          <div>
            <label className="block text-sm font-medium text-green-300 mb-4">
              Choose Your Class
            </label>
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
                    Primary: {cls.primaryStats.map(s => s.toUpperCase()).join(', ')}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          {/* Submit button */}
          <div className="text-center">
            <button
              type="submit"
              disabled={!name.trim() || !selectedClass}
              className={`px-8 py-3 rounded font-bold text-lg transition-all ${
                name.trim() && selectedClass
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
