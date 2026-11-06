export type StorageMode = 'turso' | 'preview';
export type SubmissionType = 'job' | 'student';
export type SubmissionStatus = 'new' | 'reviewed' | 'contacted' | 'archived';

export interface NavItem { id: string; label: string; href: string }
export interface Stat { value: string; label: string }
export interface JourneyStep { number: string; title: string; description: string }
export interface FaqItem { question: string; answer: string }

export interface SiteContent {
  contentVersion: number;
  seo: { title: string; description: string };
  brand: {
    name: string; legalName: string; tagline: string; logo: string; logoAlt: string;
    email: string; phone: string; whatsapp: string; address: string; officeHours: string;
  };
  navigation: NavItem[];
  hero: {
    eyebrow: string; title: string; titleAccent: string; description: string;
    primaryCta: string; secondaryCta: string; trustNote: string; image: string;
    imageAlt: string; imageEyebrow: string; imageCardTitle: string; imageCardText: string;
    stats: Stat[];
  };
  journey: { eyebrow: string; title: string; description: string; steps: JourneyStep[] };
  teamSection: {
    eyebrow: string; title: string; titleAccent: string; description: string; credentialsLabel: string;
  };
  countriesSection: {
    eyebrow: string; title: string; titleAccent: string; description: string;
    cardCta: string; routesTitle: string; processTitle: string; eligibilityTitle: string;
    timelineTitle: string; modalCta: string; closeLabel: string;
  };
  studySection: {
    eyebrow: string; title: string; titleAccent: string; description: string;
    image: string; imageAlt: string; imageCaption: string; highlightsTitle: string;
    requirementsTitle: string; intakeLabel: string; investmentLabel: string;
    cardCta: string; partnershipEyebrow: string; partnershipText: string;
  };
  testimonialsSection: {
    eyebrow: string; title: string; titleAccent: string; description: string;
    ratingLabel: string; videoLabel: string; verifiedLabel: string;
  };
  faqSection: { eyebrow: string; title: string; description: string; items: FaqItem[] };
  finalCta: { eyebrow: string; title: string; description: string; button: string; note: string };
  accreditationsSection: { eyebrow: string; title: string; description: string };
  footer: {
    description: string; exploreTitle: string; contactTitle: string; legalTitle: string;
    legalText: string; privacyText: string; privacyLabel: string; termsLabel: string; copyright: string;
    backToTopLabel: string;
  };
  consultation: {
    title: string; titleAccent: string; description: string; chooseLabel: string;
    jobTitle: string; jobDescription: string; studentTitle: string; studentDescription: string;
    privacyNote: string; successTitle: string; successMessage: string; referenceLabel: string;
    successCta: string; termsTitle: string; termsText: string; termsCheckbox: string;
    reviewTitle: string; reviewNote: string; stepLabels: { job: string[]; student: string[] };
  };
  forms: {
    yes: string; no: string; optional: string; required: string; next: string; back: string;
    submit: string; submitting: string; close: string; selectPlaceholder: string;
    addEducation: string; removeEducation: string; validationMessage: string;
    defaultCountryCode: string; countryCodePlaceholder: string;
    labels: Record<string, string>;
    options: {
      genders: string[]; maritalStatuses: string[]; qualifications: string[];
      targetPrograms: string[]; skills: string[]; languages: string[]; levels: string[];
      fundingPlans: string[]; countryCodes: string[];
    };
  };
}

export interface CountryProcess { title: string; description: string }
export interface CountryTimeline { step: string; title: string; duration: string; description: string }
export interface Country {
  id: string; slug: string; name: string; code: string; flag: string; tagline: string;
  summary: string; image: string; routes: string[]; eligibility: string[];
  processes: CountryProcess[]; timeline: CountryTimeline[]; sortOrder: number;
}

export interface StudyProgram {
  id: string; degree: string; title: string; destination: string; duration: string;
  description: string; highlights: string[]; requirements: string[];
  intake: string; investment: string; sortOrder: number;
}

export interface Testimonial {
  id: string; name: string; role: string; location: string; quote: string;
  rating: number; mediaType: 'image' | 'video'; mediaUrl: string; posterUrl: string;
  sortOrder: number;
}

export interface TeamMember {
  id: string; name: string; role: string; bio: string; credentials: string[];
  photoUrl: string; sortOrder: number;
}

export interface Accreditation {
  id: string; title: string; subtitle: string; imageUrl: string; sortOrder: number;
}

export interface Submission {
  id: string; reference: string; type: SubmissionType; fullName: string; email: string;
  data: Record<string, unknown>; status: SubmissionStatus; createdAt: string;
}

export interface PublicData {
  content: SiteContent; countries: Country[]; programs: StudyProgram[];
  testimonials: Testimonial[]; teamMembers: TeamMember[]; accreditations: Accreditation[];
}

export interface AdminData extends PublicData {
  submissions: Submission[]; storageMode: StorageMode;
}
