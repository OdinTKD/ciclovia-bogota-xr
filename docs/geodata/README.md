# Procedencia geográfica — El Virrey

Fecha: 2026-10-23. Estado: tramo inspirado en El Virrey; geografía no verificada. El JSON actual establece un recorrido de 1.200 m, pero no acredita extremos, coordenadas, medidas de calles ni fidelidad de fachadas. La Puerta A evalúa un fragmento de 200 m sin convertir esa inspiración en una reproducción cartográfica certificada.

## Fuentes previstas, pendientes de incorporación

| Fuente | Uso previsto | Licencia / estado |
| --- | --- | --- |
| [Ciclorruta Bogotá D.C. — IDU, Datos Abiertos Bogotá](https://datosabiertos.bogota.gov.co/dataset/cicloruta-bogota-d-c) | Contrastar infraestructura ciclista permanente y trazado | Ficha leída durante el plan: CC BY 4.0; fecha indicada 2026-07-24. Descarga concreta, metadatos y cobertura pendientes. Sin datos incorporados |

La ficha del catálogo y su licencia CC BY 4.0 fueron verificadas en el plan; la fecha indicada por esa ficha es 2026-07-24, no una fecha de descarga del proyecto. El timeout de una apertura automatizada posterior no invalida esa lectura previa. No se descargaron datasets ni se verificó su cobertura sobre el fragmento; verificar y conservar metadatos/licencia de cada archivo concreto antes de integrarlo.

La Ciclorruta permanente y el cierre recreativo de Ciclovía son conceptos distintos; el conjunto IDU por sí solo no acredita trazado ni horario dominical. Antes de anunciar un tramo real, seleccionar extremos, cruces y al menos tres referencias cercanas reconocibles, con fuentes utilizables y dimensiones contrastadas.

## Registro requerido antes de integrar datos

- URL exacta, entidad/autores, fecha de descarga, revisión, hash y cobertura.
- Licencia leída de cada recurso, copia/atribución y términos aplicables a modificaciones o redistribución.
- Sistema de referencia original, transformación a metros, origen local, ejes, escala y referencia vertical; distinguir alturas medidas de estimadas.
- Separación entre geometría visual, colliders, rutas de actores y progreso métrico; no tratar grados de latitud/longitud como metros.
- Recorte y transformación reproducibles en producción/build, con fuentes pesadas separadas del runtime; el juego publicado en Pages no dependerá de consultas geográficas en vivo.

Registrar recursos incorporados en `THIRD_PARTY_NOTICES.md` y en un manifiesto de assets cuando se apruebe esa fase. No afirmar datos geográficos descargados, licencia comprobada o georreferenciación terminada sin su evidencia. La [Puerta A](../architecture/gate-a.md) conserva sus validaciones pendientes y no autoriza por sí sola la producción de B/C.
