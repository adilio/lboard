import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import type { MouseEvent as RM } from "react";
import {
  areas,
  calmIds,
  cleanName,
  defaults,
  toyArt,
  validatePreferences,
} from "./model";
import type { Preferences, Voice } from "./model";
import { Art, Icon } from "./Art";
import { activities, descriptions } from "./activities";
import { clearSaved } from "./play/store";
import { hush } from "./play/speech";
import { IdleHint } from "./play/IdleHint";
import {
  stopAudio,
  startMusic,
  stopMusic,
  musicLevel,
  tone,
  sfx,
  pentatonic,
} from "./audio";
import { startTouchFX } from "./fx";
const key = "lboard.preferences.v1";
const questions = [
  { q: "What is 7 + 5?", answers: [10, 12, 14], correct: 12 },
  { q: "What is 6 + 8?", answers: [14, 12, 16], correct: 14 },
  { q: "What is 9 + 4?", answers: [11, 15, 13], correct: 13 },
];
function load() {
  try {
    return {
      prefs: validatePreferences(
        JSON.parse(localStorage.getItem(key) || "null"),
      ),
      blocked: false,
    };
  } catch {
    return { prefs: { ...defaults }, blocked: true };
  }
}
export default function App() {
  const [initial] = useState(load);
  const [prefs, setPrefs] = useState(initial.prefs);
  const [blocked, setBlocked] = useState(initial.blocked);
  const [nav, setNav] = useState({ x: 0, y: 0, dir: "load" });
  const [areaId, setArea] = useState<string | null>(null);
  const [toy, setToy] = useState<string | null>(null);
  const [resetVersion, setResetVersion] = useState(0);
  const [parent, setParent] = useState<
    "closed" | "hold" | "question" | "settings"
  >("closed");
  const [question, setQuestion] = useState(questions[0]);
  const [holding, setHolding] = useState(false);
  const [gateMessage, setGateMessage] = useState("");
  const [saved, setSaved] = useState("");
  const [musicPlaying, setMusicPlaying] = useState(false);
  useEffect(() => {
    const pause = () => {
      if (document.hidden) {
        stopMusic();
        setMusicPlaying(false);
      }
    };
    document.addEventListener("visibilitychange", pause);
    return () => document.removeEventListener("visibilitychange", pause);
  }, []);
  useEffect(() => {
    musicLevel(prefs);
    if (!prefs.soundEnabled) {
      stopMusic();
      setMusicPlaying(false);
    }
  }, [prefs]);
  const [offline, setOffline] = useState(false);
  const [repairing, setRepairing] = useState(false);
  const [registration, setRegistration] =
    useState<ServiceWorkerRegistration | null>(null);
  const [waiting, setWaiting] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dialog = useRef<HTMLDivElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const parentButton = useRef<HTMLButtonElement>(null);
  const area = areas.find((a) => a.id === areaId);
  const shown = (t: string) =>
    prefs.calmMode ? calmIds.includes(t) : prefs.enabledActivityIds.includes(t);
  const visibleAreas = areas.filter((a) => a.toys.some(shown));
  const areaToys = area ? area.toys.filter(shown) : [];
  // A room with one activity opens it directly (spec §10 room skip rule).
  const skipped = areaToys.length === 1;
  const mainRef = useRef<HTMLElement>(null);
  const fxCanvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => startTouchFX(fxCanvas.current!), []);
  // Zoom into (or back out of) the place that was tapped.
  function go(e: RM<HTMLElement> | null, dir: "in" | "out", next: () => void) {
    const main = mainRef.current?.getBoundingClientRect();
    const r = e?.currentTarget.getBoundingClientRect();
    setNav({
      x: r && main ? r.left + r.width / 2 - main.left : 0,
      y: r && main ? r.top + r.height / 2 - main.top : 0,
      dir,
    });
    stopAudio();
    hush();
    sfx(prefs, "whoosh", dir === "in" ? 1 : 0.7);
    next();
    window.scrollTo({ top: 0 });
  }
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(prefs));
      setBlocked(false);
    } catch {
      setBlocked(true);
    }
  }, [prefs]);
  useEffect(() => {
    title.current?.focus({ preventScroll: true });
  }, [areaId, toy]);
  useEffect(() => {
    document.documentElement.dataset.reduced = String(prefs.reducedMotion);
    if (!prefs.soundEnabled) stopAudio();
  }, [prefs.reducedMotion, prefs.soundEnabled]);
  useEffect(() => {
    if (!("serviceWorker" in navigator) || !import.meta.env.PROD) return;
    let active = true;
    const check = async (reg: ServiceWorkerRegistration) => {
      const ready = !!navigator.serviceWorker.controller && !!reg.active;
      if (!ready) {
        setOffline(false);
        return;
      }
      const channel = new MessageChannel();
      channel.port1.onmessage = (e) => {
        if (active) setOffline(e.data?.ready === true);
        channel.port1.close();
      };
      reg.active?.postMessage({ type: "STATUS" }, [channel.port2]);
    };
    let current: ServiceWorkerRegistration | undefined;
    const controller = () => {
      if (current) void check(current);
    };
    const changed = () => {
      if (!current) return;
      setWaiting(!!current.waiting);
      void check(current);
    };
    const found = () =>
      current?.installing?.addEventListener("statechange", changed);
    navigator.serviceWorker.addEventListener("controllerchange", controller);
    void navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`, {
        scope: import.meta.env.BASE_URL,
      })
      .then((reg) => {
        if (!active) return;
        current = reg;
        setRegistration(reg);
        changed();
        reg.addEventListener("updatefound", found);
      })
      .catch(() => setOffline(false));
    return () => {
      active = false;
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        controller,
      );
      current?.removeEventListener("updatefound", found);
    };
    // Register once; controller callbacks use the registration returned above.
  }, []);
  function change<K extends keyof Preferences>(k: K, v: Preferences[K]) {
    setPrefs((p) => ({ ...p, [k]: v }));
    setSaved("Preferences saved on this device.");
  }
  function openParent() {
    lastFocus.current = document.activeElement as HTMLElement;
    setParent("hold");
    setGateMessage("");
    setQuestion(questions[Math.floor(Math.random() * questions.length)]);
  }
  function cancelHold() {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    holdTimer.current = null;
    setHolding(false);
  }
  useEffect(() => {
    const cancel = () => {
      if (holdTimer.current) clearTimeout(holdTimer.current);
      holdTimer.current = null;
      setHolding(false);
    };
    window.addEventListener("blur", cancel);
    document.addEventListener("visibilitychange", cancel);
    return () => {
      window.removeEventListener("blur", cancel);
      document.removeEventListener("visibilitychange", cancel);
    };
  }, []);
  function closeParent() {
    cancelHold();
    setParent("closed");
    setResetConfirm(false);
    requestAnimationFrame(() => lastFocus.current?.focus());
  }
  function reveal() {
    cancelHold();
    setParent("question");
  }
  useEffect(() => {
    if (parent !== "closed")
      dialog.current?.querySelector<HTMLElement>("button,input")?.focus();
    return () => {
      if (holdTimer.current) clearTimeout(holdTimer.current);
    };
  }, [parent]);
  function trap(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Escape") {
      closeParent();
      return;
    }
    if (e.key !== "Tab") return;
    const elements = [
      ...dialog.current!.querySelectorAll<HTMLElement>(
        "button:not(:disabled),input,select,summary,a[href]",
      ),
    ];
    const first = elements[0],
      last = elements.at(-1);
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last?.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first?.focus();
    }
  }
  function arrowFocus(e: KeyboardEvent<HTMLElement>) {
    if (
      !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key) ||
      (e.target as HTMLElement).tagName === "INPUT"
    )
      return;
    const buttons = [
      ...e.currentTarget.querySelectorAll<HTMLButtonElement>(
        "button:not(:disabled)",
      ),
    ];
    const i = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (i < 0) return;
    e.preventDefault();
    buttons[
      (i +
        (["ArrowLeft", "ArrowUp"].includes(e.key) ? -1 : 1) +
        buttons.length) %
        buttons.length
    ]?.focus();
  }
  return (
    <>
      <div
        className="app-shell"
        inert={parent !== "closed"}
        onKeyDown={arrowFocus}
      >
        <div className="sky" aria-hidden="true">
          <div className="sky-sun" />
          <div className="sky-cloud" />
          <svg
            className="sky-hills"
            viewBox="0 0 1440 260"
            preserveAspectRatio="none"
          >
            <path
              d="M0 150Q240 40 520 130T1040 110 1440 90V260H0z"
              fill="#9fdc8f"
            />
            <path
              d="M0 200Q300 110 640 190T1180 170 1440 180V260H0z"
              fill="#6cc07a"
            />
          </svg>
        </div>
        <header className="topbar">
          <button
            className="brand"
            aria-label="Layla Board playroom"
            onClick={(e) =>
              go(e, "out", () => {
                setToy(null);
                setArea(null);
              })
            }
          >
            <span className="brand-mark" aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
            </span>
            <span className="brand-word">
              layla<span className="brand-board">board</span>
            </span>
          </button>
          <div className="top-actions">
            <button
              className="icon-button sound-button"
              aria-label={prefs.soundEnabled ? "Mute sound" : "Enable sound"}
              aria-pressed={prefs.soundEnabled}
              onClick={() => change("soundEnabled", !prefs.soundEnabled)}
            >
              <Icon name={prefs.soundEnabled ? "sound" : "mute"} />
            </button>
            <button
              ref={parentButton}
              className="parent-link"
              onClick={openParent}
            >
              <Icon name="settings" />
              <span>Grown-ups</span>
            </button>
          </div>
        </header>
        <main ref={mainRef}>
          <div
            key={`${areaId}|${toy}`}
            className={`view view-${nav.dir}`}
            style={
              {
                "--ox": `${nav.x}px`,
                "--oy": `${nav.y}px`,
              } as React.CSSProperties
            }
          >
            {toy && area ? (
              <div
                className="activity-view"
                style={{ "--area": area.color } as React.CSSProperties}
              >
                <div className="activity-header">
                  <button
                    className="round-nav home-button"
                    aria-label={
                      skipped ? "Back to playroom" : `Back to ${area.name}`
                    }
                    onClick={(e) =>
                      go(e, "out", () => {
                        setToy(null);
                        if (skipped) setArea(null);
                      })
                    }
                  >
                    <Icon name="home" />
                  </button>
                  <div className="activity-title">
                    <span className="eyebrow">{area.name}</span>
                    <h1 ref={title} tabIndex={-1}>
                      {toy}
                    </h1>
                  </div>
                  <button
                    className="round-nav reset-button"
                    aria-label={`Reset ${toy}`}
                    onClick={() => {
                      stopAudio();
                      hush();
                      sfx(prefs, "sparkle", 0.8);
                      clearSaved(toy);
                      setResetVersion((v) => v + 1);
                    }}
                  >
                    <Icon name="reset" />
                  </button>
                </div>
                <section className="activity-stage">
                  <ActivityView
                    key={`${toy}:${resetVersion}`}
                    name={toy}
                    prefs={prefs}
                  />
                  <IdleHint key={`hint:${toy}:${resetVersion}`} />
                </section>
              </div>
            ) : area ? (
              <div
                className="room-view"
                style={{ "--area": area.color } as React.CSSProperties}
              >
                <div className="shelf-heading">
                  <button
                    className="round-nav home-button"
                    aria-label="Back to playroom"
                    onClick={(e) => go(e, "out", () => setArea(null))}
                  >
                    <Icon name="home" />
                  </button>
                  <div>
                    <h1 ref={title} tabIndex={-1}>
                      {area.name}
                    </h1>
                    <p>{area.tag}</p>
                  </div>
                </div>
                <section
                  className="toy-shelf"
                  aria-label={`${area.name} activities`}
                >
                  {areaToys.map((t, i) => (
                    <button
                      key={t}
                      className="activity-card tilt"
                      style={{ "--i": i } as React.CSSProperties}
                      onClick={(e) => {
                        go(e, "in", () => setToy(t));
                        tone(prefs, pentatonic[5 + i * 2]);
                      }}
                    >
                      <span className="card-face">
                        <span className="activity-art">
                          <span className="art-glow" />
                          <Art kind={toyArt[t]} />
                        </span>
                        <span className="activity-card-text">
                          <strong>{t}</strong>
                          <span>{descriptions[t]}</span>
                        </span>
                        <span className="card-shine" />
                      </span>
                    </button>
                  ))}
                </section>
              </div>
            ) : (
              <div className="map-view">
                <div className="welcome">
                  <h1 ref={title} tabIndex={-1}>
                    Hello, little <span>explorer.</span>
                  </h1>
                  <p>Pick a little world. See where it takes you.</p>
                </div>
                <section className="area-shelf" aria-label="Play areas">
                  {visibleAreas.map((a, i) => (
                    <button
                      key={a.id}
                      className={`area-card tilt area-${a.id}`}
                      style={
                        {
                          "--area": a.color,
                          "--i": i,
                        } as React.CSSProperties
                      }
                      onClick={(e) => {
                        const own = a.toys.filter(shown);
                        go(e, "in", () => {
                          setArea(a.id);
                          if (own.length === 1) setToy(own[0]);
                        });
                        tone(prefs, pentatonic[i % pentatonic.length]);
                      }}
                    >
                      <span className="card-face">
                        <span className="card-illustration">
                          <span className="art-glow" />
                          <Art kind={a.art} />
                        </span>
                        <span className="area-card-label">
                          <h2>{a.name}</h2>
                          <p>{a.tag}</p>
                        </span>
                        <span className="card-shine" />
                      </span>
                    </button>
                  ))}
                </section>
              </div>
            )}
          </div>
        </main>
      </div>
      <canvas ref={fxCanvas} className="touch-fx" aria-hidden="true" />
      {parent !== "closed" && (
        <div className="modal-backdrop">
          <div
            ref={dialog}
            className={`parent-modal ${parent === "settings" ? "settings-modal" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="parent-title"
            onKeyDown={trap}
          >
            <div className="modal-heading">
              <div>
                <span className="eyebrow">A QUIET CORNER FOR</span>
                <h2 id="parent-title">Grown-ups</h2>
              </div>
              <button
                className="close-button"
                aria-label="Close parent controls"
                onClick={closeParent}
              >
                ×
              </button>
            </div>
            {parent === "hold" ? (
              <div className="gate-content">
                <span className="gate-flower">✿</span>
                <p>A little pause before the settings.</p>
                <button
                  className={`hold-button ${holding ? "holding" : ""}`}
                  onPointerDown={(e) => {
                    e.currentTarget.setPointerCapture(e.pointerId);
                    setHolding(true);
                    holdTimer.current = setTimeout(reveal, 3000);
                  }}
                  onPointerUp={cancelHold}
                  onPointerCancel={cancelHold}
                  onLostPointerCapture={cancelHold}
                  onClick={(e) => {
                    if (e.detail === 0) reveal();
                  }}
                >
                  <span>
                    {holding ? "Keep holding…" : "Hold for 3 seconds"}
                  </span>
                </button>
                <small>
                  Using a keyboard or screen reader? Activate the button to
                  continue.
                </small>
              </div>
            ) : parent === "question" ? (
              <div className="gate-content">
                <p>One quick question for a grown-up.</p>
                <h3>{question.q}</h3>
                <div className="answer-buttons">
                  {question.answers.map((a) => (
                    <button
                      key={a}
                      onClick={() =>
                        a === question.correct
                          ? setParent("settings")
                          : setGateMessage("Have another look. Take your time.")
                      }
                    >
                      {a}
                    </button>
                  ))}
                </div>
                <p role="status">{gateMessage}</p>
              </div>
            ) : (
              <div className="settings-content">
                <p className="settings-intro">
                  A little room to make play feel right for your family.
                </p>
                <section>
                  <h3>Sound & stillness</h3>
                  <Setting
                    label="Gentle sound"
                    detail="Visual play always works without sound."
                  >
                    <input
                      type="checkbox"
                      checked={prefs.soundEnabled}
                      onChange={(e) => change("soundEnabled", e.target.checked)}
                    />
                  </Setting>
                  <label className="setting-row">
                    <span>Effects volume</span>
                    <input
                      aria-label="Effects volume"
                      type="range"
                      min="0"
                      max="1"
                      step=".05"
                      value={prefs.effectsVolume}
                      onChange={(e) => change("effectsVolume", +e.target.value)}
                    />
                  </label>
                  <p className="setting-note">
                    Instruments make sound only when played. The optional soft
                    chord starts only here and stops when the app is hidden. Try
                    the device volume at a comfortable level.
                  </p>
                  <label className="setting-row">
                    <span>Music volume</span>
                    <input
                      aria-label="Music volume"
                      type="range"
                      min="0"
                      max="1"
                      step=".05"
                      value={prefs.musicVolume}
                      onChange={(e) => change("musicVolume", +e.target.value)}
                    />
                  </label>
                  <button
                    disabled={!prefs.soundEnabled}
                    aria-pressed={musicPlaying}
                    onClick={() => {
                      if (musicPlaying) {
                        stopMusic();
                        setMusicPlaying(false);
                      } else setMusicPlaying(startMusic(prefs));
                    }}
                  >
                    {musicPlaying ? "Stop quiet music" : "Play quiet music"}
                  </button>
                  <Setting
                    label="Reduced motion"
                    detail="Also follows your device’s reduced motion setting."
                  >
                    <input
                      type="checkbox"
                      checked={prefs.reducedMotion}
                      onChange={(e) =>
                        change("reducedMotion", e.target.checked)
                      }
                    />
                  </Setting>
                  <Setting
                    label="Calm mode"
                    detail="Show only the gentlest activities: Cozy Nook, the art tools and the xylophone."
                  >
                    <input
                      type="checkbox"
                      checked={prefs.calmMode}
                      onChange={(e) => {
                        change("calmMode", e.target.checked);
                        setArea(null);
                        setToy(null);
                      }}
                    />
                  </Setting>
                </section>
                <section>
                  <h3>Words and names</h3>
                  <label className="setting-row">
                    <span>
                      <strong>Spoken words</strong>
                      <small>
                        Uses this device’s built-in voice. “Names only” keeps
                        numbers, letters, colours and names but skips hints.
                      </small>
                    </span>
                    <select
                      value={prefs.voice}
                      onChange={(e) => change("voice", e.target.value as Voice)}
                    >
                      <option value="on">On</option>
                      <option value="names">Names only</option>
                      <option value="off">Off</option>
                    </select>
                  </label>
                  <label className="setting-row">
                    <span>
                      <strong>Child’s name</strong>
                      <small>
                        Letter Friends builds this name. Letters only.
                      </small>
                    </span>
                    <input
                      type="text"
                      className="name-input"
                      maxLength={10}
                      autoComplete="off"
                      defaultValue={prefs.childName}
                      onBlur={(e) => {
                        const n = cleanName(e.target.value) || "Layla";
                        e.target.value = n;
                        change("childName", n);
                      }}
                    />
                  </label>
                  <label className="setting-row">
                    <span>
                      <strong>Family names</strong>
                      <small>
                        Up to six, separated by commas (Mom, Dad, Biscuit).
                      </small>
                    </span>
                    <input
                      type="text"
                      className="name-input"
                      autoComplete="off"
                      defaultValue={prefs.familyNames.join(", ")}
                      onBlur={(e) =>
                        change(
                          "familyNames",
                          e.target.value
                            .split(",")
                            .map(cleanName)
                            .filter(Boolean)
                            .slice(0, 6),
                        )
                      }
                    />
                  </label>
                </section>
                <section>
                  <h3>Make room for favourites</h3>
                  <p>
                    Everything is available from the start. Keep at least one
                    activity selected.
                  </p>
                  <div className="activity-settings">
                    {areas.map((a) => (
                      <fieldset key={a.id}>
                        <legend>{a.name}</legend>
                        {a.toys.map((t) => (
                          <label key={t}>
                            <input
                              type="checkbox"
                              checked={prefs.enabledActivityIds.includes(t)}
                              disabled={
                                prefs.enabledActivityIds.length === 1 &&
                                prefs.enabledActivityIds.includes(t)
                              }
                              onChange={(e) => {
                                change(
                                  "enabledActivityIds",
                                  e.target.checked
                                    ? [...prefs.enabledActivityIds, t]
                                    : prefs.enabledActivityIds.filter(
                                        (id) => id !== t,
                                      ),
                                );
                                setToy(null);
                                setArea(null);
                              }}
                            />
                            {t}
                          </label>
                        ))}
                      </fieldset>
                    ))}
                  </div>
                </section>
                <section>
                  <h3>Ready for a little adventure</h3>
                  <div
                    className={`offline-status ${offline ? "ready" : ""}`}
                    role="status"
                  >
                    <span>{offline ? "●" : "○"}</span>
                    {offline
                      ? "This copy is prepared for offline play."
                      : "Offline preparation is not yet confirmed."}
                  </div>
                  <p>
                    In Safari, use Share → Add to Home Screen. Open that
                    installed copy online first, then check this status before
                    trying airplane mode. Device storage can be cleared or
                    evicted.
                  </p>
                  {!offline && (
                    <button
                      disabled={repairing}
                      onClick={() => {
                        if (!registration?.active) {
                          location.reload();
                          return;
                        }
                        setRepairing(true);
                        const channel = new MessageChannel();
                        const timeout = setTimeout(() => {
                          channel.port1.close();
                          setRepairing(false);
                        }, 15000);
                        channel.port1.onmessage = (e) => {
                          clearTimeout(timeout);
                          setOffline(
                            e.data?.ready === true &&
                              !!navigator.serviceWorker.controller,
                          );
                          setRepairing(false);
                          channel.port1.close();
                        };
                        registration.active.postMessage({ type: "REPAIR" }, [
                          channel.port2,
                        ]);
                      }}
                    >
                      {repairing
                        ? "Preparing offline play…"
                        : "Retry offline preparation"}
                    </button>
                  )}
                  {waiting && (
                    <button
                      onClick={() => {
                        if (
                          window.confirm(
                            "Restart now to use the prepared update? Play state will reset.",
                          )
                        ) {
                          navigator.serviceWorker.addEventListener(
                            "controllerchange",
                            () => location.reload(),
                            { once: true },
                          );
                          registration?.waiting?.postMessage({
                            type: "ACTIVATE",
                          });
                        }
                      }}
                    >
                      Update ready: restart
                    </button>
                  )}
                  <details>
                    <summary>Device guidance & privacy</summary>
                    <p>
                      For fewer accidental app switches, enable Guided Access in
                      iPad Settings → Accessibility, then use your device’s
                      triple-click shortcut. This parent gate only discourages
                      accidental entry; it is not a security lock.
                    </p>
                    <p>
                      No accounts, ads, analytics, camera, microphone, or
                      personal data. Only preferences are saved locally. Art and
                      toy states stay in memory and may be lost on reload.
                      Painting offers stamps as a keyboard alternative; freehand
                      drawing is not fully equivalent through assistive
                      technology.
                    </p>
                    <p>
                      Science activities use simple illustrative rules, not
                      real-world experiments. Real iPad touch, audio, VoiceOver,
                      offline, and long-session checks are still required before
                      release.
                    </p>
                  </details>
                </section>
                <section>
                  <h3>A fresh start</h3>
                  {resetConfirm ? (
                    <div className="reset-confirm">
                      <p>
                        Reset preferences and activity selection? Current
                        artwork stays.
                      </p>
                      <button onClick={() => setResetConfirm(false)}>
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          stopMusic();
                          setMusicPlaying(false);
                          setPrefs({ ...defaults });
                          setResetConfirm(false);
                          setSaved("Preferences reset.");
                        }}
                      >
                        Reset preferences
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setResetConfirm(true)}>
                      Reset preferences
                    </button>
                  )}
                  <p className="save-status" role="status">
                    {blocked
                      ? "Storage is unavailable. Preferences work for this session only."
                      : saved || "Preferences stay on this device."}
                  </p>
                </section>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
function Setting({
  label,
  detail,
  children,
}: {
  label: string;
  detail: string;
  children: React.ReactNode;
}) {
  return (
    <label className="setting-row">
      <span>
        <strong>{label}</strong>
        <small>{detail}</small>
      </span>
      {children}
    </label>
  );
}
function ActivityView({ name, prefs }: { name: string; prefs: Preferences }) {
  const Activity = activities[name];
  return Activity ? <Activity prefs={prefs} /> : null;
}
