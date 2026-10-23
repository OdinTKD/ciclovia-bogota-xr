# Inicio durante carga

- Rojo: `npx playwright test --project=desktop --grep 'inicio espera'` falló: al confirmar seguridad con JSON pendiente, el botón ya estaba habilitado.
- Corrección: habilitar el inicio solo cuando la carga termine y exista consentimiento; estado visible “Preparando recorrido…”.

- Verde: mismo E2E 1/1 pasa. Refactor: refreshStart centraliza estado, texto y consentimiento. Suite E2E final verifica escritorio y móvil: 5 pasan, 1 omitida (performance desktop redundante).

