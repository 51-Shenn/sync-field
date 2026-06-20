import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({
	baseURL: process.env.BETTER_AUTH_URL
})

export const signInSocial = async () => {
	await authClient.signIn.social({
		provider: "google",
		callbackURL: "/dashboard",
		errorCallbackURL: "/error",
		newUserCallbackURL: "/welcome",
		disableRedirect: false,
	});
}