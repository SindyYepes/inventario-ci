const API_URL = '/api/items/';

// ---------- VALIDACIÓN EN ESPAÑOL ----------
const inputNombre = document.getElementById("nombre");
const inputCantidad = document.getElementById("cantidad");
const inputPrecio = document.getElementById("precio");

function setSpanishValidation(input, mensaje) {
  input.addEventListener("invalid", () => input.setCustomValidity(mensaje));
  input.addEventListener("input", () => input.setCustomValidity(""));
}

setSpanishValidation(inputNombre, "Por favor ingresa el nombre del producto.");
setSpanishValidation(inputCantidad, "Por favor ingresa la cantidad.");
setSpanishValidation(inputPrecio, "Por favor ingresa el precio.");

// ---------- CARGAR ITEMS ----------
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
      <td>
        <button class="btn-edit" onclick="editarItem(${item.id}, '${item.nombre}', ${item.cantidad}, ${item.precio})">Editar</button>
        <button class="btn-delete" onclick="eliminarItem(${item.id})">Eliminar</button>
      </td>
    `;
    tbody.appendChild(fila);
  });
}

// ---------- AGREGAR ----------
document.getElementById('form-item').addEventListener('submit', async e => {
  if (!e.target.checkValidity()) return;
  e.preventDefault();

  const nombre = inputNombre.value;
  const cantidad = inputCantidad.value;
  const precio = inputPrecio.value;

  await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre, cantidad, precio })
  });

  Swal.fire({
    title: "Producto agregado",
    text: "El producto fue guardado exitosamente.",
    icon: "success",
    confirmButtonText: "Aceptar"
  });

  await cargarItems();
  e.target.reset();
});

// ---------- EDITAR ----------
async function editarItem(id, nombreActual, cantidadActual, precioActual) {
  const { value: valores } = await Swal.fire({
    title: "Editar Producto",
    html: `
      <input id="swal-nombre" class="swal2-input" placeholder="Nombre" value="${nombreActual}">
      <input id="swal-cantidad" type="number" class="swal2-input" placeholder="Cantidad" value="${cantidadActual}">
      <input id="swal-precio" type="number" class="swal2-input" placeholder="Precio" value="${precioActual}">
    `,
    confirmButtonText: "Guardar",
    focusConfirm: false,
    showCancelButton: true,
    cancelButtonText: "Cancelar",
    preConfirm: () => {
      return [
        document.getElementById('swal-nombre').value,
        document.getElementById('swal-cantidad').value,
        document.getElementById('swal-precio').value
      ]
    }
  });

  if (!valores) return;

  const [nombre, cantidad, precio] = valores;

  await fetch(API_URL + id, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre, cantidad, precio })
  });

  Swal.fire("Actualizado", "El producto fue modificado.", "success");
  cargarItems();
}

// ---------- ELIMINAR ----------
async function eliminarItem(id) {
  const confirm = await Swal.fire({
    title: "¿Eliminar producto?",
    text: "Esta acción no se puede deshacer",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí, eliminar",
    cancelButtonText: "Cancelar"
  });

  if (!confirm.isConfirmed) return;

  await fetch(API_URL + id, { method: 'DELETE' });

  Swal.fire("Eliminado", "El producto fue eliminado.", "success");
  cargarItems();
}

// Ejecutar al iniciar
cargarItems();
