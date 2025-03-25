/**
 * Monitor de Conexión a Firebase
 * Este script verifica y muestra el estado de conexión a Firebase en tiempo real.
 *
 * Uso:
 * 1. Incluye este script en tu HTML después de cargar Firebase
 * 2. Llama a initFirebaseConnectionMonitor() con tu configuración de Firebase
 * 3. El monitor mostrará un indicador flotante en la esquina inferior derecha
 */

// Función para inicializar el monitor de conexión
function initFirebaseConnectionMonitor(config = null) {
    // Crear elementos del monitor
    createConnectionMonitorElements()
  
    // Inicializar Firebase si se proporciona configuración y no está ya inicializado
    if (config && (!window.firebase || !firebase.apps.length)) {
      try {
        firebase.initializeApp(config)
      } catch (error) {
        console.error("Error initializing Firebase:", error)
        updateConnectionStatus(false, "Error al inicializar Firebase")
        return false
      }
    }
  
    // Verificar que Firebase esté disponible
    if (!window.firebase) {
      console.error("Firebase no está disponible. Asegúrate de incluir Firebase antes de este script.")
      updateConnectionStatus(false, "Firebase no está disponible")
      return false
    }
  
    // Verificar que Firebase Database esté disponible
    if (!firebase.database) {
      console.error("Firebase Database no está disponible. Asegúrate de incluir firebase-database.js")
      updateConnectionStatus(false, "Firebase Database no está disponible")
      return false
    }
  
    // Configurar listeners para el estado de conexión
    setupConnectionListeners()
  
    return true
  }
  
  // Crear elementos del monitor en el DOM
  function createConnectionMonitorElements() {
    // Estilos CSS
    const style = document.createElement("style")
    style.textContent = `
          .fb-connection-indicator {
              position: fixed;
              bottom: 20px;
              right: 20px;
              width: 15px;
              height: 15px;
              border-radius: 50%;
              box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
              z-index: 9999;
              cursor: pointer;
              transition: background-color 0.3s ease;
          }
          .fb-connected {
              background-color: #4CAF50;
          }
          .fb-disconnected {
              background-color: #F44336;
          }
          .fb-checking {
              background-color: #FFC107;
          }
          .fb-connection-tooltip {
              position: absolute;
              bottom: 25px;
              right: 25px;
              background-color: #333;
              color: white;
              padding: 5px 10px;
              border-radius: 4px;
              font-size: 12px;
              display: none;
              white-space: nowrap;
          }
          .fb-connection-indicator:hover .fb-connection-tooltip {
              display: block;
          }
      `
    document.head.appendChild(style)
  
    // Indicador de conexión
    const indicator = document.createElement("div")
    indicator.className = "fb-connection-indicator fb-checking"
    indicator.id = "fbConnectionIndicator"
  
    // Tooltip
    const tooltip = document.createElement("div")
    tooltip.className = "fb-connection-tooltip"
    tooltip.id = "fbConnectionTooltip"
    tooltip.textContent = "Verificando conexión a Firebase..."
  
    indicator.appendChild(tooltip)
    document.body.appendChild(indicator)
  }
  
  // Configurar listeners para el estado de conexión
  function setupConnectionListeners() {
    try {
      const connectedRef = firebase.database().ref(".info/connected")
  
      connectedRef.on("value", (snap) => {
        const connected = snap.val() === true
        updateConnectionStatus(connected, connected ? "Conectado a Firebase" : "Desconectado de Firebase")
      })
  
      // Verificar conexión cuando cambia el estado de la red
      window.addEventListener("online", () => {
        // Esperar un poco para que la conexión se establezca
        setTimeout(() => checkFirebaseConnection(), 2000)
      })
  
      window.addEventListener("offline", () => {
        updateConnectionStatus(false, "Dispositivo sin conexión a Internet")
      })
    } catch (error) {
      console.error("Error al configurar listeners de conexión:", error)
      updateConnectionStatus(false, "Error al verificar conexión")
    }
  }
  
  // Verificar manualmente la conexión a Firebase
  function checkFirebaseConnection() {
    const indicator = document.getElementById("fbConnectionIndicator")
    const tooltip = document.getElementById("fbConnectionTooltip")
  
    if (!indicator || !tooltip) return false
  
    indicator.className = "fb-connection-indicator fb-checking"
    tooltip.textContent = "Verificando conexión a Firebase..."
  
    try {
      const connectedRef = firebase.database().ref(".info/connected")
  
      connectedRef
        .once("value")
        .then((snap) => {
          const connected = snap.val() === true
          updateConnectionStatus(connected, connected ? "Conectado a Firebase" : "Desconectado de Firebase")
          return connected
        })
        .catch((error) => {
          console.error("Error al verificar conexión:", error)
          updateConnectionStatus(false, "Error al verificar conexión")
          return false
        })
    } catch (error) {
      console.error("Error al verificar conexión:", error)
      updateConnectionStatus(false, "Error al verificar conexión")
      return false
    }
  }
  
  // Actualizar el estado visual del indicador
  function updateConnectionStatus(isConnected, message) {
    const indicator = document.getElementById("fbConnectionIndicator")
    const tooltip = document.getElementById("fbConnectionTooltip")
  
    if (!indicator || !tooltip) return
  
    if (isConnected) {
      indicator.className = "fb-connection-indicator fb-connected"
    } else {
      indicator.className = "fb-connection-indicator fb-disconnected"
    }
  
    tooltip.textContent = message || (isConnected ? "Conectado a Firebase" : "Desconectado de Firebase")
  
    // Disparar evento personalizado
    const event = new CustomEvent("firebaseConnectionChange", {
      detail: { connected: isConnected, message: tooltip.textContent },
    })
    document.dispatchEvent(event)
  }
  
  // Exportar funciones para uso externo
  window.FirebaseConnectionMonitor = {
    init: initFirebaseConnectionMonitor,
    check: checkFirebaseConnection,
  }
  
  