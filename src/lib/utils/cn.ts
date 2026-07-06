/**
 * Utility function to merge class names safely.
 * Handles conditional classes, duplicates, and falsy values.
 * Used extensively throughout the codebase for DRY styling.
 */

type ClassValue = string | undefined | null | false | Record<string, boolean>;

/**
 * Merge class names, handling arrays, objects, and duplicates.
 * @param classes - Class values to merge
 * @returns Merged class string
 */
export function cn(...classes: (ClassValue | ClassValue[])[]): string {
  const result: string[] = [];
  const seen = new Set<string>();

  const process = (value: ClassValue | ClassValue[]): void => {
    if (Array.isArray(value)) {
      value.forEach(process);
      return;
    }

    if (typeof value === 'object' && value !== null) {
      Object.entries(value).forEach(([key, isActive]) => {
        if (isActive && !seen.has(key)) {
          result.push(key);
          seen.add(key);
        }
      });
      return;
    }

    if (typeof value === 'string' && value.trim()) {
      const classes = value.split(/\s+/);
      classes.forEach((cls) => {
        if (!seen.has(cls)) {
          result.push(cls);
          seen.add(cls);
        }
      });
    }
  };

  classes.forEach(process);
  return result.join(' ');
}
