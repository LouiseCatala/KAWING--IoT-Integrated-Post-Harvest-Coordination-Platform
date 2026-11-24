export const normalizeMobileNumber = (value: string): string => {
  const compact = value.replace(/[\s-]/g, '');
  return compact.startsWith('+63') ? `0${compact.slice(3)}` : compact;
};

export const isValidMobileNumber = (value: string): boolean => {
  const number = normalizeMobileNumber(value);
  return /^09\d{9}$/.test(number) && number !== '09123456789' && !/^09(\d)\1{8}$/.test(number);
};
