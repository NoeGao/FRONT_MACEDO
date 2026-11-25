# Gestor de tareas 2

Aplicación del taller para crear, editar, completar, eliminar y filtrar tareas. El título, la descripción y el estado se guardan en la API compartida del curso. Cada navegador o instalación guarda sus propias prioridades.

## Empezar en Windows

Necesitás Node.js 24 con npm, acceso a Internet y una copia del proyecto. La aplicación usa Expo SDK 57, React Native, Expo Router y TypeScript. Para probar en Android, instalá una versión de Expo Go compatible con el SDK del proyecto.

Abrí PowerShell en la carpeta que contiene `package.json` y ejecutá:

```powershell
node -v
npm.cmd -v
npm.cmd ci
if (!(Test-Path .env)) { Copy-Item .env.example .env }
npx.cmd expo start --go
```

- **En la PC**, abrí [http://localhost:8081](http://localhost:8081) o la dirección web que muestre Expo. Si el puerto está ocupado, aceptá el alternativo que indique la terminal.
- **En Android**, conectá el teléfono y la PC a la misma Wi-Fi. Abrí Expo Go y escaneá el QR de la terminal.
- Dejá Expo abierto mientras usás la app. Para detenerlo, presioná `Ctrl+C`.

## Configuración y accesos

`.env.example` trae el valor de `EXPO_PUBLIC_API_URL` para la API del curso. Reiniciá Expo después de cambiarlo. El valor es público y Expo lo incorpora al código cliente. Guardá credenciales con el mecanismo autorizado por tu equipo y mantenelas fuera de las variables `EXPO_PUBLIC_*`, del repositorio y de ClickUp.

El proyecto consume la API compartida por HTTPS. Consultá los endpoints en [Swagger de la API del curso](https://api.montenegroariel.com.ar/docs). Para generar un APK mediante EAS necesitás una cuenta de Expo con acceso al proyecto asociado.

## Verificación

```powershell
npm.cmd run typecheck
npm.cmd test
```

En la app, creá una tarea propia de práctica, recargá la lista y verificá que aparezca. Cambiá su prioridad, reabrí la misma dirección o instalación y confirmá que se conserve. Probá filtros, edición y marcado como completada. Al terminar, eliminá tu tarea de prueba si corresponde. Las operaciones de escritura afectan la lista compartida.

Para conocer los módulos, los entornos, la publicación y los pasos de diagnóstico, consultá la [guía técnica](docs/guia-tecnica.md).
