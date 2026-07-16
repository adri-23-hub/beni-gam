Actúa como un Desarrollador Full-Stack experto y Arquitecto de Software. Tu tarea es construir desde cero el sistema "Beni-Gan", una plataforma web automatizada de gestión de inventario y trazabilidad cárnica para una central de acopio en San Borja, Beni [5]. 

El sistema debe resolver problemas de inconsistencia de datos, opacidad de inventario y mermas no controladas mediante la implementación estricta del método PEPS (Primero en Entrar, Primero en Salir) [6]. 

### 1. Arquitectura y Stack Tecnológico Requerido 

El sistema debe diseñarse bajo una arquitectura orientada a servicios y el patrón MVC [2, 4]. 

*   **Base de Datos (Modelo):** PostgreSQL 18 [1]. 

*   **ORM:** Prisma (para el acceso seguro y tipado a la base de datos desde el frontend/BFF). 

*   **Frontend (Vista):** Next.js (React) para desarrollar las interfaces de usuario (Dashboard, formularios y reportes). 

*   **Backend / Servicios (Controlador):** Python (puedes usar FastAPI o Flask). Python se encargará de los microservicios pesados o específicos: generación de códigos QR, cálculo de mermas, lógica matemática de validación y generación de reportes en PDF [1, 7]. Next.js consumirá estos servicios a través de una API REST (JSON) [8]. 

### 2. Esquema de Base de Datos (Prisma & PostgreSQL) 

Debes generar el `schema.prisma` basado en estas entidades principales: 

*   **Rol y Usuario:** Manejo de autenticación (roles: Admin, Recepción, Cámara, Ventas). Debe incluir bloqueo tras 3 intentos fallidos. 

- **Productor:** `id`, `nombre`, `ci_nit` (único para evitar duplicados), `estancia_ubicacion`. 

*   **Lote_Carcasa (Inventario):** `id`, `codigo_qr` (único), `peso_ingreso` (Float, debe ser > 0.2 kg), `peso_salida` (Float, nullable), `fecha_hora_ingreso` (DateTime, por defecto now()), `estado` (String, por defecto "En Cámara"), y relación con `Productor` [9, 10]. 

### 3. Módulos del Sistema (Basados en Historias de Usuario) 

**Módulo 1: Seguridad y Accesos (Login)** 

- Interfaz en Next.js para login de operarios. 

- Lógica: Restricción de rutas según el rol. Bloqueo de cuenta a los 3 intentos fallidos. 

**Módulo 2: Gestión de Productores** 

- CRUD en Next.js para registrar los proveedores ganaderos. 

- Validación obligatoria para que no existan números de CI/NIT duplicados. 

**Módulo 3: Recepción e Ingreso (Capa de captura)** 

- **Interfaz:** Formulario para registrar una nueva res. 

- **Validación:** El `peso_ingreso` debe ser estrictamente mayor a 0.2 kg [9, 10]. 

*   **Servicio Python:** Una vez enviado el formulario, un microservicio en Python debe generar un identificador único (Código QR/Barras) y devolverlo para su impresión [10]. Esto activa el cronómetro de frescura (PEPS). 

**Módulo 4: Dashboard y Cámara de Frío (Control en Tiempo Real)** 

- **Interfaz:** Un panel en Next.js utilizado por el Jefe de Cámara [11]. 

- **Funcionalidad:** Debe mostrar una tabla con todo el inventario cuyo estado sea "En Cámara", ordenado de más antiguo a más reciente (PEPS) [11]. 

*   **Regla Crítica:** Implementar un renderizado condicional; si la diferencia entre la `fecha_hora_ingreso` y el momento actual supera las **48 horas**, esa fila debe pintarse de color **ROJO** (alerta de maduración excesiva) [9, 12]. 

**Módulo 5: Despacho y Ventas** 

- **Interfaz:** Módulo para que el vendedor escanee el QR o busque el ID, e ingrese el `peso_salida` [7, 12]. 

*   **Servicio Python:** Actualiza el estado a "Despachada". Calcula 

automáticamente la "Merma" (`peso_ingreso` - `peso_salida`). 

*   **Salida:** Genera un remito/ticket de salida digital en formato PDF [7]. 

**Módulo 6: Auditoría de Mermas** 

*   **Interfaz:** Tabla analítica del historial de despachos. 

*   **Regla Crítica:** El sistema debe calcular el porcentaje de pérdida de peso. Si la merma supera el **3%**, la fila debe resaltarse en **AMARILLO** indicando una pérdida anormal (desposte injustificado o robo) [13]. 

**Módulo 7: Pronóstico de Demanda y Reportes** 

- **Interfaz:** Gráficos (barras/líneas) construidos en el frontend mostrando el volumen histórico despachado. 

- **Servicio Python:** Procesamiento de datos agrupados (por mes/semana) y exportación de estas estadísticas gráficas a un informe en PDF para gerencia. 

### Instrucciones de inicio para el agente: 

1. Inicia creando el archivo `schema.prisma` completo con las relaciones requeridas. 

2. Construye la estructura base de Next.js (app router) y los endpoints iniciales de la API en Python. 

3. Devuélveme el código paso a paso, empezando por la base de datos y el Módulo de Recepción (Módulo 3). No generes todo de golpe, hazlo de forma iterativa (Sprint a Sprint). 

Diagramas para hacer en plantuml.com 

¡Claro que sí! Como decidimos actualizar el stack tecnológico de tu proyecto a una arquitectura más moderna y profesional ( **Next.js para la Vista, Python para el Controlador/API y Prisma + PostgreSQL para el Modelo** ), es estrictamente necesario que actualicemos los diagramas UML para que reflejen esta nueva realidad. 

Tu profesor fue muy claro en que **se deben presentar diagramas de clases y de secuencia (no de actividades) basados en el patrón MVC** , y que el sistema debe evidenciar una **arquitectura basada en servicios** donde la aplicación cliente consuma una API. Además, él mismo alentó a **utilizar Inteligencia Artificial para generar estos diagramas** . 

Aquí tienes los scripts exactos en PlantUML adaptados a tu nuevo stack para que los copies, generes las imágenes y las pegues en tu informe: 

1. Diagrama de Clases (Arquitectura MVC y Servicios) 

Este diagrama demuestra cómo tu frontend en Next.js se comunica con los microservicios en Python, y este a su vez usa Prisma para consultar PostgreSQL. 

@startuml 

package "Vista (Next.js - Frontend Client)" { 

class RecepcionView { 

+ capturarPesoYProductor() 

+ mostrarTicketQR() 

} 

class DashboardView { 

+ renderizarInventario() 

+ resaltarAlertasRojas() 

} 

} 

package "Controlador (Python API - Servicios Web)" { 

class LoteController { 

+ registrar_ingreso(datos) 

+ generar_qr() 

+ obtener_inventario_activo() 

+ calcular_tiempo_almacenado() 

+ registrar_despacho(id_carcasa, peso_salida) 

+ calcular_merma() 

+ generar_pdf_remito() 

} 

} 

package "Modelo (Prisma ORM & PostgreSQL 18)" { 

class LoteCarcasaModel { 

+ create() 

+ findMany() 

+ update() 

} 

} 

RecepcionView --> LoteController : Petición HTTP POST (JSON) DashboardView --> LoteController : Petición HTTP GET (JSON) LoteController --> LoteCarcasaModel : Consultas vía Prisma Client @enduml 

2. Diagrama de Base de Datos Físico (ER con Prisma) 

El esquema actualizado para soportar tus entidades en PostgreSQL. 

@startuml 

hide circle 

skinparam linetype ortho 

entity "Rol" as rol { 

* id_rol : Int <<PK>> 

nombre_rol : String } 

entity "Usuario" as usuario { * id_usuario : Int <<PK>> -- username : String <<UNIQUE>> password_encriptada : String intentos_fallidos : Int * id_rol : Int <<FK>> } 

entity "Productor" as productor { * id_productor : Int <<PK>> -- nombre : String ci_nit : String <<UNIQUE>> estancia_ubicacion : String } entity "Lote_Carcasa" as lote { * id_carcasa : Int <<PK>> -- codigo_qr : String <<UNIQUE>> peso_ingreso : Float peso_salida : Float fecha_hora_ingreso : DateTime estado : String * id_productor : Int <<FK>> } 

rol ||--o{ usuario : "1 a Muchos" 

productor ||--o{ lote : "1 a Muchos" 

@enduml 

3. Diagramas de Secuencia (El flujo paso a paso) 

El profesor enfatizó la necesidad de diseñar la **"secuencia de objetos"** para cada historia de usuario. 

# **A) Secuencia para HU-01 (Registro y Trazabilidad de Ingreso)** 

@startuml 

actor "Encargado de Recepción" as Usuario 

boundary "Next.js UI\n(Formulario)" as Vista 

control "Python API\n(Microservicio)" as Controlador 

entity "Prisma + PostgreSQL\n(Base de Datos)" as Modelo 

Usuario -> Vista: Ingresa Peso (>0.2 kg) y Productor 

activate Vista 

Vista -> Controlador: POST /api/recepcion {peso, productor} 

activate Controlador 

Controlador -> Controlador: validar_peso() 

Controlador -> Controlador: generar_codigo_qr() 

Controlador -> Modelo: Prisma.Lote_Carcasa.create() 

activate Modelo 

Modelo --> Controlador: Lote guardado 

deactivate Modelo 

Controlador --> Vista: 201 OK (Retorna Código QR generado) 

deactivate Controlador 

Vista --> Usuario: Muestra código QR en pantalla para imprimir 

deactivate Vista 

@enduml 

# **B) Secuencia para HU-02 (Control de Stock y Alerta >48h)** 

@startuml 

actor "Jefe de Cámara" as Usuario 

boundary "Next.js UI\n(Dashboard)" as Vista 

control "Python API\n(Microservicio)" as Controlador 

entity "Prisma + PostgreSQL\n(Base de Datos)" as Modelo 

Usuario -> Vista: Abre Dashboard de Inventario 

activate Vista 

Vista -> Controlador: GET /api/inventario 

activate Controlador 

Controlador -> Modelo: Prisma.Lote_Carcasa.findMany(estado="En Cámara") 

activate Modelo 

Modelo --> Controlador: Lista de carcasas con fecha_ingreso 

deactivate Modelo 

Controlador -> Controlador: calcular_horas_almacenadas(fecha_actual - fecha_ingreso) 

Controlador -> Controlador: marcar_alertas(horas > 48) 

Controlador --> Vista: 200 OK (JSON con datos y flags de alerta) 

deactivate Controlador 

Vista -> Vista: Aplicar clase CSS roja a filas con flag 

Vista --> Usuario: Visualiza tabla con alertas (PEPS) 

deactivate Vista 

@enduml 

# **C) Secuencia para HU-03 (Despacho y Cálculo de Merma)** 

@startuml 

actor "Vendedor / Despacho" as Usuario 

boundary "Next.js UI\n(Escáner)" as Vista 

control "Python API\n(Microservicio)" as Controlador 

entity "Prisma + PostgreSQL\n(Base de Datos)" as Modelo 

Usuario -> Vista: Escanea QR e ingresa Peso de Salida 

activate Vista 

Vista -> Controlador: POST /api/despacho {qr, peso_salida} 

activate Controlador 

Controlador -> Modelo: Prisma.Lote_Carcasa.findUnique(qr) 

activate Modelo 

Modelo --> Controlador: Retorna peso_ingreso original 

deactivate Modelo 

Controlador -> Controlador: calcular_merma(peso_ingreso - peso_salida) Controlador -> Controlador: generar_pdf_remito() 

Controlador -> Modelo: Prisma.Lote_Carcasa.update(estado="Despachada") 

activate Modelo 

Modelo --> Controlador: Confirmación 

deactivate Modelo 

Controlador --> Vista: 200 OK (Retorna URL del PDF) 

deactivate Controlador 

Vista --> Usuario: Descarga Ticket de Salida 

deactivate Vista 

@enduml 

# **Instrucciones para generar las imágenes:** 

1. Ve a un generador online como **PlantText** o **PlantUML Web Server** . 

2. Copia y pega cada bloque de código de forma individual. 

3. Descarga la imagen generada. 

4. Pégalas en tu informe bajo el título _"Arquitectura del Sistema y Diagramas UML - Sprint 1"_ . 

Con esto, le demostrarás al profesor que entiendes perfectamente cómo separar la Vista (Next.js), el Controlador (Python) y el Modelo (Prisma/PostgreSQL), cumpliendo con todas las exigencias técnicas de la clase. ¡Tu diseño está de nivel profesional! 

