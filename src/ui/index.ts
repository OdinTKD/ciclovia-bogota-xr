import { canStart, formatDistance, formatSpeed, routeProgress } from "./model";
export interface UISnapshot {
  status: string;
  speed: number;
  distance: number;
  health: number;
  score: number;
  weather: string;
  humor?: string;
}
export function createUI(root: HTMLElement) {
  root.innerHTML = `<canvas id="world" aria-label="Escena 3D de la ciclovía de Bogotá"></canvas>
 <header class="topbar"><a class="brand" href="#" aria-label="Ciclovía Bogotá XR"><span class="brand-icon">↗</span><span>CICLOVÍA<span class="brand-city">BOGOTÁ <b>XR</b></span></span></a><span class="route-tag"><i></i> RUTA 01 · PARQUE EL VIRREY</span><button id="pause" class="icon-button" aria-label="Pausar juego">Ⅱ</button></header>
 <div class="route-label"><span class="eyebrow">TU CIUDAD. OTRO RITMO.</span><h1>Bogotá se vive<br>sobre ruedas<span>.</span></h1><p>Un paseo por la ciudad que nunca deja de moverse.</p></div>
 <div class="world-tag"><span>4°40′ N 74°03′ W</span><b>BOGOTÁ, COLOMBIA</b><span>2.640 m más cerca del cielo</span></div>
 <section class="welcome panel" id="welcome" aria-label="Preparar paseo"><div class="panel-heading"><span class="eyebrow">SAL A RODAR</span><span class="pill">PASEO LIBRE</span></div><h2>La ciclovía es tuya.</h2><p class="muted">Respira, pedalea y encuentra tu ritmo.<br>Ojo con los carros y los peatones.</p><div class="vehicle"><span class="bike-symbol">♧</span><div><b>Bici tradicional</b><small>Un clásico de la ciudad</small></div><span class="selected">✓</span></div><div class="settings"><label>CLIMA<select id="weather" aria-label="Clima"><option value="sun">☀ Sol bogotano</option><option value="rain">☂ Lluvia</option></select></label><label class="humor-setting">Humor bogotano<input id="humor" type="checkbox" checked role="switch" aria-label="Humor bogotano"></label></div><label class="safety"><input id="safety" type="checkbox"><span><b>Voy a jugar quieto y en un lugar seguro.</b><small>Nunca mientras caminas, conduces o pedaleas realmente.</small></span></label><button id="start" class="primary" disabled>Comenzar paseo <span>↗</span></button><span class="ar-note">AR: próxima fase · Disponible ahora en pantalla</span><div class="controls-help"><span><kbd>W A S D</kbd> o <kbd>↑ ← ↓ →</kbd></span><span>Conduce · Espacio para frenar</span></div></section>
 <section class="hud" id="hud" hidden><div class="speed"><b id="speed">0</b><span>KM/H</span></div><div class="hud-divider"></div><div><small>DISTANCIA</small><b id="distance">0 m</b></div><div><small>PUNTOS</small><b id="score">0</b></div><div class="health"><small>ESTADO</small><b id="health">100 %</b></div></section>
 <div class="route-progress" id="progress" hidden><div><span>PASEO · EL VIRREY</span><span id="progress-text">0 / 1.200 m</span></div><div class="progress-track"><i id="progress-fill"></i></div></div>
 <div class="humor-bubble" id="bubble" hidden role="status"></div><div class="error" id="error" hidden role="alert"></div>
 <section class="modal panel" id="pause-panel" hidden><span class="eyebrow">TÓMATE UN RESPIRO</span><h2 id="pause-title">Paseo en pausa</h2><p id="pause-message" class="muted">La ciudad puede esperar un momento.</p><button id="resume" class="primary">Seguir rodando ↗</button><button id="restart" class="secondary">Volver a empezar</button></section>
 <div class="touch-controls" id="touch" hidden><div><button id="touch-left" aria-label="Girar a la izquierda">←</button><button id="touch-right" aria-label="Girar a la derecha">→</button></div><div><button id="touch-brake" aria-label="Frenar">FRENO</button><button id="touch-pedal" aria-label="Pedalear">↑</button></div></div>
 <footer class="footer"><span><i></i> HECHO PARA RODAR, HECHO EN BOGOTÁ</span><span>PRIMERA PERSONA <b>·</b> WEB 3D</span></footer>`;
  const nodes = new Map<string, HTMLElement>();
  const byId = <T extends HTMLElement>(id: string): T => {
    let node = nodes.get(id);
    if (!node) {
      node = root.querySelector<HTMLElement>(`#${id}`)!;
      nodes.set(id, node);
    }
    return node as T;
  };
  const elements = {
    canvas: byId<HTMLCanvasElement>("world"),
    start: byId<HTMLButtonElement>("start"),
    pause: byId<HTMLButtonElement>("pause"),
    resume: byId<HTMLButtonElement>("resume"),
    restart: byId<HTMLButtonElement>("restart"),
    weather: byId<HTMLSelectElement>("weather"),
    humor: byId<HTMLInputElement>("humor"),
    safety: byId<HTMLInputElement>("safety"),
    touchLeft: byId<HTMLButtonElement>("touch-left"),
    touchRight: byId<HTMLButtonElement>("touch-right"),
    touchBrake: byId<HTMLButtonElement>("touch-brake"),
    touchPedal: byId<HTMLButtonElement>("touch-pedal"),
  };
  Object.entries(elements).forEach(([key, element]) => {
    element.dataset.testid =
      (
        {
          touchPedal: "pedal",
          touchLeft: "left",
          touchRight: "right",
          touchBrake: "brake",
        } as Record<string, string>
      )[key] || key;
  });
  let loaded = false;
  const refreshStart = () => {
    elements.start.disabled = !loaded || !canStart(elements.safety.checked);
    elements.start.innerHTML = loaded
      ? "Comenzar paseo <span>↗</span>"
      : "Preparando recorrido…";
  };
  refreshStart();
  elements.safety.addEventListener("change", refreshStart);
  const settings = root.querySelector<HTMLElement>(".settings")!;
  const text = (id: string, value: string) => {
    const node = byId(id);
    if (node.textContent !== value) node.textContent = value;
  };
  const hidden = (node: HTMLElement, value: boolean) => {
    if (node.hidden !== value) node.hidden = value;
  };
  let phase: string | undefined;
  function update(s: UISnapshot) {
    const ready = s.status === "ready";
    const paused = s.status === "paused";
    const finished = s.status === "finished";
    if (phase !== s.status) {
      phase = s.status;
      if (
        (paused || finished) &&
        settings.parentElement !== byId("pause-panel")
      )
        byId("pause-panel").insertBefore(settings, elements.resume);
      else if (ready && settings.parentElement !== byId("welcome"))
        byId("welcome").insertBefore(settings, root.querySelector(".safety"));
      if (root.classList.contains("playing") === ready)
        root.classList.toggle("playing", !ready);
      hidden(byId("welcome"), !ready);
      hidden(byId("hud"), ready);
      hidden(byId("progress"), ready);
      hidden(byId("touch"), ready || paused || finished);
      hidden(byId("pause-panel"), !(paused || finished));
      hidden(elements.pause, ready || finished);
      hidden(elements.resume, finished);
    }
    text(
      "pause-title",
      finished
        ? s.health <= 0
          ? "Paseo interrumpido"
          : "¡Qué buen paseo!"
        : "Paseo en pausa",
    );
    text(
      "pause-message",
      finished
        ? s.health <= 0
          ? "Una colisión terminó el paseo. Respira y vuelve a intentarlo con cuidado."
          : `Recorriste ${formatDistance(s.distance)}. Bogotá te espera para otra vuelta.`
        : "La ciudad puede esperar un momento.",
    );
    text("speed", formatSpeed(s.speed));
    text("distance", formatDistance(s.distance));
    text("score", String(Math.round(s.score)));
    text("health", `${Math.round(s.health)} %`);
    text("progress-text", `${Math.floor(s.distance)} / 1.200 m`);
    const progressWidth = `${routeProgress(s.distance)}%`;
    const progressFill = byId("progress-fill");
    if (progressFill.style.width !== progressWidth)
      progressFill.style.width = progressWidth;
    hidden(byId("bubble"), !s.humor || !elements.humor.checked);
    text("bubble", s.humor || "");
  }
  return {
    setReady: (value: boolean) => {
      loaded = value;
      refreshStart();
    },
    elements,
    update,
    showError: (message: string) => {
      byId("error").hidden = false;
      byId("error").textContent = message;
    },
  };
}
