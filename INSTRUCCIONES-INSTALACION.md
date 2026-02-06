# 📦 Instrucciones de Instalación - Thrive Formative

## ⚠️ Requisitos previos

Antes de poder ejecutar el proyecto, necesitas instalar Node.js en tu sistema.

### 1. Instalar Node.js

1. Ve a: https://nodejs.org/
2. Descarga la versión **LTS** (Long Term Support) — actualmente v20.x o superior
3. Ejecuta el instalador y sigue las instrucciones
4. **IMPORTANTE**: Durante la instalación, asegúrate de marcar la opción "Add to PATH"

### 2. Verificar la instalación

Abre una nueva terminal PowerShell y ejecuta:

```powershell
node --version
npm --version
```

Deberías ver algo como:
```
v20.11.0
10.2.4
```

## 🚀 Pasos para ejecutar el proyecto

Una vez que Node.js esté instalado:

### 1. Abrir terminal en la carpeta del proyecto

En el explorador de archivos:
- Navega a: `C:\Users\sergi\Desktop\thrive-formative`
- Haz clic derecho en un espacio vacío
- Selecciona "Abrir en Terminal" o "Abrir en Windows PowerShell"

### 2. Instalar dependencias

```powershell
npm install
```

Este comando descargará todas las librerías necesarias (Next.js, React, Tailwind CSS, Framer Motion, etc.). Puede tomar 2-3 minutos.

### 3. Iniciar el servidor de desarrollo

```powershell
npm run dev
```

Verás un mensaje como:

```
  ▲ Next.js 15.1.0
  - Local:        http://localhost:3000
  - ready started server on [::]:3000
```

### 4. Abrir en el navegador

- Abre tu navegador (Chrome, Firefox, Edge)
- Ve a: `http://localhost:3000`
- ¡Deberías ver tu sitio web funcionando!

### 5. Ver el botón de temas

En la esquina inferior derecha verás un botón "Cambiar vista" que permite cambiar entre los 4 temas:
- Golden Sand (cálido, default)
- Nocturnal (oscuro)
- Metallics (metálico boutique)
- Earth Modern (tierra contemporáneo)

## 🛠️ Si tienes problemas

### Error: "npm no se reconoce..."

Significa que Node.js no está en el PATH. Soluciones:
1. Cierra TODAS las ventanas de PowerShell/CMD
2. Abre una nueva terminal
3. Intenta de nuevo

Si aún no funciona:
- Reinstala Node.js marcando "Add to PATH"
- Reinicia la computadora

### Error durante npm install

Si ves errores tipo `EACCES` o `permission denied`:
1. Cierra la terminal
2. Abre PowerShell como Administrador (clic derecho → "Ejecutar como administrador")
3. Navega a la carpeta: `cd C:\Users\sergi\Desktop\thrive-formative`
4. Ejecuta de nuevo: `npm install`

### El sitio no se ve bien / no carga

1. Verifica que el servidor esté corriendo (debe decir "ready" en la terminal)
2. Refresca la página (Ctrl + R o F5)
3. Limpia la caché del navegador (Ctrl + Shift + R)
4. Prueba en modo incógnito

## 📝 Próximos pasos después de instalar

Una vez que el sitio esté funcionando localmente:

1. **Personaliza el contenido:**
   - Edita `app/page.tsx` para cambiar textos
   - Cambia el número de WhatsApp (línea 4 de `app/page.tsx`)
   - Agrega información real del doctor
   - Actualiza contacto (correo, teléfono, dirección)

2. **Prueba los temas:**
   - Haz clic en "Cambiar vista"
   - Prueba cada tema
   - Decide cuál usar por default (editar `ThemeProvider.tsx` línea 17)

3. **Prepara para producción:**
   - Reemplaza placeholders con información real
   - Agrega fotos reales
   - Configura testimonios autorizados
   - Define precios de planes

## 🌐 Desplegar a internet

Cuando esté listo para publicar:

### Opción 1: Vercel (más fácil, gratis)

1. Crea una cuenta en https://vercel.com
2. Instala Vercel CLI: `npm i -g vercel`
3. En la carpeta del proyecto: `vercel`
4. Sigue las instrucciones
5. ¡Listo! Tendrás una URL pública

### Opción 2: Netlify

1. Crea una cuenta en https://netlify.com
2. Arrastra la carpeta del proyecto a Netlify Drop
3. Espera el deploy
4. Configura dominio personalizado

### Opción 3: Hosting tradicional

1. Ejecuta: `npm run build`
2. Copia la carpeta `out/` a tu servidor
3. Configura el servidor web (Apache/Nginx)

## 💡 Tips

- **Modo desarrollo** (`npm run dev`): Cambios en vivo, recarga automática
- **Modo producción** (`npm run build`): Optimizado, rápido, listo para usuarios reales
- **Terminal siempre abierta**: Mientras editas, deja la terminal con `npm run dev` corriendo

## 📞 Ayuda adicional

Si necesitas ayuda:
1. Revisa el archivo `README.md` en la raíz del proyecto
2. Consulta la documentación de Next.js: https://nextjs.org/docs
3. Busca tutoriales de Next.js en YouTube (en español)

---

¡Éxito con tu proyecto Thrive Formative! 🚀
