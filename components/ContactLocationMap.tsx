import { CLINIC_MAP_EMBED_URL } from "@/lib/branding";
import "@/app/styles/contact-location-map.css";

type Props = {
  title?: string;
};

export default function ContactLocationMap({ title = "Ubicación del consultorio" }: Props) {
  return (
    <div className="contact-location-map">
      <iframe
        title={title}
        src={CLINIC_MAP_EMBED_URL}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />
    </div>
  );
}
