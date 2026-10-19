// Sprite viewer: front, back and icon (plus the old procedural art) for named Wildkin, scaled up.
import { creatureSprite, creatureIcon, drawCreature } from '../src/game/art/creatures';
import { speciesByName, species } from '../src/game/data/species';
const names = (new URLSearchParams(location.search).get('n') ?? 'Sproutle').split(',');
const S = 6;
const cv = document.createElement('canvas');
cv.width = 48 * S * 4 + 60;
cv.height = (48 * S + 20) * names.length;
document.body.appendChild(cv);
const x = cv.getContext('2d')!;
x.imageSmoothingEnabled = false;
x.fillStyle = '#e8e8d8';
x.fillRect(0, 0, cv.width, cv.height);
names.forEach((n, i) => {
  const sp = speciesByName(n);
  const y = i * (48 * S + 20) + 10;
  x.drawImage(creatureSprite(sp), 10, y, 48 * S, 48 * S);
  x.drawImage(creatureSprite(sp, true), 20 + 48 * S, y, 48 * S, 48 * S);
  x.drawImage(creatureIcon(sp), 30 + 96 * S, y, 16 * S, 16 * S);
  x.drawImage(drawCreature(species(sp).art), 40 + 96 * S + 16 * S, y, 48 * S, 48 * S);
});
