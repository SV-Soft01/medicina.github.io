// Inicialización de variables globales
let inventario = []
let facturas = []
let compras = []
let cuentasCobrar = []
let cuentasPagar = []
let ingresos = []
let gastos = []
let capital = {
  productos: 0,
  efectivo: 0,
}
let ganancias = 0
let usuarioActual = null

// Inicializar Firebase si no está ya inicializado
try {
  if (!firebase.apps.length) {
    // Verifica si ya existe una configuración de Firebase en la ventana
    if (window.firebaseConfig) {
      firebase.initializeApp(window.firebaseConfig)
    } else {
      console.error("No se encontró configuración de Firebase")
    }
  }
  console.log("Firebase inicializado correctamente")
} catch (error) {
  console.error("Error al inicializar Firebase:", error)
}

// Función para mostrar una sección
function mostrarSeccion(seccion) {
  document.querySelectorAll(".seccion").forEach((s) => (s.style.display = "none"))
  document.getElementById(seccion).style.display = "block"
}

// Función para guardar datos solo en Firestore (sin localStorage)
function guardarDatos() {
  if (!usuarioActual) {
    console.error("No hay usuario activo para guardar datos")
    return
  }

  // Mostrar indicador de guardado
  const indicador = document.createElement("div")
  indicador.id = "indicadorGuardado"
  indicador.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background-color: #3498db;
    color: white;
    padding: 10px 15px;
    border-radius: 5px;
    z-index: 9999;
    font-size: 14px;
  `
  indicador.textContent = "Guardando..."
  document.body.appendChild(indicador)

  const datos = {
    inventario,
    facturas,
    compras,
    cuentasCobrar,
    cuentasPagar,
    ingresos,
    gastos,
    capital,
    ganancias,
    ultimaActualizacion: firebase.firestore.FieldValue.serverTimestamp(),
  }

  // Guardar en Firestore con reintentos
  const guardarConReintentos = (intentos = 3) => {
    firebase
      .firestore()
      .collection("usuarios")
      .doc(usuarioActual)
      .set(datos)
      .then(() => {
        // Éxito - actualizar indicador
        if (document.getElementById("indicadorGuardado")) {
          indicador.style.backgroundColor = "#27ae60"
          indicador.textContent = "✓ Guardado"
          setTimeout(() => {
            if (document.body.contains(indicador)) {
              document.body.removeChild(indicador)
            }
          }, 2000)
        }
        console.log("Datos guardados en Firestore correctamente")
      })
      .catch((error) => {
        console.error("Error al guardar datos en Firestore:", error)

        if (intentos > 1) {
          // Reintentar
          console.log(`Reintentando guardado... (${4 - intentos}/3)`)
          setTimeout(() => guardarConReintentos(intentos - 1), 1000)
        } else {
          // Error final
          if (document.getElementById("indicadorGuardado")) {
            indicador.style.backgroundColor = "#e74c3c"
            indicador.textContent = "✗ Error al guardar"
            setTimeout(() => {
              if (document.body.contains(indicador)) {
                document.body.removeChild(indicador)
              }
            }, 5000)
          }
          alert("Error al guardar datos. Por favor, verifica tu conexión e intenta nuevamente.")
        }
      })
  }

  guardarConReintentos()
}

// Función para cargar datos solo desde Firestore
function cargarDatos() {
  if (!usuarioActual) {
    console.error("No hay usuario activo para cargar datos")
    return
  }

  // Mostrar indicador de carga
  const indicador = document.createElement("div")
  indicador.id = "indicadorCarga"
  indicador.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: rgba(0,0,0,0.8);
    color: white;
    padding: 20px;
    border-radius: 10px;
    z-index: 10000;
    text-align: center;
  `
  indicador.innerHTML = `
    <div style="margin-bottom: 10px;">Cargando datos...</div>
    <div style="width: 30px; height: 30px; border: 3px solid #f3f3f3; border-top: 3px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto;"></div>
  `
  document.body.appendChild(indicador)

  const db = firebase.firestore()
  db.collection("usuarios")
    .doc(usuarioActual)
    .get()
    .then((doc) => {
      if (doc.exists) {
        const datosFirestore = doc.data()
        console.log("Datos cargados desde Firestore")

        // Cargar datos desde Firestore
        inventario = datosFirestore.inventario || []
        facturas = datosFirestore.facturas || []
        compras = datosFirestore.compras || []
        cuentasCobrar = datosFirestore.cuentasCobrar || []
        cuentasPagar = datosFirestore.cuentasPagar || []
        ingresos = datosFirestore.ingresos || []
        gastos = datosFirestore.gastos || []
        capital = datosFirestore.capital || { productos: 0, efectivo: 0 }
        ganancias = datosFirestore.ganancias || 0

        // Actualizar la interfaz
        actualizarTablaInventario()
        actualizarTablaFacturas()
        actualizarTablaCuentasCobrar()
        actualizarTablaCompras()
        actualizarTablaCuentasPagar()
        actualizarGanancias()
        actualizarCapital()

        // Remover indicador de carga
        if (document.body.contains(indicador)) {
          document.body.removeChild(indicador)
        }
      } else {
        console.log("No hay datos en Firestore para este usuario")

        // Inicializar con datos vacíos
        inventario = []
        facturas = []
        compras = []
        cuentasCobrar = []
        cuentasPagar = []
        ingresos = []
        gastos = []
        capital = { productos: 0, efectivo: 0 }
        ganancias = 0

        // Actualizar la interfaz
        actualizarTablaInventario()
        actualizarTablaFacturas()
        actualizarTablaCuentasCobrar()
        actualizarTablaCompras()
        actualizarTablaCuentasPagar()
        actualizarGanancias()
        actualizarCapital()

        // Remover indicador de carga
        if (document.body.contains(indicador)) {
          document.body.removeChild(indicador)
        }
      }
    })
    .catch((error) => {
      console.error("Error al cargar datos desde Firestore:", error)

      // Remover indicador de carga
      if (document.body.contains(indicador)) {
        document.body.removeChild(indicador)
      }

      alert("Error al cargar datos. Por favor, verifica tu conexión e intenta nuevamente.")
    })
}

// Funciones de localStorage convertidas en no-op (no hacen nada)
function guardarDatosLocal() {
  // Esta función ya no hace nada - solo Firebase
  console.log("localStorage desactivado - usando solo Firebase")
}

function cargarDatosLocal() {
  // Esta función ya no hace nada - solo Firebase
  console.log("localStorage desactivado - usando solo Firebase")
}

// Función para sincronizar datos con Firestore (mejorada)
function sincronizarDatos() {
  if (!usuarioActual) {
    alert("Debe iniciar sesión para sincronizar datos")
    return
  }

  const spinner = document.createElement("div")
  spinner.className = "spinner"
  spinner.innerHTML = "Sincronizando..."
  spinner.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: rgba(0,0,0,0.7);
    color: white;
    padding: 20px;
    border-radius: 5px;
    z-index: 9999;
  `
  document.body.appendChild(spinner)

  firebase
    .firestore()
    .collection("usuarios")
    .doc(usuarioActual)
    .set({
      inventario,
      facturas,
      compras,
      cuentasCobrar,
      cuentasPagar,
      ingresos,
      gastos,
      capital,
      ganancias,
      ultimaActualizacion: firebase.firestore.FieldValue.serverTimestamp(),
    })
    .then(() => {
      document.body.removeChild(spinner)
      mostrarNotificacion("Datos sincronizados correctamente", "success")
    })
    .catch((error) => {
      document.body.removeChild(spinner)
      console.error("Error al sincronizar datos:", error)
      mostrarNotificacion("Error al sincronizar datos: " + error.message, "error")
    })
}

// Manejo del formulario de inicio de sesión
document.getElementById("loginForm").addEventListener("submit", (e) => {
  e.preventDefault()
  const username = document.getElementById("loginUsername").value
  const password = document.getElementById("loginPassword").value

  try {
    // Primero intentamos obtener usuarios desde Firestore
    firebase
      .firestore()
      .collection("sistema")
      .doc("usuarios")
      .get()
      .then((doc) => {
        let usuarios = {}

        if (doc.exists) {
          usuarios = doc.data()
        } else {
          // Si no hay documento en Firestore, intentamos obtener del localStorage
          usuarios = JSON.parse(localStorage.getItem("usuarios")) || {}
        }

        if (usuarios[username] && usuarios[username].password === password) {
          usuarioActual = username
          document.getElementById("companyName").textContent = usuarios[username].empresa
          document.getElementById("mainNav").style.display = "block"

          // Añadir botón de sincronización
          const navBar = document.getElementById("mainNav")
          if (!document.getElementById("btnSincronizar")) {
            const btnSincronizar = document.createElement("button")
            btnSincronizar.id = "btnSincronizar"
            btnSincronizar.textContent = "Sincronizar Datos"
            btnSincronizar.onclick = sincronizarDatos
            navBar.appendChild(btnSincronizar)
          }

          cargarDatos()
          mostrarSeccion("inventario")
        } else {
          alert("Credenciales incorrectas")
        }
      })
      .catch((error) => {
        console.error("Error al obtener usuarios desde Firestore:", error)

        // Fallback a localStorage si hay error con Firestore
        const usuarios = JSON.parse(localStorage.getItem("usuarios")) || {}
        if (usuarios[username] && usuarios[username].password === password) {
          usuarioActual = username
          document.getElementById("companyName").textContent = usuarios[username].empresa
          document.getElementById("mainNav").style.display = "block"
          cargarDatosLocal()
          mostrarSeccion("inventario")

          alert("Conectado en modo local debido a problemas de conexión")
        } else {
          alert("Credenciales incorrectas")
        }
      })
  } catch (error) {
    console.error("Error al iniciar sesión:", error)

    // Fallback a localStorage si hay error con Firestore
    const usuarios = JSON.parse(localStorage.getItem("usuarios")) || {}
    if (usuarios[username] && usuarios[username].password === password) {
      usuarioActual = username
      document.getElementById("companyName").textContent = usuarios[username].empresa
      document.getElementById("mainNav").style.display = "block"
      cargarDatosLocal()
      mostrarSeccion("inventario")

      alert("Conectado en modo local debido a problemas de conexión")
    } else {
      alert("Credenciales incorrectas")
    }
  }
})

// Manejo del formulario de registro
document.getElementById("registroForm").addEventListener("submit", (e) => {
  e.preventDefault()
  const username = document.getElementById("registroUsername").value
  const password = document.getElementById("registroPassword").value
  const empresa = document.getElementById("registroEmpresa").value
  const clave = document.getElementById("registroClave").value

  if (clave !== "12345") {
    alert("Clave de seguridad incorrecta")
    return
  }

  try {
    // Intentar obtener usuarios desde Firestore
    firebase
      .firestore()
      .collection("sistema")
      .doc("usuarios")
      .get()
      .then((doc) => {
        let usuarios = {}

        if (doc.exists) {
          usuarios = doc.data()
        } else {
          // Si no hay documento en Firestore, intentamos obtener del localStorage
          usuarios = JSON.parse(localStorage.getItem("usuarios")) || {}
        }

        if (usuarios[username]) {
          alert("El nombre de usuario ya existe")
          return
        }

        usuarios[username] = { password, empresa }

        // Guardar en Firestore
        firebase
          .firestore()
          .collection("sistema")
          .doc("usuarios")
          .set(usuarios)
          .then(() => {
            // Crear documento para los datos del usuario
            return firebase
              .firestore()
              .collection("usuarios")
              .doc(username)
              .set({
                inventario: [],
                facturas: [],
                compras: [],
                cuentasCobrar: [],
                cuentasPagar: [],
                ingresos: [],
                gastos: [],
                capital: { productos: 0, efectivo: 0 },
                ganancias: 0,
                fechaCreacion: firebase.firestore.FieldValue.serverTimestamp(),
              })
          })
          .then(() => {
            // También guardar en localStorage como respaldo
            localStorage.setItem("usuarios", JSON.stringify(usuarios))
            alert("Registro exitoso. Por favor, inicia sesión.")
            mostrarSeccion("login")
          })
          .catch((error) => {
            console.error("Error al guardar en Firestore:", error)

            // Fallback a localStorage si hay error con Firestore
            localStorage.setItem("usuarios", JSON.stringify(usuarios))
            alert("Registro exitoso (modo local). Por favor, inicia sesión.")
            mostrarSeccion("login")
          })
      })
      .catch((error) => {
        console.error("Error al obtener usuarios desde Firestore:", error)

        // Fallback a localStorage si hay error con Firestore
        const usuarios = JSON.parse(localStorage.getItem("usuarios")) || {}
        if (usuarios[username]) {
          alert("El nombre de usuario ya existe")
          return
        }

        usuarios[username] = { password, empresa }
        localStorage.setItem("usuarios", JSON.stringify(usuarios))

        alert("Registro exitoso (modo local). Por favor, inicia sesión.")
        mostrarSeccion("login")
      })
  } catch (error) {
    console.error("Error al registrar usuario:", error)

    // Fallback a localStorage si hay error with Firestore
    const usuarios = JSON.parse(localStorage.getItem("usuarios")) || {}
    if (usuarios[username]) {
      alert("El nombre de usuario ya existe")
      return
    }

    usuarios[username] = { password, empresa }
    localStorage.setItem("usuarios", JSON.stringify(usuarios))

    alert("Registro exitoso (modo local). Por favor, inicia sesión.")
    mostrarSeccion("login")
  }
})

document.getElementById("btnAgregarProducto").addEventListener("click", () => {
  const form = document.getElementById("formInventario")
  form.style.display = "block"

  document.getElementById("btnGuardarProducto").textContent = "Agregar Producto"
  document.getElementById("btnCancelarEdicion").style.display = "none"
  form.reset()
})

document.getElementById("formInventario").addEventListener("submit", function (e) {
  e.preventDefault()
  const producto = {
    nombre: document.getElementById("nombreProducto").value,
    codigo: document.getElementById("codigoProducto").value,
    precioCompra: Number.parseFloat(document.getElementById("precioCompra").value),
    precioVenta: Number.parseFloat(document.getElementById("precioVenta").value),
    cantidad: Number.parseFloat(document.getElementById("cantidadInventario").value),
    minimo: Number.parseInt(document.getElementById("cantidadMinima").value),
    etiqueta: document.getElementById("etiquetaProducto").value,
    fechaVencimiento: document.getElementById("fechaVencimiento").value,
  }

  // Verificar si estamos en modo edición
  const isEditing = document.getElementById("btnGuardarProducto").textContent === "Guardar Cambios"

  if (isEditing) {
    // Buscar el índice del producto que estamos editando
    const originalIndex = inventario.findIndex((p) => p.codigo === this.dataset.originalCode)

    if (originalIndex !== -1) {
      // Si el código ha cambiado, verificar que no exista otro producto con ese código
      if (producto.codigo !== this.dataset.originalCode) {
        const existeOtroProducto = inventario.some((p, idx) => p.codigo === producto.codigo && idx !== originalIndex)

        if (existeOtroProducto) {
          alert("Ya existe otro producto con este código. Por favor, use un código diferente.")
          return
        }
      }

      // Actualizar capital antes de actualizar el producto
      capital.productos -= inventario[originalIndex].cantidad * inventario[originalIndex].precioCompra

      // Actualizar el producto
      inventario[originalIndex] = producto

      // Actualizar capital con nuevos valores
      capital.productos += producto.cantidad * producto.precioCompra

      // Limpiar el código original almacenado
      delete this.dataset.originalCode
    } else {
      alert("Error: No se encontró el producto a editar.")
      return
    }
  } else {
    // Verificar si ya existe un producto con ese código al agregar uno nuevo
    const existeProducto = inventario.some((p) => p.codigo === producto.codigo)
    if (existeProducto) {
      alert("Ya existe un producto con este código. Por favor, use un código diferente.")
      return
    }

    // Agregar nuevo producto
    inventario.push(producto)
    capital.productos += producto.cantidad * producto.precioCompra
  }

  actualizarTablaInventario()
  this.reset()
  this.style.display = "none"
  document.getElementById("btnGuardarProducto").textContent = "Agregar Producto"
  document.getElementById("btnCancelarEdicion").style.display = "none"
  actualizarCapital()
  guardarDatos()
})

document.getElementById("btnCancelarEdicion").addEventListener("click", function () {
  const form = document.getElementById("formInventario")
  form.reset()
  form.style.display = "none"
  document.getElementById("btnGuardarProducto").textContent = "Agregar Producto"
  this.style.display = "none"

  // Limpiar cualquier código original almacenado
  if (form.dataset.originalCode) {
    delete form.dataset.originalCode
  }
})

function actualizarTablaInventario(productosFiltrados = inventario) {
  const tbody = document.getElementById("cuerpoTablaInventario")
  tbody.innerHTML = ""
  productosFiltrados.forEach((producto, index) => {
    const tr = document.createElement("tr")
    tr.innerHTML = `
            <td>${producto.nombre}</td>
            <td>${producto.codigo}</td>
            <td>${producto.precioCompra.toFixed(2)}</td>
            <td>${producto.precioVenta.toFixed(2)}</td>
            <td>${producto.cantidad}</td>
            <td>${producto.minimo}</td>
            <td>${producto.etiqueta}</td>
            <td>${producto.fechaVencimiento || "N/A"}</td>
            <td>
                <button onclick="editarProducto(${index})">Editar</button>
                <button onclick="eliminarProducto(${index})">Eliminar</button>
            </td>
        `
    tbody.appendChild(tr)
  })
}

document.getElementById("buscarProducto").addEventListener("input", (e) => {
  const busqueda = e.target.value.toLowerCase()
  const productosFiltrados = inventario.filter(
    (p) =>
      p.nombre.toLowerCase().includes(busqueda) ||
      p.codigo.toLowerCase().includes(busqueda) ||
      p.etiqueta.toLowerCase().includes(busqueda),
  )
  productosFiltrados.sort((a, b) => {
    const aIncludes = a.nombre.toLowerCase().includes(busqueda)
    const bIncludes = b.nombre.toLowerCase().includes(busqueda)
    if (aIncludes && !bIncludes) return -1
    if (!aIncludes && bIncludes) return 1
    return 0
  })
  actualizarTablaInventario(productosFiltrados)
})

document.getElementById("ordenarProductos").addEventListener("change", (e) => {
  const criterio = e.target.value
  if (criterio === "alfabetico") {
    inventario.sort((a, b) => a.nombre.localeCompare(b.nombre))
  } else if (criterio === "vencimiento") {
    inventario.sort((a, b) => new Date(a.fechaVencimiento) - new Date(b.fechaVencimiento))
  }
  actualizarTablaInventario()
})

function editarProducto(index) {
  const producto = inventario[index]
  const form = document.getElementById("formInventario")

  // Guardar el código original del producto para referencia
  form.dataset.originalCode = producto.codigo

  // Llenar el formulario con los datos del producto
  document.getElementById("nombreProducto").value = producto.nombre
  document.getElementById("codigoProducto").value = producto.codigo
  document.getElementById("precioCompra").value = producto.precioCompra
  document.getElementById("precioVenta").value = producto.precioVenta
  document.getElementById("cantidadInventario").value = producto.cantidad
  document.getElementById("cantidadMinima").value = producto.minimo
  document.getElementById("etiquetaProducto").value = producto.etiqueta
  document.getElementById("fechaVencimiento").value = producto.fechaVencimiento

  // Mostrar el formulario y actualizar botones
  form.style.display = "block"
  document.getElementById("btnGuardarProducto").textContent = "Guardar Cambios"
  document.getElementById("btnCancelarEdicion").style.display = "inline-block"
}

function eliminarProducto(index) {
  if (confirm("¿Está seguro de que desea eliminar este producto?")) {
    const producto = inventario[index]
    capital.productos -= producto.precioCompra * producto.cantidad
    inventario.splice(index, 1)
    actualizarTablaInventario()
    actualizarCapital()
    guardarDatos()
  }
}

function importarDesdeExcel() {
  const input = document.getElementById("importarExcel")
  const file = input.files[0]
  const reader = new FileReader()
  reader.onload = (e) => {
    const data = new Uint8Array(e.target.result)
    const workbook = XLSX.read(data, { type: "array" })
    const firstSheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[firstSheetName]
    const json = XLSX.utils.sheet_to_json(worksheet)
    json.forEach((row) => {
      const producto = {
        nombre: row.Nombre,
        codigo: row.Codigo,
        precioCompra: Number.parseFloat(row.PrecioCompra),
        precioVenta: Number.parseFloat(row.PrecioVenta),
        cantidad: Number.parseInt(row.Cantidad),
        minimo: Number.parseInt(row.Minimo),
        etiqueta: row.Etiqueta,
        fechaVencimiento: row.FechaVencimiento,
      }
      inventario.push(producto)
      capital.productos += producto.precioCompra * producto.cantidad
    })
    actualizarTablaInventario()
    actualizarCapital()
    guardarDatos()
  }
  reader.readAsArrayBuffer(file)
}

document.getElementById("fechaFactura").value = new Date().toLocaleDateString()

document.getElementById("buscarProductoFactura").addEventListener("input", (e) => {
  const busqueda = e.target.value.toLowerCase()
  const select = document.getElementById("productoSeleccionado")
  select.innerHTML = ""
  inventario
    .filter((p) => p.nombre.toLowerCase().includes(busqueda) || p.codigo.toLowerCase().includes(busqueda))
    .forEach((p) => {
      const option = document.createElement("option")
      option.value = p.codigo
      option.textContent = `${p.nombre} - ${p.codigo}`
      select.appendChild(option)
    })
})

let productosEnFactura = []

function agregarProductoFactura() {
  const codigo = document.getElementById("productoSeleccionado").value
  const cantidad = Number.parseFloat(document.getElementById("cantidadFactura").value)
  const producto = inventario.find((p) => p.codigo === codigo)
  if (producto && cantidad > 0) {
    if (cantidad > producto.cantidad) {
      alert(`No hay suficiente stock. Stock disponible: ${producto.cantidad}`)
      return
    }
    const precio = producto.precioVenta
    productosEnFactura.push({ ...producto, cantidad, precio })
    actualizarTablaFactura()
    document.getElementById("productoSeleccionado").value = ""
    document.getElementById("cantidadFactura").value = ""
    document.getElementById("precioFactura").value = ""
    document.getElementById("buscarProductoFactura").value = ""
  }
}

function actualizarTablaFactura() {
  const tbody = document.getElementById("cuerpoTablaFactura")
  tbody.innerHTML = ""
  let total = 0
  productosEnFactura.forEach((p, index) => {
    const subtotal = p.cantidad * p.precio
    total += subtotal
    const tr = document.createElement("tr")
    tr.innerHTML = `
            <td>${p.nombre}</td>
            <td>${p.cantidad}</td>
            <td>
              ${p.precio.toFixed(2)}
              <button onclick="editarPrecioFactura(${index})" style="margin-left: 5px; padding: 2px 5px;">
                <i>✏️</i>
              </button>
            </td>
            <td>${subtotal.toFixed(2)}</td>
            <td><button onclick="eliminarProductoFactura(${index})">Eliminar</button></td>
        `
    tbody.appendChild(tr)
  })
  document.getElementById("totalFactura").textContent = total.toFixed(2)
}

function eliminarProductoFactura(index) {
  productosEnFactura.splice(index, 1)
  actualizarTablaFactura()
}

function editarPrecioFactura(index) {
  const producto = productosEnFactura[index]
  const nuevoPrecio = prompt(`Ingrese el nuevo precio para ${producto.nombre}:`, producto.precio)

  if (nuevoPrecio !== null && !isNaN(nuevoPrecio) && Number.parseFloat(nuevoPrecio) > 0) {
    productosEnFactura[index].precio = Number.parseFloat(nuevoPrecio)
    actualizarTablaFactura()
  }
}

// Modificar la función finalizarFactura para usar FIFO en la venta
function finalizarFactura() {
  const cliente = document.getElementById("clienteFactura").value.trim()
  const fecha = document.getElementById("fechaFactura").value
  const total = Number.parseFloat(document.getElementById("totalFactura").textContent)
  const tipoFactura = document.getElementById("tipoFactura").value

  if (cliente === "") {
    alert("Por favor, ingrese el nombre del cliente.")
    return
  }

  if (productosEnFactura.length === 0) {
    alert("No hay productos en la factura. Añada productos antes de finalizar.")
    return
  }

  let gananciaFactura = 0

  // Procesar cada producto en la factura usando FIFO
  productosEnFactura.forEach((p) => {
    const productoInventario = inventario.find((inv) => inv.codigo === p.codigo)

    if (productoInventario) {
      // Reducir la cantidad total
      productoInventario.cantidad -= p.cantidad

      // Si no hay lotes definidos, crear uno con todo el inventario actual
      if (!productoInventario.lotes || productoInventario.lotes.length === 0) {
        productoInventario.lotes = [
          {
            cantidad: productoInventario.cantidad + p.cantidad, // Cantidad original antes de la venta
            precioCompra: productoInventario.precioCompra,
            fecha: new Date().toLocaleDateString(),
          },
        ]
      }

      // Cantidad que queda por vender de este producto
      let cantidadPorVender = p.cantidad
      let costoPonderado = 0

      // Recorrer los lotes usando FIFO (primero en entrar, primero en salir)
      for (let i = 0; i < productoInventario.lotes.length && cantidadPorVender > 0; i++) {
        const lote = productoInventario.lotes[i]

        // Determinar cuánto se vende de este lote
        const cantidadVendidaDelLote = Math.min(lote.cantidad, cantidadPorVender)

        // Actualizar el costo ponderado
        costoPonderado += cantidadVendidaDelLote * lote.precioCompra

        // Reducir la cantidad del lote
        lote.cantidad -= cantidadVendidaDelLote

        // Reducir la cantidad por vender
        cantidadPorVender -= cantidadVendidaDelLote
      }

      // Eliminar lotes vacíos
      productoInventario.lotes = productoInventario.lotes.filter((lote) => lote.cantidad > 0)

      // Calcular la ganancia usando el costo ponderado
      const costoPromedio = costoPonderado / p.cantidad
      gananciaFactura += (p.precio - costoPromedio) * p.cantidad

      // Actualizar el capital en productos
      capital.productos -= costoPonderado
    }
  })

  const factura = {
    fecha,
    cliente,
    total,
    ganancia: gananciaFactura,
    productos: productosEnFactura,
    tipo: tipoFactura,
    id: Date.now().toString(),
  }

  if (tipoFactura === "contado") {
    facturas.push(factura)
    ganancias += gananciaFactura
    capital.efectivo += total - gananciaFactura
    ingresos.push({
      fecha,
      monto: total,
      descripcion: `Factura al contado - ${cliente}`,
      etiqueta: "Venta",
      id: Date.now().toString() + 1,
    })
  } else {
    cuentasCobrar.push(factura)
  }

  actualizarTablaFacturas()
  actualizarTablaCuentasCobrar()
  actualizarGanancias()
  actualizarCapital()
  actualizarTablaInventario()

  productosEnFactura = []
  document.getElementById("formFactura").reset()
  document.getElementById("fechaFactura").value = new Date().toLocaleDateString()
  document.getElementById("cuerpoTablaFactura").innerHTML = ""
  document.getElementById("totalFactura").textContent = "0"

  guardarDatos()
  alert("Factura emitida correctamente")
}

function actualizarTablaFacturas() {
  const tbody = document.getElementById("cuerpoTablaFacturas")
  if (!tbody) return // Add this check
  tbody.innerHTML = ""
  facturas.forEach((f) => {
    const tr = document.createElement("tr")
    tr.innerHTML = `
            <td>${f.fecha}</td>
            <td>${f.cliente}</td>
            <td>${f.total.toFixed(2)}</td>
            <td>${f.ganancia.toFixed(2)}</td>
            <td>${f.tipo}</td>
        `
    tbody.appendChild(tr)
  })
}

function actualizarTablaCuentasCobrar() {
  const tbody = document.getElementById("cuerpoTablaCuentasCobrar")
  tbody.innerHTML = ""
  cuentasCobrar.forEach((factura, index) => {
    const tr = document.createElement("tr")
    tr.innerHTML = `
            <td>${factura.fecha}</td>
            <td>${factura.cliente}</td>
            <td>${factura.total.toFixed(2)}</td>
            <td>
                <button onclick="registrarPagoCuentaCobrar(${index})">Registrar Pago</button>
                <button onclick="verDetallesCuentaCobrar(${index})">Ver Detalles</button>
            </td>
        `
    tbody.appendChild(tr)
  })
}

function registrarPagoCuentaCobrar(index) {
  const factura = cuentasCobrar[index]
  facturas.push(factura)
  ganancias += factura.ganancia
  capital.efectivo += factura.total - factura.ganancia
  ingresos.push({
    fecha: new Date().toLocaleDateString(),
    monto: factura.total,
    descripcion: `Pago de factura a crédito - ${factura.cliente}`,
    etiqueta: "Venta",
    id: Date.now().toString(), // ID único
  })
  cuentasCobrar.splice(index, 1)
  actualizarTablaFacturas()
  actualizarTablaCuentasCobrar()
  actualizarGanancias()
  actualizarCapital()
  guardarDatos()
  alert("Pago registrado correctamente")
}

function verDetallesCuentaCobrar(index) {
  const factura = cuentasCobrar[index]
  alert(`Detalles de la factura:
Cliente: ${factura.cliente}
Fecha: ${factura.fecha}
Total: ${factura.total.toFixed(2)}
Productos 
Cliente: ${factura.cliente}
Fecha: ${factura.fecha}
Total: ${factura.total.toFixed(2)}
Productos: ${factura.productos.map((p) => `${p.nombre} (${p.cantidad})`).join(", ")}`)
}

document.getElementById("formCompra").addEventListener("submit", (e) => {
  e.preventDefault()
  finalizarCompra()
})

let productosEnCompra = []

// Modificar la función agregarProductoCompra para usar automáticamente el precio del inventario
function agregarProductoCompra() {
  const codigo = document.getElementById("productoCompraSeleccionado").value
  const cantidad = Number.parseFloat(document.getElementById("cantidadCompra").value)
  const producto = inventario.find((p) => p.codigo === codigo)

  if (producto && cantidad > 0) {
    // Usar el precio de compra del inventario automáticamente
    const precio = producto.precioCompra
    productosEnCompra.push({ ...producto, cantidad, precio })
    actualizarTablaCompra()
    document.getElementById("productoCompraSeleccionado").value = ""
    document.getElementById("cantidadCompra").value = ""
    document.getElementById("buscarProductoCompra").value = ""
  } else {
    alert("Por favor, ingrese datos válidos para el producto.")
  }
}

function actualizarTablaCompra() {
  const tbody = document.getElementById("cuerpoTablaCompra")
  tbody.innerHTML = ""
  let total = 0
  productosEnCompra.forEach((p, index) => {
    const subtotal = p.cantidad * p.precio
    total += subtotal
    const tr = document.createElement("tr")
    tr.innerHTML = `
            <td>${p.nombre}</td>
            <td>${p.cantidad}</td>
            <td>
              ${p.precio.toFixed(2)}
              <button onclick="editarPrecioCompra(${index})" style="margin-left: 5px; padding: 2px 5px;">
                <i>✏️</i>
              </button>
            </td>
            <td>${subtotal.toFixed(2)}</td>
            <td><button onclick="eliminarProductoCompra(${index})">Eliminar</button></td>
        `
    tbody.appendChild(tr)
  })
  document.getElementById("totalCompra").textContent = total.toFixed(2)
}

function eliminarProductoCompra(index) {
  productosEnCompra.splice(index, 1)
  actualizarTablaCompra()
}

function editarPrecioCompra(index) {
  const producto = productosEnCompra[index]
  const nuevoPrecio = prompt(`Ingrese el nuevo precio para ${producto.nombre}:`, producto.precio)

  if (nuevoPrecio !== null && !isNaN(nuevoPrecio) && Number.parseFloat(nuevoPrecio) > 0) {
    productosEnCompra[index].precio = Number.parseFloat(nuevoPrecio)
    actualizarTablaCompra()
  }
}

document.getElementById("buscarProductoCompra").addEventListener("input", (e) => {
  const busqueda = e.target.value.toLowerCase()
  const select = document.getElementById("productoCompraSeleccionado")
  select.innerHTML = ""
  inventario
    .filter((p) => p.nombre.toLowerCase().includes(busqueda) || p.codigo.toLowerCase().includes(busqueda))
    .forEach((p) => {
      const option = document.createElement("option")
      option.value = p.codigo
      option.textContent = `${p.nombre} - ${p.codigo}`
      select.appendChild(option)
    })
})

document.getElementById("productoCompraSeleccionado").addEventListener("change", (e) => {
  const codigo = e.target.value
  const productoInventario = inventario.find((p) => p.codigo === codigo)
  if (productoInventario) {
    document.getElementById("precioCompraProducto").value = productoInventario.precioCompra.toFixed(2)
  }
})

function mostrarFormNuevoProducto() {
  document.getElementById("formNuevoProductoCompra").style.display = "block"
}

function agregarNuevoProductoCompra() {
  const nuevoProducto = {
    nombre: document.getElementById("nombreNuevoProducto").value,
    codigo: document.getElementById("codigoNuevoProducto").value,
    precioCompra: Number.parseFloat(document.getElementById("precioCompraNuevoProducto").value),
    precioVenta: Number.parseFloat(document.getElementById("precioVentaNuevoProducto").value),
    cantidad: Number.parseInt(document.getElementById("cantidadNuevoProducto").value),
    minimo: Number.parseInt(document.getElementById("cantidadMinimaNuevoProducto").value),
    etiqueta: document.getElementById("etiquetaNuevoProducto").value,
    fechaVencimiento: document.getElementById("fechaVencimientoNuevoProducto").value,
  }

  // Agregar el nuevo producto a productosEnCompra, pero no al inventario todavía
  productosEnCompra.push({ ...nuevoProducto, precio: nuevoProducto.precioCompra })

  actualizarTablaCompra()

  document.getElementById("formNuevoProductoCompra").style.display = "none"
  document.getElementById("formNuevoProductoCompra").reset()
}

// Modificar la función finalizarCompra para manejar lotes correctamente
function finalizarCompra() {
  const proveedor = document.getElementById("proveedorCompra").value.trim()
  const fecha = document.getElementById("fechaCompra").value || new Date().toLocaleDateString()
  const tipoCompra = document.getElementById("tipoCompra").value
  const total = Number.parseFloat(document.getElementById("totalCompra").textContent)

  if (proveedor === "") {
    alert("Por favor, ingrese el nombre del proveedor.")
    return
  }

  if (productosEnCompra.length === 0) {
    alert("No hay productos en la compra. Añada productos antes de finalizar.")
    return
  }

  const compra = {
    proveedor,
    fecha,
    total,
    productos: productosEnCompra,
    tipo: tipoCompra,
    id: Date.now().toString(), // ID único para Firestore
  }

  if (tipoCompra === "contado") {
    compras.push(compra)
    capital.efectivo -= total
    gastos.push({
      fecha,
      monto: total,
      descripcion: `Compra al contado - ${proveedor}`,
      etiqueta: "Compra",
      id: Date.now().toString(), // ID único
    })
  } else {
    cuentasPagar.push(compra)
  }

  // Procesar cada producto en la compra
  productosEnCompra.forEach((p) => {
    const productoInventario = inventario.find((inv) => inv.codigo === p.codigo)

    // Si el producto ya existe en el inventario
    if (productoInventario) {
      // Inicializar el array de lotes si no existe
      if (!productoInventario.lotes) {
        productoInventario.lotes = []

        // Si no hay lotes pero hay cantidad, crear un lote inicial con el inventario existente
        if (productoInventario.cantidad > 0) {
          productoInventario.lotes.push({
            cantidad: productoInventario.cantidad,
            precioCompra: productoInventario.precioCompra,
            fecha: productoInventario.fechaUltimaCompra || fecha,
          })
        }
      }

      // SIEMPRE crear un nuevo lote para la nueva compra, independientemente del precio
      productoInventario.lotes.push({
        cantidad: p.cantidad,
        precioCompra: p.precio,
        fecha: fecha,
      })

      // Actualizar el precio de compra en el inventario (para mostrar el más reciente)
      productoInventario.precioCompra = p.precio
      productoInventario.fechaUltimaCompra = fecha

      // Actualizar la cantidad total
      productoInventario.cantidad += p.cantidad
    } else {
      // Si es un producto nuevo, crearlo con su primer lote
      const nuevoProducto = {
        nombre: p.nombre,
        codigo: p.codigo,
        precioCompra: p.precio,
        precioVenta: p.precioVenta || p.precio * 1.3,
        cantidad: p.cantidad,
        minimo: p.minimo || 5,
        etiqueta: p.etiqueta || "",
        fechaVencimiento: p.fechaVencimiento || "",
        fechaUltimaCompra: fecha,
        lotes: [
          {
            cantidad: p.cantidad,
            precioCompra: p.precio,
            fecha: fecha,
          },
        ],
      }

      inventario.push(nuevoProducto)
    }
  })

  // Actualizar capital.productos
  actualizarCapital()

  actualizarTablaCompras()
  actualizarTablaCuentasPagar()
  actualizarTablaInventario()

  productosEnCompra = []
  document.getElementById("formCompra").reset()
  document.getElementById("cuerpoTablaCompra").innerHTML = ""
  document.getElementById("totalCompra").textContent = "0"

  guardarDatos()
  alert("Compra registrada correctamente")
}

function actualizarTablaCompras() {
  const tbody = document.getElementById("cuerpoTablaCompras")
  if (!tbody) return // Add this check
  tbody.innerHTML = ""
  compras.forEach((c, index) => {
    const tr = document.createElement("tr")
    tr.innerHTML = `
            <td>${c.fecha}</td>
            <td>${c.proveedor}</td>
            <td>${c.total.toFixed(2)}</td>
            <td><button onclick="verDetallesCompra(${index})">Ver Detalles</button></td>
        `
    tbody.appendChild(tr)
  })
}

function verDetallesCompra(index) {
  const compra = compras[index]
  alert(`Detalles de la compra:
Proveedor: ${compra.proveedor}
Fecha: ${compra.fecha}
Total: ${compra.total.toFixed(2)}
Productos: ${compra.productos.map((p) => `${p.nombre} (${p.cantidad})`).join(", ")}`)
}

function actualizarTablaCuentasPagar() {
  const tbody = document.getElementById("cuerpoTablaCuentasPagar")
  tbody.innerHTML = ""
  cuentasPagar.forEach((compra, index) => {
    const tr = document.createElement("tr")
    tr.innerHTML = `
            <td>${compra.fecha}</td>
            <td>${compra.proveedor}</td>
            <td>${compra.total.toFixed(2)}</td>
            <td>
                <button onclick="registrarPagoCuentaPagar(${index})">Registrar Pago</button>
                <button onclick="verDetallesCuentaPagar(${index})">Ver Detalles</button>
            </td>
        `
    tbody.appendChild(tr)
  })
}

function registrarPagoCuentaPagar(index) {
  const compra = cuentasPagar[index]
  compras.push(compra)
  capital.efectivo -= compra.total
  gastos.push({
    fecha: new Date().toLocaleDateString(),
    monto: compra.total,
    descripcion: `Pago de compra a crédito - ${compra.proveedor}`,
    etiqueta: "Compra",
    id: Date.now().toString(), // ID único
  })
  cuentasPagar.splice(index, 1)
  actualizarTablaCompras()
  actualizarTablaCuentasPagar()
  actualizarCapital()
  guardarDatos()
  alert("Pago registrado correctamente")
}

function verDetallesCuentaPagar(index) {
  const compra = cuentasPagar[index]
  alert(`Detalles de la compra a crédito:
Proveedor: ${compra.proveedor}
Fecha: ${compra.fecha}
Total: ${compra.total.toFixed(2)}
Productos: ${compra.productos.map((p) => `${p.nombre} (${p.cantidad})`).join(", ")}`)
}

document.getElementById("formIngresoGasto").addEventListener("submit", function (e) {
  e.preventDefault()
  const tipo = document.getElementById("tipoMovimiento").value
  const monto = Number.parseFloat(document.getElementById("montoMovimiento").value)
  const descripcion = document.getElementById("descripcionMovimiento").value
  const etiqueta = document.getElementById("etiquetaMovimiento").value
  const fecha = new Date().toLocaleDateString()

  const movimiento = {
    fecha,
    monto,
    descripcion,
    etiqueta,
    id: Date.now().toString(), // ID único
  }

  if (tipo === "ingreso") {
    ingresos.push(movimiento)
    ganancias += monto
  } else {
    gastos.push(movimiento)
    ganancias -= monto
  }
  actualizarGanancias()
  actualizarRegistros()
  this.reset()
  guardarDatos()
  alert(`${tipo.charAt(0).toUpperCase() + tipo.slice(1)} registrado correctamente.`)
})

function actualizarGanancias() {
  document.getElementById("gananciasTotal").textContent = ganancias.toFixed(2)
}

function buscarGananciasPorFecha() {
  const fechaInicio = new Date(document.getElementById("fechaInicioGanancias").value)
  const fechaFin = new Date(document.getElementById("fechaFinGanancias").value)
  let gananciasEnPeriodo = 0

  facturas.forEach((f) => {
    const fechaFactura = new Date(f.fecha)
    if (fechaFactura >= fechaInicio && fechaFactura <= fechaFin) {
      gananciasEnPeriodo += f.ganancia
    }
  })

  ingresos.forEach((i) => {
    const fechaIngreso = new Date(i.fecha)
    if (fechaIngreso >= fechaInicio && fechaIngreso <= fechaFin) {
      gananciasEnPeriodo += i.monto
    }
  })

  gastos.forEach((g) => {
    const fechaGasto = new Date(g.fecha)
    if (fechaGasto >= fechaInicio && fechaGasto <= fechaFin) {
      gananciasEnPeriodo -= g.monto
    }
  })

  alert(`Ganancias en el período seleccionado: ${gananciasEnPeriodo.toFixed(2)}`)
}

// Actualizar la función actualizarCapital para calcular correctamente con lotes
function actualizarCapital() {
  // Calcular el capital en productos sumando el valor de cada lote individualmente
  capital.productos = inventario.reduce((total, producto) => {
    if (producto.lotes && producto.lotes.length > 0) {
      // Sumar el valor de todos los lotes
      const valorLotes = producto.lotes.reduce((subtotal, lote) => {
        return subtotal + lote.cantidad * lote.precioCompra
      }, 0)

      console.log(`Producto ${producto.nombre}: Valor de lotes = ${valorLotes}`)
      return total + valorLotes
    } else {
      // Si no hay lotes, usar el método tradicional
      const valorTradicional = producto.cantidad * producto.precioCompra
      console.log(`Producto ${producto.nombre}: Valor tradicional = ${valorTradicional}`)
      return total + valorTradicional
    }
  }, 0)

  document.getElementById("capitalProductos").textContent = capital.productos.toFixed(2)
  document.getElementById("capitalEfectivo").textContent = capital.efectivo.toFixed(2)
  document.getElementById("capitalTotal").textContent = (capital.productos + capital.efectivo).toFixed(2)
}

document.getElementById("formCapital").addEventListener("submit", function (e) {
  e.preventDefault()
  const monto = Number.parseFloat(document.getElementById("montoCapital").value)
  const descripcion = document.getElementById("descripcionCapital").value
  capital.efectivo += monto
  actualizarCapital()
  guardarDatos()
  alert(`Se ha añadido ${monto.toFixed(2)} al capital. Descripción: ${descripcion}`)
  this.reset()
})

function anadirGananciasCapital() {
  const monto = Number.parseFloat(document.getElementById("montoGananciasCapital").value)
  if (isNaN(monto) || monto <= 0) {
    alert("Por favor, ingrese un monto válido.")
    return
  }
  if (monto > ganancias) {
    alert("No puedes añadir más de las ganancias actuales al capital.")
    return
  }
  capital.efectivo += monto
  ganancias -= monto
  actualizarCapital()
  guardarDatos()
  alert(`Se han añadido ${monto.toFixed(2)} de las ganancias al capital.`)
  document.getElementById("montoGananciasCapital").value = ""
}

function restarCapital() {
  const monto = Number.parseFloat(document.getElementById("montoRestarCapital").value)
  if (isNaN(monto) || monto <= 0) {
    alert("Por favor, ingrese un monto válido.")
    return
  }
  if (monto > capital.efectivo) {
    alert("No puedes restar más del capital en efectivo actual.")
    return
  }
  capital.efectivo -= monto
  actualizarCapital()
  guardarDatos()
  alert(`Se han restado ${monto.toFixed(2)} del capital.`)
  document.getElementById("montoRestarCapital").value = ""
}

function actualizarRegistros() {
  const tipoRegistro = document.getElementById("tipoRegistro").value
  const tbody = document.getElementById("cuerpoTablaRegistros")
  const thead = document.getElementById("encabezadoRegistros")
  tbody.innerHTML = ""
  thead.innerHTML = ""

  switch (tipoRegistro) {
    case "facturas":
      thead.innerHTML = `
          <tr>
              <th>Fecha</th>
              <th>Cliente</th>
              <th>Total</th>
              <th>Tipo</th>
              <th>Detalles</th>
          </tr>
      `
      facturas.concat(cuentasCobrar).forEach((f, index) => {
        const tr = document.createElement("tr")
        tr.innerHTML = `
              <td>${f.fecha}</td>
              <td>${f.cliente}</td>
              <td>${f.total.toFixed(2)}</td>
              <td>${f.tipo}</td>
              <td><button onclick="verDetallesFactura(${index}, '${f.tipo}')">Ver Detalles</button></td>
          `
        tbody.appendChild(tr)
      })
      break
    case "ingresos":
      thead.innerHTML = `
                  <tr>
                      <th>Fecha</th>
                      <th>Monto</th>
                      <th>Descripción</th>
                      <th>Etiqueta</th>
                  </tr>
              `
      ingresos.forEach((i) => {
        const tr = document.createElement("tr")
        tr.innerHTML = `
                      <td>${i.fecha}</td>
                      <td>${i.monto.toFixed(2)}</td>
                      <td>${i.descripcion}</td>
                      <td>${i.etiqueta}</td>
                  `
        tbody.appendChild(tr)
      })
      break
    case "gastos":
      thead.innerHTML = `
                  <tr>
                      <th>Fecha</th>
                      <th>Monto</th>
                      <th>Descripción</th>
                      <th>Etiqueta</th>
                  </tr>
              `
      gastos.forEach((g) => {
        const tr = document.createElement("tr")
        tr.innerHTML = `
                      <td>${g.fecha}</td>
                      <td>${g.monto.toFixed(2)}</td>
                      <td>${g.descripcion}</td>
                      <td>${g.etiqueta}</td>
                  `
        tbody.appendChild(tr)
      })
      break
    case "compras":
      thead.innerHTML = `
                  <tr>
                      <th>Fecha</th>
                      <th>Proveedor</th>
                      <th>Total</th>
                      <th>Detalles</th>
                  </tr>
              `
      compras.forEach((c, index) => {
        const tr = document.createElement("tr")
        tr.innerHTML = `
                      <td>${c.fecha}</td>
                      <td>${c.proveedor}</td>
                      <td>${c.total.toFixed(2)}</td>
                      <td><button onclick="verDetallesCompra(${index})">Ver Detalles</button></td>
                  `
        tbody.appendChild(tr)
      })
      break
  }
}

document.getElementById("tipoRegistro").addEventListener("change", actualizarRegistros)

document.getElementById("buscarRegistro").addEventListener("input", (e) => {
  const busqueda = e.target.value.toLowerCase()
  const tipoRegistro = document.getElementById("tipoRegistro").value
  let datosFiltrados

  switch (tipoRegistro) {
    case "facturas":
      datosFiltrados = facturas.filter((f) => f.cliente.toLowerCase().includes(busqueda) || f.fecha.includes(busqueda))
      break
    case "ingresos":
      datosFiltrados = ingresos.filter(
        (i) =>
          i.descripcion.toLowerCase().includes(busqueda) ||
          i.etiqueta.toLowerCase().includes(busqueda) ||
          i.fecha.includes(busqueda),
      )
      break
    case "gastos":
      datosFiltrados = gastos.filter(
        (g) =>
          g.descripcion.toLowerCase().includes(busqueda) ||
          g.etiqueta.toLowerCase().includes(busqueda) ||
          g.fecha.includes(busqueda),
      )
      break
    case "compras":
      datosFiltrados = compras.filter((c) => c.proveedor.toLowerCase().includes(busqueda) || c.fecha.includes(busqueda))
      break
  }

  actualizarRegistros(datosFiltrados)
})

function verDetallesFactura(index, tipo) {
  const factura = tipo === "contado" ? facturas[index] : cuentasCobrar[index]
  let detalles = `Cliente: ${factura.cliente}\nFecha: ${factura.fecha}\nTotal: ${factura.total.toFixed(2)}\nTipo: ${factura.tipo}\n\nProductos:\n`
  factura.productos.forEach((p) => {
    detalles += `- ${p.nombre}: ${p.cantidad} x ${p.precio.toFixed(2)} = ${(p.cantidad * p.precio).toFixed(2)}\n`
  })
  alert(detalles)
}

function imprimirFactura() {
  window.print()
}

function calcularVuelto() {
  const total = Number.parseFloat(document.getElementById("totalFactura").textContent)
  const pagoCon = Number.parseFloat(document.getElementById("pagoConFactura").value)
  if (!isNaN(pagoCon)) {
    const vuelto = pagoCon - total
    document.getElementById("vueltoFactura").textContent = vuelto.toFixed(2)
  } else {
    document.getElementById("vueltoFactura").textContent = "0.00"
  }
}

// Función mejorada para realizar una copia de seguridad en Firestore
function realizarBackup() {
  if (!usuarioActual) {
    alert("Debe iniciar sesión para realizar una copia de seguridad")
    return
  }

  // Mostrar spinner de carga
  const spinner = crearSpinner("Creando copia de seguridad...")
  document.body.appendChild(spinner)

  try {
    const timestamp = new Date().toISOString()
    const backupId = `${usuarioActual}_${timestamp.replace(/[:.]/g, "-")}`

    const backupData = {
      usuario: usuarioActual, // Asegurar que el campo usuario esté presente
      inventario,
      facturas,
      compras,
      cuentasCobrar,
      cuentasPagar,
      ingresos,
      gastos,
      capital,
      ganancias,
      fechaBackup: firebase.firestore.FieldValue.serverTimestamp(),
      descripcion: `Backup automático - ${new Date().toLocaleString()}`,
      fechaCreacion: new Date().toISOString(), // Campo adicional para ordenamiento
    }

    firebase
      .firestore()
      .collection("backups")
      .doc(backupId)
      .set(backupData)
      .then(() => {
        document.body.removeChild(spinner)
        mostrarNotificacion("Copia de seguridad realizada correctamente", "success")
        console.log("Backup creado con ID:", backupId)
      })
      .catch((error) => {
        document.body.removeChild(spinner)
        console.error("Error al realizar copia de seguridad:", error)
        mostrarNotificacion("Error al realizar copia de seguridad: " + error.message, "error")
      })
  } catch (error) {
    document.body.removeChild(spinner)
    console.error("Error al realizar copia de seguridad:", error)
    mostrarNotificacion("Error al realizar copia de seguridad: " + error.message, "error")
  }
}

// Función mejorada para restaurar datos desde Firestore sin requerir índices compuestos
function restaurarDatos() {
  if (!usuarioActual) {
    alert("Debe iniciar sesión para restaurar datos")
    return
  }

  // Mostrar spinner de carga
  const spinner = crearSpinner("Cargando copias de seguridad...")
  document.body.appendChild(spinner)

  try {
    // Usar una consulta más simple que no requiere índice compuesto
    // Primero obtenemos todos los backups y luego filtramos en el cliente
    firebase
      .firestore()
      .collection("backups")
      .orderBy("fechaBackup", "desc")
      .limit(50) // Obtener más para filtrar después
      .get()
      .then((querySnapshot) => {
        document.body.removeChild(spinner)

        if (querySnapshot.empty) {
          mostrarNotificacion("No hay copias de seguridad disponibles", "warning")
          return
        }

        // Filtrar backups del usuario actual en el cliente
        const backups = []
        querySnapshot.forEach((doc) => {
          const data = doc.data()

          // Solo incluir backups del usuario actual
          if (data.usuario === usuarioActual) {
            backups.push({
              id: doc.id,
              fecha: data.fechaBackup ? data.fechaBackup.toDate() : new Date(),
              descripcion: data.descripcion || "Backup sin descripción",
              data: data,
            })
          }
        })

        // Limitar a los últimos 20 backups del usuario
        const backupsLimitados = backups.slice(0, 20)

        if (backupsLimitados.length === 0) {
          mostrarNotificacion("No hay copias de seguridad disponibles para este usuario", "warning")
          return
        }

        // Mostrar modal de selección de backup
        mostrarModalSeleccionBackup(backupsLimitados)
      })
      .catch((error) => {
        document.body.removeChild(spinner)
        console.error("Error al obtener backups desde Firestore:", error)

        // Si hay error con la consulta ordenada, intentar consulta más simple
        if (error.code === "failed-precondition") {
          restaurarDatosSimple()
        } else {
          mostrarNotificacion("Error al cargar copias de seguridad: " + error.message, "error")
        }
      })
  } catch (error) {
    document.body.removeChild(spinner)
    console.error("Error al restaurar datos:", error)
    mostrarNotificacion("Error al restaurar datos: " + error.message, "error")
  }
}

// Función alternativa con consulta aún más simple
function restaurarDatosSimple() {
  const spinner = crearSpinner("Cargando copias de seguridad (modo simple)...")
  document.body.appendChild(spinner)

  try {
    // Consulta muy simple sin ordenamiento
    firebase
      .firestore()
      .collection("backups")
      .get()
      .then((querySnapshot) => {
        document.body.removeChild(spinner)

        if (querySnapshot.empty) {
          mostrarNotificacion("No hay copias de seguridad disponibles", "warning")
          return
        }

        // Filtrar y ordenar backups del usuario actual en el cliente
        const backups = []
        querySnapshot.forEach((doc) => {
          const data = doc.data()

          // Solo incluir backups del usuario actual
          if (data.usuario === usuarioActual) {
            backups.push({
              id: doc.id,
              fecha: data.fechaBackup ? data.fechaBackup.toDate() : new Date(),
              descripcion: data.descripcion || "Backup sin descripción",
              data: data,
            })
          }
        })

        // Ordenar por fecha (más reciente primero) y limitar
        backups.sort((a, b) => b.fecha - a.fecha)
        const backupsLimitados = backups.slice(0, 20)

        if (backupsLimitados.length === 0) {
          mostrarNotificacion("No hay copias de seguridad disponibles para este usuario", "warning")
          return
        }

        // Mostrar modal de selección de backup
        mostrarModalSeleccionBackup(backupsLimitados)
      })
      .catch((error) => {
        document.body.removeChild(spinner)
        console.error("Error al obtener backups:", error)
        mostrarNotificacion("Error al cargar copias de seguridad: " + error.message, "error")
      })
  } catch (error) {
    document.body.removeChild(spinner)
    console.error("Error al restaurar datos:", error)
    mostrarNotificación("Error al restaurar datos: " + error.message, "error")
  }
}

// Función para crear un spinner de carga
function crearSpinner(mensaje = "Cargando...") {
  const spinner = document.createElement("div")
  spinner.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.7);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 10000;
    color: white;
    font-size: 18px;
  `

  spinner.innerHTML = `
    <div style="
      width: 50px;
      height: 50px;
      border: 5px solid #f3f3f3;
      border-top: 5px solid #3498db;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 20px;
    "></div>
    <div>${mensaje}</div>
  `

  return spinner
}

// Función para mostrar notificaciones
function mostrarNotificacion(mensaje, tipo = "info") {
  const notificacion = document.createElement("div")
  notificacion.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    border-radius: 5px;
    color: white;
    z-index: 10001;
    max-width: 400px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    animation: slideIn 0.3s ease-out;
  `

  const colores = {
    success: "#4CAF50",
    error: "#F44336",
    warning: "#FF9800",
    info: "#2196F3",
  }

  notificacion.style.backgroundColor = colores[tipo] || colores.info
  notificacion.textContent = mensaje

  document.body.appendChild(notificacion)

  // Auto-remover después de 5 segundos
  setTimeout(() => {
    if (notificacion.parentNode) {
      notificacion.style.animation = "slideOut 0.3s ease-in"
      setTimeout(() => {
        document.body.removeChild(notificacion)
      }, 300)
    }
  }, 5000)
}

// Función para mostrar modal de selección de backup
function mostrarModalSeleccionBackup(backups) {
  // Crear overlay del modal
  const overlay = document.createElement("div")
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
  `

  // Crear contenido del modal
  const modal = document.createElement("div")
  modal.style.cssText = `
    background-color: white;
    border-radius: 10px;
    padding: 30px;
    max-width: 600px;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  `

  modal.innerHTML = `
    <h2 style="margin-top: 0; color: #333; text-align: center;">Seleccionar Copia de Seguridad</h2>
    <p style="color: #666; text-align: center; margin-bottom: 20px;">
      Selecciona la copia de seguridad que deseas restaurar:
    </p>
    <div id="listaBackups" style="margin-bottom: 20px;"></div>
    <div style="text-align: center;">
      <button id="btnCancelarRestore" style="
        background-color: #6c757d;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 5px;
        cursor: pointer;
        margin-right: 10px;
      ">Cancelar</button>
    </div>
  `

  // Crear lista de backups
  const listaBackups = modal.querySelector("#listaBackups")

  backups.forEach((backup, index) => {
    const backupItem = document.createElement("div")
    backupItem.style.cssText = `
      border: 2px solid #e9ecef;
      border-radius: 8px;
      padding: 15px;
      margin-bottom: 10px;
      cursor: pointer;
      transition: all 0.3s ease;
      background-color: #f8f9fa;
    `

    backupItem.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <div style="font-weight: bold; color: #333; margin-bottom: 5px;">
            ${backup.descripcion}
          </div>
          <div style="color: #666; font-size: 14px;">
            ${backup.fecha.toLocaleString()}
          </div>
        </div>
        <button class="btn-restaurar" data-index="${index}" style="
          background-color: #28a745;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 5px;
          cursor: pointer;
          font-size: 14px;
        ">Restaurar</button>
      </div>
    `

    // Hover effects
    backupItem.addEventListener("mouseenter", () => {
      backupItem.style.borderColor = "#007bff"
      backupItem.style.backgroundColor = "#e3f2fd"
    })

    backupItem.addEventListener("mouseleave", () => {
      backupItem.style.borderColor = "#e9ecef"
      backupItem.style.backgroundColor = "#f8f9fa"
    })

    listaBackups.appendChild(backupItem)
  })

  // Event listeners
  modal.addEventListener("click", (e) => {
    if (e.target.classList.contains("btn-restaurar")) {
      const index = Number.parseInt(e.target.dataset.index)
      const backupSeleccionado = backups[index]

      if (
        confirm(
          `¿Está seguro de que desea restaurar la copia de seguridad del ${backupSeleccionado.fecha.toLocaleString()}?\n\nEsto sobrescribirá todos los datos actuales.`,
        )
      ) {
        document.body.removeChild(overlay)
        ejecutarRestauracion(backupSeleccionado.data)
      }
    }
  })

  modal.querySelector("#btnCancelarRestore").addEventListener("click", () => {
    document.body.removeChild(overlay)
  })

  // Cerrar modal al hacer clic fuera
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      document.body.removeChild(overlay)
    }
  })

  overlay.appendChild(modal)
  document.body.appendChild(overlay)
}

// Función para ejecutar la restauración de datos
function ejecutarRestauracion(datosBackup) {
  const spinner = crearSpinner("Restaurando datos...")
  document.body.appendChild(spinner)

  try {
    // Restaurar datos desde el backup
    inventario = datosBackup.inventario || []
    facturas = datosBackup.facturas || []
    compras = datosBackup.compras || []
    cuentasCobrar = datosBackup.cuentasCobrar || []
    cuentasPagar = datosBackup.cuentasPagar || []
    ingresos = datosBackup.ingresos || []
    gastos = datosBackup.gastos || []
    capital = datosBackup.capital || { productos: 0, efectivo: 0 }
    ganancias = datosBackup.ganancias || 0

    // Actualizar interfaz
    actualizarTablaInventario()
    actualizarTablaFacturas()
    actualizarTablaCuentasCobrar()
    actualizarTablaCompras()
    actualizarTablaCuentasPagar()
    actualizarGanancias()
    actualizarCapital()

    // Guardar en localStorage como respaldo
    guardarDatosLocal()

    // Sincronizar con Firestore
    sincronizarDatos()

    setTimeout(() => {
      document.body.removeChild(spinner)
      mostrarNotificacion("Datos restaurados correctamente", "success")
    }, 1000)
  } catch (error) {
    document.body.removeChild(spinner)
    console.error("Error al restaurar datos:", error)
    mostrarNotificacion("Error al restaurar datos: " + error.message, "error")
  }
}

// Detectar estado de conexión para modo offline
window.addEventListener("online", () => {
  const statusIndicator = document.getElementById("firebaseStatus")
  if (statusIndicator) {
    statusIndicator.style.backgroundColor = "#4CAF50"
    statusIndicator.title = "Conectado a Firebase"
  }

  if (usuarioActual) {
    sincronizarDatos()
    console.log("Datos sincronizados después de recuperar conexión")
  }
})

window.addEventListener("offline", () => {
  const statusIndicator = document.getElementById("firebaseStatus")
  if (statusIndicator) {
    statusIndicator.style.backgroundColor = "#F44336"
    statusIndicator.title = "Desconectado de Firebase - Modo local activado"
  }

  mostrarNotificacion(
    "Conexión perdida. La aplicación funcionará en modo local hasta que se restablezca la conexión.",
    "warning",
  )
})

// Inicialización
window.onload = () => {
  mostrarSeccion("login")

  // Verificar conexión a Firebase
  const statusIndicator = document.createElement("div")
  statusIndicator.id = "firebaseStatus"
  statusIndicator.style.position = "fixed"
  statusIndicator.style.bottom = "10px"
  statusIndicator.style.right = "10px"
  statusIndicator.style.width = "15px"
  statusIndicator.style.height = "15px"
  statusIndicator.style.borderRadius = "50%"
  statusIndicator.style.backgroundColor = "#ccc"
  statusIndicator.style.zIndex = "9999"
  document.body.appendChild(statusIndicator)

  // Comprobar conexión a Firebase
  try {
    const connectedRef = firebase.database().ref(".info/connected")
    connectedRef.on("value", (snap) => {
      if (snap.val() === true) {
        statusIndicator.style.backgroundColor = "#4CAF50" // Verde
        statusIndicator.title = "Conectado a Firebase"
        console.log("Conectado a Firebase")
      } else {
        statusIndicator.style.backgroundColor = "#F44336" // Rojo
        statusIndicator.title = "Desconectado de Firebase"
        console.log("Desconectado de Firebase")
      }
    })
  } catch (error) {
    console.error("Error al verificar conexión a Firebase:", error)
    statusIndicator.style.backgroundColor = "#F44336" // Rojo
    statusIndicator.title = "Error de conexión a Firebase"
  }

  // Añadir botones de backup y restauración al menú principal
  const mainNav = document.getElementById("mainNav")
  if (mainNav) {
    const btnBackup = document.createElement("button")
    btnBackup.textContent = "Realizar Backup"
    btnBackup.onclick = realizarBackup

    const btnRestore = document.createElement("button")
    btnRestore.textContent = "Restaurar Datos"
    btnRestore.onclick = restaurarDatos

    mainNav.appendChild(btnBackup)
    mainNav.appendChild(btnRestore)
  }

  // Establecer fecha actual en campos de fecha
  document.getElementById("fechaFactura").value = new Date().toLocaleDateString()
  const fechaCompra = document.getElementById("fechaCompra")
  if (fechaCompra) {
    fechaCompra.value = new Date().toLocaleDateString()
  }

  // Añadir estilos CSS para animaciones
  const style = document.createElement("style")
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    
    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    }
  `
  document.head.appendChild(style)
}

// script.js
document.addEventListener("DOMContentLoaded", () => {
  console.log("El DOM está listo.")
  console.log("Verificando Firebase:", typeof firebase)

  // Aquí puedes poner cualquier manipulación del DOM, como cambiar el título.
  const title = document.querySelector("h1")
  if (title) {
    title.textContent = "Bienvenido a SV Soft"
  }

  // Otras interacciones con el DOM
  const paragraph = document.querySelector("p")
  if (paragraph) {
    paragraph.style.color = "blue"
  }
})

// Declare firebase
try {
  // Check if firebase is already declared
  if (typeof firebase === "undefined") {
    // If not, declare it
    window.firebase = firebase
  }
} catch (e) {
  // If there is an error, it means firebase is not defined
  console.error("Firebase is not properly initialized. Make sure you have included the Firebase SDK.")
}

// Declare XLSX
try {
  // Check if XLSX is already declared
  if (typeof XLSX === "undefined") {
    // If not, declare it
    window.XLSX = XLSX
  }
} catch (e) {
  // If there is an error, it means XLSX is not properly initialized
  console.error("XLSX is not properly initialized. Make sure you have included the js-xlsx library.")
}
// SCRIPT DEL INDICADOR DE INTERNET - COPIAR ESTE CÓDIGO
(function() {
    let isOnline = navigator.onLine;
    let checkInterval;
    
    const indicator = document.getElementById('internetIndicator');
    const notification = document.getElementById('connectionNotification');
    
    // Asegurarse de que los elementos existen antes de usarlos
    if (!indicator || !notification) {
        console.warn("Elementos del indicador de internet no encontrados. Asegúrate de haber copiado el HTML.");
        return;
    }

    // Función para mostrar notificación
    function showNotification(message, type) {
        notification.textContent = message;
        notification.className = `connection-notification ${type} show`;
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 4000);
    }
    
    // Función para actualizar el indicador
    function updateIndicator(online, checking = false) {
        if (checking) {
            indicator.className = 'internet-indicator checking';
            indicator.textContent = '⏳';
            indicator.setAttribute('data-tooltip', 'Verificando conexión...');
            return;
        }
        
        if (online) {
            indicator.className = 'internet-indicator online';
            indicator.textContent = '🌐';
            indicator.setAttribute('data-tooltip', 'Conectado - Datos seguros');
            
            if (!isOnline) {
                showNotification('✅ Internet conectado - Puedes guardar datos', 'success');
                console.log('🌐 Internet conectado');
            }
        } else {
            indicator.className = 'internet-indicator offline';
            indicator.textContent = '❌';
            indicator.setAttribute('data-tooltip', '¡SIN INTERNET! - No guardes datos');
            
            if (isOnline) {
                showNotification('❌ Sin internet - ¡No guardes datos!', 'error');
                console.log('❌ Internet desconectado');
            }
        }
        
        isOnline = online;
    }
    
    // Función para probar conexión real
    async function testConnection() {
        updateIndicator(navigator.onLine, true);
        
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 segundos de timeout
            
            const response = await fetch('https://www.google.com/favicon.ico', {
                method: 'HEAD',
                mode: 'no-cors', // Importante para evitar errores CORS
                cache: 'no-cache',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            updateIndicator(true);
            return true;
        } catch (error) {
            updateIndicator(false);
            return false;
        }
    }
    
    // Event listeners
    window.addEventListener('online', () => {
        // Dar un pequeño retraso para que la red se estabilice
        setTimeout(testConnection, 1000); 
    });
    
    window.addEventListener('offline', () => {
        updateIndicator(false);
    });
    
    // Click en indicador para probar manualmente
    indicator.addEventListener('click', testConnection);
    
    // Inicialización
    function init() {
        console.log('🚀 Indicador de internet iniciado');
        testConnection(); // Primera verificación al iniciar
        
        // Verificar cada 30 segundos
        checkInterval = setInterval(() => {
            // Solo si el navegador cree que está online, hacemos la prueba real
            if (navigator.onLine) {
                testConnection();
            } else {
                // Si el navegador ya dice que está offline, actualizamos el indicador directamente
                updateIndicator(false);
            }
        }, 30000); // Cada 30 segundos
    }
    
    // Iniciar cuando se carga la página
    // Usamos DOMContentLoaded para asegurar que el HTML esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
// FIN DEL CÓDIGO DEL INDICADOR
