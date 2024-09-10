export const publicEnv = {
	PUBLIC_GIT_PROXY_BASE_URL: import.meta.env.PUBLIC_GIT_PROXY_BASE_URL,
	PUBLIC_LIX_GITHUB_APP_NAME: import.meta.env.PUBLIC_LIX_GITHUB_APP_NAME,
	PUBLIC_LIX_GITHUB_APP_CLIENT_ID: import.meta.env.PUBLIC_LIX_GITHUB_APP_CLIENT_ID,
	PUBLIC_POSTHOG_TOKEN: import.meta.env.PUBLIC_POSTHOG_TOKEN,
	PUBLIC_FINK_SENTRY_DSN: import.meta.env.PUBLIC_FINK_SENTRY_DSN,
	PUBLIC_SERVER_BASE_URL: import.meta.env.PUBLIC_SERVER_BASE_URL,
	PUBLIC_ALLOWED_AUTH_URLS: import.meta.env.PUBLIC_ALLOWED_AUTH_URLS,
}

export const privateEnv = {
	SERVER_SENTRY_DSN: import.meta.env.SERVER_SENTRY_DSN,
	SESSION_COOKIE_SECRET: import.meta.env.SESSION_COOKIE_SECRET,
}
