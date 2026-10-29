'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, CheckCircle2, User, MapPin, Sparkles, BookOpen } from 'lucide-react';
import { artistProfileSchema, ArtistProfileInput } from '../schemas';
import { INDIAN_STATES, getDistrictsByState } from '@/lib/constants/states';
import { ART_CATEGORIES } from '@/lib/constants/art-categories';

interface ArtistProfileFormProps {
  initialData?: Partial<ArtistProfileInput>;
  onSave: (data: ArtistProfileInput) => Promise<{ success: boolean; message: string }>;
}

export function ArtistProfileForm({ initialData, onSave }: ArtistProfileFormProps) {
  const [selectedState, setSelectedState] = useState<string>(initialData?.state || 'Odisha');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);

  const availableDistricts = getDistrictsByState(selectedState);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ArtistProfileInput>({
    resolver: zodResolver(artistProfileSchema),
    defaultValues: {
      stageName: initialData?.stageName || '',
      fullName: initialData?.fullName || '',
      bio: initialData?.bio || '',
      state: initialData?.state || 'Odisha',
      district: initialData?.district || availableDistricts[0] || '',
      language: initialData?.language || 'Odia / Santhali',
      primaryCategory: initialData?.primaryCategory || ART_CATEGORIES[0].slug,
      experienceYears: initialData?.experienceYears || 5,
      socialLinks: initialData?.socialLinks || {},
      consentDeclaration: true,
    },
  });

  const onSubmit = async (data: ArtistProfileInput) => {
    setIsSubmitting(true);
    setFeedback(null);
    try {
      const result = await onSave(data);
      setFeedback(result);
    } catch {
      setFeedback({ success: false, message: 'An unexpected error occurred while saving profile.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 bg-white p-6 md:p-10 rounded-2xl border border-ivory-300 shadow-sm">
      {/* Header */}
      <div className="border-b border-ivory-200 pb-5">
        <h2 className="text-2xl font-bold text-charcoal-900 flex items-center gap-2">
          <User className="w-6 h-6 text-forest-700" />
          Adivasi Artist Profile
        </h2>
        <p className="text-sm text-charcoal-600 mt-1">
          Your profile represents your identity across all national contests. Only your stage name, bio, state, district, and art category are publicly displayed.
        </p>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${
            feedback.success
              ? 'bg-forest-50 border border-forest-200 text-forest-800'
              : 'bg-terracotta-50 border border-terracotta-200 text-terracotta-800'
          }`}
        >
          {feedback.success ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : null}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-charcoal-800 mb-1.5">
            Stage / Artist Name <span className="text-terracotta-600">*</span>
          </label>
          <input
            {...register('stageName')}
            placeholder="e.g. Guru Birsa Munda Troupe"
            className="w-full px-4 py-2.5 rounded-lg border border-ivory-300 focus:border-forest-600 focus:ring-2 focus:ring-forest-200 outline-none text-charcoal-900"
          />
          {errors.stageName && <p className="text-xs text-terracotta-600 mt-1">{errors.stageName.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-charcoal-800 mb-1.5">
            Official Full Name <span className="text-terracotta-600">*</span>
          </label>
          <input
            {...register('fullName')}
            placeholder="As per Government ID"
            className="w-full px-4 py-2.5 rounded-lg border border-ivory-300 focus:border-forest-600 focus:ring-2 focus:ring-forest-200 outline-none text-charcoal-900"
          />
          {errors.fullName && <p className="text-xs text-terracotta-600 mt-1">{errors.fullName.message}</p>}
        </div>
      </div>

      {/* Geography & Language */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-semibold text-charcoal-800 mb-1.5">
            State <span className="text-terracotta-600">*</span>
          </label>
          <select
            {...register('state')}
            value={selectedState}
            onChange={(e) => {
              const newState = e.target.value;
              setSelectedState(newState);
              setValue('state', newState);
              const districts = getDistrictsByState(newState);
              if (districts.length > 0) {
                setValue('district', districts[0]);
              }
            }}
            className="w-full px-4 py-2.5 rounded-lg border border-ivory-300 focus:border-forest-600 focus:ring-2 focus:ring-forest-200 outline-none bg-white text-charcoal-900"
          >
            {INDIAN_STATES.map((st) => (
              <option key={st.name} value={st.name}>
                {st.name}
              </option>
            ))}
          </select>
          {errors.state && <p className="text-xs text-terracotta-600 mt-1">{errors.state.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-charcoal-800 mb-1.5">
            District <span className="text-terracotta-600">*</span>
          </label>
          <select
            {...register('district')}
            className="w-full px-4 py-2.5 rounded-lg border border-ivory-300 focus:border-forest-600 focus:ring-2 focus:ring-forest-200 outline-none bg-white text-charcoal-900"
          >
            {availableDistricts.map((dst) => (
              <option key={dst} value={dst}>
                {dst}
              </option>
            ))}
          </select>
          {errors.district && <p className="text-xs text-terracotta-600 mt-1">{errors.district.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-charcoal-800 mb-1.5">
            Preferred Language <span className="text-terracotta-600">*</span>
          </label>
          <input
            {...register('language')}
            placeholder="e.g. Santhali, Ho, Odia, Hindi"
            className="w-full px-4 py-2.5 rounded-lg border border-ivory-300 focus:border-forest-600 focus:ring-2 focus:ring-forest-200 outline-none text-charcoal-900"
          />
          {errors.language && <p className="text-xs text-terracotta-600 mt-1">{errors.language.message}</p>}
        </div>
      </div>

      {/* Art Category & Experience */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-charcoal-800 mb-1.5">
            Primary Art Form <span className="text-terracotta-600">*</span>
          </label>
          <select
            {...register('primaryCategory')}
            className="w-full px-4 py-2.5 rounded-lg border border-ivory-300 focus:border-forest-600 focus:ring-2 focus:ring-forest-200 outline-none bg-white text-charcoal-900"
          >
            {ART_CATEGORIES.map((cat) => (
              <option key={cat.slug} value={cat.slug}>
                {cat.name}
              </option>
            ))}
          </select>
          {errors.primaryCategory && <p className="text-xs text-terracotta-600 mt-1">{errors.primaryCategory.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-charcoal-800 mb-1.5">
            Years of Cultural Practice
          </label>
          <input
            type="number"
            {...register('experienceYears', { valueAsNumber: true })}
            min={0}
            max={80}
            className="w-full px-4 py-2.5 rounded-lg border border-ivory-300 focus:border-forest-600 focus:ring-2 focus:ring-forest-200 outline-none text-charcoal-900"
          />
          {errors.experienceYears && <p className="text-xs text-terracotta-600 mt-1">{errors.experienceYears.message}</p>}
        </div>
      </div>

      {/* Biography */}
      <div>
        <label className="block text-sm font-semibold text-charcoal-800 mb-1.5">
          Biography & Cultural Lineage <span className="text-terracotta-600">*</span>
        </label>
        <p className="text-xs text-charcoal-500 mb-2">
          Share your artistic journey, tribal heritage, traditional teachers/gurus, and community impact (minimum 50 characters).
        </p>
        <textarea
          {...register('bio')}
          rows={5}
          placeholder="Describe your artistic tradition, village background, awards, and dedication to preserving Adivasi culture..."
          className="w-full px-4 py-3 rounded-lg border border-ivory-300 focus:border-forest-600 focus:ring-2 focus:ring-forest-200 outline-none text-charcoal-900"
        />
        {errors.bio && <p className="text-xs text-terracotta-600 mt-1">{errors.bio.message}</p>}
      </div>

      {/* Declaration Checkbox */}
      <div className="pt-4 border-t border-ivory-200">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            {...register('consentDeclaration')}
            className="mt-1 w-4 h-4 text-forest-700 border-ivory-400 rounded focus:ring-forest-500"
          />
          <span className="text-xs text-charcoal-700">
            I hereby declare that I am an authentic Adivasi/indigenous artist, and that all information and performances submitted represent authentic cultural expressions of our community.
          </span>
        </label>
        {errors.consentDeclaration && (
          <p className="text-xs text-terracotta-600 mt-1">{errors.consentDeclaration.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full sm:w-auto px-8 py-3 bg-forest-700 hover:bg-forest-800 disabled:opacity-50 text-white font-semibold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Saving Profile...
          </>
        ) : (
          'Save Artist Profile'
        )}
      </button>
    </form>
  );
}
