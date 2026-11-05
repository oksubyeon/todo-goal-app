import { generateKeyBetween, generateNKeysBetween } from 'fractional-indexing';

/** prev와 next 사이에 정렬되는 order 키를 만듭니다. null은 양 끝을 뜻합니다. */
export function keyBetween(prev: string | null | undefined, next: string | null | undefined): string {
  return generateKeyBetween(prev ?? null, next ?? null);
}

/** prev 뒤에 n개의 연속된 키를 만듭니다. */
export function keysAfter(prev: string | null | undefined, n: number): string[] {
  return generateNKeysBetween(prev ?? null, null, n);
}

/** fractional-indexing이 받아들이는 키인지 확인합니다 (예: "0", "a00"은 거부). */
export function isValidOrderKey(key: string): boolean {
  if (!/^[0-9A-Za-z]{1,200}$/.test(key)) return false;
  try {
    generateKeyBetween(key, null);
    return true;
  } catch {
    return false;
  }
}
