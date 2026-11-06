import { z } from 'zod';

const required = (key: string) => z.string().trim().min(1, `${key} is required`).max(500);

export const submissionEnvelopeSchema = z.object({
  type: z.enum(['job', 'student']),
  website: z.string().max(0).optional().default(''),
  data: z.record(z.string(), z.unknown()),
}).superRefine((value, context) => {
  const data = value.data;
  for (const key of ['fullName', 'email', 'mobile', 'nationality', 'residenceCountry']) {
    const result = required(key).safeParse(data[key]);
    if (!result.success) context.addIssue({ code: z.ZodIssueCode.custom, path: ['data', key], message: result.error.issues[0].message });
  }
  const email = z.string().trim().email('Enter a valid email address').safeParse(data.email);
  if (!email.success) context.addIssue({ code: z.ZodIssueCode.custom, path: ['data', 'email'], message: email.error.issues[0].message });
  if (data.terms !== true) context.addIssue({ code: z.ZodIssueCode.custom, path: ['data', 'terms'], message: 'You must agree to the terms and conditions.' });
  const conditionalText = (flag: string, detail: string) => {
    if (data[flag] === true) {
      const result = required(detail).safeParse(data[detail]);
      if (!result.success) context.addIssue({ code: z.ZodIssueCode.custom, path: ['data', detail], message: result.error.issues[0].message });
    }
  };
  if (data.hasPassport === true) {
    for (const key of ['passportNumber', 'passportCity', 'passportIssueDate', 'passportExpiryDate']) conditionalText('hasPassport', key);
  }
  if (data.hasChildren === true) {
    const children = Number(data.childrenCount);
    if (!Number.isInteger(children) || children < 1 || children > 30) context.addIssue({ code: z.ZodIssueCode.custom, path: ['data', 'childrenCount'], message: 'Enter a valid number of children.' });
  }
  conditionalText('medicalCondition', 'medicalDetails');
  conditionalText('criminalRecord', 'criminalDetails');
  conditionalText('travelHistory', 'travelCountries');
  conditionalText('familyOutside', 'familyCountry');
  conditionalText('licensedExams', 'examDetails');
  if (value.type === 'job') {
    for (const key of ['preferredCountry', 'preferredOccupation']) {
      const result = required(key).safeParse(data[key]);
      if (!result.success) context.addIssue({ code: z.ZodIssueCode.custom, path: ['data', key], message: result.error.issues[0].message });
    }
    if (!Array.isArray(data.skills) || data.skills.length === 0) context.addIssue({ code: z.ZodIssueCode.custom, path: ['data', 'skills'], message: 'Select at least one professional skill.' });
  } else {
    for (const key of ['targetProgram', 'preferredDestination', 'intendedCourse']) {
      const result = required(key).safeParse(data[key]);
      if (!result.success) context.addIssue({ code: z.ZodIssueCode.custom, path: ['data', key], message: result.error.issues[0].message });
    }
    if (!Array.isArray(data.educationHistory) || data.educationHistory.length === 0) context.addIssue({ code: z.ZodIssueCode.custom, path: ['data', 'educationHistory'], message: 'Add at least one educational qualification.' });
  }
});

export const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1).max(200) });

export function cleanText(value: unknown, max = 20000) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}
