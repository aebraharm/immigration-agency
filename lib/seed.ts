import seedJson from '@/db/seed.json';
import type {
  Accreditation, AdminData, Country, SiteContent, StudyProgram, TeamMember, Testimonial,
} from './types';

export const seedContent = seedJson.content as SiteContent;
export const seedCountries = seedJson.countries as Country[];
export const seedPrograms = seedJson.programs as StudyProgram[];
export const seedTestimonials = seedJson.testimonials as Testimonial[];
export const seedTeamMembers = seedJson.teamMembers as TeamMember[];
export const seedAccreditations = seedJson.accreditations as Accreditation[];

export function createSeedData(): AdminData {
  return structuredClone({
    content: seedContent,
    countries: seedCountries,
    programs: seedPrograms,
    testimonials: seedTestimonials,
    teamMembers: seedTeamMembers,
    accreditations: seedAccreditations,
    submissions: [],
    storageMode: 'preview',
  });
}
