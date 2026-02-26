import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  matcher: [
    // Excluir auth (callback de Supabase), api, estáticos
    "/((?!api|auth|_next|_vercel|.*\\..*).*)",
  ],
};
