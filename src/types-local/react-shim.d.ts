// Minimal React typings used ONLY for type-checking in the offline build
// environment (no @types/react available). Not used by `npm run build`.
declare module 'react' {
  export type ReactNode = unknown;
  export interface CSSProperties { [k: string]: string | number | undefined }
  export function useState<T>(init: T | (() => T)): [T, (v: T | ((p: T) => T)) => void];
  export function useEffect(fn: () => void | (() => void), deps?: unknown[]): void;
  export function useRef<T>(init: T | null): { current: T | null };
  export function useMemo<T>(fn: () => T, deps: unknown[]): T;
  export function useCallback<T extends (...a: never[]) => unknown>(fn: T, deps: unknown[]): T;
  export const StrictMode: (p: { children?: ReactNode }) => ReactNode;
}
declare module 'react-dom/client' {
  export function createRoot(el: Element): { render(n: unknown): void };
}
declare module 'react/jsx-runtime' {
  export const jsx: unknown;
  export const jsxs: unknown;
  export const Fragment: unknown;
}
declare namespace JSX {
  interface IntrinsicElements { [el: string]: any }
  type Element = unknown;
  interface ElementChildrenAttribute { children: {} }
}
declare module '*.css';
