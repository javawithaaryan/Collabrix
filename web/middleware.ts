import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)']);

// 1. Add "async" right here before the parameters
export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    // 2. Add "await" right here
    await auth.protect();
  }
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};