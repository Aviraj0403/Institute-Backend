import { toWords } from 'number-to-words';

export const convertNumberToWords = async (num) => {
  return toWords(num).replace(/\b\w/g, c => c.toUpperCase()); // Capitalize each word
};
