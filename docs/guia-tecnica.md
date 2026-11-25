# Guía técnica de App Gestor de tareas Noelia

El [README](../README.md) explica cómo instalar el proyecto, iniciarlo y comprobar el funcionamiento básico.

## Arquitectura

| Archivo o directorio | Responsabilidad |
| --- | --- |
| `app/_layout.tsx` | Configura la navegación de Expo Router y la barra de estado. |
| `app/index.tsx`, `app/guia.tsx` | Pantalla de tareas y guía de uso. |
| `src/components/`, `src/colors.ts` | Tarjetas, filtros, selector de prioridad y paleta compartida. |
| `src/types/`, `src/utils/` | Tipos, validación de títulos y filtros por texto, estado y prioridad. |
| `src/services/taskService.ts` | Traduce las respuestas de la API al modelo de la app y coordina las operaciones de tareas. |
| `src/services/api.ts` | Configura la URL, las solicitudes JSON, el tiempo límite y el tratamiento de errores. |
| `src/services/priorityStore.ts`, `src/services/priorityStore.web.ts` | Guardan las prioridades por ID en el directorio de documentos de la app y en `localStorage`, respectivamente. |
| `metro.config.js` | Reenvía las solicitudes de tareas del navegador a la API durante el desarrollo. |
| `app.json`, `eas.json` | Configuran la aplicación Expo y el perfil de compilación Android. |
| `__tests__/` | Pruebas de la interfaz, solicitudes HTTP, prioridades, filtros y validación. |

### Flujo de datos

La pantalla carga las tareas mediante el servicio y combina la respuesta con las prioridades locales. La búsqueda y los filtros operan sobre esa lista en memoria. El formulario admite un título de 1 a 100 caracteres y una descripción opcional de hasta 255. Al guardar, el cliente espera la respuesta de la API antes de actualizar la lista y guarda la prioridad por separado.

| Operación | Solicitud |
| --- | --- |
| Listar | `GET /tasks/?skip=0&limit=100`, con paginación por desplazamiento. |
| Crear | `POST /tasks/`, con título, descripción y estado inicial pendiente. |
| Editar o completar | `GET /tasks/{id}` y luego `PUT /tasks/{id}`. La lectura recupera los campos compartidos antes de enviar la modificación. |
| Eliminar | `DELETE /tasks/{id}`. |

Los cambios del servidor son visibles al recargar desde otros dispositivos. Las prioridades dependen de la instalación o del origen web. Cambiar de navegador, dirección o puerto puede mostrar las tareas sin las prioridades que se habían asignado en el origen anterior.

## Entornos y accesos

| Entorno | Conexión y acceso |
| --- | --- |
| Web local | Metro sirve la app y reenvía `/api/tasks/` a `EXPO_PUBLIC_API_URL`. La PC necesita acceso a la API. |
| Android con Expo Go | Expo sirve el código al teléfono por la red local. El teléfono consulta la API directamente por HTTPS. |
| APK de vista previa | El perfil `preview` de EAS genera un APK de distribución interna y usa la API configurada en `eas.json`. |
| Web publicado | El export usa la URL de la API directamente. Antes de publicarlo, coordiná con el responsable de la API para habilitar CORS para el dominio publicado o preparar un proxy en el alojamiento y configurar el cliente para usarlo. |

La API del curso es un servicio externo al repositorio. La aplicación consulta las tareas sin enviar credenciales. Para compilar con EAS, solicitá acceso al proyecto Expo asociado a `app.json`. El perfil disponible genera un APK interno:

```powershell
npx.cmd eas-cli login
npx.cmd eas-cli build --platform android --profile preview
```

Usá el enlace que entregue EAS para instalar el APK. Los accesos al repositorio, Expo y ClickUp se gestionan con cuentas individuales. Solicitá los permisos al responsable del proyecto.

## Diagnóstico

| Síntoma | Qué revisar |
| --- | --- |
| El navegador muestra una pantalla en blanco | Ejecutá `npm.cmd ci` para instalar las dependencias de `package-lock.json`, incluido `react-native-web`. Reiniciá Expo y revisá la salida de Metro. |
| El navegador rechaza la conexión | Verificá que Expo esté corriendo y abrí el puerto que indique la terminal. `curl.exe http://localhost:8081/status` debería devolver `packager-status:running` si Expo usa ese puerto. |
| La app abre pero faltan las tareas | Confirmá que `.env` tenga la URL de `.env.example`, reiniciá Expo si cambió el valor y probá **Recargar tareas**. En web local, una consulta de solo lectura a `http://localhost:8081/api/tasks/?limit=1` comprueba el reenvío a la API. En Android, abrí Swagger desde el teléfono para comprobar la conectividad. |
| El guardado web muestra un error de CORS o HTTP 405 | Revisá en la pestaña Red del navegador que el desarrollo web envíe la solicitud a `/api/tasks/` en el mismo puerto de Expo. El navegador bloquea la escritura directa cuando la API rechaza la solicitud previa `OPTIONS`. |
| Guardar devuelve HTTP 422 | Revisá el título, la descripción y el cuerpo esperado en Swagger. |
| La conexión se corta durante el guardado | Recargá la lista antes de volver a enviar la tarea. El servidor pudo haber guardado el cambio antes del corte. |
| Expo Go no se conecta con el QR | Comprobá que ambos dispositivos estén en la misma Wi-Fi y que la red y el firewall permitan la comunicación. |

[Swagger de la API del curso](https://api.montenegroariel.com.ar/docs)
