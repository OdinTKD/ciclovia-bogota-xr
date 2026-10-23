# Controles y humor

- Rojo: `npx vitest run tests/unit/input.test.ts tests/unit/humor.test.ts` exit 1: ambos módulos ausentes.
- Pruebas de comportamiento: teclas sostenidas, pérdida de foco, cancelación táctil, validación del JSON y toggle apagado.
- Texto se presenta mediante textContent, nunca HTML del JSON.

- Verde: 3/3 pruebas pasan. Refactor: tipado de InputState compartido, función única para registrar y retirar listeners, formato uniforme. Suite final npm test: 54/54 verde. E2E teclado/táctil y toggle: verde en escritorio y móvil.

