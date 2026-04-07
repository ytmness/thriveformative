import type { ThreeElements } from "@react-three/fiber";

/**
 * React 19 tipa JSX bajo `react`/`react/jsx-runtime`; R3F solo extendía el `JSX` global (React 18).
 * Sin esto, `<group>` y `<primitive>` fallan en el typecheck.
 */
declare module "react" {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}

declare module "react/jsx-runtime" {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}
