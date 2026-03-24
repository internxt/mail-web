export const isValidEmail = (email: string) => {
  const input = document.createElement('input');
  input.type = 'email';
  input.value = email;
  return input.checkValidity();
};
