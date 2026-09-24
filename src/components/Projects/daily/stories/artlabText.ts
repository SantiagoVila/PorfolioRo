/**
 * ARTLAB, the article as published (periodismo/editorial/ARTLAB.pdf), in
 * reading order. **Bold** marks the emphasis printed in the PDF. Only four
 * unambiguous typos were corrected: "públicol", "instagra,", "Bibiiografía"
 * and a doubled comma.
 */

export type Photo = { src: string; width: number; height: number; alt: string; caption?: string; folio?: string };

const photo = (name: string, width: number, height: number, alt: string, extra: Partial<Photo> = {}): Photo => ({
  src: `/daily/artlab/${name}.jpg`, width, height, alt, ...extra,
});

export const PHOTOS = {
  night: photo("night", 1494, 944, "De noche, el público reunido en la puerta de ArtLab", { folio: "(03)" }),
  performer: photo("performer", 890, 1341, "La artista de la noche en silueta frente a una pantalla iluminada, con su equipo"),
  overhead: photo("overhead", 403, 615, "Vista cenital: bandejas de vinilo, mesas y sillas en la sala oscura"),
  phones: photo("phones", 614, 393, "Un grupo del público mira sus teléfonos en la sala"),
  bar: photo("bar", 1250, 782, "La barra iluminada, estantes de botellas", { folio: "(01)" }),
  dinner: photo("dinner", 431, 285, "La propuesta gastronómica: platos sobre la mesa", { folio: "(02)" }),
  bawax: photo("bawax", 1189, 1716, "Dos integrantes de Ba-Wax bajo el cartel del stand", { caption: "@BaWax" }),
  albisu: photo("albisu", 938, 583, "Julio Albisu frente a una proyección en blanco y negro", { caption: "@Julio Albisu" }),
  chairs: photo("chairs", 616, 407, "Dos sillones verdes frente a la pantalla, sala vacía"),
  bomber: photo("bomber", 816, 1102, "Retrato nocturno: gorro, campera de cuero, jeans"),
  tracksuit: photo("tracksuit", 886, 1419, "Retrato nocturno en la barra: anteojos rojos, pantalón deportivo"),
  scarf: photo("scarf", 975, 1463, "Retrato nocturno: bufanda larga y abrigo"),
  black: photo("black", 900, 1505, "Retrato nocturno: todo de negro, mirando el teléfono"),
};

export const ABSTRACT = [
  "El espacio urbano contemporáneo ha dejado de ser un mero escenario pasivo para convertirse en una plataforma de constante **puesta en escena**. El presente artículo de investigación aborda el ecosistema de ArtLab, como reflejo respaldatorio de la investigación abordada sobre el barrio de Chacarita. Como un caso de estudio paradigmático para analizar las nuevas formas de sociabilidad y el habitar. A partir de un trabajo de campo que contrastó las dinámicas nocturnas de performance y los comportamientos diurnos en el espacio, se examina cómo funciona este **refugio colectivo**.",
  "A través de esta indagación, se propone la hipótesis del “**rehabitar performático**”, entendida como un fenómeno de doble faz: por un lado, una tensión sociológica donde la identidad visual, el “uniforme **cool**” de prendas oscuras, y la pose esnob delimitan los códigos de exclusión de un nicho; por el otro, la configuración genuina de una **tribu urbana** que encuentra en la confluencia del diseño, la música y la tecnología digital un espacio vital de **pertenencia**, validación y afecto comunitario. En última instancia, el trabajo desentraña cómo en este territorio las fronteras de la producción cultural se diluyen de forma descarada, transformando al propio público en parte indisoluble del paisaje.",
];

export const PLACE = [
  "ArtLab es un espacio autodefinido como **centro cultural**, un laboratorio creativo de **arte** y **tecnología**. Ubicado en el barrio de Chacarita, busca unir la música, el arte, la gastronomía y la **creatividad digital** en un mismo universo. Se instalaron luego del 2020 por su fundador **Gonzalo Solimano**, artista y productor, como (y a mis palabras) una especie de bunker cultural que responde a aquel tiempo post pandemia, una **caja negra** con usuarios de negro, en donde cada fanático del arte contemporáneo tiene su lugar.",
  "Su cronograma es siempre **cambiante** y amplio; se expone un artista al mes en su galería, ya sean exposiciones físicas o a través de las pantallas. Cuenta con una sala llamada “**bar escucha**” donde generan eventos para reproducir vinilos mediante parlantes HiFi, también donde tocan diversos DJ de **house** o tech. Un pequeño espacio de venta de vinilos con los chicos de **Ba-Wax** con un stand para escuchar los que gustes. Y una propuesta gastronómica inspirada en la **comida oriental** con un pequeño menú cafetería y una carta de tragos de igual estética (en donde recomiendo el Midori Sour con Whiskey y matcha).",
  "Es un lugar que refleja los nuevos tiempos chacaritenses, un pequeño sitio donde encontrás de todo y a todos. Cool, artístico y **rutinario**, responde a la premisa del “re-habitar performático”. En palabras del fundador Gonzalo, se terminó gestando una “**cajita cultural**” que es un punto de encuentro para escritores, fanáticos del cine, la música y el arte. Entendió que el ser humano es parte del mundo digital y que en vez de vivir la pantalla en el encierro, puede ser una actividad social. El concepto queda clarísimo: esa tensión entre el espacio físico como refugio frente al encierro de las pantallas, y la tensión sociológica entre quienes van a “performear” (la pose, el look, el esnobismo) y quienes van a vivir la performance de manera genuina como una “tribu urbana” o comunidad.",
];

export const NIGHT = [
  "El análisis de campo iniciado la noche del 4 de junio, durante la performance en vivo de Carola Zelaschi (baterista de Blanco Teta) y el set de la artista visual del mes y DJ de la noche, HTML (Marina Saporiti), permitió observar cómo opera este universo cerrado. En ArtLab, las fronteras tradicionales de la producción cultural se diluyen descaradamente: los rostros se **reconocen**, y las jerarquías entre los trabajadores del espacio y los consumidores se desvanecen en una **horizontalidad simulada**. Al indagar entre los asistentes sobre su motivación para asistir, la respuesta unánime era “A ver a Maru” “A apoyar a Maru”, devela que el motor del espacio no es el consumo abstracto de arte, sino el apoyo a la **red vincular del nicho**.",
  "La propia artista, (vestida por sus amigos, Emiliano Blanco y Camila Milessi) sintetizaba tras bambalinas al exclamar que “ArtLab es lo más grande que hay”, un orgullo **patriota** barrial que ya responde a la lógica del que habita Chacarita. Cada persona del público con la que pude interactuar sabe a qué viene, conocedores de la obra, de Maru o pertenecientes al nicho artístico contemporáneo, se abrazaban como familiares. Me contaron que no era la primera vez de ninguno allí, que la querían ir a pasar bien y apoyar a los artistas.",
  "Desde una perspectiva sociológica, el público que acude a estas instancias nocturnas no solo es conocedor de la obra contemporánea, sino que se encuentra cohesionado por un estricto **código visual**. Los cuerpos observados se entrelazan mediante una estética compartida: prendas oscuras, calzado Adidas, y siluetas sueltas, holgadas y de carácter experimental. Aunque ninguno lo reconozca, hay una lógica del “**uniforme cool**” que deambula en ellos. Estos consumos funcionan como un sistema de símbolos y códigos urbanos; el “puchito armado” y el trago en la mano no son meras conductas azarosas, sino parte de una coreografía social que delimita quién pertenece al nicho y quién queda por fuera.",
];

export const ROOM = [
  "El lugar es completamente negro con pantallas que proyectan las obras, una mesa larga y dos mesitas pequeñas, dejando un amplio vacío para la interacción. Luego la sala Hifi que es modificada constantemente como la performance lo desee. Según Gonzalo se pensó así para que resalte lo que tenga que resaltar, como los instrumentos y demás, las luces son tenues cálidas y otras rojas, si bien es negro no se lo siente oscuro o frio, más bien agradable y amistoso.",
  "El 10 de junio volví para ver el accionar diurno del espacio, fue de mi sorpresa ver a obviamente muchísima menos gente pero sí rostros reconocibles de mi visita anterior, rehabitando ese suelo, se auto catalogaron como una especie de tribu urbana. **Artlab** cuenta con un gran equipo de trabajo con el cual tuve el placer de charlar, el ya citado Gonzalo Solimano, Julio Albisu de relaciones públicas, Maru la artista del mes, Damian Torres como patovica, Mariano Prieto y una guarda abrigos que por lo polémico de la opinión prefirió mantener el anonimato.",
];

export const VOICES = [
  "Para desentrañar si este fenómeno responde a un interés genuino o a una mera impostura social, se relevaron los testimonios del equipo de trabajo. Estas voces exponen las tensiones inherentes al arte contemporáneo y a las formas de sociabilidad que genera.",
  "Por un lado, Julio Albisu, encargado de relaciones públicas del lugar, ensaya una fuerte defensa corporativa e identitaria. Albisu se opone rotundamente a la etiqueta “snob” o meramente performática que las miradas externas suelen adjudicar al público. Para él, ArtLab debe ser interpretado como un lugar de **expresión y comunicación**, gente de nicho donde la identidad visual es una herramienta clave de expresión, la homogeneidad en los looks y las poses no constituye una falta de originalidad, sino una **casualidad colectiva** de sujetos creativos que comparten un **mismo lenguaje** estético y visual. En sintonía con esta postura, Damian Torres, miembro del equipo de seguridad con más de dos años de trayectoria en el acceso al local, manifiesta un profundo orgullo por el público que custodia. Torres observa un espectro demográfico amplio (personas de todas las edades) y afirma de manera tajante que el público asiste con un interés real por la performance artística en sí, y no por el acto social de “performear” o simular estatus.",
  "Por otro lado, la investigación de campo logró acceder a las voces disidentes que habitan el reverso del espacio. Una trabajadora del sector de guardarropas, quien solicitó mantener el anonimato debido a la sensibilidad de sus declaraciones, ofreció una lectura crítica y desencantada tras tres meses de desempeño en el puesto. Desde los camarines, describió a la gente que atendía bajo las categorías de “narices respingadas” y “personajes”, denunciando una atmósfera de **artificialidad y pose**.",
];

export const CLOSING = [
  "Esta **polarización** en los discursos del staff y los usuarios es sumamente coherente con la lógica del **arte contemporáneo** actual, históricamente tensionado entre quienes juzgan sus dinámicas de banales o superficiales y quienes se acogen en sus lógicas temporales para hallar un sentido de pertenencia. El fenómeno de ArtLab demuestra que el “rehabitar performático” es una moneda de dos caras. Mientras que para una mirada ajena al nicho las dinámicas de vestimenta, los tragos nipones y la gestualidad pueden ser interpretados como una puesta en escena vacía realizada por “los personajes”, para la comunidad que lo integra representa un espacio vital de **validación cultural**.",
  "En esta instancia, resulta imprescindible incorporar la mirada propia como investigadora inserta en el territorio. En una primera aproximación, es factible abordar el espacio meramente como un **spot fotográfico** o un fondo estético para instagram. Sin embargo, la experiencia directa demuestra que allí no abundan más flashes que en otros espacios de entretenimiento nocturno; las redes de los usuarios se configuran de manera discreta y la atmósfera general no transmite una actuación impostada para las pantallas de los teléfonos móviles. Por el contrario, se percibe una encarnación genuina de aquello que los sujetos buscan representar: un **refugio** para manifestar el amor por el diseño, la identidad visual y la buena música. ArtLab se consolida, en última instancia, como un territorio donde la pantalla individual se disuelve para volverse una experiencia colectiva y artística, y donde el público no solo asiste a contemplar una obra, sino que se ofrece un comportamiento en vivo de la performance, la posé está allí, en lo físico, en las charlas y corporalidades, en lo local.",
];

export const BIBLIOGRAPHY = { title: "Bibliografía", source: "ArtLab: https://artlabpro.net/", credit: "Investigación y fotografía: Rosario Medina" };
