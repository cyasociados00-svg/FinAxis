## 1. Promediar acciones y cripto al comprar de nuevo

Hoy cada "Agregar" crea una fila nueva. Cambiar la lógica para que, si ya existe una posición con el mismo símbolo (acciones) o el mismo `coingeckoId` (cripto), se **consolide en la misma línea** recalculando precio promedio ponderado:

```
nuevaQty   = qtyExistente + qtyComprada
nuevoAvg   = (qtyExistente·avgExistente + qtyComprada·precioCompra) / nuevaQty
```

- El precio "actual" se sobreescribe con el del último refresh.
- Igual cálculo si se ingresa la compra desde el dialog o desde un futuro botón "Comprar más" en cada fila.
- El descuento de la cuenta de origen (Quick-Log categoría Inversión) se sigue registrando por cada compra individual, así el historial de transacciones queda íntegro.
- **Editar** una posición existente sigue siendo "sobreescribir valores" (no suma) — útil para corregir errores.

Archivos: `src/lib/store.ts` (nuevas acciones `buyStock` / `buyCrypto` o lógica de merge dentro de `addStock` / `addCrypto`), `src/components/forms/position-dialog.tsx` (al guardar nueva compra usa el merge; muestra aviso "Se sumará a tu posición existente" si ya hay una).

## 2. Ahorro programado (aporte recurrente automático)

Funciona como un débito automático mensual desde una cuenta a la vista hacia un instrumento (fondo mutuo o CDA programado). Se modela así:

**Nueva entidad `ScheduledSaving`** en el store (y tabla `scheduled_savings` en Lovable Cloud):

| campo | tipo | descripción |
|---|---|---|
| id | uuid | |
| target_type | `fund` \| `cda` | a dónde va el aporte |
| target_id | uuid | id del fondo o del CDA programado |
| account_id | uuid | cuenta de origen del débito |
| amount_pyg | number | monto de cada aporte |
| frequency | `monthly` \| `biweekly` \| `weekly` | |
| day_of_month | int | día de débito (ej. 5) |
| next_run | date | próxima fecha programada |
| active | bool | |

**Ejecución:** al abrir la app, un hook revisa todos los `scheduled_savings` activos cuyo `next_run <= hoy` y por cada uno:
1. Crea una transacción tipo `expense` / categoría "Inversión" descontando de la cuenta.
2. Suma el monto al fondo (`addFundContribution`) o al CDA programado (incrementa capital).
3. Avanza `next_run` según frequency y deja registro.

**UI:**
- En `/portafolio/fondos`: dentro de cada `FundCard`, sección "Ahorro programado" con botón "Programar aporte" → dialog (monto, cuenta, frecuencia, día). Badge "📅 5.000.000 Gs/mes desde Itaú" cuando está activo, con editar/pausar.
- En `/portafolio/renta-fija`: nuevo tipo de CDA "Programado" (acumulativo) que recibe aportes mensuales en vez de capital único; mismo dialog de programación.
- Vista general "Mis ahorros programados" en el dashboard con próximos débitos del mes.

Archivos nuevos: `src/components/forms/scheduled-saving-dialog.tsx`, `src/lib/scheduled-runner.ts` (ejecuta pendientes al hidratar). Editados: `src/lib/store.ts`, `src/routes/portafolio.fondos.tsx`, `src/routes/portafolio.renta-fija.tsx`, `src/routes/__root.tsx` (dispara el runner en hydrate), migración Supabase para la tabla.

## 3. Cancelar cuotas individualmente

Hoy `payInstallment` existe en el store pero no hay UI. Plan:

**Nueva ruta `/cuotas`** (o tab dentro de Tesorería) con tabla:

| Tarjeta | Concepto | Cuota | Monto | Vence | Estado | Acción |
|---|---|---|---|---|---|---|
| Itaú VISA | iPhone | 3/12 | 1.250.000 | 15/01/26 | Pendiente | [Pagar] |

- Filtros: solo pendientes / todas, por tarjeta, por mes.
- Botón **"Pagar cuota"** abre confirmación: elige cuenta de origen → genera una transacción `expense` categoría "Pago tarjeta" descontando de la cuenta + marca `installment.paid = true` + reduce `card.balancePYG` en el monto de la cuota. Esto baja el pasivo contingente al instante.
- Botón "Pagar varias" para cancelar todas las de un mes.

**Caso "ya pagué N cuotas antes de registrar el plan":** al editar una compra a crédito existente, agregar campo **"Cuotas ya pagadas"** (0–N). Al guardar, esas primeras N cuotas se marcan como `paid = true` sin generar movimiento de cuenta (porque se pagaron fuera del sistema), y el `card.balancePYG` se ajusta restando esos montos.

Archivos: `src/routes/cuotas.tsx` (nuevo), `src/components/forms/transaction-dialog.tsx` (campo "cuotas ya pagadas"), `src/lib/store.ts` (acción `payInstallment` ya existe — extender para que tome `accountId` y genere la transacción; nueva acción `markInstallmentsPrepaid(txId, n)`), `src/components/app-sidebar.tsx` (entrada de menú).

## Resumen de cambios

```text
store.ts          → merge en addStock/addCrypto, payInstallment(accountId),
                    markInstallmentsPrepaid, scheduledSavings CRUD + runner
position-dialog   → aviso de consolidación
fondos.tsx        → sección ahorro programado por fondo
renta-fija.tsx    → CDA programado + aportes recurrentes
cuotas.tsx (new)  → listado y pago individual de cuotas
transaction-dialog→ campo "cuotas ya pagadas" al editar crédito
scheduled-runner  → corre pendientes al hidratar
+ migración Supabase: tabla scheduled_savings
```
