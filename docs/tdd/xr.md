# AR/WebXR — preparación de capacidades, Fase 1

Fecha: 2026-10-23 (Bogotá). Área: AR/WebXR.

## Contrato

`detectAR(xr?)` recibe exclusivamente `isSessionSupported(mode): Promise<boolean>`.
Devuelve `{ supported, reason }`; `reason` pertenece a `unavailable`, `unsupported`,
`supported` o `error`. Un rechazo por permisos no se propaga al juego.

El resultado es informativo: incluso si `supported` es verdadero, el MVP sigue
en pantalla normal. La interfaz debe mostrar AR como fase futura, sin botón para
iniciar una sesión jugable. La detección no solicita cámara, sensores o sesión.
La integración puede llamar `detectAR(navigator.xr)` y traducir el resultado a
un estado de diagnóstico; nunca debe bloquear el inicio normal.

## Evidencia rojo → verde → refactor

1. Rojo: `npm test -- tests/unit/xr.test.ts`, salida 1 (10:52:52).
   Vitest falla porque `src/xr/capabilities` todavía no existe, exactamente la
   función de detección solicitada. Suite: 1 fallida, importación ausente.
2. Verde: se implementa detección con fallback y captura del rechazo.
   Mismo comando, salida 0 (10:52:59): 1 archivo y 4 pruebas pasan.
3. Refactor: se extrae `ARCapability` con unión explícita de motivos, conservando
   comportamiento. Mismo comando, salida 0 (10:53:07): 4 pruebas pasan.
   `npm run check`, salida 0: TypeScript sin errores.

Los cuatro casos prueban API ausente, dispositivo sin soporte, consulta rechazada
y soporte anunciado; el último comprueba que no se solicita ninguna sesión.
Estas pruebas usan mocks y no constituyen una validación de hardware AR.

## Fase futura

AR jugable requiere sesión `immersive-ar`, hit-test, anclaje de la pista, control
por inclinación y validación en dispositivo compatible. Antes de esa fase el MVP
no anuncia AR jugable. El aviso de jugar quieto aplica también al modo pantalla.
