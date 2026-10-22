// Lógica interactiva del portal: copiado al portapapeles, probador de tipografías, filtros y descarga de SVG.

document.addEventListener('DOMContentLoaded', () => {
  // 1. Base de datos de colores oficiales fijos mundiales
  const catalogoColores = [
    {
      hex: '#F79016',
      rgb: 'rgb(247, 144, 22)',
      hsl: 'hsl(33, 93%, 53%)'
    },
    {
      hex: '#98371E',
      rgb: 'rgb(152, 55, 30)',
      hsl: 'hsl(12, 67%, 36%)'
    },
    {
      hex: '#2FAF6E',
      rgb: 'rgb(47, 175, 110)',
      hsl: 'hsl(150, 58%, 44%)'
    },
    {
      hex: '#D26830',
      rgb: 'rgb(210, 104, 48)',
      hsl: 'hsl(21, 64%, 51%)'
    }
  ];

  // 2. Control de logotipos oficiales (3 SVG y 3 PNG cargados estáticamente)

  // Elementos DOM
  const contenedorColores = document.getElementById('contenedor-tarjetas-colores');
  const contenedorLogos = document.getElementById('contenedor-logos');
  const toastElemento = document.getElementById('notificacion-toast');
  const mensajeToast = document.getElementById('mensaje-toast');
  const modalSvg = document.getElementById('modal-visor-svg');
  const visorGrafico = document.getElementById('visor-grafico-svg');
  const codigoSvgTexto = document.getElementById('codigo-svg-texto');
  const modalTitulo = document.getElementById('modal-titulo');
  const btnCerrarModal = document.getElementById('btn-cerrar-modal');
  const btnCopiarCodigoSvg = document.getElementById('btn-copiar-codigo-svg');
  const btnDescargarArchivoSvg = document.getElementById('btn-descargar-archivo-svg');

  // Estado activo
  let temporizadorToast = null;
  let logoSeleccionadoActual = null;
  let filtroColorActivo = 'todos';
  let filtroLogoRegionActivo = 'todos';
  let contrasteFondoLogos = 'oscuro';

  // Función para mostrar notificación flotante
  function mostrarToast(mensaje) {
    if (temporizadorToast) {
      clearTimeout(temporizadorToast);
    }
    mensajeToast.textContent = mensaje;
    toastElemento.classList.add('visible');

    temporizadorToast = setTimeout(() => {
      toastElemento.classList.remove('visible');
    }, 2800);
  }

  // Copiar al portapapeles con fallback robusto
  async function copiarTexto(texto, etiqueta) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(texto);
      } else {
        const areaTemporal = document.createElement('textarea');
        areaTemporal.value = texto;
        areaTemporal.style.position = 'fixed';
        areaTemporal.style.left = '-9999px';
        document.body.appendChild(areaTemporal);
        areaTemporal.select();
        document.execCommand('copy');
        document.body.removeChild(areaTemporal);
      }
      mostrarToast(`¡Copiado: ${texto}!`);
    } catch (error) {
      mostrarToast(`Error al copiar al portapapeles.`);
    }
  }

  // Inicializar o sincronizar tarjetas de colores oficiales fijos
  function inicializarColores() {
    if (!contenedorColores) return;

    // Si ya existen las tarjetas en el HTML, conectamos sus eventos de copiado
    const tarjetasExistentes = contenedorColores.querySelectorAll('.tarjeta-color');
    if (tarjetasExistentes.length > 0) {
      tarjetasExistentes.forEach(tarjeta => {
        const muestra = tarjeta.querySelector('.muestra-color');

        if (muestra) {
          muestra.addEventListener('click', () => {
            const hex = muestra.getAttribute('data-hex');
            if (hex) copiarTexto(hex);
          });
        }

        tarjeta.querySelectorAll('.btn-copiar-valor').forEach(boton => {
          boton.addEventListener('click', (e) => {
            e.stopPropagation();
            const valor = boton.getAttribute('data-copiar');
            if (valor) copiarTexto(valor);
          });
        });
      });
      return;
    }

    // Renderizado dinámico de respaldo si el contenedor estuviese vacío
    contenedorColores.innerHTML = '';
    catalogoColores.forEach(color => {
      const tarjeta = document.createElement('div');
      tarjeta.className = 'tarjeta-color';
      tarjeta.innerHTML = `
        <div class="muestra-color" style="background-color: ${color.hex};" title="Clic para copiar ${color.hex}" data-hex="${color.hex}"></div>
        <div class="cuerpo-tarjeta-color">
          <div class="fila-codigo-color">
            <span class="texto-codigo">${color.hex}</span>
            <button type="button" class="btn-copiar-valor" data-copiar="${color.hex}" aria-label="Copiar código HEX">
              <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor">
                <path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z"/>
                <path d="M5 3a2 2 0 00-2 2v6a2 2 0 002 2V5h8a2 2 0 00-2-2H5z"/>
              </svg>
            </button>
          </div>
          <div class="fila-codigo-color">
            <span class="texto-codigo">${color.rgb}</span>
            <button type="button" class="btn-copiar-valor" data-copiar="${color.rgb}" aria-label="Copiar código RGB">
              <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor">
                <path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z"/>
                <path d="M5 3a2 2 0 00-2 2v6a2 2 0 002 2V5h8a2 2 0 00-2-2H5z"/>
              </svg>
            </button>
          </div>
        </div>
      `;

      const muestra = tarjeta.querySelector('.muestra-color');
      muestra.addEventListener('click', () => {
        copiarTexto(color.hex);
      });

      tarjeta.querySelectorAll('.btn-copiar-valor').forEach(boton => {
        boton.addEventListener('click', (e) => {
          e.stopPropagation();
          const valor = boton.getAttribute('data-copiar');
          copiarTexto(valor);
        });
      });

      contenedorColores.appendChild(tarjeta);
    });
  }

  // Control de contraste y filtros para logos oficiales separados por formato
  function configurarControlesLogos() {
    const btnFondoOscuro = document.getElementById('btn-fondo-oscuro');
    const btnFondoClaro = document.getElementById('btn-fondo-claro');
    const areasGraficas = document.querySelectorAll('.area-grafica-logo');

    if (btnFondoOscuro && btnFondoClaro) {
      btnFondoOscuro.addEventListener('click', () => {
        btnFondoOscuro.classList.add('activo');
        btnFondoClaro.classList.remove('activo');
        areasGraficas.forEach(area => {
          area.classList.remove('fondo-claro');
          area.classList.add('fondo-oscuro');
        });
      });

      btnFondoClaro.addEventListener('click', () => {
        btnFondoClaro.classList.add('activo');
        btnFondoOscuro.classList.remove('activo');
        areasGraficas.forEach(area => {
          area.classList.remove('fondo-oscuro');
          area.classList.add('fondo-claro');
        });
      });
    }

    const botonesFiltroFormato = document.querySelectorAll('[data-filtro-formato]');
    const bloqueSvg = document.getElementById('bloque-logos-svg');
    const bloquePng = document.getElementById('bloque-logos-png');

    botonesFiltroFormato.forEach(btn => {
      btn.addEventListener('click', () => {
        botonesFiltroFormato.forEach(b => b.classList.remove('activo'));
        btn.classList.add('activo');
        const formato = btn.getAttribute('data-filtro-formato');

        if (formato === 'todos') {
          if (bloqueSvg) bloqueSvg.classList.remove('oculto');
          if (bloquePng) bloquePng.classList.remove('oculto');
          mostrarToast('Mostrando todos los formatos (SVG y PNG)');
        } else if (formato === 'svg') {
          if (bloqueSvg) bloqueSvg.classList.remove('oculto');
          if (bloquePng) bloquePng.classList.add('oculto');
          mostrarToast('Mostrando solo logos vectoriales (SVG)');
        } else if (formato === 'png') {
          if (bloquePng) bloquePng.classList.remove('oculto');
          if (bloqueSvg) bloqueSvg.classList.add('oculto');
          mostrarToast('Mostrando solo logos PNG en alta resolución');
        }
      });
    });
  }

  // Abrir modal con detalles y código SVG
  function abrirModalLogo(item) {
    logoSeleccionadoActual = item;
    modalTitulo.textContent = item.nombre;
    visorGrafico.innerHTML = item.svg;
    codigoSvgTexto.value = item.svg.trim();
    if (modalSvg && typeof modalSvg.showModal === 'function') {
      modalSvg.showModal();
    }
  }

  // Cerrar modal
  if (btnCerrarModal) {
    btnCerrarModal.addEventListener('click', () => {
      if (modalSvg) modalSvg.close();
    });
  }

  if (modalSvg) {
    // Cerrar al hacer clic en el backdrop
    modalSvg.addEventListener('click', (evento) => {
      const dimensiones = modalSvg.getBoundingClientRect();
      const clicDentro = (
        evento.clientX >= dimensiones.left &&
        evento.clientX <= dimensiones.right &&
        evento.clientY >= dimensiones.top &&
        evento.clientY <= dimensiones.bottom
      );
      if (!clicDentro) {
        modalSvg.close();
      }
    });
  }

  // Copiar código SVG desde el modal
  if (btnCopiarCodigoSvg) {
    btnCopiarCodigoSvg.addEventListener('click', () => {
      if (codigoSvgTexto) {
        copiarTexto(codigoSvgTexto.value, 'Código SVG');
      }
    });
  }

  // Descargar archivo .SVG
  function descargarArchivoSvg(nombreArchivo, contenidoSvg) {
    const blob = new Blob([contenidoSvg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = `${nombreArchivo}.svg`;
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);
    URL.revokeObjectURL(url);
    mostrarToast(`Descarga iniciada: ${nombreArchivo}.svg`);
  }

  if (btnDescargarArchivoSvg) {
    btnDescargarArchivoSvg.addEventListener('click', () => {
      if (logoSeleccionadoActual) {
        descargarArchivoSvg(logoSeleccionadoActual.id, logoSeleccionadoActual.svg);
      }
    });
  }

  // Probador de fuentes en tiempo real
  const entradaTextoStreamer = document.getElementById('entrada-texto-streamer');
  const deslizadorTamano = document.getElementById('deslizador-tamano');
  const indicadorTamano = document.getElementById('indicador-tamano-fuente');
  const muestrasTexto = [
    document.getElementById('muestra-marcellus'),
    document.getElementById('muestra-rajdhani'),
    document.getElementById('muestra-alegreya')
  ];

  function actualizarTextoMuestras(nuevoTexto) {
    const textoFinal = nuevoTexto.trim() === '' ? 'TuCanal_Stream' : nuevoTexto;
    muestrasTexto.forEach(muestra => {
      if (muestra) muestra.textContent = textoFinal;
    });
  }

  function actualizarTamanoMuestras(tamanoPx) {
    if (indicadorTamano) {
      indicadorTamano.textContent = `Tamaño: ${tamanoPx}px`;
    }
    muestrasTexto.forEach(muestra => {
      if (muestra) muestra.style.fontSize = `${tamanoPx}px`;
    });
  }

  if (entradaTextoStreamer) {
    entradaTextoStreamer.addEventListener('input', (e) => {
      actualizarTextoMuestras(e.target.value);
    });
  }

  if (deslizadorTamano) {
    deslizadorTamano.addEventListener('input', (e) => {
      actualizarTamanoMuestras(e.target.value);
    });
  }

  // Render inicial
  inicializarColores();
  configurarControlesLogos();
});
