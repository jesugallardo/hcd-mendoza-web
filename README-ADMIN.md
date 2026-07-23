┌─────────────────────────────────────────────────────────────┐
│                    USUARIO FINAL                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  index.html (Sitio Público)                        │    │
│  │  ↓                                                  │    │
│  │  content-loader.js (Carga contenido dinámico)      │    │
│  │  ↓                                                  │    │
│  │  GitHub Raw API (Lee archivos JSON)                │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  ADMINISTRADOR                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  admin.html (Panel de Control)                     │    │
│  │  ↓                                                  │    │
│  │  admin-app.js (Gestiona formularios)               │    │
│  │  ↓                                                  │    │
│  │  github-api.js (Conecta con GitHub API)            │    │
│  │  ↓                                                  │    │
│  │  GitHub API (Crea/Actualiza JSON e Imágenes)       │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
hcd-mendoza-web/
│
├── index.html                    # Sitio web público
├── admin.html                    # Panel de administración
│
── js/
│   ├── github-api.js            # Wrapper de GitHub API
│   ├── admin-app.js             # Lógica del panel admin
│   └── content-loader.js        # Carga dinámica de contenido
│
── data/                         # Archivos JSON (se crean automáticamente)
│   ├── concejales.json          # Datos de concejales
│   ├── banners.json             # Banners del slider
│   ├── noticias.json            # Noticias
│   └── temas_sesion.json        # Temas de sesión
│
└── assets/
    └── img/
        ├── concejales/          # Fotos de concejales
        ├── banners/             # Imágenes de banners
        └── noticias/            # Imágenes de noticias

        Este sitio web permite gestionar de forma dinámica el contenido del Honorable Concejo Deliberante sin necesidad de conocimientos técnicos avanzados. Todo el contenido (noticias, concejales, banners, temas de sesión) se almacena en archivos JSON dentro de un repositorio de GitHub y se carga automáticamente en la página.
Ventajas:
✅ Sin base de datos tradicional
✅ Actualizaciones en tiempo real
✅ Control de versiones integrado
✅ Hosting gratuito en GitHub Pages
✅ Panel de administración intuitivo