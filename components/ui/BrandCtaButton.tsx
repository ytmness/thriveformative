import { BRAND_CTA_BASE_CLASS } from "@/lib/brandCta";
import "@/app/styles/brand-cta.css";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
  block?: boolean;
};

export default function BrandCtaButton({
  children,
  className = "",
  block = true,
  type = "button",
  ...rest
}: Props) {
  const widthClass = block ? "brand-cta--block" : "brand-cta--inline";
  return (
    <button
      type={type}
      className={`${BRAND_CTA_BASE_CLASS} brand-cta ${widthClass} ${className}`.trim()}
      {...rest}
    >
      <span>{children}</span>
    </button>
  );
}
