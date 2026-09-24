**FICHA DE REFERENCIA INTERNA: CONDUCTORES EN PARALELO**

Esta ficha resume las disposiciones, criterios y vacíos normativos detectados en los Pliegos Técnicos RIC, RPTD e Instrucciones RGR respecto a la instalación y operación de conductores en paralelo y trazados en paralelismo.

---

### 1. EXIGENCIAS POR PLIEGO

#### **Pliego Técnico RIC N° 04 (Conductores y Canalizaciones)**
*   **Permisividad y Sección Mínima (5.28):** Se autoriza el uso de conductores en paralelo, unidos en ambos extremos para formar un solo conductor, únicamente en líneas de potencia con sección igual o superior a **50 mm²**.
*   **Condiciones de Simetría (5.28.1 al 5.28.4):** Los conductores que formen el conjunto deben tener:
    *   Mismo largo.
    *   Misma sección transversal.
    *   Mismo tipo de aislación.
    *   Mismo tipo de terminal de conexión, con dimensiones idénticas y conectados al mismo punto.
*   **Canalización (5.27):** Solo pueden llevarse conductores de un mismo circuito en una tubería, salvo excepciones en bandejas o escalerillas.

#### **Pliego Técnico RIC N° 03 (Alimentadores y Demanda)**
*   **Configuraciones de Instalación (Anexo 3.1):** Establece disposiciones geométricas específicas para reducir desbalances de impedancia:
    *   Esquemas para 4 cables de 3 núcleos.
    *   Configuraciones para 6, 9 y 12 cables de un solo núcleo en planos lisos, uno sobre otro o en trébol.

#### **Instrucción Técnica RGR-N 06 (Sistemas de Almacenamiento - BESS)**
*   **Restricción en Equipos de Conversión (PCE):** No se permiten conductores en paralelo unidos para formar un solo conductor, salvo que el fabricante del PCE indique expresamente lo contrario.
*   **Interconexión de Sistemas de Baterías (BS) (Sección 12):** Para interconectar dos o más sistemas en paralelo, los conductores de salida de cada uno hacia el punto de conexión (barras) deben tener la **misma resistencia**, cumpliendo igualdad en largo, sección, aislación y terminales.
*   **Baterías de Plomo Ácido:** La conexión en paralelo solo se permite entre unidades de la misma capacidad nominal, marca, modelo, año de fabricación y química.

#### **Pliego Técnico RPTD N° 11 (Líneas de Alta y Extra Alta Tensión)**
*   **Paralelismo de Líneas (5.7.6):** Se debe evitar la construcción de líneas paralelas a distancias inferiores a **1,5 veces la altura del apoyo más alto**, salvo en accesos a centrales o estaciones.
*   **Líneas Subterráneas (6.8.1):** En paralelismos de cables subterráneos con distancias menores a 20 cm, cada línea debe ir en ductos o separada por tabiques aislantes del calor.

---

### 2. DEFINICIONES OFICIALES

*   **Haz de conductores (conductor múltiple):** "Conjunto de dos o más conductores utilizados como un solo conductor, con separadores para mantener una configuración predeterminada. Los conductores individuales de este conjunto se llaman subconductores" (RPTD N° 11, 4.22; RPTD N° 04, 4.13).
*   **Paralelismo (Líneas):** "Se entiende por paralelismo el de líneas vecinas que siguen de manera aproximada la misma dirección, aun cuando sus trazados no sean rigurosamente paralelos" (RPTD N° 11, 5.7.1.a).
*   **Operación en paralelo (Generación):** "Condición en que operan el sistema de generación de algún productor suministrada por la empresa distribuidora y la instalación interior de consumo del usuario" (RIC N° 09, 4.12).
*   *Nota: El término específico "conductores en paralelo" como unión eléctrica de cables para aumentar capacidad no cuenta con una definición textual en los glosarios de las fuentes, aunque se regula su uso en RIC N° 04.*

---

### 3. CRITERIOS DE APLICACIÓN

*   **Evitar desbalances:** La norma exige igualdad de longitud, sección y material para asegurar que la impedancia sea idéntica en cada rama, evitando que un conductor absorba más corriente que los otros y se sobrecaliente.
*   **Distribución en Barras:** En sistemas con inversores en paralelo, la distribución física en las barras de CC debe ser homogénea para que la corriente máxima no circule por una única sección de la barra.
*   **Sincronismo:** En inversores en paralelo, se requiere una configuración "maestro-esclavo" donde un equipo determina voltaje y frecuencia mientras los otros se sincronizan vía puertos de comunicación.

---

### 4. REFERENCIAS SECUNDARIAS

*   **IEC 60287-1-3:** Invocada por el pliego **RPTD N° 11** (punto 3.3) para el cálculo del reparto de corriente entre cables unipolares en paralelo y pérdidas por corrientes circulantes.
*   **UL 486A-486B e IEC 61238-1-1/2/3:** Invocadas por **RIC N° 04** (punto 5.11.4) para validar terminales de alta compresión usados en estas uniones.
*   **RIC N° 04:** Invocado por **RGR-N 06** para definir los métodos de instalación de conductores en paralelo en sistemas de almacenamiento.

---

### 5. VACÍOS

*   **Secciones menores a 50 mm²:** No existe regulación ni autorización para instalar conductores en paralelo en secciones pequeñas (ej. 2.5 mm² o 4 mm²) para uso general, lo que implica una prohibición implícita salvo indicación de fabricante de equipos específicos.
*   **Factores de corrección por agrupamiento complejo:** Si bien RIC N° 03 muestra geometrías, no se especifica un método de cálculo de capacidad de transporte cuando se combinan múltiples ternas en paralelo más allá de los factores de corrección generales de la Tabla 4.6 de RIC N° 04.
*   **Protección individual por rama:** Las fuentes no detallan si es obligatorio o prohibido instalar protecciones individuales por cada conductor que conforma el paralelo, enfocándose solo en la unión en los extremos como "conductor único".

---

### 6. TEMAS DERIVABLES

*   **Optimización geométrica de bancos de ductos:** Análisis de las disposiciones del Anexo 3.1 de RIC 03 para minimizar el efecto piel y proximidad.
*   **Seguridad en paralelismo de servicios subterráneos:** Guía sobre las distancias y protecciones de hormigón requeridas entre electricidad, gas y agua según RIC 04.
*   **Gestión de sistemas BESS en paralelo:** Requisitos de comunicación y sincronismo para inversores bidireccionales y bancos de baterías según RGR 06.
*   **Criterios de diseño para líneas de transporte paralelas:** Estudio de las distancias de seguridad y efectos de inducción en trazados de alta tensión según RPTD 11.
