/** Public avatar catalog. Image URLs reuse the options already used in Settings. */
export const AVATAR_CATALOG = [
  { id: "aster", name: "Aster", url: "https://tapback.co/api/avatar/bankos-aster.webp", price: 0 },
  { id: "nova", name: "Nova", url: "https://tapback.co/api/avatar/bankos-nova.webp", price: 500 },
  { id: "sage", name: "Sage", url: "https://tapback.co/api/avatar/bankos-sage.webp", price: 2_000 },
  { id: "mira", name: "Mira", url: "https://tapback.co/api/avatar/bankos-mira.webp", price: 5_000 },
  { id: "arjun", name: "Arjun", url: "https://tapback.co/api/avatar/bankos-arjun.webp", price: 10_000 },
  { id: "zara", name: "Zara", url: "https://tapback.co/api/avatar/bankos-zara.webp", price: 20_000 },
] as const;

export type AvatarId = (typeof AVATAR_CATALOG)[number]["id"];

export function getAvatar(avatarId: string) {
  return AVATAR_CATALOG.find((avatar) => avatar.id === avatarId);
}

export function getAvatarByUrl(url: string | null | undefined) {
  return AVATAR_CATALOG.find((avatar) => avatar.url === url);
}
