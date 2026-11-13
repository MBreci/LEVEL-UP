import type { Metadata } from "next";
import { GuestHeader } from "@/components/layout/GuestHeader";

export const metadata: Metadata = {
  title: "Política de Tratamiento de Datos · LEVEL UP",
};

export default function PrivacidadPage() {
  return (
    <>
      <GuestHeader />
      <div className="page-banner">
        <div className="page-banner-eyebrow">LEGAL · PROTECCIÓN DE DATOS</div>
        <div className="page-banner-title">POLÍTICA DE TRATAMIENTO DE DATOS PERSONALES Y DE IMAGEN</div>
        <div className="page-banner-desc">Última actualización: 25 de junio de 2026</div>
      </div>

      <section id="privacidad" style={{ maxWidth: 880, margin: "0 auto 80px", padding: "0 24px" }}>
        <div className="tp-card" style={{ marginBottom: 20 }}>
          <p className="tp-text">
            LEVEL UP (&quot;la Plataforma&quot;, &quot;nosotros&quot;) es una plataforma deportiva digital con sede en
            Bogotá, Colombia, dedicada a la gestión de la carrera deportiva de jugadores de fútbol amateur. Esta
            Política de Tratamiento de Datos Personales y de Imagen (&quot;la Política&quot;) describe cómo
            recolectamos, usamos, almacenamos y protegemos los datos personales y el material audiovisual de los
            usuarios registrados (&quot;Jugadores&quot;), en cumplimiento de la Ley 1581 de 2012, el Decreto 1377 de
            2013 y las demás normas colombianas aplicables en materia de protección de datos personales (régimen de
            habeas data).
          </p>
          <p className="tp-text">
            Al crear una cuenta en LEVEL UP, el Jugador (o su representante legal, en el caso de menores de edad)
            acepta expresamente los términos de esta Política. La aceptación es un requisito obligatorio para el
            registro y uso de la Plataforma.
          </p>
        </div>

        <div className="tp-card" style={{ marginBottom: 20 }}>
          <div className="tp-title">1. RESPONSABLE DEL TRATAMIENTO</div>
          <p className="tp-text">
            LEVEL UP, con domicilio en Bogotá, Colombia, es responsable del tratamiento de los datos personales
            recolectados a través de la Plataforma. Para ejercer sus derechos o realizar consultas, el Jugador puede
            escribir a través de los canales de contacto habilitados en la Plataforma.
          </p>
        </div>

        <div className="tp-card" style={{ marginBottom: 20 }}>
          <div className="tp-title">2. DATOS QUE RECOLECTAMOS</div>
          <p className="tp-text">Para prestar el servicio, LEVEL UP recolecta y trata las siguientes categorías de datos:</p>
          <p className="tp-text">
            <b>a) Datos de identificación y perfil:</b> nombre, apodo, posición de juego, equipo, contraseña
            (almacenada de forma cifrada, nunca en texto plano).
          </p>
          <p className="tp-text">
            <b>b) Datos de desempeño deportivo:</b> estadísticas de partidos, resultados, calificaciones (OVR),
            historial de progreso, rango, ranking y demás métricas generadas a partir de tu actividad en la Plataforma
            y en cancha.
          </p>
          <p className="tp-text">
            <b>c) Imagen y video:</b> fotografías y videos capturados durante tus partidos y entrenamientos en las
            canchas afiliadas a LEVEL UP, incluyendo tu foto de jugador (carta), clips de jugadas, y grabaciones
            usadas para análisis de desempeño.
          </p>
          <p className="tp-text">
            <b>d) Datos técnicos:</b> información del dispositivo y navegador utilizados para acceder a la
            Plataforma, con fines de seguridad y soporte.
          </p>
        </div>

        <div className="tp-card" style={{ marginBottom: 20 }}>
          <div className="tp-title">3. FINALIDADES DEL TRATAMIENTO</div>
          <p className="tp-text">
            Los datos personales y el material de imagen y video recolectados serán usados para las siguientes
            finalidades:
          </p>
          <p className="tp-text">
            • Crear, administrar y autenticar tu perfil y carta de jugador en la Plataforma, incluyendo el acceso
            desde múltiples dispositivos con tus credenciales.
          </p>
          <p className="tp-text">
            • Grabar, monitorear y analizar tu desempeño en cancha (físico, técnico y táctico) con el fin de calcular
            tu OVR, tu rango y tu evolución dentro del sistema de niveles de LEVEL UP.
          </p>
          <p className="tp-text">
            • Calificar tu desempeño y el de otros Jugadores con base en estadísticas y observación en video, para
            fines de ranking y desarrollo deportivo.
          </p>
          <p className="tp-text">
            • Usar tu imagen (fotografías y videos) para generar tu carta de jugador, mostrar resúmenes y momentos
            destacados de partidos, y producir contenido relacionado con tu crecimiento deportivo dentro de la
            Plataforma.
          </p>
          <p className="tp-text">
            • Realizar mediciones de progreso y crecimiento individual a lo largo del tiempo, comparando tu
            desempeño en distintos partidos y temporadas.
          </p>
          <p className="tp-text">
            • Enviarte notificaciones relacionadas con tu actividad en la Plataforma (resultados, invitaciones a
            partidos, cambios de rango, etc.).
          </p>
          <p className="tp-text">• Mejorar la Plataforma, corregir errores y desarrollar nuevas funcionalidades.</p>
          <p className="tp-text">
            • Con tu autorización, usar fotografías y videos de partidos con fines promocionales o de divulgación de
            LEVEL UP (por ejemplo, en redes sociales o materiales de mercadeo), siempre dentro del contexto deportivo
            de la Plataforma.
          </p>
        </div>

        <div className="tp-card" style={{ marginBottom: 20 }}>
          <div className="tp-title">4. AUTORIZACIÓN DE USO DE IMAGEN Y VIDEO</div>
          <p className="tp-text">
            Al aceptar esta Política, el Jugador autoriza expresa, voluntaria e inequívocamente a LEVEL UP a captar,
            grabar, almacenar, editar y usar su imagen (fotografías y videos tomados durante partidos, entrenamientos
            y demás actividades organizadas por LEVEL UP) para los fines descritos en la Sección 3, sin que ello
            genere ninguna contraprestación económica a favor del Jugador, salvo acuerdo expreso en contrario. Esta
            autorización es indispensable para el funcionamiento del sistema de cartas, calificación y medición de
            desempeño de la Plataforma, ya que es a partir de la observación en cancha y en video que LEVEL UP
            calcula el OVR y el progreso de cada Jugador.
          </p>
        </div>

        <div className="tp-card" style={{ marginBottom: 20 }}>
          <div className="tp-title">5. TRATAMIENTO DE DATOS DE MENORES DE EDAD</div>
          <p className="tp-text">
            Cuando un Jugador registrado sea menor de edad, el tratamiento de sus datos personales y de su imagen
            requiere la autorización expresa de su padre, madre o representante legal, quien deberá aceptar esta
            Política en su nombre al momento del registro. LEVEL UP podrá solicitar verificación adicional cuando lo
            considere necesario para proteger el interés superior del menor.
          </p>
        </div>

        <div className="tp-card" style={{ marginBottom: 20 }}>
          <div className="tp-title">6. ALMACENAMIENTO Y SEGURIDAD</div>
          <p className="tp-text">
            Los datos personales se almacenan en infraestructura en la nube con controles de acceso y cifrado de
            contraseñas. LEVEL UP implementa medidas técnicas y organizativas razonables para proteger los datos
            personales contra acceso no autorizado, pérdida o alteración. No obstante, ningún sistema es completamente
            infalible, y el Jugador entiende que el uso de la Plataforma implica los riesgos inherentes a los
            servicios digitales.
          </p>
        </div>

        <div className="tp-card" style={{ marginBottom: 20 }}>
          <div className="tp-title">7. TRANSFERENCIA Y COMPARTICIÓN DE DATOS</div>
          <p className="tp-text">
            LEVEL UP no vende los datos personales de sus Jugadores a terceros. Los datos pueden ser compartidos con
            proveedores tecnológicos que prestan servicios de almacenamiento e infraestructura en la nube, únicamente
            en la medida necesaria para operar la Plataforma, y bajo obligaciones de confidencialidad. Tu nombre,
            apodo, posición, equipo, OVR y rango son visibles para otros Jugadores registrados dentro de los rankings
            y módulos sociales de la Plataforma, como parte natural del funcionamiento del servicio.
          </p>
        </div>

        <div className="tp-card" style={{ marginBottom: 20 }}>
          <div className="tp-title">8. TIEMPO DE CONSERVACIÓN</div>
          <p className="tp-text">
            Los datos personales, estadísticas, imágenes y videos se conservarán mientras el Jugador mantenga su
            cuenta activa en la Plataforma, y durante el tiempo adicional necesario para cumplir obligaciones legales
            o resolver controversias. El Jugador puede solicitar la eliminación de su cuenta y de sus datos en
            cualquier momento, sin perjuicio de la información que deba conservarse por obligación legal.
          </p>
        </div>

        <div className="tp-card" style={{ marginBottom: 20 }}>
          <div className="tp-title">9. DERECHOS DEL JUGADOR (HABEAS DATA)</div>
          <p className="tp-text">Como titular de tus datos personales, tienes derecho a:</p>
          <p className="tp-text">• Conocer, actualizar y rectificar tus datos personales.</p>
          <p className="tp-text">• Solicitar prueba de la autorización otorgada para el tratamiento de tus datos e imagen.</p>
          <p className="tp-text">• Ser informado sobre el uso que se ha dado a tus datos personales.</p>
          <p className="tp-text">
            • Revocar la autorización y/o solicitar la eliminación de tus datos, cuando no exista un deber legal o
            contractual que impida su eliminación, incluyendo la eliminación de tu cuenta y carta de jugador.
          </p>
          <p className="tp-text">
            • Presentar quejas ante la Superintendencia de Industria y Comercio por infracciones a la normatividad de
            protección de datos personales.
          </p>
          <p className="tp-text">
            Puedes ejercer estos derechos desde la sección de Configuración de tu cuenta o escribiendo a través de
            los canales de contacto de LEVEL UP.
          </p>
        </div>

        <div className="tp-card" style={{ marginBottom: 20 }}>
          <div className="tp-title">10. CAMBIOS A ESTA POLÍTICA</div>
          <p className="tp-text">
            LEVEL UP podrá actualizar esta Política para reflejar cambios en sus prácticas o en la normatividad
            aplicable. Los cambios sustanciales serán comunicados a los Jugadores dentro de la Plataforma. El uso
            continuado de LEVEL UP después de una actualización implica la aceptación de la Política vigente.
          </p>
        </div>

        <div className="tp-card">
          <div className="tp-title">11. ACEPTACIÓN</div>
          <p className="tp-text">
            Al marcar la casilla de aceptación durante la creación de tu cuenta, confirmas que has leído, entendido y
            aceptado esta Política de Tratamiento de Datos Personales y de Imagen, y que otorgas las autorizaciones
            aquí descritas de forma libre, expresa, voluntaria e informada.
          </p>
        </div>
      </section>
    </>
  );
}
