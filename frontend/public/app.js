const API_URL = '/api/items/';

//Cargar productos desde el backend y mostrarlos en una tabla
async function cargarItems() {
  const res = await fetch(API_URL);
  const items = await res.json();

  const tbody = document.getElementById('productosBody');
  tbody.innerHTML = '';

  items.forEach(item => {
    const fila = document.createElement('tr');
    fila.innerHTML = `
      <td>${item.nombre}</td>
      <td>${item.cantidad} unidades</td>
      <td>$${item.precio.toLocaleString()}</td>
    `;
    tbody.appendChild(fila);
  });
}

//Maneja el envío del formulario
document.getElementById('form-item').addEventListener('submit', async e => {
  e.preventDefault();

  const nombre = document.getElementById('nombre').value;
  const cantidad = document.getElementById('cantidad').value;
  const precio = document.getElementById('precio').value;

  if (!nombre || !cantidad || !precio) {
    alert('Por favor completa todos los campos.');
    return;
  }

  await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre, cantidad, precio })
  });

  await cargarItems();
  e.target.reset();
});

//Ejecuta al iniciar
cargarItems();
