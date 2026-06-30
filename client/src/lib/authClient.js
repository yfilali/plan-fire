import { createAuthClient } from "better-auth/react";

// Same-origin: the client talks to /api/auth/* on whatever host served the app
// (Vercel in prod, the Vite proxy → :3000 in local dev). No baseURL needed.
export const authClient = createAuthClient();

export const {
	signIn,
	signUp,
	signOut,
	forgetPassword,
	resetPassword,
	useSession,
} = authClient;
