/**
 * Time module - game time management.
 */

export {
  createTimeTicker,
  getTimeOfDay,
  formatGameTime,
  type TimeTicker,
  type TimeChangeCallback,
  type DayChangeCallback,
} from './time-ticker';

export {
  createWeatherSimulator,
  getWeatherTransitions,
  getWeatherDescription,
  type WeatherSimulator,
  type WeatherType,
  type WeatherChangeCallback,
} from './weather';
