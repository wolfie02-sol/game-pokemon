import { useEffect, useState } from 'react';
import type { Game } from '../game';
import { earnedMilestones, explorerTx, findWallet, type Me, type Rewards, type RewardsConfig, RewardsError } from '../rewards/client';

const short = (a: string) => `${a.slice(0, 4)}…${a.slice(-4)}`;

function untilText(ms: number): string {
  const h = Math.ceil(ms / 3600_000);
  return h <= 1 ? 'within the hour' : `in about ${h} hours`;
}

const WIN_STATUS: Record<string, string> = {
  pending: 'Waiting for review',
  sent: 'Sent to your wallet',
  rejected: 'Not approved',
  failed: 'Being retried',
};

/** The "Card rewards" panel: connect a wallet, see eligibility, odds and wins. */
export function RewardsDialog({ game, rewards, onClose, onClaimed }: { game: Game; rewards: Rewards; onClose: () => void; onClaimed: () => void }) {
  const [cfg, setCfg] = useState<RewardsConfig | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const refresh = async () => {
    try {
      setCfg(await rewards.config());
      if (rewards.connected) setMe(await rewards.me());
      else setMe(null);
    } catch (e) {
      setMsg(e instanceof RewardsError ? e.message : 'Something went wrong. Try again.');
      if (!rewards.connected) setMe(null);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const connect = async () => {
    setBusy(true);
    setMsg('');
    try {
      await rewards.connect();
      onClaimed();
      await refresh();
    } catch (e) {
      setMsg(e instanceof RewardsError ? e.message : 'Could not connect the wallet.');
    } finally {
      setBusy(false);
    }
  };

  const disconnect = () => {
    rewards.disconnect();
    setMe(null);
    setMsg('Wallet disconnected.');
  };

  const earned = new Set(earnedMilestones(game.state));
  const hasWallet = typeof window !== 'undefined' && !!findWallet();
  const need = cfg?.gate?.min ?? 0;

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="rewards-title" onClick={onClose}>
      <div className="modal-card rewards" onClick={(e: { stopPropagation(): void }) => e.stopPropagation()}>
        <h2 id="rewards-title">Real card rewards</h2>
        <p>
          Earning badges and becoming CHAMPION can drop a real, graded trading card from <b>Collector Crypt</b> into your Solana wallet. Each milestone gives you one
          chance, and the chance grows the further you get.
        </p>
        {cfg?.cluster && cfg.cluster !== 'mainnet-beta' && <p className="rw-test">Test mode ({cfg.cluster}): rewards are practice cards with no real value.</p>}

        <h3>Your wallet</h3>
        {me ? (
          <div className="rw-row">
            <span>
              <b>{short(me.wallet)}</b>
              {cfg?.gate ? (
                <>
                  {' · '}
                  {me.balance === null ? '…' : me.balance.toLocaleString()} / {need.toLocaleString()} tokens{' '}
                  <span className={me.eligible ? 'rw-ok' : 'rw-bad'}>{me.eligible ? 'Eligible' : 'Not enough tokens'}</span>
                </>
              ) : (
                <span className="rw-ok"> · Eligible</span>
              )}
            </span>
            <button type="button" className="pill-btn ghost" onClick={disconnect}>
              Disconnect
            </button>
          </div>
        ) : (
          <>
            <p>{cfg?.gate ? `To take part, connect a Solana wallet holding at least ${need.toLocaleString()} tokens.` : 'Connect a Solana wallet to take part.'} Connecting only proves you own the wallet; it never moves funds.</p>
            <button type="button" className="pill-btn" onClick={connect} disabled={busy || !hasWallet}>
              {busy ? 'Check your wallet…' : 'Connect wallet'}
            </button>
            {!hasWallet && <p className="rw-note">No Solana wallet found in this browser. Install Phantom or another Solana wallet, then reload.</p>}
          </>
        )}

        {cfg && (
          <>
            <h3>Chances</h3>
            <table className="rw-table">
              <tbody>
                {cfg.milestones.map((m) => {
                  const claimed = me?.claimed.includes(m.id);
                  const next = me?.next.find((n) => n.id === m.id);
                  const wait = next?.readyAt && next.readyAt > Date.now() ? next.readyAt - Date.now() : 0;
                  const state = claimed ? 'Rolled' : !earned.has(m.id) ? 'Not reached' : !me ? 'Reached' : wait ? `Rolls ${untilText(wait)}` : 'Rolling…';
                  return (
                    <tr key={m.id}>
                      <td>{m.label}</td>
                      <td className="rw-num">{m.odds}%</td>
                      <td className={claimed ? 'rw-muted' : earned.has(m.id) ? 'rw-ok' : 'rw-muted'}>{state}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        )}

        {me && me.wins.length > 0 && (
          <>
            <h3>Your cards</h3>
            <ul className="rw-wins">
              {me.wins.map((w) => (
                <li key={w.id}>
                  <b>{w.card ?? 'Card'}</b> · {WIN_STATUS[w.status] ?? w.status}
                  {w.tx && cfg && (
                    <>
                      {' · '}
                      <a href={explorerTx(w.tx, cfg.cluster)} target="_blank" rel="noreferrer">
                        View transaction
                      </a>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}

        <p className="rw-note">
          Wins are checked by hand before a card is sent, and each wallet can win at most one card. To get the physical card, redeem it on Collector Crypt (they charge
          shipping and a small fee). Rolls are tied to your wallet, not your save, so each milestone only counts once.
        </p>
        {msg && (
          <p className="rw-msg" role="status">
            {msg}
          </p>
        )}
        <button type="button" className="pill-btn ghost" onClick={onClose} autoFocus>
          Close
        </button>
      </div>
    </div>
  );
}

/** Shown when a milestone roll wins a card. */
export function WinDialog({ card, onClose }: { card: string; onClose: () => void }) {
  return (
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="win-title" onClick={onClose}>
      <div className="modal-card rewards rw-win" onClick={(e: { stopPropagation(): void }) => e.stopPropagation()}>
        <p className="rw-kicker">Card drop</p>
        <h2 id="win-title">You won {card}!</h2>
        <p>After a quick review it will be sent to your connected wallet. You can follow it under Card rewards.</p>
        <button type="button" className="pill-btn" onClick={onClose} autoFocus>
          Back to the game
        </button>
      </div>
    </div>
  );
}
