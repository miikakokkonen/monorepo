import {
	baseLocale,
	pathnameBase,
	pathnames,
	TREE_SHAKE_IS_DEFAULT_PATHNAMES,
} from "./variables.js";
import { getLocale } from "./get-locale.js";
import { extractLocaleFromPathname } from "./extract-locale-from-pathname.js";

/**
 * Localizes the given path.
 *
 * This function is useful if you use localized (i18n) routing
 * in your application.
 *
 * Defaults to `getLocale()` if no locale is provided.
 *
 * @tip
 *   Use `deLocalizePath()` for the inverse operation.
 *
 * @example
 *  // getLocale() = 'en'
 *  localizePath('/home'));
 *  // '/de/home'
 *
 *  // enforcing a specific locale
 *  localizePath('/home', { locale: 'fr' });
 *  // '/fr/home'
 *
 * @example
 *   <a href={localizePath('/home')}>Home</a>
 *
 * @param {string} pathname
 * @param {Object} [options] - Optional parameters.
 * @param {Locale} [options.locale] - The locale to use for the path.
 * @returns {string}
 */
export function localizePath(pathname, options) {
	const url = new URL(pathname, "http://y.com");
	const locale = options?.locale ?? getLocale();

	const pathnameLocale = extractLocaleFromPathname(url.pathname);

	// If the path is already localized, return it as is
	if (pathnameLocale === locale) {
		if (pathnameBase && !url.pathname.startsWith(pathnameBase)) {
			return pathnameBase + pathname + url.search;
		} else {
			return pathname + url.search;
		}
	}

	// no dynamic matching is needed if the default pathnames are used
	// this is a tree-shaking optimization to avoid loading the path-to-regexp library
	if (TREE_SHAKE_IS_DEFAULT_PATHNAMES) {
		if (locale === baseLocale) {
			let path = url.pathname;
			if (pathnameBase && !path.startsWith(pathnameBase)) {
				path = pathnameBase + path;
			}
			// remove the locale from the path
			if (pathnameLocale) {
				path = path.replace(`/${pathnameLocale}`, "");
			}
			return path + url.search;
		} else {
			if (pathnameBase) {
				return (
					`${pathnameBase}/${locale}${url.pathname.replace(pathnameBase, "")}` +
					url.search
				);
			}
			return `/${locale}${url.pathname}` + url.search;
		}
	}
	// dynamic matching is needed
	for (const [pattern, locales] of Object.entries(pathnames)) {
		let path = url.pathname;
		if (pathnameBase && path.startsWith(pathnameBase)) {
			path = path.replace(pathnameBase, "");
		}
		if (pathnameLocale) {
			path = path.replace(`/${pathnameLocale}`, "");
		}
		if (path === "") {
			path = "/";
		}
		const hasMatch = pathToRegexp.match(pattern)(path);
		if (hasMatch) {
			const localizedPattern = /** @type {string} */ (locales[locale]);
			const localizedPath =
				pathToRegexp.compile(localizedPattern)(hasMatch.params) + url.search;
			if (pathnameBase && localizedPath !== "/") {
				return pathnameBase + localizedPath;
			} else if (pathnameBase) {
				return pathnameBase;
			} else {
				return localizedPath;
			}
		}
	}
	throw new Error(
		"No match found for localized path. Refer to the documentation on how to define pathnames."
	);
}
