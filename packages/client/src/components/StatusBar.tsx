import { formatCurrency } from '@solo-mud/shared';
import { useGameStore } from '../store/gameStore';

/**
 * StatusBar component - displays player health, mana, and location info.
 */
export function StatusBar() {
  const { player, room, time, weather } = useGameStore();

  if (!player) {
    return null;
  }

  const hpPercent = Math.round((player.currentHp / player.maxHp) * 100);
  const mpPercent = Math.round((player.currentMp / player.maxMp) * 100);

  const hpColor = hpPercent > 50 ? 'bg-green-600' : hpPercent > 25 ? 'bg-yellow-600' : 'bg-red-600';
  const mpColor = 'bg-blue-600';

  return (
    <div className="border-t border-gray-700 p-2 bg-gray-900">
      <div className="flex items-center justify-between gap-4 text-sm">
        {/* Player info */}
        <div className="flex items-center gap-4">
          <span className="font-bold text-cyan-400">{player.name}</span>
          <span className="text-gray-400">Lv.{player.level} {player.class}</span>
        </div>

        {/* HP Bar */}
        <div className="flex items-center gap-2">
          <span className="text-red-400 text-xs w-8">HP</span>
          <div className="w-24 h-3 bg-gray-700 rounded overflow-hidden">
            <div
              className={`h-full ${hpColor} transition-all duration-300`}
              style={{ width: `${hpPercent}%` }}
            />
          </div>
          <span className="text-gray-300 text-xs w-16">
            {player.currentHp}/{player.maxHp}
          </span>
        </div>

        {/* MP Bar */}
        <div className="flex items-center gap-2">
          <span className="text-blue-400 text-xs w-8">MP</span>
          <div className="w-24 h-3 bg-gray-700 rounded overflow-hidden">
            <div
              className={`h-full ${mpColor} transition-all duration-300`}
              style={{ width: `${mpPercent}%` }}
            />
          </div>
          <span className="text-gray-300 text-xs w-16">
            {player.currentMp}/{player.maxMp}
          </span>
        </div>

        {/* Location */}
        {room && (
          <div className="flex items-center gap-2 text-gray-400">
            <span className="text-yellow-400">@</span>
            <span className="truncate max-w-32">{room.location.name}</span>
          </div>
        )}

        {/* Time */}
        {time && (
          <div className="text-gray-500 text-xs">
            Day {time.day}, {time.timeOfDay}
            {weather && weather.type !== 'clear' && (
              <span className="ml-1">({weather.type})</span>
            )}
          </div>
        )}

        {/* Currency */}
        <div className="text-yellow-400">
          {formatCurrency(player.currency)}
        </div>
      </div>
    </div>
  );
}

export default StatusBar;
