export function separateUUIDUser(user_id: string): string {
  const userSeparateId: string[] = user_id.split('-');
  const lastSegment: string = userSeparateId[4];
  const lastFourChars: string = lastSegment.slice(-4);
  return `user_${lastFourChars}`;
}
