package com.jaywapp.squadmaker.preview;

import com.google.android.gms.ads.AgeRestrictedTreatment;
import com.google.android.gms.ads.RequestConfiguration;

/** Approved teen baseline; never weakens a pre-existing child/under-age signal. */
final class ConsentRequestConfiguration {
    static RequestConfiguration apply(RequestConfiguration existing, boolean underAgeOfConsent) {
        boolean child = underAgeOfConsent
            || existing.getAgeRestrictedTreatment() == AgeRestrictedTreatment.CHILD
            || existing.getTagForUnderAgeOfConsent() == RequestConfiguration.TAG_FOR_UNDER_AGE_OF_CONSENT_TRUE
            || existing.getTagForChildDirectedTreatment() == RequestConfiguration.TAG_FOR_CHILD_DIRECTED_TREATMENT_TRUE;
        RequestConfiguration.Builder builder = existing.toBuilder()
            .setAgeRestrictedTreatment(child ? AgeRestrictedTreatment.CHILD : AgeRestrictedTreatment.TEEN)
            .setPublisherPrivacyPersonalizationState(RequestConfiguration.PublisherPrivacyPersonalizationState.DISABLED)
            .setMaxAdContentRating(RequestConfiguration.MAX_AD_CONTENT_RATING_G);
        // false is not proof of age: preserve any existing TFUA value instead of clearing it.
        if (underAgeOfConsent) {
            builder.setTagForUnderAgeOfConsent(RequestConfiguration.TAG_FOR_UNDER_AGE_OF_CONSENT_TRUE);
        }
        return builder.build();
    }
}
