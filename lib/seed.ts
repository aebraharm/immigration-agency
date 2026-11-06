import seedJson from '@/db/seed.json';
import type { AdminData, SiteContent, Country, StudyProgram, Testimonial } from './types';

export const seedContent = seedJson.content as SiteContent;
export const seedCountries = seedJson.countries as Country[];
export const seedPrograms = seedJson.programs as StudyProgram[];
export const seedTestimonials = seedJson.testimonials as Testimonial[];

export function createSeedData(): AdminData {
  return structuredClone({
    content: seedContent,
    countries: seedCountries,
    programs: seedPrograms,
    testimonials: seedTestimonials,
    submissions: [],
    storageMode: 'preview',
  });
}
