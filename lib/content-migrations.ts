import { seedContent } from './seed';
import type { SiteContent } from './types';

export const CURRENT_CONTENT_VERSION = 3;

const legacyStudyCopy = {
  seoDescription: "Clear, considered immigration guidance for global careers, Master's and PhD study across the USA, Canada, UK, Luxembourg and Australia.",
  eyebrow: "MASTER'S & PHD OPPORTUNITIES",
  description: 'From shortlisting research-led universities to preparing a compelling application, we help ambitious graduates turn academic potential into global opportunity.',
  imageAlt: 'A doctoral graduate outside a modern international university',
  imageCaption: 'Research. Community. A global perspective.',
  partnershipText: 'University options across the USA, Canada, UK, Luxembourg and Australia, matched to your academic profile, research interests and budget.',
  footerDescription: 'Clear, personal guidance for international careers, postgraduate study and life beyond borders.',
  studentDescription: "For Master's and PhD candidates ready to pursue postgraduate study abroad.",
  faqAnswer: "Yes. Our assessment has dedicated pathways for skilled job applicants and for Master's or PhD candidates. Your consultation and checklist are tailored to the route you select.",
};
const legacyPhonePlaceholder = '(555) 012-3456';

function replaceLegacy(value: string, legacy: string, replacement: string) {
  return value === legacy ? replacement : value;
}

/** Applies additive content upgrades without overwriting custom CMS copy. */
export function runContentMigrations(content: SiteContent, sourceVersion: number): SiteContent {
  if (sourceVersion >= CURRENT_CONTENT_VERSION) return content;
  const next = structuredClone(content);

  if (sourceVersion < 2) {
    next.seo.description = replaceLegacy(next.seo.description, legacyStudyCopy.seoDescription, seedContent.seo.description);
    next.studySection.eyebrow = replaceLegacy(next.studySection.eyebrow, legacyStudyCopy.eyebrow, seedContent.studySection.eyebrow);
    next.studySection.description = replaceLegacy(next.studySection.description, legacyStudyCopy.description, seedContent.studySection.description);
    next.studySection.imageAlt = replaceLegacy(next.studySection.imageAlt, legacyStudyCopy.imageAlt, seedContent.studySection.imageAlt);
    next.studySection.imageCaption = replaceLegacy(next.studySection.imageCaption, legacyStudyCopy.imageCaption, seedContent.studySection.imageCaption);
    next.studySection.partnershipText = replaceLegacy(next.studySection.partnershipText, legacyStudyCopy.partnershipText, seedContent.studySection.partnershipText);
    next.footer.description = replaceLegacy(next.footer.description, legacyStudyCopy.footerDescription, seedContent.footer.description);
    next.consultation.studentDescription = replaceLegacy(next.consultation.studentDescription, legacyStudyCopy.studentDescription, seedContent.consultation.studentDescription);
    next.faqSection.items = next.faqSection.items.map((item) => ({
      ...item,
      answer: replaceLegacy(item.answer, legacyStudyCopy.faqAnswer, seedContent.faqSection.items.find((seedItem) => seedItem.question === item.question)?.answer || item.answer),
    }));

    const bachelorOption = "Bachelor's (BSc)";
    if (!next.forms.options.targetPrograms.includes(bachelorOption)) {
      next.forms.options.targetPrograms.unshift(bachelorOption);
    }
    next.contentVersion = 2;
  }

  if (sourceVersion < 3) {
    next.forms.labels.mobilePlaceholder = replaceLegacy(next.forms.labels.mobilePlaceholder, legacyPhonePlaceholder, seedContent.forms.labels.mobilePlaceholder);
    next.forms.labels.alternativeMobilePlaceholder = replaceLegacy(next.forms.labels.alternativeMobilePlaceholder, legacyPhonePlaceholder, seedContent.forms.labels.alternativeMobilePlaceholder);
    next.contentVersion = 3;
  }

  return next;
}
