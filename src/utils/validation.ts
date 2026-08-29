import { MAX_MESSAGE_LENGTH } from '../protocol/MessagePacket';

export function validateMessageText(text: string): { isValid: boolean; error?: string } {
  const trimmed = text.trim();
  if (!trimmed) {
    return { isValid: false, error: 'Message cannot be empty.' };
  }
  if (trimmed.length > MAX_MESSAGE_LENGTH) {
    return { isValid: false, error: `Message cannot exceed ${MAX_MESSAGE_LENGTH} characters.` };
  }
  return { isValid: true };
}

export function validateDisplayName(name: string): { isValid: boolean; error?: string } {
  const trimmed = name.trim();
  if (!trimmed) {
    return { isValid: false, error: 'Name cannot be empty.' };
  }
  if (trimmed.length > 24) {
    return { isValid: false, error: 'Name must be 24 characters or less.' };
  }
  return { isValid: true };
}
