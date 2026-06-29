/**
 * The languages OAuthLint's rule pack covers, exposed as the `language`
 * argument of `scan_code`. The tokens match the `languages:` values in the
 * Semgrep rules, so an agent names the language it generated and we write the
 * snippet to a file with the right extension for Semgrep to parse.
 */
export const SUPPORTED_LANGUAGES = [
  'javascript',
  'typescript',
  'python',
  'go',
  'java',
  'rust',
] as const;

export type Language = (typeof SUPPORTED_LANGUAGES)[number];

/** File extension Semgrep needs to select the right parser for each language. */
const EXTENSION: Record<Language, string> = {
  javascript: 'js',
  typescript: 'ts',
  python: 'py',
  go: 'go',
  java: 'java',
  rust: 'rs',
};

export function extensionFor(language: Language): string {
  return EXTENSION[language];
}
