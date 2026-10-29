'use client';

import React, { useState } from 'react';
import { ArtistProfileForm } from '@/features/artists/components/ArtistProfileForm';
import { ArtistProfileInput } from '@/features/artists/schemas';

export default function ArtistProfilePage() {
  const handleSaveProfile = async (data: ArtistProfileInput) => {
    const res = await fetch('/api/artists/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const resData = await res.json();
    if (!res.ok || !resData.success) {
      return {
        success: false,
        message: resData.error || 'Failed to update profile. Please try again.',
      };
    }

    return {
      success: true,
      message: 'Profile saved successfully! Your details will be displayed with your nominations.',
    };
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold text-charcoal-900">Artist Profile Settings</h1>
        <p className="text-sm text-charcoal-600">
          Maintain your cultural portfolio, artistic tradition, and regional origins.
        </p>
      </div>

      <ArtistProfileForm onSave={handleSaveProfile} />
    </div>
  );
}

