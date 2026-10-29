import { useMemo } from 'react';
import { creatureSprite } from '../game/art/creatures';
import { TYPE_COLORS } from '../game/core/gfx';
import { ALL_SPECIES } from '../game/data/species';

/** Field guide grid rendered from the same creature sprites the game uses. */
export function Roster() {
  const entries = useMemo(
    () =>
      ALL_SPECIES.map((s) => ({
        id: s.id,
        name: s.name,
        types: s.types,
        kind: s.kind,
        src: creatureSprite(s.id).toDataURL(),
      })),
    [],
  );
  return (
    <ul className="roster">
      {entries.map((e) => (
        <li key={e.id} className="roster-card">
          <img src={e.src} width={96} height={96} alt={`${e.name} sprite`} loading="lazy" />
          <span className="roster-no">No.{String(e.id).padStart(3, '0')}</span>
          <strong>{e.name}</strong>
          <span className="roster-kind">{e.kind}</span>
          <span className="roster-types">
            {e.types.map((t) => (
              <em key={t} style={{ background: TYPE_COLORS[t] }}>
                {t}
              </em>
            ))}
          </span>
        </li>
      ))}
    </ul>
  );
}
