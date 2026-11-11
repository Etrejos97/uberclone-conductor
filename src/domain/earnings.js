// El resumen de un periodo a partir de los viajes pagados. Facturado es la
// suma de las tarifas sin propina; la ganancia neta suma lo que recibió el
// conductor (tarifa menos comisión más propina) y el promedio es esa ganancia
// entre el número de viajes.

function inRange(trip, { start, end }) {
  const completedAt = trip.completedAt;
  return completedAt instanceof Date && completedAt >= start && completedAt < end;
}

export function summarizeEarnings(trips, range) {
  const selected = trips.filter((trip) => inRange(trip, range));
  const sum = (field) => selected.reduce((total, trip) => total + (trip[field] ?? 0), 0);
  const net = sum('driverEarnings');
  return {
    trips: selected.length,
    billed: sum('fare'),
    commissions: sum('commission'),
    tips: sum('tip'),
    net,
    average: selected.length === 0 ? 0 : Math.round(net / selected.length),
  };
}

// El saldo entre el conductor y la plataforma. Un viaje con Mercado Pago lo
// cobró la plataforma y le debe al conductor su ganancia; en un viaje en efectivo el
// conductor se quedó con todo y le debe la comisión. Lo calculo con los viajes
// pagados en vez de guardarlo, para que siempre coincida con ellos. Puede ser negativo.
export function computeBalance(trips) {
  return trips.reduce((balance, trip) => {
    if (trip.paymentMethod === 'mercadopago') return balance + (trip.driverEarnings ?? 0);
    if (trip.paymentMethod === 'cash') return balance - (trip.commission ?? 0);
    return balance;
  }, 0);
}