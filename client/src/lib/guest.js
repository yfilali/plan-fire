// Shared key: remembers a guest who chose "Continue as guest" so the login
// screen doesn't reappear on reload. In its own module (not App.jsx) so the
// login screen can import it without pulling the whole planner shell into the
// public bundle — keeping /app code-split out of the prerendered marketing HTML.
export const GUEST_CONTINUE_KEY = "firly_guest_continue";
