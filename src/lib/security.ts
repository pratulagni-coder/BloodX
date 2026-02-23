const PASSWORD_MIN_LENGTH = 10;

const PASSWORD_REQUIREMENTS = [
  /[a-z]/, // lowercase
  /[A-Z]/, // uppercase
  /\d/, // number
  /[^A-Za-z0-9]/, // special char
];

const ALLOWED_REPORT_EXTENSIONS = new Set(["pdf", "jpg", "jpeg", "png"]);
const ALLOWED_REPORT_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
]);

export const PASSWORD_POLICY_MESSAGE =
  "Password must be at least 10 characters and include uppercase, lowercase, number, and special character.";

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

export const isStrongPassword = (password: string): boolean => {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return false;
  }

  return PASSWORD_REQUIREMENTS.every((rule) => rule.test(password));
};

export const isAllowedMedicalReport = (file: File): boolean => {
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (!extension || !ALLOWED_REPORT_EXTENSIONS.has(extension)) {
    return false;
  }

  if (!ALLOWED_REPORT_MIME_TYPES.has(file.type)) {
    return false;
  }

  return true;
};

export const getSafeFileExtension = (file: File): string => {
  const extension = file.name.split(".").pop()?.toLowerCase();
  return extension && ALLOWED_REPORT_EXTENSIONS.has(extension) ? extension : "bin";
};
