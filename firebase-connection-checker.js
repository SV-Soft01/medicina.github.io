/**
 * Verificador de Conexión a Firebase
 * Este script diagnostica problemas de conexión con Firebase
 */

// Declarar la variable firebase (asumiendo que se carga externamente)
let firebase

// Función para verificar la conexión a Firebase
function diagnosticarConexionFirebase() {
  console.log("=== DIAGNÓSTICO DE CONEXIÓN A FIREBASE ===")

  // Paso 1: Verificar si Firebase está definido
  if (typeof firebase === "undefined") {
    console.error("❌ Firebase no está definido. Asegúrate de incluir los scripts de Firebase.")
    mostrarResultado("Firebase no está definido", false)
    return
  }
  console.log("✅ Firebase está definido")

  // Paso 2: Verificar si Firebase está inicializado
  if (!firebase.apps || !firebase.apps.length) {
    console.error("❌ Firebase no está inicializado. Llama a firebase.initializeApp()")
    mostrarResultado("Firebase no está inicializado", false)
    return
  }
  console.log("✅ Firebase está inicializado")

  // Paso 3: Verificar si Firestore está disponible
  if (!firebase.firestore) {
    console.error("❌ Firebase Firestore no está disponible. Incluye el script de Firestore.")
    mostrarResultado("Firestore no está disponible", false)
    return
  }
  console.log("✅ Firestore está disponible")

  // Paso 4: Verificar si Database está disponible (para .info/connected)
  if (!firebase.database) {
    console.error("❌ Firebase Realtime Database no está disponible. Incluye el script de Database.")
    mostrarResultado("Realtime Database no está disponible", false)
    return
  }
  console.log("✅ Realtime Database está disponible")

  // Paso 5: Verificar conexión a Realtime Database
  try {
    const connectedRef = firebase.database().ref(".info/connected")
    connectedRef
      .once("value")
      .then((snap) => {
        const connected = snap.val() === true
        console.log(connected ? "✅ Conectado a Realtime Database" : "❌ No conectado a Realtime Database")

        // Paso 6: Verificar conexión a Firestore
        return firebase.firestore().collection("_test_connection").doc("_test").set({
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        })
      })
      .then(() => {
        console.log("✅ Conectado a Firestore")
        mostrarResultado("Conexión a Firebase establecida correctamente", true)

        // Limpiar el documento de prueba
        return firebase.firestore().collection("_test_connection").doc("_test").delete()
      })
      .catch((error) => {
        console.error("❌ Error al conectar con Firestore:", error)
        mostrarResultado("Error al conectar con Firestore: " + error.message, false)
      })
  } catch (error) {
    console.error("❌ Error al verificar la conexión:", error)
    mostrarResultado("Error al verificar la conexión: " + error.message, false)
  }
}

// Función para mostrar el resultado en la interfaz
function mostrarResultado(mensaje, exito) {
  // Crear o actualizar el elemento de resultado
  let resultadoElement = document.getElementById("firebase-diagnostico-resultado")

  if (!resultadoElement) {
    resultadoElement = document.createElement("div")
    resultadoElement.id = "firebase-diagnostico-resultado"
    resultadoElement.style.position = "fixed"
    resultadoElement.style.top = "10px"
    resultadoElement.style.left = "10px"
    resultadoElement.style.padding = "15px"
    resultadoElement.style.borderRadius = "5px"
    resultadoElement.style.zIndex = "9999"
    resultadoElement.style.boxShadow = "0 2px 10px rgba(0,0,0,0.2)"
    resultadoElement.style.maxWidth = "80%"
    document.body.appendChild(resultadoElement)
  }

  resultadoElement.style.backgroundColor = exito ? "#4CAF50" : "#F44336"
  resultadoElement.style.color = "white"
  resultadoElement.innerHTML = `
    <div style="display: flex; align-items: center;">
      <div style="font-size: 24px; margin-right: 10px;">${exito ? "✅" : "❌"}</div>
      <div>
        <div style="font-weight: bold; margin-bottom: 5px;">Diagnóstico de Firebase</div>
        <div>${mensaje}</div>
      </div>
      <div style="margin-left: 15px;">
        <button onclick="this.parentNode.parentNode.parentNode.style.display='none'">Cerrar</button>
      </div>
    </div>
  `

  // Auto-ocultar después de 10 segundos si es exitoso
  if (exito) {
    setTimeout(() => {
      if (resultadoElement.parentNode) {
        resultadoElement.style.display = "none"
      }
    }, 10000)
  }
}

// Función para verificar si todos los scripts de Firebase están cargados
function verificarScriptsFirebase() {
  const scriptsNecesarios = ["firebase-app.js", "firebase-firestore.js", "firebase-database.js", "firebase-auth.js"]

  const scriptsEncontrados = []

  // Buscar scripts en el documento
  document.querySelectorAll("script").forEach((script) => {
    const src = script.src.toLowerCase()
    scriptsNecesarios.forEach((necesario) => {
      if (src.includes(necesario)) {
        scriptsEncontrados.push(necesario)
      }
    })
  })

  // Verificar scripts faltantes
  const scriptsFaltantes = scriptsNecesarios.filter((script) => !scriptsEncontrados.includes(script))

  if (scriptsFaltantes.length > 0) {
    console.warn("⚠️ Faltan los siguientes scripts de Firebase:", scriptsFaltantes)
    return false
  }

  return true
}

// Función para reiniciar Firebase
function reiniciarFirebase(config) {
  try {
    // Desconectar todas las instancias existentes
    firebase.apps.forEach((app) => app.delete())

    // Reinicializar Firebase
    firebase.initializeApp(config)

    console.log("Firebase reiniciado correctamente")
    return true
  } catch (error) {
    console.error("Error al reiniciar Firebase:", error)
    return false
  }
}

// Exportar funciones
window.FirebaseDiagnostico = {
  diagnosticar: diagnosticarConexionFirebase,
  verificarScripts: verificarScriptsFirebase,
  reiniciar: reiniciarFirebase,
}

// Ejecutar diagnóstico automáticamente si se incluye el parámetro autorun=true
if (window.location.search.includes("autorun=true")) {
  window.addEventListener("load", () => {
    setTimeout(diagnosticarConexionFirebase, 1000)
  })
}

