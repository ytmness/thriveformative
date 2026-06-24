"use client";

import { useGLTF } from "@react-three/drei";

/** Precarga temprana de modelos 3D del logo (antes del dynamic import del canvas). */
useGLTF.preload("/logos/logo3ddorado.glb", true, true);
useGLTF.preload("/logos/logometal.glb", true, true);
