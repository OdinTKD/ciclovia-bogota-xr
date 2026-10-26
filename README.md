# Ciclovía Bogotá XR

Estado al 2026-10-26: candidato `0.3.0-alpha.3`, runtime `d247ee8575ae56924c29a5b5b8245c023622b98d`. CI 40357178802 verify/deploy correctos: 167 pruebas unitarias y de integración en 35 archivos, build y 25 E2E aprobadas / 3 omitidas en 4,8 minutos. Sesión corta completa 41,193/55,034 FPS sol/lluvia, sin excluir arranque; smoke público exacto correcto a las 16:22:13.192 UTC. A sigue abierta por OK visual; teléfono aplazado y B/C sujetos a aprobación.

Pulido de 40 m dentro de un fragmento de 200 m: manos/materiales, cámara horizontal y vertical, parque/fachadas, transición superficial 40–52 m, UI carbón/blanco/amarillo, carro a 110 m y peatón a 160 m, recuperación de calidad. El resto de 200 m mantiene arte básico; el recorrido final previsto es de 1.200 m. [Alcance](docs/architecture/gate-a-polish.md) y [estado técnico/rendimiento](docs/performance/gate-a-polish/README.md).

A sigue abierta por revisión/OK del usuario; teléfono físico aplazado hasta modelo, OS y navegador reales. B/C y AR jugable requieren aprobación. El detector AR no inicia sesión ni hit-test. Juega quieto y en un lugar seguro; nunca mientras caminas, conduces o pedaleas realmente.

[Repositorio](https://github.com/OdinTKD/ciclovia-bogota-xr) · [Demo del proyecto](https://odintkd.github.io/ciclovia-bogota-xr/) · [Galería](https://odintkd.github.io/ciclovia-bogota-xr/review/polish/). Publicación de alpha.3 comprobada con el JS exacto, assets y medios; A sigue pendiente de aceptación.

## Ejecutar y validar

Node.js 24 y npm. Stack: Vite, TypeScript, Three.js, Rapier y WebXR.

```sh
npm ci
npx playwright install chromium
npm run dev
```

```sh
npm test
npm run check
npm run build
npm run test:e2e
```

[SETUP.md](SETUP.md) explica producción y publicación. Los resultados se registran en [CHANGELOG.md](CHANGELOG.md) solo al cerrar con evidencia; alpha.2 permanece intacta y alpha.3 se añade como candidato técnico publicado, con A aún abierta.

## Controles

| Acción | Control |
| --- | --- |
| Pedalear | W o flecha arriba |
| Girar | A/D o flechas izquierda/derecha |
| Frenar | Espacio, S o flecha abajo; soltar pedaleo antes de medir frenada |
| Pausar / continuar | Botones, P o Escape |
| Reiniciar | Botón de pausa/fin |
| Móvil | Botones de giro, pedaleo y freno |
| Clima | Selector sol/lluvia antes de empezar o en pausa |
| Humor | Interruptor desactivable; contenido en public/config/humor/bogota.json |

La lluvia modifica agarre/frenada. HUD: velocidad, distancia, puntos y estado. El aviso inicial requiere consentimiento y el inicio espera los recursos/preparación.

## Calidad y límites

Objetivo 30 FPS, máximo 100 draw calls/100.000 triángulos; mínimo visual ratio 0,75, high desde 1. Recuperación +0,125 tras 8 s estables y espera 20 s tras sobrecarga. Low conserva mapas/alpha/fog/luces con Lambert por vértice y geometría simplificada; high conserva PBR/sombras. No se baja nitidez para pasar el presupuesto.

El benchmark quieto y las capturas no sustituyen el gate de partida completa. Promedios de CPU emulada o GPU de escritorio no acreditan teléfono ni garantizan FPS por frame. Copas ligeras, dedos sin articulación y resto de recorrido básico son límites visibles; no arte final aprobado. [Comparaciones y métricas por revisión](docs/performance/gate-a-polish/README.md).

Modelo Blender original: 10.516 triángulos/11 llamadas/4 materiales, 274.308 bytes. Entorno high 33.364/18; low 12.994/12, +840 triángulos respecto al low anterior para recuperar grupos de hojas. Tres mapas CC0 de Poly Haven: 173.971 bytes. [Avisos y procedencia](THIRD_PARTY_NOTICES.md).

## Comprobar una publicación

```powershell
$env:PLAYWRIGHT_BASE_URL = 'https://odintkd.github.io/ciclovia-bogota-xr/'
npm run test:e2e
Remove-Item Env:PLAYWRIGHT_BASE_URL
```

La verificación pública final debe contrastar nombre y SHA del JavaScript con dist local, además de hashes GLB/mapas, diagnóstico y medios. El vídeo codificado no es benchmark del juego.
