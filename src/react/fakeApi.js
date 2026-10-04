// A local stand-in for a paginated API. No network.
const FRUITS = [
  'Apple', 'Apricot', 'Avocado', 'Banana', 'Blackberry', 'Blueberry', 'Cherry', 'Coconut',
  'Cranberry', 'Date', 'Dragon fruit', 'Fig', 'Grape', 'Grapefruit', 'Guava', 'Kiwi',
  'Lemon', 'Lime', 'Lychee', 'Mango', 'Melon', 'Nectarine', 'Orange', 'Papaya',
  'Passion fruit', 'Peach', 'Pear', 'Pineapple', 'Plum', 'Pomegranate', 'Quince',
  'Raspberry', 'Strawberry', 'Tangerine', 'Watermelon'
];

export function fetchFruits({ filter = '', delay = 300 } = {}) {
  const needle = filter.trim().toLowerCase();
  const result = FRUITS.filter((name) => name.toLowerCase().includes(needle));
  return new Promise((resolve) => setTimeout(() => resolve(result), delay));
}
