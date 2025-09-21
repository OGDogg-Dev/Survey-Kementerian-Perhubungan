import login from '@/routes/login';
import register from '@/routes/register';
import password from '@/routes/password';
import confirmPassword from '@/routes/password/confirm';
import verification from '@/routes/verification';
import profile from '@/routes/profile';
import { logout } from '@/routes';

/**
 * Lightweight wrappers around route definitions so forms can call controller-style helpers
 * without depending on generated files from the Wayfinder plugin.
 */
export const AuthenticatedSessionController = {
    store: login.store,
    destroy: logout,
} as const;

export const RegisteredUserController = {
    store: register.store,
} as const;

export const PasswordResetLinkController = {
    store: password.email,
} as const;

export const NewPasswordController = {
    store: password.store,
} as const;

export const ConfirmablePasswordController = {
    store: confirmPassword.store,
} as const;

export const EmailVerificationNotificationController = {
    store: verification.send,
} as const;

export const ProfileController = {
    update: profile.update,
    destroy: profile.destroy,
} as const;

export const PasswordController = {
    update: password.update,
} as const;
