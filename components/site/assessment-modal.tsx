'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, BriefcaseBusiness, Check, CheckCircle2, GraduationCap, LockKeyhole, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { FormSection, Input, Select, Textarea, YesNo } from '@/components/ui/form-controls';
import { Modal } from '@/components/ui/modal';
import type { Country, SiteContent, SubmissionType } from '@/lib/types';
import { cn } from '@/lib/utils';

type AssessmentData = Record<string, any>;
type EducationEntry = { qualification: string; institution: string; institutionCountry: string; graduationYear: string; grade: string };

const blankEducation: EducationEntry = { qualification: '', institution: '', institutionCountry: '', graduationYear: '', grade: '' };
const disclosureDefaults = { medicalCondition: null, medicalDetails: '', criminalRecord: null, criminalDetails: '', travelHistory: null, travelCountries: '', familyOutside: null, familyCountry: '', licensedExams: null, examDetails: '' };
function personalDefaults() {
  return {
    fullName: '', dateOfBirth: '', gender: '', nationality: '', residenceCountry: '', streetAddress: '', city: '', state: '', postalCode: '',
    mobile: '', alternativeMobile: '', email: '', maritalStatus: '', hasChildren: null, childrenCount: '',
  };
}
const passportDefaults = { hasPassport: null, passportNumber: '', passportCity: '', passportIssueDate: '', passportExpiryDate: '' };
const languageDefaults = { languages: {} as Record<string, string> };

function initialData(type: SubmissionType): AssessmentData {
  const shared = { ...personalDefaults(), ...passportDefaults, ...disclosureDefaults, ...languageDefaults, terms: false };
  if (type === 'job') return {
    ...shared, qualificationLevel: '', institution: '', institutionCountry: '', graduationYear: '',
    hasCurrentEmployment: null, currentEmployer: '', currentPosition: '', currentEmploymentCountry: '', employmentStartDate: '', monthlySalary: '',
    hasPreviousEmployment: null, previousEmployer: '', previousPosition: '', previousEmploymentCountry: '', yearsWorked: '',
    skills: [], preferredCountry: '', preferredOccupation: '', expectedSalary: '',
  };
  return {
    ...shared, educationHistory: [{ ...blankEducation }], targetProgram: '', preferredDestination: '', intendedCourse: '',
    researchTopic: '', startIntake: '', fundingPlan: '',
  };
}

interface Props {
  open: boolean; onClose: () => void; content: SiteContent; countries: Country[]; initialType?: SubmissionType | null;
}

export function AssessmentModal({ open, onClose, content, countries, initialType }: Props) {
  const [type, setType] = useState<'choose' | SubmissionType>('choose');
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [reference, setReference] = useState('');
  const top = useRef<HTMLDivElement>(null);
  const c = content.consultation;
  const f = content.forms;
  const [data, setData] = useState<AssessmentData>(() => initialData('job'));
  const L = useCallback((key: string) => f.labels[key] || key, [f.labels]);

  useEffect(() => {
    if (!open) return;
    const nextType = initialType || 'choose';
    setType(nextType); setStep(0); setData(initialData(initialType || 'job'));
    setErrors({}); setServerError(''); setReference(''); setSubmitting(false);
  }, [open, initialType]);

  const update = (key: string, value: unknown) => {
    setData((current) => ({ ...current, [key]: value }));
    setErrors((current) => { const next = { ...current }; delete next[key]; return next; });
    setServerError('');
  };

  const validateStep = useCallback((targetType: SubmissionType, targetStep: number, values: AssessmentData) => {
    const next: Record<string, string> = {};
    const required = (key: string) => {
      if (values[key] === undefined || values[key] === null || values[key] === '') next[key] = f.required;
    };
    const conditional = (flag: string, keys: string[]) => { if (values[flag] === true) keys.forEach(required); };
    if (targetStep === 0) {
      ['fullName', 'dateOfBirth', 'gender', 'nationality', 'residenceCountry', 'streetAddress', 'city', 'state', 'postalCode', 'mobile', 'email', 'maritalStatus', 'hasChildren'].forEach(required);
      conditional('hasChildren', ['childrenCount']);
      if (values.email && !/^\S+@\S+\.\S+$/.test(values.email)) next.email = f.validationMessage;
      if (values.hasChildren === true && (!Number.isInteger(Number(values.childrenCount)) || Number(values.childrenCount) < 1)) next.childrenCount = f.validationMessage;
    }
    if (targetStep === 1) {
      required('hasPassport'); conditional('hasPassport', ['passportNumber', 'passportCity', 'passportIssueDate', 'passportExpiryDate']);
      if (targetType === 'job') ['qualificationLevel', 'institution', 'institutionCountry', 'graduationYear'].forEach(required);
      else (values.educationHistory || []).forEach((entry: EducationEntry, index: number) => {
        for (const key of ['qualification', 'institution', 'institutionCountry', 'graduationYear']) {
          if (!entry[key as keyof EducationEntry]) next[`educationHistory.${index}.${key}`] = f.required;
        }
      });
    }
    if (targetType === 'job' && targetStep === 2) {
      required('hasCurrentEmployment'); conditional('hasCurrentEmployment', ['currentEmployer', 'currentPosition', 'currentEmploymentCountry', 'employmentStartDate', 'monthlySalary']);
      required('hasPreviousEmployment'); conditional('hasPreviousEmployment', ['previousEmployer', 'previousPosition', 'previousEmploymentCountry', 'yearsWorked']);
      if (!values.skills?.length) next.skills = f.required;
      if (!values.languages?.English) next['languages.English'] = f.required;
    }
    if (targetType === 'student' && targetStep === 2) {
      ['targetProgram', 'preferredDestination', 'intendedCourse', 'startIntake', 'fundingPlan'].forEach(required);
      if (values.targetProgram === 'PhD') required('researchTopic');
      if (!values.languages?.English) next['languages.English'] = f.required;
    }
    const backgroundStep = targetType === 'job' ? 3 : 3;
    if (targetStep === backgroundStep) {
      if (targetType === 'job') ['preferredCountry', 'preferredOccupation', 'expectedSalary'].forEach(required);
      ['medicalCondition', 'criminalRecord', 'travelHistory', 'familyOutside', 'licensedExams'].forEach(required);
      conditional('licensedExams', ['examDetails']);
      conditional('medicalCondition', ['medicalDetails']); conditional('criminalRecord', ['criminalDetails']);
      conditional('travelHistory', ['travelCountries']); conditional('familyOutside', ['familyCountry']);
    }
    if (targetStep === 4 && values.terms !== true) next.terms = f.required;
    return next;
  }, [f.required, f.validationMessage]);

  function goNext() {
    if (type === 'choose') return;
    const next = validateStep(type, step, data);
    if (Object.keys(next).length) { setErrors(next); return; }
    setErrors({}); setStep((current) => Math.min(4, current + 1));
    window.setTimeout(() => top.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 30);
  }

  function goBack() {
    setErrors({}); setServerError('');
    if (step === 0) setType('choose'); else setStep((current) => current - 1);
  }

  async function submit() {
    if (type === 'choose') return;
    let allErrors: Record<string, string> = {};
    for (let index = 0; index <= 4; index += 1) allErrors = { ...allErrors, ...validateStep(type, index, data) };
    if (Object.keys(allErrors).length) {
      setErrors(allErrors);
      const firstStep = [0, 1, 2, 3, 4].find((index) => Object.keys(validateStep(type, index, data)).length);
      if (firstStep !== undefined) setStep(firstStep);
      return;
    }
    setSubmitting(true); setServerError('');
    try {
      const response = await fetch('/api/submissions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, data, website: data.website || '' }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || f.validationMessage);
      setReference(result.reference);
    } catch (error) { setServerError(error instanceof Error ? error.message : f.validationMessage); }
    finally { setSubmitting(false); }
  }

  const handleClose = useCallback(() => { if (!submitting) onClose(); }, [onClose, submitting]);
  const selectedType = type === 'choose' ? null : type;
  const countryOptions = countries.map((country) => country.name);
  const steps = selectedType ? c.stepLabels[selectedType] : [];

  function renderPersonal() {
    return <>
      <FormSection title={L('personalDetails')} description={L('personalDescription')}>
        <div className="grid gap-5 sm:grid-cols-2">
          <Input label={L('fullName')} required value={data.fullName} error={errors.fullName} onChange={(e) => update('fullName', e.target.value)} autoComplete="name" />
          <Input label={L('dateOfBirth')} required type="date" max={new Date().toISOString().slice(0, 10)} value={data.dateOfBirth} error={errors.dateOfBirth} onChange={(e) => update('dateOfBirth', e.target.value)} />
          <Select label={L('gender')} required value={data.gender} error={errors.gender} onChange={(e) => update('gender', e.target.value)} placeholder={f.selectPlaceholder} options={f.options.genders} />
          <Input label={L('nationality')} required value={data.nationality} error={errors.nationality} onChange={(e) => update('nationality', e.target.value)} autoComplete="country-name" />
          <Select label={L('maritalStatus')} required value={data.maritalStatus} error={errors.maritalStatus} onChange={(e) => update('maritalStatus', e.target.value)} placeholder={f.selectPlaceholder} options={f.options.maritalStatuses} />
          <YesNo label={L('hasChildren')} value={data.hasChildren} onChange={(value) => update('hasChildren', value)} yes={f.yes} no={f.no} error={errors.hasChildren} />
          {data.hasChildren === true && <Input label={L('childrenCount')} required type="number" min="1" max="30" value={data.childrenCount} error={errors.childrenCount} onChange={(e) => update('childrenCount', e.target.value)} />}
        </div>
      </FormSection>
      <FormSection title={L('contactDetails')}>
        <div className="grid gap-5 sm:grid-cols-2">
          <Input label={L('residenceCountry')} required value={data.residenceCountry} error={errors.residenceCountry} onChange={(e) => update('residenceCountry', e.target.value)} />
          <Input label={L('streetAddress')} required value={data.streetAddress} error={errors.streetAddress} onChange={(e) => update('streetAddress', e.target.value)} autoComplete="street-address" />
          <Input label={L('city')} required value={data.city} error={errors.city} onChange={(e) => update('city', e.target.value)} autoComplete="address-level2" />
          <Input label={L('state')} required value={data.state} error={errors.state} onChange={(e) => update('state', e.target.value)} autoComplete="address-level1" />
          <Input label={L('postalCode')} required value={data.postalCode} error={errors.postalCode} onChange={(e) => update('postalCode', e.target.value)} autoComplete="postal-code" />
          <Input label={L('mobile')} required value={data.mobile} error={errors.mobile} onChange={(e) => update('mobile', e.target.value)} type="tel" inputMode="tel" autoComplete="tel" placeholder={L('mobilePlaceholder')} />
          <Input label={L('alternativeMobile')} optional={f.optional} value={data.alternativeMobile} onChange={(e) => update('alternativeMobile', e.target.value)} type="tel" inputMode="tel" autoComplete="tel" placeholder={L('alternativeMobilePlaceholder')} />
          <Input label={L('email')} required value={data.email} error={errors.email} onChange={(e) => update('email', e.target.value)} type="email" autoComplete="email" />
        </div>
      </FormSection>
    </>;
  }

  function renderPassport() {
    return <FormSection title={L('passportDetails')} description={L('passportDescription')}>
      <YesNo label={L('hasPassport')} value={data.hasPassport} onChange={(value) => update('hasPassport', value)} yes={f.yes} no={f.no} error={errors.hasPassport} />
      {data.hasPassport === true && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="grid gap-5 overflow-hidden sm:grid-cols-2">
        <Input label={L('passportNumber')} required value={data.passportNumber} error={errors.passportNumber} onChange={(e) => update('passportNumber', e.target.value)} />
        <Input label={L('passportCity')} required value={data.passportCity} error={errors.passportCity} onChange={(e) => update('passportCity', e.target.value)} />
        <Input label={L('passportIssueDate')} required type="date" max={new Date().toISOString().slice(0, 10)} value={data.passportIssueDate} error={errors.passportIssueDate} onChange={(e) => update('passportIssueDate', e.target.value)} />
        <Input label={L('passportExpiryDate')} required type="date" min={new Date().toISOString().slice(0, 10)} value={data.passportExpiryDate} error={errors.passportExpiryDate} onChange={(e) => update('passportExpiryDate', e.target.value)} />
      </motion.div>}
    </FormSection>;
  }

  function renderJobEducation() {
    return <FormSection title={L('education')}>
      <div className="grid gap-5 sm:grid-cols-2">
        <Select label={L('qualificationLevel')} required value={data.qualificationLevel} error={errors.qualificationLevel} onChange={(e) => update('qualificationLevel', e.target.value)} placeholder={f.selectPlaceholder} options={f.options.qualifications.filter((item) => item !== 'PhD')} />
        <Input label={L('institution')} required value={data.institution} error={errors.institution} onChange={(e) => update('institution', e.target.value)} />
        <Input label={L('institutionCountry')} required value={data.institutionCountry} error={errors.institutionCountry} onChange={(e) => update('institutionCountry', e.target.value)} />
        <Input label={L('graduationYear')} required type="number" min="1950" max={new Date().getFullYear() + 1} value={data.graduationYear} error={errors.graduationYear} onChange={(e) => update('graduationYear', e.target.value)} />
      </div>
    </FormSection>;
  }

  function renderEducationHistory() {
    const entries = data.educationHistory as EducationEntry[];
    const updateEntry = (index: number, key: keyof EducationEntry, value: string) => {
      const next = entries.map((entry, entryIndex) => entryIndex === index ? { ...entry, [key]: value } : entry);
      update('educationHistory', next); setErrors((current) => { const copy = { ...current }; delete copy[`educationHistory.${index}.${key}`]; return copy; });
    };
    return <FormSection title={L('educationHistory')}>
      <div className="space-y-4">
        {entries.map((entry, index) => <div key={index} className="relative rounded-2xl border border-ink-900/10 bg-cream/70 p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between"><span className="text-xs font-extrabold text-red-600">{String(index + 1).padStart(2, '0')}</span>
            {entries.length > 1 && <button type="button" onClick={() => update('educationHistory', entries.filter((_, entryIndex) => entryIndex !== index))} className="btn-ghost btn-sm -mr-2"><Trash2 className="h-3.5 w-3.5" /><span className="sr-only sm:not-sr-only">{f.removeEducation}</span></button>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label={L('qualificationLevel')} required value={entry.qualification} error={errors[`educationHistory.${index}.qualification`]} onChange={(e) => updateEntry(index, 'qualification', e.target.value)} placeholder={f.selectPlaceholder} options={f.options.qualifications} />
            <Input label={L('institution')} required value={entry.institution} error={errors[`educationHistory.${index}.institution`]} onChange={(e) => updateEntry(index, 'institution', e.target.value)} />
            <Input label={L('institutionCountry')} required value={entry.institutionCountry} error={errors[`educationHistory.${index}.institutionCountry`]} onChange={(e) => updateEntry(index, 'institutionCountry', e.target.value)} />
            <Input label={L('graduationYear')} required type="number" min="1950" max={new Date().getFullYear() + 8} value={entry.graduationYear} error={errors[`educationHistory.${index}.graduationYear`]} onChange={(e) => updateEntry(index, 'graduationYear', e.target.value)} />
            <Input label={L('grade')} optional={f.optional} value={entry.grade} onChange={(e) => updateEntry(index, 'grade', e.target.value)} />
          </div>
        </div>)}
      </div>
      <Button type="button" variant="secondary" size="sm" onClick={() => update('educationHistory', [...entries, { ...blankEducation }])}><Plus className="h-4 w-4" />{f.addEducation}</Button>
    </FormSection>;
  }

  function renderEmployment() {
    return <>
      <FormSection title={L('currentEmployment')}>
        <YesNo label={L('hasCurrentEmployment')} value={data.hasCurrentEmployment} onChange={(value) => update('hasCurrentEmployment', value)} yes={f.yes} no={f.no} error={errors.hasCurrentEmployment} />
        {data.hasCurrentEmployment === true && <div className="grid gap-5 sm:grid-cols-2">
          <Input label={L('currentEmployer')} required value={data.currentEmployer} error={errors.currentEmployer} onChange={(e) => update('currentEmployer', e.target.value)} />
          <Input label={L('currentPosition')} required value={data.currentPosition} error={errors.currentPosition} onChange={(e) => update('currentPosition', e.target.value)} />
          <Input label={L('currentEmploymentCountry')} required value={data.currentEmploymentCountry} error={errors.currentEmploymentCountry} onChange={(e) => update('currentEmploymentCountry', e.target.value)} />
          <Input label={L('employmentStartDate')} required type="month" value={data.employmentStartDate} error={errors.employmentStartDate} onChange={(e) => update('employmentStartDate', e.target.value)} />
          <Input label={L('monthlySalary')} required value={data.monthlySalary} error={errors.monthlySalary} onChange={(e) => update('monthlySalary', e.target.value)} />
        </div>}
      </FormSection>
      <FormSection title={L('previousEmployment')}>
        <YesNo label={L('hasPreviousEmployment')} value={data.hasPreviousEmployment} onChange={(value) => update('hasPreviousEmployment', value)} yes={f.yes} no={f.no} error={errors.hasPreviousEmployment} />
        {data.hasPreviousEmployment === true && <div className="grid gap-5 sm:grid-cols-2">
          <Input label={L('previousEmployer')} required value={data.previousEmployer} error={errors.previousEmployer} onChange={(e) => update('previousEmployer', e.target.value)} />
          <Input label={L('previousPosition')} required value={data.previousPosition} error={errors.previousPosition} onChange={(e) => update('previousPosition', e.target.value)} />
          <Input label={L('previousEmploymentCountry')} required value={data.previousEmploymentCountry} error={errors.previousEmploymentCountry} onChange={(e) => update('previousEmploymentCountry', e.target.value)} />
          <Input label={L('yearsWorked')} required type="number" min="0" step="0.5" value={data.yearsWorked} error={errors.yearsWorked} onChange={(e) => update('yearsWorked', e.target.value)} />
        </div>}
      </FormSection>
    </>;
  }

  function renderSkills() {
    const skills = (data.skills || []) as string[];
    return <FormSection title={L('professionalSkills')} description={L('skillsDescription')}>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {f.options.skills.map((skill) => {
          const checked = skills.includes(skill);
          return <button key={skill} type="button" aria-pressed={checked} onClick={() => { update('skills', checked ? skills.filter((item) => item !== skill) : [...skills, skill]); }} className={cn('btn min-h-11 justify-start rounded-xl border px-3 text-left text-[11px] font-semibold', checked ? 'border-red-600 bg-red-50 text-red-700' : 'border-ink-900/10 bg-white text-ink-700 hover:border-red-600/30 hover:bg-red-50/40')}>
            <span className={cn('flex h-4 w-4 shrink-0 items-center justify-center rounded border', checked ? 'border-red-600 bg-red-600 text-white' : 'border-ink-900/20 bg-white')}>{checked && <Check className="h-3 w-3" />}</span>{skill}
          </button>;
        })}
      </div>
      {errors.skills && <p className="text-xs font-semibold text-red-600">{errors.skills}</p>}
    </FormSection>;
  }

  function renderLanguages() {
    const languages = (data.languages || {}) as Record<string, string>;
    return <FormSection title={L('languageProficiency')} description={L('languageDescription')}>
      <div className="overflow-hidden rounded-2xl border border-ink-900/10">
        {f.options.languages.map((language, index) => <div key={language} className={cn('p-4', index > 0 && 'border-t border-ink-900/10')}>
          <div className="mb-3 flex items-center justify-between"><span className="text-xs font-extrabold text-ink-950">{language}</span>{language === 'English' && <span className="text-[10px] font-bold uppercase tracking-wider text-red-600">{f.required}</span>}</div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {f.options.levels.map((level) => {
              const checked = languages[language] === level;
              return <button type="button" key={level} aria-pressed={checked} onClick={() => { update('languages', { ...languages, [language]: level }); setErrors((current) => { const next = { ...current }; delete next[`languages.${language}`]; return next; }); }} className={cn('btn min-h-9 rounded-lg border px-2 text-[10px] font-bold sm:text-[11px]', checked ? 'border-red-600 bg-red-50 text-red-700' : 'border-ink-900/10 bg-white text-ink-500 hover:border-red-600/30')}>
                {checked && <Check className="h-3 w-3" />}{level}
              </button>;
            })}
          </div>
          {errors[`languages.${language}`] && <p className="mt-2 text-[11px] font-semibold text-red-600">{errors[`languages.${language}`]}</p>}
        </div>)}
      </div>
    </FormSection>;
  }

  function renderStudyPlans() {
    return <>
      <FormSection title={L('programPreferences')}>
        <div className="grid gap-5 sm:grid-cols-2">
          <Select label={L('targetProgram')} required value={data.targetProgram} error={errors.targetProgram} onChange={(e) => update('targetProgram', e.target.value)} placeholder={f.selectPlaceholder} options={f.options.targetPrograms} />
          <Select label={L('preferredDestination')} required value={data.preferredDestination} error={errors.preferredDestination} onChange={(e) => update('preferredDestination', e.target.value)} placeholder={f.selectPlaceholder} options={countryOptions} />
          <Input label={L('startIntake')} required value={data.startIntake} error={errors.startIntake} onChange={(e) => update('startIntake', e.target.value)} placeholder={L('startIntakePlaceholder')} />
          <Select label={L('fundingPlan')} required value={data.fundingPlan} error={errors.fundingPlan} onChange={(e) => update('fundingPlan', e.target.value)} placeholder={f.selectPlaceholder} options={f.options.fundingPlans} />
        </div>
      </FormSection>
      <FormSection title={L('academicInterests')}>
        <Input label={L('intendedCourse')} required value={data.intendedCourse} error={errors.intendedCourse} onChange={(e) => update('intendedCourse', e.target.value)} />
        {data.targetProgram === 'PhD' && <Textarea label={L('researchTopic')} required value={data.researchTopic} error={errors.researchTopic} onChange={(e) => update('researchTopic', e.target.value)} />}
      </FormSection>
    </>;
  }

  function renderJobPreferences() {
    return <FormSection title={L('preferredEmployment')}>
      <div className="grid gap-5 sm:grid-cols-2">
        <Select label={L('preferredCountry')} required value={data.preferredCountry} error={errors.preferredCountry} onChange={(e) => update('preferredCountry', e.target.value)} placeholder={f.selectPlaceholder} options={countryOptions} />
        <Input label={L('preferredOccupation')} required value={data.preferredOccupation} error={errors.preferredOccupation} onChange={(e) => update('preferredOccupation', e.target.value)} />
        <Input label={L('expectedSalary')} required value={data.expectedSalary} error={errors.expectedSalary} onChange={(e) => update('expectedSalary', e.target.value)} />
      </div>
    </FormSection>;
  }

  function disclosure(flag: string, detail: string, multiline = true) {
    return <div className="rounded-2xl border border-ink-900/10 p-4 sm:p-5">
      <YesNo label={L(flag)} value={data[flag]} onChange={(value) => update(flag, value)} yes={f.yes} no={f.no} error={errors[flag]} />
      <AnimatePresence initial={false}>{data[flag] === true && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden"><div className="pt-5">
        {multiline ? <Textarea label={L(detail)} required value={data[detail]} error={errors[detail]} onChange={(e) => update(detail, e.target.value)} /> : <Input label={L(detail)} required value={data[detail]} error={errors[detail]} onChange={(e) => update(detail, e.target.value)} />}
      </div></motion.div>}</AnimatePresence>
    </div>;
  }

  function renderBackground() {
    return <FormSection title={L('disclosures')}>
      <div className="space-y-4">
        {disclosure('medicalCondition', 'medicalDetails')}
        {disclosure('criminalRecord', 'criminalDetails')}
        {disclosure('travelHistory', 'travelCountries')}
        {disclosure('familyOutside', 'familyCountry', false)}
        {disclosure('licensedExams', 'examDetails')}
      </div>
    </FormSection>;
  }

  function renderReview() {
    return <>
      <FormSection title={c.reviewTitle} description={c.reviewNote}>
        <div className="grid gap-3 rounded-2xl bg-cream p-5 sm:grid-cols-2">
          {[
            [L('reviewType'), type === 'job' ? c.jobTitle : c.studentTitle],
            [L('reviewName'), data.fullName],
            [L('reviewEmail'), data.email],
            [L('reviewDestination'), type === 'job' ? data.preferredCountry : data.preferredDestination],
          ].map(([label, value]) => <div key={label}><p className="text-[10px] font-bold uppercase tracking-wider text-ink-500">{label}</p><p className="mt-1 break-words text-sm font-bold text-ink-950">{value || '—'}</p></div>)}
        </div>
      </FormSection>
      <FormSection title={c.termsTitle}>
        <div className="fine-scrollbar max-h-56 overflow-y-auto whitespace-pre-line rounded-2xl border border-ink-900/10 bg-cream p-5 text-xs leading-6 text-ink-700">{c.termsText}</div>
        <label className={cn('flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition', errors.terms ? 'border-red-500 bg-red-50/40' : 'border-ink-900/10 hover:border-red-600/30')}>
          <input type="checkbox" checked={data.terms === true} onChange={(e) => update('terms', e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-red-600" />
          <span className="text-xs font-semibold leading-5 text-ink-900">{c.termsCheckbox}<span className="ml-1 text-red-600">*</span></span>
        </label>
        {errors.terms && <p className="text-xs font-semibold text-red-600">{errors.terms}</p>}
      </FormSection>
    </>;
  }

  function renderStep() {
    if (type === 'job') {
      if (step === 0) return renderPersonal();
      if (step === 1) return <>{renderPassport()}{renderJobEducation()}</>;
      if (step === 2) return <>{renderEmployment()}{renderSkills()}{renderLanguages()}</>;
      if (step === 3) return <>{renderJobPreferences()}{renderBackground()}</>;
      return renderReview();
    }
    if (type === 'student') {
      if (step === 0) return renderPersonal();
      if (step === 1) return <>{renderPassport()}{renderEducationHistory()}</>;
      if (step === 2) return <>{renderStudyPlans()}{renderLanguages()}</>;
      if (step === 3) return renderBackground();
      return renderReview();
    }
    return null;
  }

  return <Modal open={open} onClose={handleClose} label={c.title} closeLabel={f.close} className="max-w-5xl bg-[#FDFCFC]">
    <div ref={top} className="scroll-mt-4" />
    <div className="h-1.5 w-full bg-red-600" />
    <div className="px-5 pb-8 pt-7 sm:px-8 lg:px-10">
      <div className="flex items-center justify-between pr-10">
        <img src={content.brand.logo} alt={content.brand.logoAlt} className="h-10 w-auto max-w-[170px] object-contain object-left" />
        <div className="hidden items-center gap-1.5 text-[10px] font-bold text-ink-500 sm:flex"><LockKeyhole className="h-3.5 w-3.5 text-red-600" />{c.privacyNote.split('.')[0]}</div>
      </div>

      {reference ? <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-xl py-14 text-center sm:py-20">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-50 text-red-600"><CheckCircle2 className="h-10 w-10" /></div>
        <h2 className="mt-7 font-serif text-4xl leading-tight text-ink-950 sm:text-5xl">{c.successTitle}</h2>
        <p className="mt-5 text-sm leading-7 text-ink-700">{c.successMessage}</p>
        <div className="mx-auto mt-7 max-w-sm rounded-2xl border border-ink-900/10 bg-white p-4"><p className="text-[10px] font-bold uppercase tracking-[.15em] text-ink-500">{c.referenceLabel}</p><p className="mt-2 font-mono text-sm font-bold text-red-600">{reference}</p></div>
        <Button onClick={handleClose} size="lg" className="mt-8">{c.successCta}<ArrowRight className="h-4 w-4" /></Button>
      </motion.div> : <>
        <div className="mt-7 max-w-2xl">
          <h2 className="font-serif text-4xl leading-[1.06] tracking-tight text-ink-950 sm:text-5xl">{c.title} <em className="text-red-600">{c.titleAccent}</em></h2>
          <p className="mt-4 text-sm leading-6 text-ink-700">{c.description}</p>
        </div>

        {type === 'choose' ? <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8">
          <p className="text-xs font-extrabold text-ink-950">{c.chooseLabel}<span className="ml-1 text-red-600">*</span></p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {([
              { id: 'job' as const, title: c.jobTitle, description: c.jobDescription, icon: BriefcaseBusiness },
              { id: 'student' as const, title: c.studentTitle, description: c.studentDescription, icon: GraduationCap },
            ]).map((option) => <button key={option.id} type="button" onClick={() => { setType(option.id); setData(initialData(option.id)); setStep(0); }} className="btn group relative flex min-h-[220px] flex-col items-start rounded-3xl border border-ink-900/10 bg-white p-6 text-left shadow-card hover:-translate-y-1 hover:border-red-600/40 hover:shadow-lift sm:p-7">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 transition group-hover:bg-red-600 group-hover:text-white"><option.icon className="h-6 w-6" /></span>
              <span className="mt-6 text-lg font-extrabold tracking-tight">{option.title}</span>
              <span className="mt-2 text-xs leading-6 text-ink-500 group-hover:text-white/80">{option.description}</span>
              <span className="mt-auto flex items-center gap-2 pt-5 text-xs font-bold text-red-600 group-hover:text-white">{f.next}<ArrowRight className="h-4 w-4" /></span>
            </button>)}
          </div>
          <p className="mt-6 flex items-start gap-2 text-[11px] leading-5 text-ink-500"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />{c.privacyNote}</p>
        </motion.div> : <>
          <div className="mt-8 border-y border-ink-900/10 py-5">
            <div className="flex items-center justify-between gap-4"><p className="text-xs font-extrabold text-ink-950">{steps[step]}</p><span className="font-mono text-[11px] font-bold text-red-600">{String(step + 1).padStart(2, '0')} / {String(steps.length).padStart(2, '0')}</span></div>
            <div className="mt-3 flex gap-1.5">{steps.map((label, index) => <button key={label} type="button" disabled={index > step} onClick={() => { if (index < step) setStep(index); }} aria-label={label} className={cn('h-1.5 flex-1 rounded-full border-0 p-0', index <= step ? 'bg-red-600' : 'bg-ink-900/10')} />)}</div>
          </div>
          <form onSubmit={(event) => { event.preventDefault(); void submit(); }} className="mt-7">
            <div className="absolute -left-[9999px]" aria-hidden="true"><input tabIndex={-1} autoComplete="off" value={data.website || ''} onChange={(e) => update('website', e.target.value)} name="website" /></div>
            <AnimatePresence mode="wait" initial={false}><motion.div key={`${type}-${step}`} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.2 }} className="space-y-8">{renderStep()}</motion.div></AnimatePresence>
            {(Object.keys(errors).length > 0 || serverError) && <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700" role="alert">{serverError || f.validationMessage}</div>}
            <div className="mt-8 flex flex-col-reverse gap-3 border-t border-ink-900/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <Button type="button" variant="ghost" onClick={goBack}><ArrowLeft className="h-4 w-4" />{step === 0 ? c.chooseLabel : f.back}</Button>
              {step < 4 ? <Button type="button" size="lg" onClick={goNext}>{f.next}<ArrowRight className="h-4 w-4" /></Button> : <Button type="submit" size="lg" loading={submitting}>{submitting ? f.submitting : f.submit}<ArrowRight className="h-4 w-4" /></Button>}
            </div>
            <p className="mt-5 flex items-start gap-2 text-[10px] leading-5 text-ink-500"><LockKeyhole className="mt-0.5 h-3.5 w-3.5 shrink-0" />{c.privacyNote}</p>
          </form>
        </>}
      </>}
    </div>
  </Modal>;
}
