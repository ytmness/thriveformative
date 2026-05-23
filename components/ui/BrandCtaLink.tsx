import { BRAND_CTA_BASE_CLASS } from "@/lib/brandCta";
import "@/app/styles/brand-cta.css";

type Props = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  children: React.ReactNode;
  block?: boolean;
};

export default function BrandCtaLink({
  href,
  children,
  className = "",
  block = false,
  ...rest
}: Props) {
  const widthClass = block ? "brand-cta--block" : "brand-cta--inline";
  return (
    <a
      href={href}
      className={`${BRAND_CTA_BASE_CLASS} brand-cta ${widthClass} ${className}`.trim()}
      {...rest}
    >
      <span>{children}</span>
    </a>
  );
}
